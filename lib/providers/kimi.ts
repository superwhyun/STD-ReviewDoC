/**
 * Kimi (Moonshot) LLM Provider — stub
 * Full implementation in Step 3
 */

import type { LLMProviderConfig } from "@/lib/types"
import type { LLMProvider, ReviewRequest, ReviewResult } from "@/lib/llm-provider"

export class KimiProvider implements LLMProvider {
    readonly type = "kimi" as const
    private apiKey: string
    private model: string

    constructor(config: LLMProviderConfig) {
        this.apiKey = config.apiKey
        this.model = config.model || "kimi-latest"
    }

    async review(_request: ReviewRequest): Promise<ReviewResult[]> {
        throw new Error("Kimi provider not yet implemented — will be completed in Step 3")
    }

    async *reviewStream(_request: ReviewRequest): AsyncGenerator<string> {
        throw new Error("Kimi streaming not yet implemented — will be completed in Step 4")
    }

    async validateApiKey(): Promise<boolean> {
        try {
            const response = await fetch("https://api.moonshot.cn/v1/models", {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            })
            return response.ok
        } catch {
            return false
        }
    }
}
