/**
 * OpenAI LLM Provider implementation
 * Uses Responses API (not Chat Completions) — model: gpt-5
 */

import type { LLMProviderConfig } from "@/lib/types"
import type { LLMProvider, ReviewRequest, ReviewResult } from "@/lib/llm-provider"
import { getCurrentLanguageInstruction } from "@/lib/storage/language-storage"
import { getUseFilesApi } from "@/lib/storage/openai-settings-storage"
import { extractText as extractDocumentText } from "@/lib/document-processor"

const OPENAI_API_BASE = "https://api.openai.com/v1"

interface ResponsesAPIResponse {
    id: string; object: string; created_at: number; status: string; model: string
    output: Array<{ id: string; type: string; status?: string; content?: Array<{ type: string; text: string }> }>
    output_text?: string
    usage: { input_tokens: number; output_tokens: number; total_tokens: number }
}


async function uploadFileToOpenAI(file: File, apiKey: string): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("purpose", "user_data")
    const response = await fetch(`${OPENAI_API_BASE}/files`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
    })
    if (!response.ok) { const err = await response.json(); throw new Error(err.error?.message || "Failed to upload file to OpenAI") }
    const data = await response.json()
    return data.id as string
}

async function deleteFileFromOpenAI(fileId: string, apiKey: string): Promise<void> {
    await fetch(`${OPENAI_API_BASE}/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiKey}` },
    })
}

function buildPromptText(prompts: Array<{ name: string; prompt: string }>, context?: string): string {
    const items = prompts.map((p, i) => `${i + 1}. [${p.name}]\n${p.prompt}`).join("\n\n")
    const contextSection = context ? `\n=== 문서 유형 ===\n${context}\n` : ""
    return `You are a professional document reviewer specializing in standard draft documents. Provide detailed, constructive feedback. ${getCurrentLanguageInstruction()}
${contextSection}
다음 문서를 여러 관점에서 검토해주세요. 각 검토 항목에 대해 명확하게 구분하여 답변해주세요.

=== 검토 항목 ===
${items}

=== 응답 형식 ===
각 검토 항목에 대해 다음 형식으로 답변해주세요:

### [검토 항목 번호]. [검토 항목 이름]
[검토 내용]

---`
}

function buildFileInput(fileId: string, promptText: string): unknown {
    return [
        {
            role: "user",
            content: [
                { type: "input_file", file_id: fileId },
                { type: "input_text", text: promptText },
            ],
        },
    ]
}

function buildPrompt(fileContent: string, prompts: Array<{ name: string; prompt: string }>, context?: string): string {
    const items = prompts.map((p, i) => `${i + 1}. [${p.name}]\n${p.prompt}`).join("\n\n")
    const contextSection = context ? `\n=== 문서 유형 ===\n${context}\n` : ""
    return `You are a professional document reviewer specializing in standard draft documents. Provide detailed, constructive feedback. ${getCurrentLanguageInstruction()}
${contextSection}
다음 문서를 여러 관점에서 검토해주세요. 각 검토 항목에 대해 명확하게 구분하여 답변해주세요.

=== 검토 항목 ===
${items}

=== 응답 형식 ===
각 검토 항목에 대해 다음 형식으로 답변해주세요:

### [검토 항목 번호]. [검토 항목 이름]
[검토 내용]

---

=== 문서 내용 ===
${fileContent}`
}

function parseSections(fullReview: string): string[] {
    let sections = fullReview.split(/###\s*\d+\.\s*/).slice(1)
    if (sections.length === 0 || sections[0].trim() === "") sections = fullReview.split(/###\s*/).slice(1)
    if (sections.length === 0 || sections[0].trim() === "") sections = fullReview.split(/\n\d+\.\s*\[/).slice(1).map(s => "[" + s)
    return sections
}

export class OpenAIProvider implements LLMProvider {
    readonly type = "openai" as const
    private apiKey: string
    private model: string
    private reasoning?: { effort: string }

    constructor(config: LLMProviderConfig) {
        this.apiKey = config.apiKey
        this.model = config.model || "gpt-5"
        this.reasoning = config.reasoning ? { effort: config.reasoning.effort } : undefined
    }

    private async callResponses(input: unknown, stream: false): Promise<ResponsesAPIResponse>
    private async callResponses(input: unknown, stream: true): Promise<Response>
    private async callResponses(input: unknown, stream: boolean): Promise<ResponsesAPIResponse | Response> {
        const body = JSON.stringify({
            model: this.model,
            input,
            ...(this.reasoning ? { reasoning: this.reasoning } : {}),
            ...(stream ? { stream: true } : { text: { verbosity: "high" } }),
            max_output_tokens: 16000,
        })
        const response = await fetch(`${OPENAI_API_BASE}/responses`, {
            method: "POST",
            headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
            body,
        })
        if (!response.ok) { const error = await response.json(); throw new Error(error.error?.message || "OpenAI API error") }
        return stream ? response : response.json()
    }

    private buildInput(request: ReviewRequest, fileId?: string): unknown {
        const allItems = request.prompts.map((p, i) => ({ ...p, index: i }))
        if (fileId) {
            return buildFileInput(fileId, buildPromptText(allItems, request.documentTypeContext))
        }
        return buildPrompt(request.fileContent, allItems, request.documentTypeContext)
    }

    async review(request: ReviewRequest): Promise<ReviewResult[]> {
        const allItems = request.prompts.map((p, i) => ({ ...p, index: i }))
        request.onProgress?.(1, 1, "모든 검토 항목 처리 중...")

        const useFiles = getUseFilesApi() && !!request.file
        const fileId = useFiles ? await uploadFileToOpenAI(request.file!, this.apiKey) : undefined

        try {
            const data = await this.callResponses(this.buildInput(request, fileId), false) as ResponsesAPIResponse
            let fullReview = ""
            const msg = data.output?.find(i => i.type === "message")
            if (msg?.content) { const tc = msg.content.find(c => c.type === "output_text"); if (tc) fullReview = tc.text }
            if (!fullReview) throw new Error("No text content found in API response")

            const sections = parseSections(fullReview)
            return allItems.map((item, idx) => ({ itemName: item.name, result: (sections[idx] || `검토 항목 "${item.name}"에 대한 응답을 찾을 수 없습니다.`).split("---")[0].trim() }))
        } finally {
            if (fileId) await deleteFileFromOpenAI(fileId, this.apiKey)
        }
    }

    async *reviewStream(request: ReviewRequest): AsyncGenerator<string> {
        request.onProgress?.(1, 1, "OpenAI streaming 검토 중...")

        const useFiles = getUseFilesApi() && !!request.file
        const fileId = useFiles ? await uploadFileToOpenAI(request.file!, this.apiKey) : undefined

        try {
            const response = await this.callResponses(this.buildInput(request, fileId), true) as Response
            if (!response.body) throw new Error("No response body for streaming")

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ""

            try {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split("\n")
                    buffer = lines.pop() || ""
                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            const data = line.slice(6)
                            if (data === "[DONE]") continue
                            try {
                                const parsed = JSON.parse(data)
                                if (parsed.output_text) { yield parsed.output_text; request.onToken?.(parsed.output_text) }
                                if (parsed.delta) { yield parsed.delta; request.onToken?.(parsed.delta) }
                            } catch { /* skip unparseable lines */ }
                        }
                    }
                }
            } finally {
                reader.releaseLock()
            }
        } finally {
            if (fileId) await deleteFileFromOpenAI(fileId, this.apiKey)
        }
    }

    async validateApiKey(): Promise<boolean> {
        try { const r = await fetch(`${OPENAI_API_BASE}/models`, { headers: { Authorization: `Bearer ${this.apiKey}` } }); return r.ok } catch { return false }
    }

    async listModels(): Promise<Array<{ id: string; name: string }>> {
        const r = await fetch(`${OPENAI_API_BASE}/models`, { headers: { Authorization: `Bearer ${this.apiKey}` } })
        if (!r.ok) throw new Error("Failed to list OpenAI models")
        const data = await r.json()
        return (data.data || [])
            .filter((m: { id: string }) => /^gpt-[5-9]/.test(m.id) || /^o\d/.test(m.id))
            .map((m: { id: string }) => ({ id: m.id, name: m.id }))
    }

    static async extractText(file: File): Promise<string> { return extractDocumentText(file) }
}
