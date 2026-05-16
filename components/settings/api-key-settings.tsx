"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { apiKeyStorage } from "@/lib/storage/local-storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Key, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"

interface ApiKeySettingsProps {
  userId?: string
  hasExistingKey?: boolean
}

export function ApiKeySettings({ userId, hasExistingKey }: ApiKeySettingsProps) {
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [keyExists, setKeyExists] = useState(false)
  const [maskedKey, setMaskedKey] = useState<string | null>(null)

  useEffect(() => {
    checkKeyExists()
  }, [])

  const checkKeyExists = () => {
    const exists = apiKeyStorage.exists()
    setKeyExists(exists)
    if (exists) {
      setMaskedKey(apiKeyStorage.getMasked())
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      apiKeyStorage.set(apiKey)
      setMessage({ type: "success", text: "API 키가 성공적으로 저장되었습니다." })
      setApiKey("")
      checkKeyExists()
    } catch (error) {
      console.error("Error saving API key:", error)
      setMessage({ type: "error", text: "API 키 저장 중 오류가 발생했습니다." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("정말로 API 키를 삭제하시겠습니까?")) return

    setIsLoading(true)
    setMessage(null)

    try {
      apiKeyStorage.delete()
      setMessage({ type: "success", text: "API 키가 삭제되었습니다." })
      setKeyExists(false)
      setMaskedKey(null)
    } catch (error) {
      console.error("Error deleting API key:", error)
      setMessage({ type: "error", text: "API 키 삭제 중 오류가 발생했습니다." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          OpenAI API 키
        </CardTitle>
        <CardDescription>
          문서 검토를 위해 OpenAI API 키를 등록하세요. API 키는 브라우저 localStorage에 저장됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {keyExists && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              API 키가 등록되어 있습니다: <code className="text-xs">{maskedKey}</code>
            </AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            {message.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">{keyExists ? "새 API 키" : "API 키"}</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              OpenAI API 키는{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                OpenAI 플랫폼
              </a>
              에서 발급받을 수 있습니다.
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !apiKey}>
              {isLoading ? "저장 중..." : keyExists ? "API 키 업데이트" : "API 키 저장"}
            </Button>
            {keyExists && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
                API 키 삭제
              </Button>
            )}
          </div>
        </form>

        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-semibold mb-2">사용 모델</h3>
          <p className="text-sm text-muted-foreground">GPT-5 (OpenAI)</p>
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-semibold mb-2">보안 정보</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>API 키는 브라우저 localStorage에 저장됩니다 (full backup 시 포함될 수 있음)</li>
            <li>API 키는 문서 검토 시에만 사용됩니다</li>
            <li>언제든지 API 키를 삭제할 수 있습니다</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
