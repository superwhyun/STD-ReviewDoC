"use client"

import { useState } from "react"
import type { ReviewItem } from "@/lib/types"
import { reviewItemStorage } from "@/lib/storage/local-storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { ReviewItemForm } from "./review-item-form"
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

interface ReviewItemCardProps {
  reviewItem: ReviewItem
  onUpdate: (item: ReviewItem) => void
  onDelete: (id: string) => void
}

export function ReviewItemCard({ reviewItem, onUpdate, onDelete }: ReviewItemCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDelete = async () => {
    const success = reviewItemStorage.delete(reviewItem.id)
    if (success) {
      onDelete(reviewItem.id)
    }
  }

  if (isEditing) {
    return (
      <ReviewItemForm
        documentTypeId={reviewItem.document_type_id}
        reviewItem={reviewItem}
        onSuccess={(updated) => {
          onUpdate(updated)
          setIsEditing(false)
        }}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>{reviewItem.name}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="whitespace-pre-wrap">{reviewItem.prompt}</CardDescription>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>검토 항목 삭제</AlertDialogTitle>
            <AlertDialogDescription>정말로 이 검토 항목을 삭제하시겠습니까?</AlertDialogDescription>
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
