"use client"

import { useEffect, useState } from "react"
import type { ReviewResult, ReviewItem, CommonReviewItem } from "@/lib/types"
import { reviewResultStorage, reviewItemStorage, commonReviewItemStorage } from "@/lib/storage/local-storage"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
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

export function DocumentReviewDialog({ document, open, onOpenChange }: DocumentReviewDialogProps) {
  const [results, setResults] = useState<ReviewResultWithItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{document.file_name}</DialogTitle>
          <DialogDescription>{document.document_types.name} 검토 결과</DialogDescription>
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

              return (
                <Card key={result.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{item?.name}</CardTitle>
                      {isCommon && (
                        <Badge variant="secondary" className="shrink-0">
                          공통
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">{item?.prompt}</CardDescription>
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
