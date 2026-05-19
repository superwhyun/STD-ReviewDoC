"use client"

import { useEffect, useState } from "react"
import type { ReviewResult, ReviewItem, CommonReviewItem } from "@/lib/types"
import { reviewResultStorage, reviewItemStorage, commonReviewItemStorage } from "@/lib/storage/local-storage"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"

interface Document {
  id: string
  file_name: string
  document_types: {
    name: string
  }
}

interface DocumentReviewDialogProps {
  document: Document
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ReviewResultWithItem extends ReviewResult {
  review_items?: ReviewItem
  common_review_items?: CommonReviewItem
}

function getScoreBadgeClass(score: number): string {
  if (score >= 80) return "bg-green-500 text-white"
  if (score >= 50) return "bg-amber-400 text-black"
  return "bg-red-500 text-white"
}

export function DocumentReviewDialog({ document, open, onOpenChange }: DocumentReviewDialogProps) {
  const [results, setResults] = useState<ReviewResultWithItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingPrompt, setEditingPrompt] = useState<string>("")
  const scoredResults = results.filter((result) => result.score !== undefined)
  const averageScore =
    scoredResults.length > 0
      ? Math.round(scoredResults.reduce((sum, result) => sum + result.score!, 0) / scoredResults.length)
      : undefined

  useEffect(() => {
    if (open) {
      fetchResults()
    }
  }, [open])

  const fetchResults = async () => {
    setIsLoading(true)
    try {
      const reviewResults = reviewResultStorage.getByDocument(document.id)

      // Enhance results with review item details
      const enhancedResults: ReviewResultWithItem[] = reviewResults.map((result) => {
        if (result.common_review_item_id) {
          const commonItem = commonReviewItemStorage.get(result.common_review_item_id)
          return {
            ...result,
            common_review_items: commonItem,
          }
        } else if (result.review_item_id) {
          const reviewItem = reviewItemStorage.get(result.review_item_id)
          return {
            ...result,
            review_items: reviewItem,
          }
        }
        return result
      })

      setResults(enhancedResults)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartEditPrompt = (result: ReviewResultWithItem) => {
    const item = result.common_review_items || result.review_items
    setEditingId(result.id)
    setEditingPrompt(item?.prompt ?? "")
  }

  const handleCancelEditPrompt = () => {
    setEditingId(null)
    setEditingPrompt("")
  }

  const handleSavePrompt = (result: ReviewResultWithItem) => {
    const item = result.common_review_items || result.review_items
    const nextPrompt = editingPrompt.trim()
    if (!item) return
    if (nextPrompt === "") {
      toast.error("프롬프트를 입력해주세요.")
      return
    }

    if (result.common_review_item_id) {
      commonReviewItemStorage.update(item.id, { name: item.name, prompt: nextPrompt })
    } else if (result.review_item_id) {
      reviewItemStorage.update(item.id, { name: item.name, prompt: nextPrompt })
    }

    setResults((prev) =>
      prev.map((storedResult) =>
        storedResult.id === result.id
          ? {
              ...storedResult,
              common_review_items: storedResult.common_review_items
                ? { ...storedResult.common_review_items, prompt: nextPrompt }
                : undefined,
              review_items: storedResult.review_items
                ? { ...storedResult.review_items, prompt: nextPrompt }
                : undefined,
            }
          : storedResult
      )
    )

    setEditingId(null)
    setEditingPrompt("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-[90vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{document.file_name}</DialogTitle>
          <DialogDescription>{document.document_types.name} 검토 결과</DialogDescription>
          {averageScore !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">전체 평균:</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getScoreBadgeClass(averageScore)}`}>
                {averageScore}점
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">검토 결과가 없습니다</div>
          ) : (
            results.map((result) => {
              const item = result.common_review_items || result.review_items
              const isCommon = !!result.common_review_items
              const isEditing = editingId === result.id

              return (
                <Card key={result.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{item?.name}</CardTitle>
                      <div className="flex items-center gap-2 shrink-0">
                        {result.score !== undefined && (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getScoreBadgeClass(result.score)}`}>
                            {result.score}점
                          </span>
                        )}
                        {isCommon && (
                          <Badge variant="secondary">공통</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(result.created_at).toLocaleString("ko-KR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingPrompt}
                          onChange={(event) => setEditingPrompt(event.target.value)}
                          rows={4}
                          className="text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => handleSavePrompt(result)} disabled={editingPrompt.trim() === ""}>
                            저장
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEditPrompt}>
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <CardDescription className="text-xs whitespace-pre-wrap">{item?.prompt}</CardDescription>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => handleStartEditPrompt(result)}
                          disabled={!item}
                          aria-label="검토 프롬프트 편집"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        components={{
                          h3: ({ ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
                          h4: ({ ...props }) => <h4 className="text-base font-semibold mt-3 mb-2" {...props} />,
                          p: ({ ...props }) => <p className="text-sm mb-2" {...props} />,
                          ul: ({ ...props }) => <ul className="list-disc pl-6 mb-2 text-sm" {...props} />,
                          ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-2 text-sm" {...props} />,
                          li: ({ ...props }) => <li className="mb-1" {...props} />,
                          code: ({ ...props }) => (
                            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props} />
                          ),
                          pre: ({ ...props }) => (
                            <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs" {...props} />
                          ),
                          hr: ({ ...props }) => <hr className="my-4 border-border" {...props} />,
                        }}
                      >
                        {result.result}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
