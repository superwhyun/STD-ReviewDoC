/**
 * OpenAI LLM Provider implementation
 * Uses Responses API (not Chat Completions) — model: gpt-5
 */

import type { LLMProviderConfig } from "@/lib/types"
import type { LLMProvider, ReviewRequest, ReviewResult } from "@/lib/llm-provider"
import mammoth from "mammoth"

const OPENAI_API_BASE = "https://api.openai.com/v1"

interface ResponsesAPIResponse {
    id: string; object: string; created_at: number; status: string; model: string
    output: Array<{ id: string; type: string; status?: string; content?: Array<{ type: string; text: string }> }>
    output_text?: string
    usage: { input_tokens: number; output_tokens: number; total_tokens: number }
}

async function extractTextFromFile(file: File): Promise<string> {
    const ext = file.name.split(".").pop()?.toLowerCase()
    if (ext === "docx") {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target?.result as ArrayBuffer
                    const result = await mammoth.extractRawText({ arrayBuffer })
                    resolve(result.value)
                } catch { reject(new Error("Failed to extract text from Word document")) }
            }
            reader.onerror = () => reject(new Error("Failed to read file"))
            reader.readAsArrayBuffer(file)
        })
    }
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => { resolve(e.target?.result as string) }
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsText(file)
    })
}

function buildPrompt(fileContent: string, prompts: Array<{ name: string; prompt: string }>): string {
    const items = prompts.map((p, i) => `${i + 1}. [${p.name}]\n${p.prompt}`).join("\n\n")
    return `You are a professional document reviewer specializing in standard draft documents. Provide detailed, constructive feedback in Korean.

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

    constructor(config: LLMProviderConfig) {
        this.apiKey = config.apiKey
        this.model = config.model || "gpt-5"
    }

    async review(request: ReviewRequest): Promise<ReviewResult[]> {
        const allItems = request.prompts.map((p, i) => ({ ...p, index: i }))
        const fullPrompt = buildPrompt(request.fileContent, allItems)
        request.onProgress?.(1, 1, "모든 검토 항목 처리 중...")

        const response = await fetch(`${OPENAI_API_BASE}/responses`, {
            method: "POST",
            headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: this.model, input: fullPrompt, reasoning: { effort: "medium" }, text: { verbosity: "high" }, max_output_tokens: 16000 }),
        })

        if (!response.ok) { const error = await response.json(); throw new Error(error.error?.message || "Failed to review document") }

        const data: ResponsesAPIResponse = await response.json()
        let fullReview = ""
        const msg = data.output?.find(i => i.type === "message")
        if (msg?.content) { const tc = msg.content.find(c => c.type === "output_text"); if (tc) fullReview = tc.text }
        if (!fullReview) throw new Error("No text content found in API response")

        const sections = parseSections(fullReview)
        return allItems.map((item, idx) => ({ itemName: item.name, result: (sections[idx] || `검토 항목 "${item.name}"에 대한 응답을 찾을 수 없습니다.`).split("---")[0].trim() }))
    }

    async *reviewStream(request: ReviewRequest): AsyncGenerator<string> {
        const allItems = request.prompts.map((p, i) => ({ ...p, index: i }))
        const fullPrompt = buildPrompt(request.fileContent, allItems)
        request.onProgress?.(1, 1, "OpenAI streaming 검토 중...")

        const response = await fetch(`${OPENAI_API_BASE}/responses`, {
            method: "POST",
            headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: this.model, input: fullPrompt, stream: true, reasoning: { effort: "medium" }, max_output_tokens: 16000 }),
        })

        if (!response.ok) { const error = await response.json(); throw new Error(error.error?.message || "Failed to stream review") }
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
                            // OpenAI Responses API streaming: output_text delta
                            if (parsed.output_text) {
                                yield parsed.output_text
                                request.onToken?.(parsed.output_text)
                            }
                            // Delta format
                            if (parsed.delta) {
                                yield parsed.delta
                                request.onToken?.(parsed.delta)
                            }
                        } catch { /* skip unparseable lines */ }
                    }
                }
            }
        } finally {
            reader.releaseLock()
        }
    }

    async validateApiKey(): Promise<boolean> {
        try { const r = await fetch(`${OPENAI_API_BASE}/models`, { headers: { Authorization: `Bearer ${this.apiKey}` } }); return r.ok } catch { return false }
    }

    static async extractText(file: File): Promise<string> { return extractTextFromFile(file) }
}
