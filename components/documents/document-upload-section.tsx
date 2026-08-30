"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { DocumentType, LLMProviderType, LLMProviderConfig } from "@/lib/types"
import { documentStorage, reviewItemStorage, commonReviewItemStorage, reviewResultStorage, llmProviderStorage } from "@/lib/storage/local-storage"
import { extractText } from "@/lib/document-processor"
import { createProvider } from "@/lib/llm-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface DocumentUploadSectionProps {
  documentTypes: DocumentType[]
  userId?: string
  onDocumentAdded?: () => void
}

const ALLOWED_EXTENSIONS = [".docx", ".txt"]

function isValidFile(file: File): boolean {
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "")
  return ALLOWED_EXTENSIONS.includes(ext)
}

export function DocumentUploadSection({ documentTypes, userId, onDocumentAdded }: DocumentUploadSectionProps) {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<LLMProviderType>("openai")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [availableProviders, setAvailableProviders] = useState<LLMProviderConfig[]>([])
  const [providerModels, setProviderModels] = useState<Array<{ id: string; name: string }>>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState("")

  const loadProviderConfigs = async () => {
    const configs = llmProviderStorage.getAll()
    setAvailableProviders(configs)
    const active = llmProviderStorage.getActive()
    const targetProvider = configs.some(c => c.provider === active) ? active : configs[0]?.provider || "openai"
    setSelectedProvider(targetProvider)
    const activeCfg = configs.find(c => c.provider === targetProvider)
    const currentM = activeCfg?.model || ""
    setSelectedModel(currentM)
    await loadModelsForProvider(targetProvider, activeCfg?.apiKey || "", currentM)
  }

  const loadModelsForProvider = async (provider: LLMProviderType, apiKey: string, currentM?: string) => {
    setLoadingModels(true)
    try {
      const p = await createProvider({ provider, apiKey, model: "" } as LLMProviderConfig)
      const list = await p.listModels()
      setProviderModels(list)
      if (currentM) {
        setSelectedModel(currentM)
      } else if (list.length > 0) {
        setSelectedModel(list[0].id)
      }
    } catch {
      setProviderModels([])
    } finally {
      setLoadingModels(false)
    }
  }

  useEffect(() => {
    loadProviderConfigs()
  }, [])

  const handleProviderChange = async (provider: LLMProviderType) => {
    setSelectedProvider(provider)
    llmProviderStorage.setActive(provider)
    const cfg = availableProviders.find(c => c.provider === provider)
    const currentM = cfg?.model || ""
    setSelectedModel(currentM)
    await loadModelsForProvider(provider, cfg?.apiKey || "", currentM)
  }

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel)
    const cfg = availableProviders.find(c => c.provider === selectedProvider)
    if (cfg) {
      llmProviderStorage.save({
        ...cfg,
        model: newModel,
      })
      setAvailableProviders(llmProviderStorage.getAll())
    }
  }

  const handleRefreshModels = async () => {
    const cfg = availableProviders.find(c => c.provider === selectedProvider)
    await loadModelsForProvider(selectedProvider, cfg?.apiKey || "", selectedModel)
    toast.success("최신 모델 목록을 갱신했습니다.")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!isValidFile(file)) {
        toast.error("DOCX 또는 TXT 파일만 업로드할 수 있습니다.")
        return
      }
      setSelectedFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (isValidFile(file)) {
        setSelectedFile(file)
      } else {
        toast.error("DOCX 또는 TXT 파일만 지원합니다.")
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedType) return

    setIsUploading(true)
    setProgress(10)
    setProgressText("문서 텍스트 추출 중...")

    let newDocument: ReturnType<typeof documentStorage.create> | null = null

    try {
      const fileUrl = selectedFile.name
      newDocument = documentStorage.create({
        document_type_id: selectedType,
        file_name: selectedFile.name,
        file_url: fileUrl,
      })

      documentStorage.updateStatus(newDocument.id, "processing")

      const commonItems = commonReviewItemStorage.getAll()
      const typeItems = reviewItemStorage.getByDocumentType(selectedType)

      const fileContent = await extractText(selectedFile)
      const prompts = [
        ...commonItems.map((item) => ({ name: item.name, prompt: item.prompt })),
        ...typeItems.map((item) => ({ name: item.name, prompt: item.prompt })),
      ]

      if (prompts.length === 0) {
        throw new Error("검토할 항목이 없습니다. 관리자 메뉴에서 검토 항목을 먼저 설정해주세요.")
      }

      const selectedDocType = documentTypes.find((t) => t.id === selectedType)
      const documentTypeContext = selectedDocType
        ? [selectedDocType.name, selectedDocType.description].filter(Boolean).join("\n")
        : undefined

      setProgress(25)
      setProgressText(`AI 검토 시작 중... (${selectedProvider.toUpperCase()} · ${selectedModel || "기본 모델"})`)

      const cfg = availableProviders.find((c) => c.provider === selectedProvider)
      const activeConfig: LLMProviderConfig = {
        provider: selectedProvider,
        apiKey: cfg?.apiKey || "",
        model: selectedModel || cfg?.model || "",
        reasoning: cfg?.reasoning,
      }

      const provider = await createProvider(activeConfig)
      const providerResults = await provider.review({
        fileContent,
        file: selectedFile,
        prompts,
        documentTypeContext,
        onProgress: (current, total, itemName) => {
          const progressPercent = Math.min(95, 25 + Math.round((current / total) * 70))
          setProgress(progressPercent)
          setProgressText(`검토 진행 중 (${current}/${total}): ${itemName}`)
        },
      })

      const results = providerResults.map((pr, i) => {
        const isCommon = i < commonItems.length
        return {
          review_item_id: isCommon ? undefined : typeItems[i - commonItems.length]?.id,
          common_review_item_id: isCommon ? commonItems[i]?.id : undefined,
          result: pr.result,
          score: pr.score,
        }
      })

      // Save review results
      results.forEach((result) => {
        reviewResultStorage.create({
          document_id: newDocument!.id,
          review_item_id: result.review_item_id,
          common_review_item_id: result.common_review_item_id,
          result: result.result,
          score: result.score,
        })
      })

      // Update status to completed
      documentStorage.updateStatus(newDocument!.id, "completed")

      setProgressText("검토 완료!")
      setProgress(100)
      toast.success(`"${selectedFile.name}" 문서 검토가 완료되었습니다.`)

      if (onDocumentAdded) {
        onDocumentAdded()
      }

      setTimeout(() => {
        setSelectedFile(null)
        setSelectedType("")
        setProgress(0)
        setProgressText("")
        setIsUploading(false)
      }, 1000)
    } catch (error) {
      console.error("Error uploading/reviewing document:", error)
      const errorMsg = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      setProgressText("검토 실패: " + errorMsg)
      toast.error("검토 실패: " + errorMsg)

      if (newDocument) {
        documentStorage.updateStatus(newDocument.id, "failed")
        if (onDocumentAdded) {
          onDocumentAdded()
        }
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          문서 업로드
        </CardTitle>
        <CardDescription>검토할 표준초안 문서를 업로드하고 타입을 선택하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>AI 제공자</Label>
            <Select value={selectedProvider} onValueChange={(v) => handleProviderChange(v as LLMProviderType)}>
              <SelectTrigger>
                <SelectValue placeholder="제공자 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI {availableProviders.some(c => c.provider === "openai") ? "✓" : ""}</SelectItem>
                <SelectItem value="grok">Grok (xAI) {availableProviders.some(c => c.provider === "grok") ? "✓" : ""}</SelectItem>
                <SelectItem value="openrouter">OpenRouter {availableProviders.some(c => c.provider === "openrouter") ? "✓" : ""}</SelectItem>
                <SelectItem value="kimi">Kimi (Moonshot) {availableProviders.some(c => c.provider === "kimi") ? "✓" : ""}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>AI 검토 모델</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                disabled={loadingModels}
                onClick={handleRefreshModels}
                title="최신 모델 목록 새로고침"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loadingModels ? "animate-spin" : ""}`} />
                새로고침
              </Button>
            </div>
            {providerModels.length > 0 ? (
              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="모델 선택" />
                </SelectTrigger>
                <SelectContent className="max-h-[260px]">
                  {providerModels.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-xs text-muted-foreground py-2">
                설정에서 API 키를 등록하거나 기본 모델이 사용됩니다.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="document-type">문서 타입</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger id="document-type">
              <SelectValue placeholder="문서 타입을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file-upload">문서 파일</Label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-lg border-2 border-dashed transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
          >
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".docx,.txt"
            />
            <div
              onClick={() => document.getElementById("file-upload")?.click()}
              className="flex flex-col items-center justify-center gap-2 p-8 cursor-pointer"
            >
              {selectedFile ? (
                <>
                  <FileText className="h-10 w-10 text-primary" />
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">클릭하여 다른 파일 선택</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">파일을 드래그하거나 클릭하여 선택</p>
                  <p className="text-xs text-muted-foreground">지원 형식: DOCX, TXT</p>
                </>
              )}
            </div>
          </div>
        </div>

        {isUploading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">{progressText}</p>
          </div>
        )}

        <Button onClick={handleUpload} disabled={!selectedFile || !selectedType || isUploading} className="w-full">
          {isUploading ? "검토 중..." : "업로드 및 검토 시작"}
        </Button>
      </CardContent>
    </Card>
  )
}
