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

function shouldShowReasoning(provider: LLMProviderType, model: string): boolean {
  if (provider === "grok") return true
  if (provider === "openai") return /^o\d/.test(model)
  return false
}

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

  const loadConfigs = useCallback(() => {
    const all = llmProviderStorage.getAll()
    setConfigs(all)
    const active = llmProviderStorage.getActive()
    setSelectedProvider(active)
    const cfg = all.find((c) => c.provider === active)
    if (cfg) {
      setModel(cfg.model)
      setReasoning(cfg.reasoning?.effort || "")
      fetchModels(active, cfg.apiKey, cfg.model)
    } else {
      fetchModels(active, "", "")
    }
  }, [])

  useEffect(() => {
    migrateLegacyApiKey()
    loadConfigs()
  }, [loadConfigs])

  const fetchModels = async (provider: LLMProviderType, key: string, currentModel?: string) => {
    setLoadingModels(true)
    try {
      const p = await createProvider({ provider, apiKey: key, model: "" } as LLMProviderConfig)
      const list = await p.listModels()
      setModels(list)
      const targetModel = currentModel !== undefined ? currentModel : model
      if (list.length > 0 && !targetModel) {
        setModel(list[0].id)
      }
    } catch {
      setModels([])
    } finally {
      setLoadingModels(false)
    }
  }

  const handleProviderChange = (provider: LLMProviderType) => {
    setSelectedProvider(provider)
    llmProviderStorage.setActive(provider)
    setApiKey("")
    setMessage(null)
    const cfg = configs.find((c) => c.provider === provider)
    const selectedM = cfg?.model || ""
    setModel(selectedM)
    setReasoning(cfg?.reasoning?.effort || "")
    fetchModels(provider, cfg?.apiKey || "", selectedM)
  }

  const currentConfig = configs.find((c) => c.provider === selectedProvider)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey) return
    setIsLoading(true); setMessage(null)
    try {
      const cfg: LLMProviderConfig = { provider: selectedProvider, apiKey, model: model || "" }
      if (reasoning && shouldShowReasoning(selectedProvider, model)) {
        cfg.reasoning = { effort: reasoning as LLMProviderConfig["reasoning"] extends { effort: infer E } ? E : never }
      }
      llmProviderStorage.save(cfg)
      setMessage({ type: "success", text: `${PROVIDERS.find(p => p.type === selectedProvider)?.label} API 키 및 모델 저장됨` })
      setApiKey("")
      loadConfigs()
      fetchModels(selectedProvider, apiKey, model)
    } catch {
      setMessage({ type: "error", text: "API 키 저장 중 오류" })
    } finally { setIsLoading(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`${PROVIDERS.find(p => p.type === selectedProvider)?.label} API 키를 삭제하시겠습니까?`)) return
    setIsLoading(true); setMessage(null)
    try {
      llmProviderStorage.delete(selectedProvider)
      setMessage({ type: "success", text: "삭제됨" })
      setModel("")
      setReasoning("")
      loadConfigs()
      fetchModels(selectedProvider, "", "")
    } catch {
      setMessage({ type: "error", text: "삭제 중 오류" })
    } finally {
      setIsLoading(false)
    }
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
              <Label htmlFor="model">검토 모델 선택 (최신 모델 조회)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={loadingModels}
                onClick={() => fetchModels(selectedProvider, currentConfig?.apiKey || apiKey, model)}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loadingModels ? "animate-spin" : ""}`} />
                {loadingModels ? "모델 조회 중..." : "최신 모델 새로고침"}
              </Button>
            </div>
            {models.length > 0 ? (
              <div className="space-y-2">
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger id="model">
                    <SelectValue placeholder="모델을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="또는 모델명 직접 입력 (예: gpt-4o, claude-3.7-sonnet 등)"
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            ) : (
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="모델명 직접 입력 (예: gpt-4o, grok-3 등)"
              />
            )}
          </div>

          {shouldShowReasoning(selectedProvider, model) && (
            <div className="space-y-2">
              <Label htmlFor="reasoning">Reasoning Effort</Label>
              <Select value={reasoning} onValueChange={setReasoning}>
                <SelectTrigger id="reasoning"><SelectValue placeholder="선택 안 함" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
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
