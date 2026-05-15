/**
 * localStorage-based data management
 * All data is stored in browser localStorage
 */

import { DocumentType, ReviewItem, CommonReviewItem, Document, ReviewResult } from "@/lib/types"

const KEYS = {
  DOCUMENT_TYPES: "draftreviewr:document-types",
  REVIEW_ITEMS: "draftreviewr:review-items",
  COMMON_REVIEW_ITEMS: "draftreviewr:common-review-items",
  DOCUMENTS: "draftreviewr:documents",
  REVIEW_RESULTS: "draftreviewr:review-results",
  API_KEY: "draftreviewr:api-key",
  USER_ID: "draftreviewr:user-id",
}

// Utility functions
function generateId(): string {
  return crypto.randomUUID()
}

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  const item = localStorage.getItem(key)
  return item ? JSON.parse(item) : defaultValue
}

function setItem(key: string, value: any): void {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
}

// Document Types
export const documentTypeStorage = {
  getAll(): DocumentType[] {
    return getItem(KEYS.DOCUMENT_TYPES, [])
  },

  get(id: string): DocumentType | undefined {
    return this.getAll().find((item) => item.id === id)
  },

  create(data: { name: string; description?: string }): DocumentType {
    const types = this.getAll()
    const newType: DocumentType = {
      id: generateId(),
      name: data.name,
      description: data.description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    types.push(newType)
    setItem(KEYS.DOCUMENT_TYPES, types)
    return newType
  },

  update(id: string, data: { name: string; description?: string }): DocumentType | null {
    const types = this.getAll()
    const index = types.findIndex((t) => t.id === id)
    if (index === -1) return null

    types[index] = {
      ...types[index],
      ...data,
      updated_at: new Date().toISOString(),
    }
    setItem(KEYS.DOCUMENT_TYPES, types)
    return types[index]
  },

  delete(id: string): boolean {
    const types = this.getAll().filter((t) => t.id !== id)
    setItem(KEYS.DOCUMENT_TYPES, types)

    // Cascade delete review items
    const items = reviewItemStorage.getAll().filter((item) => item.document_type_id !== id)
    setItem(KEYS.REVIEW_ITEMS, items)

    return true
  },
}

// Review Items
export const reviewItemStorage = {
  getAll(): ReviewItem[] {
    return getItem(KEYS.REVIEW_ITEMS, [])
  },

  getByDocumentType(documentTypeId: string): ReviewItem[] {
    return this.getAll()
      .filter((item) => item.document_type_id === documentTypeId)
      .sort((a, b) => a.order_index - b.order_index)
  },

  get(id: string): ReviewItem | undefined {
    return this.getAll().find((item) => item.id === id)
  },

  create(data: { document_type_id: string; name: string; prompt: string }): ReviewItem {
    const items = this.getAll()
    const maxOrder = items.filter((i) => i.document_type_id === data.document_type_id).reduce((max, item) => Math.max(max, item.order_index), 0)

    const newItem: ReviewItem = {
      id: generateId(),
      document_type_id: data.document_type_id,
      name: data.name,
      prompt: data.prompt,
      order_index: maxOrder + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    items.push(newItem)
    setItem(KEYS.REVIEW_ITEMS, items)
    return newItem
  },

  update(id: string, data: { name: string; prompt: string }): ReviewItem | null {
    const items = this.getAll()
    const index = items.findIndex((i) => i.id === id)
    if (index === -1) return null

    items[index] = {
      ...items[index],
      ...data,
      updated_at: new Date().toISOString(),
    }
    setItem(KEYS.REVIEW_ITEMS, items)
    return items[index]
  },

  delete(id: string): boolean {
    const items = this.getAll().filter((i) => i.id !== id)
    setItem(KEYS.REVIEW_ITEMS, items)
    return true
  },
}

// Common Review Items
export const commonReviewItemStorage = {
  getAll(): CommonReviewItem[] {
    return getItem(KEYS.COMMON_REVIEW_ITEMS, []).sort((a: CommonReviewItem, b: CommonReviewItem) => a.order_index - b.order_index)
  },

  get(id: string): CommonReviewItem | undefined {
    return this.getAll().find((item) => item.id === id)
  },

  create(data: { name: string; prompt: string }): CommonReviewItem {
    const items = this.getAll()
    const maxOrder = items.reduce((max, item) => Math.max(max, item.order_index), 0)

    const newItem: CommonReviewItem = {
      id: generateId(),
      name: data.name,
      prompt: data.prompt,
      order_index: maxOrder + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    items.push(newItem)
    setItem(KEYS.COMMON_REVIEW_ITEMS, items)
    return newItem
  },

  update(id: string, data: { name: string; prompt: string }): CommonReviewItem | null {
    const items = this.getAll()
    const index = items.findIndex((i) => i.id === id)
    if (index === -1) return null

    items[index] = {
      ...items[index],
      ...data,
      updated_at: new Date().toISOString(),
    }
    setItem(KEYS.COMMON_REVIEW_ITEMS, items)
    return items[index]
  },

  delete(id: string): boolean {
    const items = this.getAll().filter((i) => i.id !== id)
    setItem(KEYS.COMMON_REVIEW_ITEMS, items)
    return true
  },
}

// Documents
export const documentStorage = {
  getAll(): Document[] {
    return getItem(KEYS.DOCUMENTS, []).sort((a: Document, b: Document) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  get(id: string): Document | undefined {
    return this.getAll().find((doc) => doc.id === id)
  },

  create(data: { document_type_id: string; file_name: string; file_url: string }): Document {
    const docs = this.getAll()
    const userId = getUserId()

    const newDoc: Document = {
      id: generateId(),
      user_id: userId,
      document_type_id: data.document_type_id,
      file_name: data.file_name,
      file_url: data.file_url,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    docs.push(newDoc)
    setItem(KEYS.DOCUMENTS, docs)
    return newDoc
  },

  updateStatus(id: string, status: Document["status"]): Document | null {
    const docs = this.getAll()
    const index = docs.findIndex((d) => d.id === id)
    if (index === -1) return null

    docs[index] = {
      ...docs[index],
      status,
      updated_at: new Date().toISOString(),
    }
    setItem(KEYS.DOCUMENTS, docs)
    return docs[index]
  },

  delete(id: string): boolean {
    const docs = this.getAll().filter((d) => d.id !== id)
    setItem(KEYS.DOCUMENTS, docs)

    // Cascade delete review results
    const results = reviewResultStorage.getAll().filter((r) => r.document_id !== id)
    setItem(KEYS.REVIEW_RESULTS, results)

    return true
  },
}

// Review Results
export const reviewResultStorage = {
  getAll(): ReviewResult[] {
    return getItem(KEYS.REVIEW_RESULTS, [])
  },

  getByDocument(documentId: string): ReviewResult[] {
    return this.getAll().filter((r) => r.document_id === documentId)
  },

  create(data: {
    document_id: string
    review_item_id?: string
    common_review_item_id?: string
    result: string
  }): ReviewResult {
    const results = this.getAll()

    const newResult: ReviewResult = {
      id: generateId(),
      document_id: data.document_id,
      review_item_id: data.review_item_id || null,
      common_review_item_id: data.common_review_item_id || null,
      result: data.result,
      created_at: new Date().toISOString(),
    }
    results.push(newResult)
    setItem(KEYS.REVIEW_RESULTS, results)
    return newResult
  },

  deleteByDocument(documentId: string): boolean {
    const results = this.getAll().filter((r) => r.document_id !== documentId)
    setItem(KEYS.REVIEW_RESULTS, results)
    return true
  },
}

// API Key
export const apiKeyStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(KEYS.API_KEY)
  },

  set(apiKey: string): void {
    if (typeof window === "undefined") return
    localStorage.setItem(KEYS.API_KEY, apiKey)
  },

  delete(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(KEYS.API_KEY)
  },

  exists(): boolean {
    return !!this.get()
  },

  getMasked(): string | null {
    const key = this.get()
    if (!key) return null
    return `${key.slice(0, 7)}...${key.slice(-4)}`
  },
}

// User ID
function getUserId(): string {
  let userId = getItem(KEYS.USER_ID, "")
  if (!userId) {
    userId = `user-${Date.now()}`
    setItem(KEYS.USER_ID, userId)
  }
  return userId
}

// Export/Import
export const exportImportStorage = {
  // Export settings only (for selling/sharing knowledge)
  exportSettings(): string {
    const data = {
      version: "1.0.0",
      exported_at: new Date().toISOString(),
      document_types: documentTypeStorage.getAll(),
      review_items: reviewItemStorage.getAll(),
      common_review_items: commonReviewItemStorage.getAll(),
    }
    return JSON.stringify(data, null, 2)
  },

  // Export full backup (including API key and history)
  exportFullBackup(): string {
    const data = {
      version: "1.0.0",
      exported_at: new Date().toISOString(),
      document_types: documentTypeStorage.getAll(),
      review_items: reviewItemStorage.getAll(),
      common_review_items: commonReviewItemStorage.getAll(),
      documents: documentStorage.getAll(),
      review_results: reviewResultStorage.getAll(),
      api_key: apiKeyStorage.get(),
      user_id: getUserId(),
    }
    return JSON.stringify(data, null, 2)
  },

  // Import settings (merge with existing)
  importSettings(jsonString: string, merge: boolean = false): void {
    const data = JSON.parse(jsonString)

    if (!merge) {
      // Replace mode
      setItem(KEYS.DOCUMENT_TYPES, data.document_types || [])
      setItem(KEYS.REVIEW_ITEMS, data.review_items || [])
      setItem(KEYS.COMMON_REVIEW_ITEMS, data.common_review_items || [])
    } else {
      // Merge mode - add new items, skip duplicates
      const existingTypes = documentTypeStorage.getAll()
      const existingTypeNames = new Set(existingTypes.map((t) => t.name))

      const newTypes = (data.document_types || []).filter((t: DocumentType) => !existingTypeNames.has(t.name))

      setItem(KEYS.DOCUMENT_TYPES, [...existingTypes, ...newTypes])
      setItem(KEYS.REVIEW_ITEMS, [...reviewItemStorage.getAll(), ...(data.review_items || [])])
      setItem(KEYS.COMMON_REVIEW_ITEMS, [...commonReviewItemStorage.getAll(), ...(data.common_review_items || [])])
    }
  },

  // Import full backup (replace all data)
  importFullBackup(jsonString: string): void {
    const data = JSON.parse(jsonString)

    setItem(KEYS.DOCUMENT_TYPES, data.document_types || [])
    setItem(KEYS.REVIEW_ITEMS, data.review_items || [])
    setItem(KEYS.COMMON_REVIEW_ITEMS, data.common_review_items || [])
    setItem(KEYS.DOCUMENTS, data.documents || [])
    setItem(KEYS.REVIEW_RESULTS, data.review_results || [])

    if (data.api_key) {
      apiKeyStorage.set(data.api_key)
    }
    if (data.user_id) {
      setItem(KEYS.USER_ID, data.user_id)
    }
  },

  // Clear all data
  clearAll(): void {
    Object.values(KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
  },
}

// Initialize with default data if empty
export async function initializeDefaultData() {
  // Check if data already exists
  if (documentTypeStorage.getAll().length > 0 || commonReviewItemStorage.getAll().length > 0) {
    return
  }

  try {
    // Load default data from JSON file
    const response = await fetch("/lib/storage/default-data.json")
    if (!response.ok) {
      console.error("Failed to load default data")
      return
    }

    const defaultData = await response.text()
    // Use the existing import function to load default data
    exportImportStorage.importSettings(defaultData, false)
  } catch (error) {
    console.error("Error loading default data:", error)
  }
}
