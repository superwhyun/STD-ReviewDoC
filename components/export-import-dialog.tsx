"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Upload, Package, Database, AlertCircle } from "lucide-react"
import { exportImportStorage } from "@/lib/storage/local-storage"
import { exportSettingsJson, getSettingsExportFileName, importSettings } from "@/lib/storage/settings-serializer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function ExportImportDialog() {
  const [open, setOpen] = useState(false)
  const [importData, setImportData] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { toast } = useToast()

  const handleExportSettings = () => {
    const json = exportSettingsJson()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = getSettingsExportFileName()
    a.click()
    URL.revokeObjectURL(url)
    setSuccess("설정이 성공적으로 내보내졌습니다!")
  }

  const handleExportFullBackup = () => {
    const json = exportImportStorage.exportFullBackup()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `draftreviewr-backup-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setSuccess("전체 백업이 성공적으로 내보내졌습니다!")
  }

  const handleImportSettings = () => {
    try {
      setError("")
      setSuccess("")

      if (!importData.trim()) {
        setError("가져올 데이터를 입력해주세요.")
        return
      }

      importSettings(JSON.parse(importData))
      setSuccess("설정을 가져왔습니다. 페이지를 새로고침합니다.")
      toast({
        title: "설정을 가져왔습니다.",
        description: "문서 유형, 검토 항목, 언어 설정이 교체되었습니다.",
      })
      setImportData("")
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      setError("올바른 설정 파일이 아닙니다. 버전과 필수 항목을 확인해주세요.")
      toast({
        title: "설정 가져오기에 실패했습니다.",
        description: "버전과 필수 항목이 포함된 설정 JSON인지 확인해주세요.",
        variant: "destructive",
      })
    }
  }

  const handleImportFullBackup = () => {
    try {
      setError("")
      setSuccess("")

      if (!importData.trim()) {
        setError("가져올 데이터를 입력해주세요.")
        return
      }

      if (!confirm("전체 백업을 복원하면 현재 모든 데이터가 대체됩니다. 계속하시겠습니까?")) {
        return
      }

      exportImportStorage.importFullBackup(importData)
      setSuccess("백업이 복원되었습니다!")
      setImportData("")
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      setError("잘못된 JSON 형식입니다. 파일 내용을 확인해주세요.")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setImportData(event.target?.result as string)
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Package className="mr-2 h-4 w-4" />
          내보내기 / 가져오기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>설정 내보내기 / 가져오기</DialogTitle>
          <DialogDescription>검토 설정을 파일로 내보내거나 가져올 수 있습니다.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <Download className="mr-2 h-4 w-4" />
              내보내기
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="mr-2 h-4 w-4" />
              가져오기
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                <strong>설정 파일</strong>: 문서 유형과 검토 항목만 포함 (판매/공유용)
                <br />
                언어 설정과 문서 타입별 검토 항목을 단일 JSON으로 내보냅니다.
                <br />
                <strong>전체 백업</strong>: API 키와 검토 이력 포함 (개인 백업용)
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button onClick={handleExportSettings} className="w-full" variant="default">
                <Package className="mr-2 h-4 w-4" />
                설정 파일 내보내기 (판매/공유용)
              </Button>

              <Button onClick={handleExportFullBackup} className="w-full" variant="secondary">
                <Database className="mr-2 h-4 w-4" />
                전체 백업 파일 내보내기 (개인 백업용)
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                JSON 파일을 선택하거나 내용을 직접 붙여넣으세요.
                <br />
                설정 파일 가져오기는 전체 교체 방식입니다. 문서 유형, 검토 항목, 언어 설정만 교체되며 API 키와 문서, 검토 결과는 유지됩니다.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <Label htmlFor="file-upload">파일 선택</Label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>

              <div>
                <Label htmlFor="import-textarea">또는 JSON 내용 붙여넣기</Label>
                <Textarea
                  id="import-textarea"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="JSON 파일 내용을 붙여넣으세요..."
                  rows={8}
                  className="mt-2 font-mono text-xs"
                />
              </div>

              <Button onClick={handleImportSettings} className="w-full" variant="default">
                <Package className="mr-2 h-4 w-4" />
                설정 가져오기
              </Button>

              <Button onClick={handleImportFullBackup} className="w-full" variant="destructive">
                <Database className="mr-2 h-4 w-4" />
                전체 백업 복원 (모든 데이터 대체)
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
