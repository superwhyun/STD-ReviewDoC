"use client"

import type React from "react"

import { useState } from "react"
import type { ReviewItem } from "@/lib/types"
import { reviewItemStorage } from "@/lib/storage/local-storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ReviewItemFormProps {
  documentTypeId: string
  reviewItem?: ReviewItem
  onSuccess: (item: ReviewItem) => void
  onCancel: () => void
}

export function ReviewItemForm({ documentTypeId, reviewItem, onSuccess, onCancel }: ReviewItemFormProps) {
  const [name, setName] = useState(reviewItem?.name || "")
  const [prompt, setPrompt] = useState(reviewItem?.prompt || "")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let result: ReviewItem | null

      if (reviewItem) {
        result = reviewItemStorage.update(reviewItem.id, { name, prompt })
      } else {
        result = reviewItemStorage.create({ document_type_id: documentTypeId, name, prompt })
      }

      if (result) {
        onSuccess(result)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{reviewItem ? "검토 항목 수정" : "새 검토 항목"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">항목 이름</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 문서 구조 검토"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-prompt">검토 프롬프트</Label>
            <Textarea
              id="item-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="AI가 이 항목을 검토할 때 사용할 프롬프트를 입력하세요"
              rows={4}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "저장 중..." : reviewItem ? "수정" : "추가"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
