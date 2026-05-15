"use client"

import { useState, useEffect } from "react"
import { commonReviewItemStorage } from "@/lib/storage/local-storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CommonReviewItemCard } from "./common-review-item-card"
import { CommonReviewItemDialog } from "./common-review-item-dialog"
import type { CommonReviewItem } from "@/lib/types"

export function CommonReviewItemsList() {
  const [commonItems, setCommonItems] = useState<CommonReviewItem[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CommonReviewItem | null>(null)

  useEffect(() => {
    setCommonItems(commonReviewItemStorage.getAll())
  }, [])

  const handleAdd = () => {
    setEditingItem(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (item: CommonReviewItem) => {
    setEditingItem(item)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const success = commonReviewItemStorage.delete(id)
    if (success) {
      setCommonItems(commonItems.filter((item) => item.id !== id))
    }
  }

  const handleSave = (item: CommonReviewItem) => {
    if (editingItem) {
      setCommonItems(commonItems.map((i) => (i.id === item.id ? item : i)))
    } else {
      setCommonItems([...commonItems, item])
    }
    setIsDialogOpen(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>공통 검토 항목</CardTitle>
            <CardDescription>모든 문서 타입에 적용되는 검토 항목</CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            새 항목 추가
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {commonItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            공통 검토 항목이 없습니다. 새 항목을 추가하세요.
          </p>
        ) : (
          <div className="space-y-4">
            {commonItems.map((item) => (
              <CommonReviewItemCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </CardContent>

      <CommonReviewItemDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        item={editingItem}
        onSave={handleSave}
      />
    </Card>
  )
}
