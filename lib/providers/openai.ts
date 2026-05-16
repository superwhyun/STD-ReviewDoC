/**
 * OpenAI LLM Provider implementation
 * Uses Responses API (not Chat Completions) — model: gpt-5
 */

import type { LLMProviderConfig } from "@/lib/types"
import type { LLMProvider, ReviewRequest, ReviewResult } from "@/lib/llm-provider"
import mammoth from "mammoth"

const OPENAI_API_BASE = "https://api.openai.com/v1"

interface ResponsesAPIResponse {
    id: string
    object: string
    created_at: number
    status: string
    model: string
    output: Array<{
        id: string
        type: string
        status?: string
        content?: Array<{
            type: string
            text: string
        }>
    }>
    output_text?: string
    usage: {
        input_tokens: number
        output_tokens: number
        total_tokens: number
    }
}

async function extractTextFromFile(file: File): Promise<string> {
    const fileExtension = file.name.split(".").pop()?.toLowerCase()

    if (fileExtension === "docx") {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target?.result as ArrayBuffer
                    const result = await mammoth.extractRawText({ arrayBuffer })
                    resolve(result.value)
                } catch (error) {
                    reject(new Error("Failed to extract text from Word document"))
                }
            }
            reader.onerror = () => reject(new Error("Failed to read file"))
            reader.readAsArrayBuffer(file)
        })
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const content = e.target?.result as string
            resolve(content)
        }
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsText(file)
    })
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
        const fileContent = request.fileContent
        const allItems = request.prompts.map((p, i) => ({ ...p, index: i }))

        const systemPrompt =
            "You are a professional document reviewer specializing in standard draft documents. Provide detailed, constructive feedback in Korean."

        const reviewInstructions = allItems
            .map((item, index) => `${index + 1}. [${item.name}]\n${item.prompt}`)
            .join("\n\n")

        const fullPrompt = `${systemPrompt}

다음 문서를 여러 관점에서 검토해주세요. 각 검토 항목에 대해 명확하게 구분하여 답변해주세요.

=== 검토 항목 ===
${reviewInstructions}

=== 응답 형식 ===
각 검토 항목에 대해 다음 형식으로 답변해주세요:

### [검토 항목 번호]. [검토 항목 이름]
[검토 내용]

---

=== 문서 내용 ===
${fileContent}`

        request.onProgress?.(1, 1, "모든 검토 항목 처리 중...")

        const response = await fetch(`${OPENAI_API_BASE}/responses`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.model,
                input: fullPrompt,
                reasoning: { effort: "medium" },
                text: { verbosity: "high" },
                max_output_tokens: 16000,
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || "Failed to review document")
        }

        const data: ResponsesAPIResponse = await response.json()

        let fullReview = ""
        const messageOutput = data.output?.find((item) => item.type === "message")
        if (messageOutput?.content) {
            const textContent = messageOutput.content.find((c) => c.type === "output_text")
            if (textContent) {
                fullReview = textContent.text
            }
        }

        if (!fullReview) {
            throw new Error("No text content found in API response")
        }

        // Parse sections
        let sections: string[] = fullReview.split(/###\s*\d+\.\s*/).slice(1)
        if (sections.length === 0 || sections[0].trim() === "") {
            sections = fullReview.split(/###\s*/).slice(1)
        }
        if (sections.length === 0 || sections[0].trim() === "") {
            sections = fullReview.split(/\n\d+\.\s*\[/).slice(1).map((s) => "[" + s)
        }

        const results: ReviewResult[] = allItems.map((item, index) => {
            let result = sections[index] || `검토 항목 "${item.name}"에 대한 응답을 찾을 수 없습니다.`
            result = result.split("---")[0].trim()
            return { itemName: item.name, result }
        })

        return results
    }

    async *reviewStream(_request: ReviewRequest): AsyncGenerator<string> {
        // Streaming will be implemented in Step 4
        yield "[Streaming not yet implemented for OpenAI provider]"
    }

    async validateApiKey(): Promise<boolean> {
        try {
            const response = await fetch(`${OPENAI_API_BASE}/models`, {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            })
            return response.ok
        } catch {
            return false
        }
    }

    /**
     * Extract text from a File object (used by callers that have File, not text)
     */
    static async extractText(file: File): Promise<string> {
        return extractTextFromFile(file)
    }
}
