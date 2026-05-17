"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { DocumentType, LLMProviderType, LLMProviderConfig } from "@/lib/types"
import { documentStorage, reviewItemStorage, commonReviewItemStorage, reviewResultStorage, llmProviderStorage } from "@/lib/storage/local-storage"
import { processDocumentReview } from "@/lib/openai-client"
import { createProvider } from "@/lib/llm-provider"
import { OpenAIProvider } from "@/lib/providers/openai"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"

interface DocumentUploadSectionProps {
  documentTypes: DocumentType[]
  userId?: string
  onDocumentAdded?: () => void
}

export function DocumentUploadSection({ documentTypes, userId, onDocumentAdded }: DocumentUploadSectionProps) {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<LLMProviderType>("openai")
  const [availableProviders, setAvailableProviders] = useState<LLMProviderConfig[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState("")

  useEffect(() => {
    const configs = llmProviderStorage.getAll()
    setAvailableProviders(configs)
    const active = llmProviderStorage.getActive()
    if (configs.some(c => c.provider === active)) setSelectedProvider(active)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
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
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ]

      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedType) return

    setIsUploading(true)
    setProgress(0)
    setProgressText("문서 업로드 중...")

    let newDocument: ReturnType<typeof documentStorage.create> | null = null

    try {
      // Create document entry with file data URL (for small files) or file name
      const fileUrl = selectedFile.name // In a real app, you might store the file content as data URL
      newDocument = documentStorage.create({
        document_type_id: selectedType,
        file_name: selectedFile.name,
        file_url: fileUrl,
      })

      // Update status to processing
      documentStorage.updateStatus(newDocument.id, "processing")

      // Get review items
      const commonItems = commonReviewItemStorage.getAll()
      const typeItems = reviewItemStorage.getByDocumentType(selectedType)

      setProgressText("AI 검토 시작...")

      let results: Array<{ review_item_id?: string; common_review_item_id?: string; result: string }>

      try {
        // Try the new multi-provider system first
        const fileContent = await OpenAIProvider.extractText(selectedFile)
        const prompts = [
          ...commonItems.map((item) => ({ name: item.name, prompt: item.prompt })),
          ...typeItems.map((item) => ({ name: item.name, prompt: item.prompt })),
        ]

        const selectedDocType = documentTypes.find((t) => t.id === selectedType)
        const documentTypeContext = selectedDocType
          ? [selectedDocType.name, selectedDocType.description].filter(Boolean).join("\n")
          : undefined

        const provider = await createProvider(selectedProvider)
        const providerResults = await provider.review({
          fileContent,
          file: selectedFile,
          prompts,
          documentTypeContext,
          onProgress: (current, total, itemName) => {
            const progressPercent = (current / total) * 100
            setProgress(progressPercent)
            setProgressText(`검토 중: ${itemName} (${current}/${total})`)
          },
          onToken: (token) => {
            // Append streaming tokens to progress text
            setProgressText((prev) => prev + token)
          },
        })

        // Map provider results back to storage format
        results = providerResults.map((pr, i) => {
          const isCommon = i < commonItems.length
          return {
            review_item_id: isCommon ? undefined : typeItems[i - commonItems.length]?.id,
            common_review_item_id: isCommon ? commonItems[i]?.id : undefined,
            result: pr.result,
          }
        })
      } catch (providerError) {
        // Fallback to legacy processDocumentReview
        console.warn("Provider review failed, falling back to legacy OpenAI client:", providerError)
        results = await processDocumentReview(
          selectedFile,
          commonItems,
          typeItems,
          (current, total, itemName) => {
            const progressPercent = (current / total) * 100
            setProgress(progressPercent)
            setProgressText(`검토 중: ${itemName} (${current}/${total})`)
          }
        )
      }

      // Save review results
      results.forEach((result) => {
        reviewResultStorage.create({
          document_id: newDocument!.id,
          review_item_id: result.review_item_id,
          common_review_item_id: result.common_review_item_id,
          result: result.result,
        })
      })

      // Update status to completed
      documentStorage.updateStatus(newDocument!.id, "completed")

      setProgressText("검토 완료!")
      setProgress(100)

      // Notify parent and reset form
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
      console.error("Error uploading document:", error)
      setProgressText("검토 실패: " + (error instanceof Error ? error.message : "알 수 없는 오류"))

      // Update document status to failed if it was created before the error
      if (newDocument) {
        documentStorage.updateStatus(newDocument.id, "failed")
        // Notify parent so the list refreshes and shows the failed status
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
        {availableProviders.length > 1 && (
          <div className="space-y-2">
            <Label>AI 제공자</Label>
            <Select value={selectedProvider} onValueChange={(v) => setSelectedProvider(v as LLMProviderType)}>
              <SelectTrigger>
                <SelectValue placeholder="제공자 선택" />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.map((c) => (
                  <SelectItem key={c.provider} value={c.provider}>
                    {c.provider === "openai" ? "OpenAI" : c.provider === "grok" ? "Grok (xAI)" : c.provider === "openrouter" ? "OpenRouter" : "Kimi"} ({c.model})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
