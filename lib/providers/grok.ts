/**
 * Grok (xAI) LLM Provider
 * Uses xAI Responses API: https://api.x.ai/v1/responses
 */

import type { LLMProviderConfig } from "@/lib/types"
import type { LLMProvider, ReviewRequest, ReviewResult } from "@/lib/llm-provider"

const GROK_API_BASE = "https://api.x.ai/v1"

interface GrokResponse {
    id: string
    object: string
    created_at: number
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
}

export class GrokProvider implements LLMProvider {
    readonly type = "grok" as const
    private apiKey: string
    private model: string

    constructor(config: LLMProviderConfig) {
        this.apiKey = config.apiKey
        this.model = config.model || "grok-3"
    }

    async review(request: ReviewRequest): Promise<ReviewResult[]> {
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
${request.fileContent}`

        request.onProgress?.(1, 1, "Grok 검토 중...")

        const response = await fetch(`${GROK_API_BASE}/responses`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.model,
                input: fullPrompt,
                max_output_tokens: 16000,
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || "Failed to review document with Grok")
        }

        const data: GrokResponse = await response.json()

        // Extract text from Responses API format (same as OpenAI)
        let fullReview = data.output_text || ""
        if (!fullReview) {
            const messageOutput = data.output?.find((item) => item.type === "message")
            if (messageOutput?.content) {
                const textContent = messageOutput.content.find((c) => c.type === "output_text")
                if (textContent) {
                    fullReview = textContent.text
                }
            }
        }

        if (!fullReview) {
            throw new Error("No text content found in Grok API response")
        }

        // Parse sections
        let sections: string[] = fullReview.split(/###\s*\d+\.\s*/).slice(1)
        if (sections.length === 0 || sections[0].trim() === "") {
            sections = fullReview.split(/###\s*/).slice(1)
        }
        if (sections.length === 0 || sections[0].trim() === "") {
            sections = fullReview.split(/\n\d+\.\s*\[/).slice(1).map((s) => "[" + s)
        }

        return allItems.map((item, index) => {
            let result = sections[index] || `검토 항목 "${item.name}"에 대한 응답을 찾을 수 없습니다.`
            result = result.split("---")[0].trim()
            return { itemName: item.name, result }
        })
    }

    async *reviewStream(_request: ReviewRequest): AsyncGenerator<string> {
        yield "[Streaming not yet implemented for Grok provider — Step 4]"
    }

    async validateApiKey(): Promise<boolean> {
        try {
            const response = await fetch(`${GROK_API_BASE}/models`, {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            })
            return response.ok
        } catch {
            return false
        }
    }
}
