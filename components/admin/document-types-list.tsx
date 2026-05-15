"use client"

import { useState, useEffect } from "react"
import type { DocumentType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { DocumentTypeDialog } from "./document-type-dialog"
import { DocumentTypeCard } from "./document-type-card"
import { documentTypeStorage } from "@/lib/storage/local-storage"

export function DocumentTypesList() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    setDocumentTypes(documentTypeStorage.getAll())
  }, [])

  const handleDocumentTypeAdded = (newType: DocumentType) => {
    setDocumentTypes([newType, ...documentTypes])
    setIsDialogOpen(false)
  }

  const handleDocumentTypeUpdated = (updatedType: DocumentType) => {
    setDocumentTypes(documentTypes.map((type) => (type.id === updatedType.id ? updatedType : type)))
  }

  const handleDocumentTypeDeleted = (id: string) => {
    setDocumentTypes(documentTypes.filter((type) => type.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">문서 타입</h2>
          <p className="text-sm text-muted-foreground">검토할 문서의 타입을 관리합니다</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />새 타입 추가
        </Button>
      </div>

      {documentTypes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>문서 타입이 없습니다</CardTitle>
            <CardDescription>새 문서 타입을 추가하여 시작하세요</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documentTypes.map((type) => (
            <DocumentTypeCard
              key={type.id}
              documentType={type}
              onUpdate={handleDocumentTypeUpdated}
              onDelete={handleDocumentTypeDeleted}
            />
          ))}
        </div>
      )}

      <DocumentTypeDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={handleDocumentTypeAdded} />
    </div>
  )
}
