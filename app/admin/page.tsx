"use client"

import { DocumentTypesList } from "@/components/admin/document-types-list"
import { CommonReviewItemsList } from "@/components/admin/common-review-items-list"
import { Button } from "@/components/ui/button"
import { ExportImportDialog } from "@/components/export-import-dialog"
import Link from "next/link"
import { useEffect } from "react"
import { initializeDefaultData } from "@/lib/storage/local-storage"

export default function AdminPage() {
  useEffect(() => {
    const loadData = async () => {
      await initializeDefaultData()
    }
    loadData()
  }, [])

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
