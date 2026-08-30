/**
 * OpenRouter LLM Provider
 * Uses Chat Completions API: https://openrouter.ai/api/v1/chat/completions
 */

import type { LLMProviderConfig } from "@/lib/types"
import type { LLMProvider, ReviewRequest, ReviewResult } from "@/lib/llm-provider"
import { getCurrentLanguageInstruction } from "@/lib/storage/language-storage"
import { parseScoreFromResult } from "@/lib/providers/openai"

interface ChatChoice { delta?: { content?: string }; message?: { content: string }; finish_reason?: string }

const SCORE_INSTRUCTIONS = `응답 첫 줄은 반드시 아래 형식으로만 작성하시오:
SCORE: {점수}
점수는 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 중 하나의 정수이다.
판정 기준: 80~100은 기준 충족 수준, 50~70은 일부 개선 필요, 0~40은 중대한 문제 존재.
두 번째 줄부터 검토 내용을 작성하시오.`

function buildMessages(fileContent: string, prompts: Array<{ name: string; prompt: string }>, context?: string): Array<{ role: string; content: string }> {
    const items = prompts.map((p, i) => `${i + 1}. [${p.name}]\n${p.prompt}`).join("\n\n")
    const contextSection = context ? `\n=== 문서 유형 ===\n${context}\n\n` : ""
    return [
        { role: "system", content: `You are a professional document reviewer specializing in standard draft documents. Provide detailed, constructive feedback. ${getCurrentLanguageInstruction()}\n${SCORE_INSTRUCTIONS}` },
        { role: "user", content: `다음 문서를 여러 관점에서 검토해주세요. 각 검토 항목에 대해 명확하게 구분하여 답변해주세요.\n\n${contextSection}=== 검토 항목 ===\n${items}\n\n=== 응답 형식 ===\n각 검토 항목에 대해 다음 형식으로 답변해주세요:\n\n### [검토 항목 번호]. [검토 항목 이름]\nSCORE: {점수}\n[검토 내용]\n\n---\n\n=== 문서 내용 ===\n${fileContent}` }
    ]
}

function parseSections(fullReview: string): string[] {
    let sections = fullReview.split(/###\s*\d+\.\s*/).slice(1)
    if (sections.length === 0 || sections[0].trim() === "") sections = fullReview.split(/###\s*/).slice(1)
    if (sections.length === 0 || sections[0].trim() === "") sections = fullReview.split(/\n\d+\.\s*\[/).slice(1).map(s => "[" + s)
    return sections
}

export class OpenRouterProvider implements LLMProvider {
    readonly type = "openrouter" as const
    private apiKey: string
    private model: string
    private baseUrl: string

    constructor(config: LLMProviderConfig) {
        this.apiKey = config.apiKey; this.model = config.model || "openai/gpt-5"; this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1"
    }

    async review(request: ReviewRequest): Promise<ReviewResult[]> {
        const allItems = request.prompts.map((p, i) => ({ ...p, index: i }))
        const msgs = buildMessages(request.fileContent, allItems, request.documentTypeContext)
        request.onProgress?.(1, 1, "OpenRouter 검토 중...")

        const r = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST", headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: this.model, messages: msgs, max_tokens: 16000 }),
        })
        if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "Failed to review with OpenRouter") }
        const data = await r.json()
        const fullReview = data.choices?.[0]?.message?.content
        if (!fullReview) throw new Error("No content in OpenRouter response")
        const sections = parseSections(fullReview)
        return allItems.map((item, idx) => {
            const rawResult = (sections[idx] || `"${item.name}" 응답 없음`).split("---")[0].trim()
            const parsed = parseScoreFromResult(rawResult)
            return { itemName: item.name, result: parsed.result, score: parsed.score }
        })
    }

    async *reviewStream(request: ReviewRequest): AsyncGenerator<string> {
        const allItems = request.prompts.map((p, i) => ({ ...p, index: i }))
        const msgs = buildMessages(request.fileContent, allItems, request.documentTypeContext)
        request.onProgress?.(1, 1, "OpenRouter streaming 검토 중...")

        const r = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST", headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: this.model, messages: msgs, stream: true, max_tokens: 16000 }),
        })
        if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "Failed to stream with OpenRouter") }
        if (!r.body) throw new Error("No response body for streaming")

        const reader = r.body.getReader()
        const decoder = new TextDecoder()
        let buf = ""
        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buf += decoder.decode(value, { stream: true })
                const lines = buf.split("\n"); buf = lines.pop() || ""
                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue
                    const d = line.slice(6); if (d === "[DONE]") continue
                    try {
                        const p = JSON.parse(d)
                        const choice: ChatChoice | undefined = p.choices?.[0]
                        const token = choice?.delta?.content
                        if (token) { yield token; request.onToken?.(token) }
                    } catch { /* skip */ }
                }
            }
        } finally { reader.releaseLock() }
    }

    async validateApiKey(): Promise<boolean> {
        try { const r = await fetch(`${this.baseUrl}/models`, { headers: { Authorization: `Bearer ${this.apiKey}` } }); return r.ok } catch { return false }
    }

    async listModels(): Promise<Array<{ id: string; name: string }>> {
        const DEFAULT_MODELS = [
            { id: "anthropic/claude-3.7-sonnet", name: "anthropic/claude-3.7-sonnet (최신 플래그십)" },
            { id: "openai/gpt-4o", name: "openai/gpt-4o (추천)" },
            { id: "openai/gpt-4o-mini", name: "openai/gpt-4o-mini" },
            { id: "google/gemini-2.0-flash-001", name: "google/gemini-2.0-flash-001" },
            { id: "deepseek/deepseek-r1", name: "deepseek/deepseek-r1 (추론 특화)" },
            { id: "deepseek/deepseek-chat", name: "deepseek/deepseek-chat (V3)" },
            { id: "meta-llama/llama-3.3-70b-instruct", name: "meta-llama/llama-3.3-70b-instruct" },
            { id: "openai/o3-mini", name: "openai/o3-mini" },
        ]

        if (!this.apiKey) return DEFAULT_MODELS

        try {
            const r = await fetch(`${this.baseUrl}/models`, { headers: { Authorization: `Bearer ${this.apiKey}` } })
            if (!r.ok) return DEFAULT_MODELS
            const data = await r.json()
            const models = (data.data || []).map((m: any) => ({
                id: m.id,
                name: m.name ? `${m.id} (${m.name})` : m.id,
            }))
            return models.length > 0 ? models : DEFAULT_MODELS
        } catch {
            return DEFAULT_MODELS
        }
    }
}
