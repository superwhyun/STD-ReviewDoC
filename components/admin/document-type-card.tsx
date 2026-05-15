"use client"

import { useState } from "react"
import type { DocumentType } from "@/lib/types"
import { documentTypeStorage } from "@/lib/storage/local-storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, FileText } from "lucide-react"
import { DocumentTypeDialog } from "./document-type-dialog"
import { ReviewItemsDialog } from "./review-items-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DocumentTypeCardProps {
  documentType: DocumentType
  onUpdate: (type: DocumentType) => void
  onDelete: (id: string) => void
}

export function DocumentTypeCard({ documentType, onUpdate, onDelete }: DocumentTypeCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isReviewItemsDialogOpen, setIsReviewItemsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDelete = async () => {
    const success = documentTypeStorage.delete(documentType.id)
    if (success) {
      onDelete(documentType.id)
    }
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg">{documentType.name}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardTitle>
          {documentType.description && <CardDescription>{documentType.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full bg-transparent" onClick={() => setIsReviewItemsDialogOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            검토 항목 관리
          </Button>
        </CardContent>
      </Card>

      <DocumentTypeDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        documentType={documentType}
        onSuccess={onUpdate}
      />

      <ReviewItemsDialog
        open={isReviewItemsDialogOpen}
        onOpenChange={setIsReviewItemsDialogOpen}
        documentType={documentType}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문서 타입 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 문서 타입을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 관련된 모든 검토 항목도 함께
              삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
