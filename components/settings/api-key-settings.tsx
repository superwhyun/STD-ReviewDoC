"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { llmProviderStorage, migrateLegacyApiKey } from "@/lib/storage/local-storage"
import type { LLMProviderType, LLMProviderConfig } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Key, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"

const PROVIDERS: Array<{ type: LLMProviderType; label: string; placeholder: string; link: string; linkText: string }> = [
  { type: "openai", label: "OpenAI", placeholder: "sk-...", link: "https://platform.openai.com/api-keys", linkText: "OpenAI 플랫폼" },
  { type: "grok", label: "Grok (xAI)", placeholder: "xai-...", link: "https://console.x.ai", linkText: "xAI 콘솔" },
  { type: "openrouter", label: "OpenRouter", placeholder: "sk-or-...", link: "https://openrouter.ai/keys", linkText: "OpenRouter" },
  { type: "kimi", label: "Kimi", placeholder: "sk-...", link: "https://platform.moonshot.cn", linkText: "Moonshot 플랫폼" },
]

export function ApiKeySettings() {
  const [selectedProvider, setSelectedProvider] = useState<LLMProviderType>("openai")
  const [configs, setConfigs] = useState<LLMProviderConfig[]>([])
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    migrateLegacyApiKey()
    loadConfigs()
  }, [])

  const loadConfigs = () => {
    const all = llmProviderStorage.getAll()
    setConfigs(all)
    const active = llmProviderStorage.getActive()
    setSelectedProvider(active)
    const currentConfig = all.find((c) => c.provider === active)
    if (currentConfig) {
      setModel(currentConfig.model)
    }
  }

  const currentConfig = configs.find((c) => c.provider === selectedProvider)

  const handleProviderChange = (provider: LLMProviderType) => {
    setSelectedProvider(provider)
    llmProviderStorage.setActive(provider)
    setApiKey("")
    setMessage(null)
    const cfg = configs.find((c) => c.provider === provider)
    setModel(cfg?.model || getDefaultModel(provider))
  }

  const getDefaultModel = (provider: LLMProviderType): string => {
    switch (provider) {
      case "openai": return "gpt-5"
      case "grok": return "grok-3"
      case "openrouter": return "openai/gpt-5"
      case "kimi": return "moonshot-v1-auto"
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey) return
    setIsLoading(true)
    setMessage(null)
    try {
      llmProviderStorage.save({ provider: selectedProvider, apiKey, model: model || getDefaultModel(selectedProvider) })
      setMessage({ type: "success", text: `${PROVIDERS.find(p => p.type === selectedProvider)?.label} API 키가 저장되었습니다.` })
      setApiKey("")
      loadConfigs()
    } catch (error) {
      console.error("Error saving API key:", error)
      setMessage({ type: "error", text: "API 키 저장 중 오류가 발생했습니다." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`${PROVIDERS.find(p => p.type === selectedProvider)?.label} API 키를 삭제하시겠습니까?`)) return
    setIsLoading(true)
    setMessage(null)
    try {
      llmProviderStorage.delete(selectedProvider)
      setMessage({ type: "success", text: "API 키가 삭제되었습니다." })
      setModel("")
      loadConfigs()
    } catch (error) {
      console.error("Error deleting API key:", error)
      setMessage({ type: "error", text: "API 키 삭제 중 오류가 발생했습니다." })
    } finally {
      setIsLoading(false)
    }
  }

  const providerInfo = PROVIDERS.find(p => p.type === selectedProvider)!

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          LLM API 설정
        </CardTitle>
        <CardDescription>
          문서 검토에 사용할 AI 제공자와 API 키를 설정하세요. 모든 키는 브라우저 localStorage에 저장됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>AI 제공자 선택</Label>
          <Select value={selectedProvider} onValueChange={(v) => handleProviderChange(v as LLMProviderType)}>
            <SelectTrigger>
              <SelectValue placeholder="제공자 선택" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => (
                <SelectItem key={p.type} value={p.type}>
                  {p.label} {configs.some(c => c.provider === p.type) ? "✓" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentConfig && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              {providerInfo.label} 키 등록됨 · 모델: {currentConfig.model}
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
            <Label htmlFor="api-key">{currentConfig ? "새 API 키" : "API 키"}</Label>
            <div className="relative">
              <Input id="api-key" type={showApiKey ? "text" : "password"} value={apiKey}
                onChange={(e) => setApiKey(e.target.value)} placeholder={providerInfo.placeholder} required className="pr-10" />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <a href={providerInfo.link} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{providerInfo.linkText}</a>
              에서 발급받을 수 있습니다.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">모델</Label>
            <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder={getDefaultModel(selectedProvider)} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !apiKey}>
              {isLoading ? "저장 중..." : currentConfig ? "API 키 업데이트" : "API 키 저장"}
            </Button>
            {currentConfig && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
                API 키 삭제
              </Button>
            )}
          </div>
        </form>

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
