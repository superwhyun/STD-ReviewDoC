/**
 * Grok (xAI) LLM Provider — stub
 * Full implementation in Step 3
 */

import type { LLMProviderConfig } from "@/lib/types"
import type { LLMProvider, ReviewRequest, ReviewResult } from "@/lib/llm-provider"

export class GrokProvider implements LLMProvider {
    readonly type = "grok" as const
    private apiKey: string
    private model: string

    constructor(config: LLMProviderConfig) {
        this.apiKey = config.apiKey
        this.model = config.model || "grok-3"
    }

    async review(_request: ReviewRequest): Promise<ReviewResult[]> {
        throw new Error("Grok provider not yet implemented — will be completed in Step 3")
    }

    async *reviewStream(_request: ReviewRequest): AsyncGenerator<string> {
        throw new Error("Grok streaming not yet implemented — will be completed in Step 4")
    }

    async validateApiKey(): Promise<boolean> {
        try {
            const response = await fetch("https://api.x.ai/v1/models", {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            })
            return response.ok
        } catch {
            return false
        }
    }
}
