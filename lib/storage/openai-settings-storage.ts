const USE_FILES_API_KEY = "draftreviewr:openai-use-files-api"

export function getUseFilesApi(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(USE_FILES_API_KEY) === "true"
}

export function setUseFilesApi(value: boolean): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(USE_FILES_API_KEY, value ? "true" : "false")
}
