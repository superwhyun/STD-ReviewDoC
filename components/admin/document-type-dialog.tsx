"use client"

import type React from "react"

import { useEffect, useState } from "react"
import type { DocumentType } from "@/lib/types"
import { documentTypeStorage } from "@/lib/storage/local-storage"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface DocumentTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentType?: DocumentType
  onSuccess: (type: DocumentType) => void
}

export function DocumentTypeDialog({ open, onOpenChange, documentType, onSuccess }: DocumentTypeDialogProps) {
  const [name, setName] = useState(documentType?.name || "")
  const [description, setDescription] = useState(documentType?.description || "")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(documentType?.name || "")
      setDescription(documentType?.description || "")
    }
  }, [open, documentType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let result: DocumentType | null

      if (documentType) {
        result = documentTypeStorage.update(documentType.id, { name, description })
      } else {
        result = documentTypeStorage.create({ name, description })
      }

      if (result) {
        onSuccess(result)
        onOpenChange(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{documentType ? "문서 타입 수정" : "새 문서 타입 추가"}</DialogTitle>
          <DialogDescription>문서 타입의 이름과 설명을 입력하세요</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: ISO 표준 문서"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="문서 타입에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "저장 중..." : documentType ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
