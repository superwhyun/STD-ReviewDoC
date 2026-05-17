import type { CommonReviewItem, DocumentType, ReviewItem } from "@/lib/types"
import { KEYS as STORAGE_KEYS } from "@/lib/storage/local-storage"

const DOCUMENT_TYPE_SEED_PATHS = [
  "/data/document-types/itu-t-draft.json",
  "/data/document-types/itu-t-contribution.json",
  "/data/document-types/jtc1-draft.json",
  "/data/document-types/jtc1-contribution.json",
] as const

const COMMON_REVIEW_ITEMS_SEED_PATH = "/data/common-review-items.json"

interface SeedReviewItem {
  id: string
  name: string
  prompt: string
  order_index: number
}

interface SeedDocumentType {
  id: string
  name: string
  description: string
  review_items: SeedReviewItem[]
}

interface SeedCommonReviewItems {
  items: SeedReviewItem[]
}

export interface SeedLoadResult {
  documentTypes: number
  reviewItems: number
  commonReviewItems: number
}

const emptySeedLoadResult: SeedLoadResult = {
  documentTypes: 0,
  reviewItems: 0,
  commonReviewItems: 0,
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function readStorageArray<T>(key: string): T[] {
  if (!canUseLocalStorage()) return []

  const value = window.localStorage.getItem(key)
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStorageArray<T>(key: string, value: T[]): void {
  if (!canUseLocalStorage()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Failed to load seed data: ${path}`)
  }
  return response.json() as Promise<T>
}

async function loadSeedDocumentTypes(): Promise<SeedDocumentType[]> {
  return Promise.all(DOCUMENT_TYPE_SEED_PATHS.map((path) => fetchJson<SeedDocumentType>(path)))
}

async function loadSeedCommonReviewItems(): Promise<SeedCommonReviewItems> {
  return fetchJson<SeedCommonReviewItems>(COMMON_REVIEW_ITEMS_SEED_PATH)
}

function toDocumentType(seed: SeedDocumentType, now: string): DocumentType {
  return {
    id: seed.id,
    name: seed.name,
    description: seed.description,
    created_at: now,
    updated_at: now,
  }
}

function toReviewItems(seed: SeedDocumentType, now: string): ReviewItem[] {
  return seed.review_items.map((item) => ({
    id: item.id,
    document_type_id: seed.id,
    name: item.name,
    prompt: item.prompt,
    order_index: item.order_index,
    created_at: now,
    updated_at: now,
  }))
}

function toCommonReviewItems(seed: SeedCommonReviewItems, now: string): CommonReviewItem[] {
  return seed.items.map((item) => ({
    id: item.id,
    name: item.name,
    prompt: item.prompt,
    order_index: item.order_index,
    created_at: now,
    updated_at: now,
  }))
}

export async function initializeSeedData(): Promise<SeedLoadResult> {
  if (!canUseLocalStorage()) return emptySeedLoadResult

  const [seedDocumentTypes, seedCommonItems] = await Promise.all([
    loadSeedDocumentTypes(),
    loadSeedCommonReviewItems(),
  ])

  const now = new Date().toISOString()
  const existingDocumentTypes = readStorageArray<DocumentType>(STORAGE_KEYS.DOCUMENT_TYPES)
  const existingReviewItems = readStorageArray<ReviewItem>(STORAGE_KEYS.REVIEW_ITEMS)
  const existingCommonItems = readStorageArray<CommonReviewItem>(STORAGE_KEYS.COMMON_REVIEW_ITEMS)
  const existingDocumentTypeIds = new Set(existingDocumentTypes.map((item) => item.id))
  const existingCommonItemIds = new Set(existingCommonItems.map((item) => item.id))

  const newDocumentTypes = seedDocumentTypes
    .filter((seed) => !existingDocumentTypeIds.has(seed.id))
    .map((seed) => toDocumentType(seed, now))
  const newReviewItems = seedDocumentTypes
    .filter((seed) => !existingDocumentTypeIds.has(seed.id))
    .flatMap((seed) => toReviewItems(seed, now))
  const newCommonItems = toCommonReviewItems(seedCommonItems, now).filter((item) => !existingCommonItemIds.has(item.id))

  if (newDocumentTypes.length > 0) {
    writeStorageArray(STORAGE_KEYS.DOCUMENT_TYPES, [...existingDocumentTypes, ...newDocumentTypes])
  }
  if (newReviewItems.length > 0) {
    writeStorageArray(STORAGE_KEYS.REVIEW_ITEMS, [...existingReviewItems, ...newReviewItems])
  }
  if (newCommonItems.length > 0) {
    writeStorageArray(STORAGE_KEYS.COMMON_REVIEW_ITEMS, [...existingCommonItems, ...newCommonItems])
  }

  return {
    documentTypes: newDocumentTypes.length,
    reviewItems: newReviewItems.length,
    commonReviewItems: newCommonItems.length,
  }
}

export async function resetToSeedData(): Promise<SeedLoadResult> {
  if (!canUseLocalStorage()) return emptySeedLoadResult

  const [seedDocumentTypes, seedCommonItems] = await Promise.all([
    loadSeedDocumentTypes(),
    loadSeedCommonReviewItems(),
  ])

  const now = new Date().toISOString()
  const documentTypes = seedDocumentTypes.map((seed) => toDocumentType(seed, now))
  const reviewItems = seedDocumentTypes.flatMap((seed) => toReviewItems(seed, now))
  const commonReviewItems = toCommonReviewItems(seedCommonItems, now)

  writeStorageArray(STORAGE_KEYS.DOCUMENT_TYPES, documentTypes)
  writeStorageArray(STORAGE_KEYS.REVIEW_ITEMS, reviewItems)
  writeStorageArray(STORAGE_KEYS.COMMON_REVIEW_ITEMS, commonReviewItems)

  return {
    documentTypes: documentTypes.length,
    reviewItems: reviewItems.length,
    commonReviewItems: commonReviewItems.length,
  }
}
