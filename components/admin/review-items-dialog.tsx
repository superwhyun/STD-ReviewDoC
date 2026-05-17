"use client"

import { useState, useEffect } from "react"
import type { DocumentType, ReviewItem } from "@/lib/types"
import { reviewItemStorage } from "@/lib/storage/local-storage"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { ReviewItemForm } from "./review-item-form"
import { ReviewItemCard } from "./review-item-card"

interface ReviewItemsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentType: DocumentType
}

export function ReviewItemsDialog({ open, onOpenChange, documentType }: ReviewItemsDialogProps) {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchReviewItems()
    }
  }, [open])

  const fetchReviewItems = () => {
    setIsLoading(true)
    try {
      setReviewItems(reviewItemStorage.getByDocumentType(documentType.id))
    } finally {
      setIsLoading(false)
    }
  }

  const handleItemAdded = (newItem: ReviewItem) => {
    setReviewItems([...reviewItems, newItem])
    setIsFormOpen(false)
  }

  const handleItemUpdated = (updatedItem: ReviewItem) => {
    setReviewItems(reviewItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
  }

  const handleItemDeleted = (id: string) => {
    setReviewItems(reviewItems.filter((item) => item.id !== id))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{documentType.name} - 검토 항목</DialogTitle>
          <DialogDescription>이 문서 타입에 대한 검토 항목을 관리합니다</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button onClick={() => setIsFormOpen(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" />새 검토 항목 추가
          </Button>

          {isFormOpen && (
            <ReviewItemForm
              documentTypeId={documentType.id}
              onSuccess={handleItemAdded}
              onCancel={() => setIsFormOpen(false)}
            />
          )}

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : reviewItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">검토 항목이 없습니다</div>
          ) : (
            <div className="space-y-3">
              {reviewItems.map((item) => (
                <ReviewItemCard
                  key={item.id}
                  reviewItem={item}
                  onUpdate={handleItemUpdated}
                  onDelete={handleItemDeleted}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
