export type Language = "ko" | "en"

export const LANGUAGE_KEY = "draftreviewr:language"

export function getLanguage(): Language {
  if (typeof window === "undefined") return "ko"

  const language = window.localStorage.getItem(LANGUAGE_KEY)
  return language === "en" || language === "ko" ? language : "ko"
}

export function setLanguage(lang: Language): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(LANGUAGE_KEY, lang)
}

export function getLanguageInstruction(lang: Language): string {
  return lang === "en" ? "Write all review results in English." : "검토 결과는 반드시 한국어로 작성하라."
}

export function getCurrentLanguageInstruction(): string {
  return getLanguageInstruction(getLanguage())
}
