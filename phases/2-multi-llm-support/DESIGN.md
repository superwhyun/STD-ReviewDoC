# Phase 2: Multi-LLM Support - Contract Design

## Core Interface

```typescript
// lib/llm-provider.ts

export type LLMProviderType = 'openai' | 'grok' | 'openrouter' | 'kimi';

export interface LLMProviderConfig {
  provider: LLMProviderType;
  apiKey: string;
  model: string;
  baseUrl?: string; // Custom endpoint for OpenRouter, etc.
}

export interface ReviewRequest {
  fileContent: string;
  prompts: Array<{ name: string; prompt: string }>;
  onProgress?: (current: number, total: number, itemName: string) => void;
  onToken?: (token: string) => void; // Streaming callback
}

export interface ReviewResult {
  itemName: string;
  result: string;
}

export interface LLMProvider {
  readonly type: LLMProviderType;
  review(request: ReviewRequest): Promise<ReviewResult[]>;
  reviewStream(request: ReviewRequest): AsyncGenerator<string>; // SSE streaming
  validateApiKey(): Promise<boolean>;
}

// Factory
export function createProvider(config: LLMProviderConfig): LLMProvider;

// Storage helpers
export const llmProviderStorage = {
  getAll(): LLMProviderConfig[];
  save(config: LLMProviderConfig): void;
  delete(provider: LLMProviderType): void;
  getActive(): LLMProviderType;
  setActive(provider: LLMProviderType): void;
};
```

## Provider Implementation Strategy

| Provider | API Type | Base URL | Streaming | Notes |
|----------|----------|----------|-----------|-------|
| OpenAI | Responses API | https://api.openai.com/v1 | SSE | Use existing code, refactor to provider pattern |
| Grok | xAI Responses API | https://api.x.ai/v1 | SSE | Similar to OpenAI Responses |
| OpenRouter | Chat Completions | https://openrouter.ai/api/v1 | SSE | choices[0].delta.content pattern |
| Kimi | Chat Completions | https://api.moonshot.cn/v1 | SSE | OpenAI-compatible |

## Storage Migration

- **Old**: `draftreviewr:api-key` (single OpenAI key string)
- **New**: `draftreviewr:llm-configs` (LLMProviderConfig[])
- **Migration**: Auto-convert existing OpenAI key to new format on first load

## Module Map

| Module | Owner Steps | Owned Paths |
|--------|-------------|-------------|
| multi-llm-contracts | 0 | module-map.json, step0-output.json, project-manifest.json |
| storage-migration | 1 | lib/storage/local-storage.ts, lib/types.ts |
| llm-client-abstraction | 2 | lib/llm-provider.ts, lib/providers/openai.ts |
| grok-openrouter-kimi | 3 | lib/providers/grok.ts, openrouter.ts, kimi.ts |
| streaming-support | 4 | lib/llm-provider.ts (streaming methods) |
| settings-ui | 5 | components/settings/api-key-settings.tsx |
| integration | 6 | components/documents/document-upload-section.tsx |
| phase-close | 7 | baselines/2-multi-llm-support.json |
