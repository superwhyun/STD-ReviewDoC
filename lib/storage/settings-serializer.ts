import type { Language } from "@/lib/storage/language-storage"
import { getLanguage } from "@/lib/storage/language-storage"
import { commonReviewItemStorage, documentTypeStorage, reviewItemStorage } from "@/lib/storage/local-storage"

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

function toExportReviewItem(item: { id: string; name: string; prompt: string; order_index: number }): SettingsExportReviewItem {
  return {
    id: item.id,
    name: item.name,
    prompt: item.prompt,
    order_index: item.order_index,
  }
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

export function getSettingsExportFileName(date = new Date()): string {
  return `draftreviewr-settings-${date.toISOString().slice(0, 10)}.json`
}
