"use client"

import { useEffect, useState } from "react"
import { DocumentUploadSection } from "@/components/documents/document-upload-section"
import { DocumentsList } from "@/components/documents/documents-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { documentTypeStorage, documentStorage, initializeDefaultData } from "@/lib/storage/local-storage"
import type { DocumentType, Document } from "@/lib/types"

export default function HomePage() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [documents, setDocuments] = useState<Document[]>([])

  useEffect(() => {
    const loadData = async () => {
      await initializeDefaultData()
      setDocumentTypes(documentTypeStorage.getAll())
      setDocuments(documentStorage.getAll())
    }
    loadData()
  }, [])

  const handleDocumentAdded = () => {
    setDocuments(documentStorage.getAll())
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">문서 검토 시스템</h1>
              <p className="mt-1 text-sm text-muted-foreground">AI 기반 표준초안 문서 검토</p>
            </div>
            <div className="flex gap-2">
              <Link href="/settings">
                <Button variant="outline">설정</Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline">관리자</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <DocumentUploadSection documentTypes={documentTypes} onDocumentAdded={handleDocumentAdded} />
          <DocumentsList initialDocuments={documents} />
        </div>
      </main>
    </div>
  )
}
