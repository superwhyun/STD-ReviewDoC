"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, GripVertical } from "lucide-react"
import type { CommonReviewItem } from "@/lib/types"

interface CommonReviewItemCardProps {
  item: CommonReviewItem
  onEdit: (item: CommonReviewItem) => void
  onDelete: (id: string) => void
}

export function CommonReviewItemCard({ item, onEdit, onDelete }: CommonReviewItemCardProps) {
  return (
    <Card className="transition-colors hover:bg-accent/50">
      <CardContent className="flex items-start gap-4 p-4">
        <GripVertical className="mt-1 h-5 w-5 text-muted-foreground" />
        <div className="flex-1 space-y-1">
          <h4 className="font-semibold text-foreground">{item.name}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{item.prompt}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
