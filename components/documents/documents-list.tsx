"use client"

import { useState, useEffect } from "react"
import { documentTypeStorage, documentStorage, reviewResultStorage } from "@/lib/storage/local-storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Eye, Trash2 } from "lucide-react"
import { DocumentReviewDialog } from "./document-review-dialog"
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

interface Document {
  id: string
  user_id: string
  document_type_id: string
  file_name: string
  file_url: string
  status: "pending" | "processing" | "completed" | "failed"
  created_at: string
}

interface DocumentWithType extends Document {
  document_types: {
    id: string
    name: string
  }
  reviewed_at?: string
}

interface DocumentsListProps {
  initialDocuments: Document[]
}

export function DocumentsList({ initialDocuments }: DocumentsListProps) {
  const [documents, setDocuments] = useState<DocumentWithType[]>([])
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithType | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<DocumentWithType | null>(null)

  // Update documents when initialDocuments changes
  useEffect(() => {
    const enhancedDocs = initialDocuments.map((doc) => {
      const docType = documentTypeStorage.get(doc.document_type_id)
      const results = reviewResultStorage.getByDocument(doc.id)
      const reviewed_at = results.length > 0
        ? results.reduce((latest, r) =>
            r.created_at > latest ? r.created_at : latest,
            results[0].created_at
          )
        : undefined
      return {
        ...doc,
        document_types: {
          id: doc.document_type_id,
          name: docType?.name || "Unknown Type",
        },
        reviewed_at,
      }
    })
    setDocuments(enhancedDocs)
  }, [initialDocuments])

  const handleDeleteClick = (doc: DocumentWithType) => {
    setDocumentToDelete(doc)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      documentStorage.delete(documentToDelete.id)
      setDocuments(documents.filter((d) => d.id !== documentToDelete.id))
      setDocumentToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "대기 중" },
      processing: { variant: "default", label: "검토 중" },
      completed: { variant: "outline", label: "완료" },
      failed: { variant: "destructive", label: "실패" },
    }

    const config = variants[status] || variants.pending
    return (
      <Badge variant={config.variant} className="bg-transparent">
        {config.label}
      </Badge>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">내 문서</h2>
          <p className="text-sm text-muted-foreground">업로드한 문서와 검토 결과를 확인하세요</p>
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>문서가 없습니다</CardTitle>
              <CardDescription>문서를 업로드하여 AI 검토를 시작하세요</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{doc.file_name}</span>
                    </span>
                  </CardTitle>
                  <CardDescription>{doc.document_types.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">상태</span>
                    {getStatusBadge(doc.status)}
                  </div>
                  {doc.reviewed_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">검토일</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.reviewed_at).toLocaleString("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => setSelectedDocument(doc)}
                      disabled={doc.status !== "completed"}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      결과 보기
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-transparent text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedDocument && (
        <DocumentReviewDialog
          document={selectedDocument}
          open={!!selectedDocument}
          onOpenChange={(open) => !open && setSelectedDocument(null)}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문서 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{documentToDelete?.file_name}" 문서와 관련된 모든 검토 결과가 삭제됩니다. 이 작업은 취소할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
