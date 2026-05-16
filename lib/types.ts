export interface DocumentType {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface ReviewItem {
  id: string
  document_type_id: string
  name: string
  prompt: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface CommonReviewItem {
  id: string
  name: string
  prompt: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface UserApiKey {
  id: string
  user_id: string
  encrypted_api_key: string
  provider: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  document_type_id: string
  file_name: string
  file_url: string
  status: "pending" | "processing" | "completed" | "failed"
  created_at: string
  updated_at: string
}

export interface ReviewResult {
  id: string
  document_id: string
  review_item_id: string | null
  common_review_item_id: string | null
  result: string
  created_at: string
}

export interface ApiKeyInfo {
  exists: boolean
  masked?: string
  provider?: string
}

export type LLMProviderType = "openai" | "grok" | "openrouter" | "kimi"

export interface LLMProviderConfig {
  provider: LLMProviderType
  apiKey: string
  model: string
  baseUrl?: string
}
