/**
 * OpenRouter LLM Provider — stub
 * Full implementation in Step 3
 */

import type { LLMProviderConfig } from "@/lib/types"
import type { LLMProvider, ReviewRequest, ReviewResult } from "@/lib/llm-provider"

export class OpenRouterProvider implements LLMProvider {
    readonly type = "openrouter" as const
    private apiKey: string
    private model: string
    private baseUrl: string

    constructor(config: LLMProviderConfig) {
        this.apiKey = config.apiKey
        this.model = config.model || "openai/gpt-5"
        this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1"
    }

    async review(_request: ReviewRequest): Promise<ReviewResult[]> {
        throw new Error("OpenRouter provider not yet implemented — will be completed in Step 3")
    }

    async *reviewStream(_request: ReviewRequest): AsyncGenerator<string> {
        throw new Error("OpenRouter streaming not yet implemented — will be completed in Step 4")
    }

    async validateApiKey(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            })
            return response.ok
        } catch {
            return false
        }
    }
}
