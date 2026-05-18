/**
 * Kimi (Moonshot AI) LLM Provider
 * Uses Chat Completions API: https://api.moonshot.cn/v1/chat/completions
 */

import type { LLMProviderConfig } from "@/lib/types"
import type { LLMProvider, ReviewRequest, ReviewResult } from "@/lib/llm-provider"
import { getCurrentLanguageInstruction } from "@/lib/storage/language-storage"
import { parseScoreFromResult } from "@/lib/providers/openai"

const KIMI_API_BASE = "https://api.moonshot.cn/v1"

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

export class KimiProvider implements LLMProvider {
    readonly type = "kimi" as const
    private apiKey: string
    private model: string

    constructor(config: LLMProviderConfig) { this.apiKey = config.apiKey; this.model = config.model || "moonshot-v1-auto" }

    async review(request: ReviewRequest): Promise<ReviewResult[]> {
        const allItems = request.prompts.map((p, i) => ({ ...p, index: i }))
        const msgs = buildMessages(request.fileContent, allItems, request.documentTypeContext)
        request.onProgress?.(1, 1, "Kimi 검토 중...")

        const r = await fetch(`${KIMI_API_BASE}/chat/completions`, {
            method: "POST", headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: this.model, messages: msgs, max_tokens: 16000 }),
        })
        if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "Failed to review with Kimi") }
        const data = await r.json()
        const fullReview = data.choices?.[0]?.message?.content
        if (!fullReview) throw new Error("No content in Kimi response")
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
        request.onProgress?.(1, 1, "Kimi streaming 검토 중...")

        const r = await fetch(`${KIMI_API_BASE}/chat/completions`, {
            method: "POST", headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: this.model, messages: msgs, stream: true, max_tokens: 16000 }),
        })
        if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "Failed to stream with Kimi") }
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
        try { const r = await fetch(`${KIMI_API_BASE}/models`, { headers: { Authorization: `Bearer ${this.apiKey}` } }); return r.ok } catch { return false }
    }

    async listModels(): Promise<Array<{ id: string; name: string }>> {
        const r = await fetch(`${KIMI_API_BASE}/models`, { headers: { Authorization: `Bearer ${this.apiKey}` } })
        if (!r.ok) throw new Error("Failed to list Kimi models")
        const data = await r.json()
        return (data.data || [])
            .filter((m: any) => m.id.includes("moonshot"))
            .map((m: any) => ({ id: m.id, name: m.id }))
    }
}
