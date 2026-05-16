/**
 * LLM Provider abstraction layer
 * Defines the common interface for all LLM backends (OpenAI, Grok, OpenRouter, Kimi)
 */

import type { LLMProviderType, LLMProviderConfig } from "@/lib/types"
import { llmProviderStorage } from "@/lib/storage/local-storage"

export interface ReviewRequest {
    fileContent: string
    prompts: Array<{ name: string; prompt: string }>
    onProgress?: (current: number, total: number, itemName: string) => void
    onToken?: (token: string) => void
}

export interface ReviewResult {
    itemName: string
    result: string
}

export interface LLMProvider {
    readonly type: LLMProviderType

    /**
     * Execute a document review with all prompts.
     * Returns one ReviewResult per prompt.
     */
    review(request: ReviewRequest): Promise<ReviewResult[]>

    /**
     * Execute a document review with streaming token output.
     * Yields tokens as they arrive from the LLM.
     */
    reviewStream(request: ReviewRequest): AsyncGenerator<string>

    /**
     * Validate the configured API key against the provider's endpoint.
     */
    validateApiKey(): Promise<boolean>
}

// Dynamic import to avoid circular dependency
const loadProvider = async (type: LLMProviderType): Promise<new (config: LLMProviderConfig) => LLMProvider> => {
    switch (type) {
        case "openai":
            return (await import("@/lib/providers/openai")).OpenAIProvider
        case "grok":
            return (await import("@/lib/providers/grok")).GrokProvider
        case "openrouter":
            return (await import("@/lib/providers/openrouter")).OpenRouterProvider
        case "kimi":
            return (await import("@/lib/providers/kimi")).KimiProvider
        default:
            throw new Error(`Unknown provider type: ${type}`)
    }
}

/**
 * Create an LLM provider instance from its stored configuration.
 * Falls back to active provider if no config is specified.
 */
export async function createProvider(configOrType?: LLMProviderConfig | LLMProviderType): Promise<LLMProvider> {
    let config: LLMProviderConfig

    if (typeof configOrType === "string") {
        const stored = llmProviderStorage.get(configOrType)
        if (!stored) throw new Error(`No configuration found for provider: ${configOrType}`)
        config = stored
    } else if (configOrType) {
        config = configOrType
    } else {
        const active = llmProviderStorage.getActive()
        const stored = llmProviderStorage.get(active)
        if (!stored) throw new Error(`No configuration found for active provider: ${active}`)
        config = stored
    }

    const Provider = await loadProvider(config.provider)
    return new Provider(config)
}

/**
 * Get the active provider instance based on user selection.
 */
export async function getActiveProvider(): Promise<LLMProvider> {
    return createProvider()
}
