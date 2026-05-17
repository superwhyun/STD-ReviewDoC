"use client"

import { DocumentTypesList } from "@/components/admin/document-types-list"
import { CommonReviewItemsList } from "@/components/admin/common-review-items-list"
import { Button } from "@/components/ui/button"
import { ExportImportDialog } from "@/components/export-import-dialog"
import Link from "next/link"
import { RotateCcw } from "lucide-react"
import { resetToSeedData } from "@/lib/storage/seed-loader"
import { useToast } from "@/hooks/use-toast"

export default function AdminPage() {
  const { toast } = useToast()

  const handleResetToSeedData = async () => {
    try {
      const result = await resetToSeedData()
      toast({
        title: "기본값으로 초기화했습니다",
        description: `문서 타입 ${result.documentTypes}개, 검토 항목 ${result.reviewItems + result.commonReviewItems}개를 불러왔습니다.`,
      })
      window.setTimeout(() => window.location.reload(), 600)
    } catch (error) {
      toast({
        title: "기본값 초기화 실패",
        description: error instanceof Error ? error.message : "seed 데이터를 불러오지 못했습니다.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">관리자 대시보드</h1>
              <p className="mt-1 text-sm text-muted-foreground">문서 타입 및 검토 항목 관리</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleResetToSeedData}>
                <RotateCcw className="mr-2 h-4 w-4" />
                기본값으로 초기화
              </Button>
              <ExportImportDialog />
              <Link href="/">
                <Button variant="outline">사용자 페이지로</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <CommonReviewItemsList />
          <DocumentTypesList />
        </div>
      </main>
    </div>
  )
}
