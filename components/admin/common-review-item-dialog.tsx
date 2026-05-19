"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { commonReviewItemStorage } from "@/lib/storage/local-storage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CommonReviewItem } from "@/lib/types"

interface CommonReviewItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: CommonReviewItem | null
  onSave: (item: CommonReviewItem) => void
}

export function CommonReviewItemDialog({ open, onOpenChange, item, onSave }: CommonReviewItemDialogProps) {
  const [name, setName] = useState("")
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(item?.name ?? "")
      setPrompt(item?.prompt ?? "")
    }
  }, [open, item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let result: CommonReviewItem | null

      if (item) {
        result = commonReviewItemStorage.update(item.id, { name, prompt })
      } else {
        result = commonReviewItemStorage.create({ name, prompt })
      }

      if (result) {
        onSave(result)
        onOpenChange(false)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{item ? "공통 항목 수정" : "공통 항목 추가"}</DialogTitle>
          <DialogDescription>모든 문서에 적용될 공통 검토 항목을 설정합니다</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">항목 이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 맞춤법 검사"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt">검토 프롬프트</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="AI가 문서를 검토할 때 사용할 프롬프트를 입력하세요"
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">이 프롬프트는 업로드된 문서와 함께 AI에게 전달됩니다</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
