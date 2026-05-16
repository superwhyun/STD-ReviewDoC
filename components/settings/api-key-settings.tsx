"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { llmProviderStorage, migrateLegacyApiKey } from "@/lib/storage/local-storage"
import type { LLMProviderType, LLMProviderConfig } from "@/lib/types"
import { createProvider } from "@/lib/llm-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Key, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"

const PROVIDERS: Array<{ type: LLMProviderType; label: string; placeholder: string; link: string; linkText: string }> = [
  { type: "openai", label: "OpenAI", placeholder: "sk-...", link: "https://platform.openai.com/api-keys", linkText: "OpenAI 플랫폼" },
  { type: "grok", label: "Grok (xAI)", placeholder: "xai-...", link: "https://console.x.ai", linkText: "xAI 콘솔" },
  { type: "openrouter", label: "OpenRouter", placeholder: "sk-or-...", link: "https://openrouter.ai/keys", linkText: "OpenRouter" },
  { type: "kimi", label: "Kimi", placeholder: "sk-...", link: "https://platform.moonshot.cn", linkText: "Moonshot 플랫폼" },
]

const SHOW_REASONING_FOR: LLMProviderType[] = ["openai", "grok"]

export function ApiKeySettings() {
  const [selectedProvider, setSelectedProvider] = useState<LLMProviderType>("openai")
  const [configs, setConfigs] = useState<LLMProviderConfig[]>([])
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("")
  const [reasoning, setReasoning] = useState<string>("")
  const [models, setModels] = useState<Array<{ id: string; name: string }>>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => { migrateLegacyApiKey(); loadConfigs() }, [])

  const loadConfigs = () => {
    const all = llmProviderStorage.getAll()
    setConfigs(all)
    const active = llmProviderStorage.getActive()
    setSelectedProvider(active)
    const cfg = all.find((c) => c.provider === active)
    if (cfg) { setModel(cfg.model); setReasoning(cfg.reasoning?.effort || "") }
  }

  const fetchModels = useCallback(async (provider: LLMProviderType, apiKey: string) => {
    setLoadingModels(true)
    try {
      const p = await createProvider({ provider, apiKey, model: "" } as LLMProviderConfig)
      const list = await p.listModels()
      setModels(list)
      if (list.length > 0 && !list.find(m => m.id === model)) setModel(list[0].id)
    } catch {
      setModels([])
    } finally { setLoadingModels(false) }
  }, [model])

  const handleProviderChange = (provider: LLMProviderType) => {
    setSelectedProvider(provider)
    llmProviderStorage.setActive(provider)
    setApiKey(""); setMessage(null)
    const cfg = configs.find((c) => c.provider === provider)
    setModel(cfg?.model || "")
    setReasoning(cfg?.reasoning?.effort || "")
    setModels([])
    if (cfg) fetchModels(provider, cfg.apiKey)
  }

  const currentConfig = configs.find((c) => c.provider === selectedProvider)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey) return
    setIsLoading(true); setMessage(null)
    try {
      const cfg: LLMProviderConfig = { provider: selectedProvider, apiKey, model: model || "" }
      if (reasoning && reasoning !== "__none__" && SHOW_REASONING_FOR.includes(selectedProvider)) {
        cfg.reasoning = { effort: reasoning as "minimal" | "low" | "medium" | "high" }
      }
      llmProviderStorage.save(cfg)
      setMessage({ type: "success", text: `${PROVIDERS.find(p => p.type === selectedProvider)?.label} API 키 저장됨` })
      setApiKey(""); loadConfigs(); fetchModels(selectedProvider, apiKey)
    } catch {
      setMessage({ type: "error", text: "API 키 저장 중 오류" })
    } finally { setIsLoading(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`${PROVIDERS.find(p => p.type === selectedProvider)?.label} API 키를 삭제하시겠습니까?`)) return
    setIsLoading(true); setMessage(null)
    try { llmProviderStorage.delete(selectedProvider); setMessage({ type: "success", text: "삭제됨" }); setModel(""); setReasoning(""); loadConfigs(); setModels([]) }
    catch { setMessage({ type: "error", text: "삭제 중 오류" }) }
    finally { setIsLoading(false) }
  }

  const info = PROVIDERS.find(p => p.type === selectedProvider)!

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />LLM API 설정</CardTitle>
        <CardDescription>문서 검토에 사용할 AI 제공자와 API 키를 설정하세요. 모든 키는 브라우저 localStorage에 저장됩니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>AI 제공자 선택</Label>
          <Select value={selectedProvider} onValueChange={(v) => handleProviderChange(v as LLMProviderType)}>
            <SelectTrigger><SelectValue placeholder="제공자 선택" /></SelectTrigger>
            <SelectContent>{PROVIDERS.map((p) => <SelectItem key={p.type} value={p.type}>{p.label} {configs.some(c => c.provider === p.type) ? "✓" : ""}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {currentConfig && <Alert><CheckCircle2 className="h-4 w-4" /><AlertDescription>{info.label} 키 등록됨 · 모델: {currentConfig.model}</AlertDescription></Alert>}
        {message && <Alert variant={message.type === "error" ? "destructive" : "default"}>{message.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}<AlertDescription>{message.text}</AlertDescription></Alert>}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">{currentConfig ? "새 API 키" : "API 키"}</Label>
            <div className="relative">
              <Input id="api-key" type={showApiKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={info.placeholder} required className="pr-10" />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground"><a href={info.link} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{info.linkText}</a>에서 발급</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="model">모델</Label>
              {currentConfig && (
                <Button type="button" variant="ghost" size="sm" disabled={loadingModels} onClick={() => fetchModels(selectedProvider, currentConfig.apiKey)}>
                  <RefreshCw className={`h-3 w-3 mr-1 ${loadingModels ? "animate-spin" : ""}`} />새로고침
                </Button>
              )}
            </div>
            {models.length > 0 ? (
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model"><SelectValue placeholder="모델 선택" /></SelectTrigger>
                <SelectContent>{models.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="직접 입력 또는 API 키 저장 후 새로고침" />
            )}
          </div>

          {SHOW_REASONING_FOR.includes(selectedProvider) && (
            <div className="space-y-2">
              <Label htmlFor="reasoning">Reasoning Effort</Label>
              <Select value={reasoning} onValueChange={setReasoning}>
                <SelectTrigger id="reasoning"><SelectValue placeholder="선택 안 함" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">사용 안 함</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !apiKey}>{isLoading ? "저장 중..." : currentConfig ? "업데이트" : "저장"}</Button>
            {currentConfig && <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>삭제</Button>}
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
