import type { Language } from "@/lib/storage/language-storage"
import { getLanguage, setLanguage } from "@/lib/storage/language-storage"
import { commonReviewItemStorage, documentTypeStorage, reviewItemStorage } from "@/lib/storage/local-storage"
import type { CommonReviewItem, DocumentType, ReviewItem } from "@/lib/types"

const STORAGE_KEYS = {
  DOCUMENT_TYPES: "draftreviewr:document-types",
  REVIEW_ITEMS: "draftreviewr:review-items",
  COMMON_REVIEW_ITEMS: "draftreviewr:common-review-items",
} as const

export interface SettingsExportReviewItem {
  id: string
  name: string
  prompt: string
  order_index: number
}

export interface SettingsExportDocumentType {
  id: string
  name: string
  description: string
  review_items: SettingsExportReviewItem[]
}

export interface SettingsExport {
  version: "1"
  exported_at: string
  language: Language
  document_types: SettingsExportDocumentType[]
  common_review_items: SettingsExportReviewItem[]
}

interface SettingsImport extends Omit<SettingsExport, "language"> {
  language?: Language
}

function toExportReviewItem(item: { id: string; name: string; prompt: string; order_index: number }): SettingsExportReviewItem {
  return {
    id: item.id,
    name: item.name,
    prompt: item.prompt,
    order_index: item.order_index,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key]
  if (typeof value !== "string") {
    throw new Error(`Invalid or missing ${key}`)
  }
  return value
}

function readNumber(source: Record<string, unknown>, key: string): number {
  const value = source[key]
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid or missing ${key}`)
  }
  return value
}

function readReviewItems(value: unknown): SettingsExportReviewItem[] {
  if (!Array.isArray(value)) {
    throw new Error("Invalid or missing review_items")
  }

  return value.map((item) => {
    if (!isRecord(item)) {
      throw new Error("Invalid review item")
    }

    return {
      id: readString(item, "id"),
      name: readString(item, "name"),
      prompt: readString(item, "prompt"),
      order_index: readNumber(item, "order_index"),
    }
  })
}

function assertUniqueIds(items: { id: string }[], label: string): void {
  const ids = new Set<string>()

  for (const item of items) {
    if (ids.has(item.id)) {
      throw new Error(`Duplicate ${label} id: ${item.id}`)
    }
    ids.add(item.id)
  }
}

function parseSettingsImport(json: unknown): SettingsImport {
  if (!isRecord(json)) {
    throw new Error("Settings import must be a JSON object")
  }

  if (json.version !== "1") {
    throw new Error("Unsupported or missing settings version")
  }

  const language = json.language
  if (language !== undefined && language !== "ko" && language !== "en") {
    throw new Error("Invalid language")
  }

  if (!Array.isArray(json.document_types)) {
    throw new Error("Invalid or missing document_types")
  }

  const documentTypes = json.document_types.map((documentType) => {
    if (!isRecord(documentType)) {
      throw new Error("Invalid document type")
    }

    return {
      id: readString(documentType, "id"),
      name: readString(documentType, "name"),
      description: readString(documentType, "description"),
      review_items: readReviewItems(documentType.review_items),
    }
  })

  const commonReviewItems = readReviewItems(json.common_review_items)

  assertUniqueIds(documentTypes, "document type")
  assertUniqueIds(
    documentTypes.flatMap((documentType) => documentType.review_items),
    "review item",
  )
  assertUniqueIds(commonReviewItems, "common review item")

  return {
    version: "1",
    exported_at: typeof json.exported_at === "string" ? json.exported_at : "",
    language,
    document_types: documentTypes,
    common_review_items: commonReviewItems,
  }
}

function setStorageItem<T>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function exportSettings(): SettingsExport {
  const reviewItems = reviewItemStorage.getAll()

  return {
    version: "1",
    exported_at: new Date().toISOString(),
    language: getLanguage(),
    document_types: documentTypeStorage.getAll().map((documentType) => ({
      id: documentType.id,
      name: documentType.name,
      description: documentType.description ?? "",
      review_items: reviewItems
        .filter((item) => item.document_type_id === documentType.id)
        .sort((a, b) => a.order_index - b.order_index)
        .map(toExportReviewItem),
    })),
    common_review_items: commonReviewItemStorage.getAll().map(toExportReviewItem),
  }
}

export function exportSettingsJson(): string {
  return JSON.stringify(exportSettings(), null, 2)
}

export function importSettings(json: unknown): void {
  if (typeof window === "undefined") {
    throw new Error("Settings import is only available in the browser")
  }

  const settings = parseSettingsImport(json)
  const now = new Date().toISOString()

  const documentTypes: DocumentType[] = settings.document_types.map((documentType) => ({
    id: documentType.id,
    name: documentType.name,
    description: documentType.description || null,
    created_at: now,
    updated_at: now,
  }))

  const reviewItems: ReviewItem[] = settings.document_types.flatMap((documentType) =>
    documentType.review_items.map((item) => ({
      id: item.id,
      document_type_id: documentType.id,
      name: item.name,
      prompt: item.prompt,
      order_index: item.order_index,
      created_at: now,
      updated_at: now,
    })),
  )

  const commonReviewItems: CommonReviewItem[] = settings.common_review_items.map((item) => ({
    id: item.id,
    name: item.name,
    prompt: item.prompt,
    order_index: item.order_index,
    created_at: now,
    updated_at: now,
  }))

  setStorageItem(STORAGE_KEYS.DOCUMENT_TYPES, documentTypes)
  setStorageItem(STORAGE_KEYS.REVIEW_ITEMS, reviewItems)
  setStorageItem(STORAGE_KEYS.COMMON_REVIEW_ITEMS, commonReviewItems)
  if (settings.language) {
    setLanguage(settings.language)
  }
}

export function getSettingsExportFileName(date = new Date()): string {
  return `draftreviewr-settings-${date.toISOString().slice(0, 10)}.json`
}
