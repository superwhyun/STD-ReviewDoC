"use client"

import { ApiKeySettings } from "@/components/settings/api-key-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useEffect, useState } from "react"
import { getLanguage, setLanguage, type Language } from "@/lib/storage/language-storage"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [language, setSelectedLanguage] = useState<Language>("ko")
  const { toast } = useToast()

  useEffect(() => {
    setSelectedLanguage(getLanguage())
  }, [])

  const handleLanguageChange = (value: Language) => {
    setLanguage(value)
    setSelectedLanguage(value)
    toast({
      title: "언어 설정이 저장되었습니다",
      description: value === "ko" ? "검토 결과를 한국어로 작성합니다." : "Review results will be written in English.",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">설정</h1>
              <p className="mt-1 text-sm text-muted-foreground">API 키 및 계정 설정 관리</p>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>검토 결과 언어</CardTitle>
              <CardDescription>AI 검토 결과에 사용할 출력 언어를 선택하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="review-language">언어</Label>
                <select
                  id="review-language"
                  value={language}
                  onChange={(event) => handleLanguageChange(event.target.value as Language)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                </select>
              </div>
            </CardContent>
          </Card>
          <ApiKeySettings />
        </div>
      </main>
    </div>
  )
}
