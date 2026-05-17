/**
 * DOCX text extractor with tracked-change (revision) support.
 *
 * If the document contains tracked changes (w:ins / w:del), the text is
 * extracted with inline markers so the LLM has full context:
 *   [INSERTED: text] — text being proposed for insertion
 *   [DELETED: text]  — text being proposed for deletion
 *
 * A header instruction is prepended to guide the LLM:
 *   - Quality/structural items  → treat [INSERTED:] as current, ignore [DELETED:]
 *   - Change-clarity items      → markers are evidence that revisions exist
 *
 * Falls back to mammoth plain-text when no revisions are detected.
 */

import mammoth from "mammoth"
import JSZip from "jszip"

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

// ─── XML helpers ──────────────────────────────────────────────────────────

function children(el: Element): Element[] {
  return Array.from(el.childNodes).filter((n): n is Element => n.nodeType === 1)
}

function byTag(el: Element, local: string): Element[] {
  return Array.from(el.getElementsByTagNameNS(W, local))
}

/** Extract alt-text or name from a <w:drawing> or <w:pict> element. */
function drawingLabel(el: Element): string {
  // wp:docPr carries the alt text (descr) and name attributes
  const all = Array.from(el.getElementsByTagName("*"))
  for (const node of all) {
    if (node.localName === "docPr") {
      const descr = node.getAttribute("descr")
      const name = node.getAttribute("name")
      const label = (descr && descr.trim()) || (name && name.trim())
      if (label) return `[그림: ${label}]`
    }
  }
  return "[그림]"
}

function runText(run: Element): string {
  return children(run).map((c) => {
    if (c.localName === "t") return c.textContent ?? ""
    if (c.localName === "br" || c.localName === "cr") return "\n"
    if (c.localName === "tab") return "\t"
    if (c.localName === "drawing" || c.localName === "pict") return drawingLabel(c)
    return ""
  }).join("")
}

function runDelText(run: Element): string {
  return children(run).map((c) => {
    if (c.localName === "delText") return c.textContent ?? ""
    if (c.localName === "br" || c.localName === "cr") return "\n"
    if (c.localName === "tab") return "\t"
    return ""
  }).join("")
}

// ─── paragraph extraction ─────────────────────────────────────────────────

function extractParagraph(para: Element): string {
  return children(para).map((child) => {
    switch (child.localName) {
      case "r":
        return runText(child)

      case "ins": {
        const text = byTag(child, "r").map(runText).join("")
        return text.trim() ? `[INSERTED: ${text}]` : ""
      }

      case "del": {
        const text = byTag(child, "r").map(runDelText).join("")
        return text.trim() ? `[DELETED: ${text}]` : ""
      }

      case "hyperlink":
      case "smartTag":
      case "sdt":
      case "sdtContent":
        return extractParagraph(child)

      default:
        return ""
    }
  }).join("")
}

// ─── body extraction ──────────────────────────────────────────────────────

function extractBody(body: Element): string {
  const lines: string[] = []

  for (const child of children(body)) {
    switch (child.localName) {
      case "p":
        lines.push(extractParagraph(child))
        break

      case "tbl":
        for (const row of byTag(child, "tr")) {
          const cells = byTag(row, "tc").map((tc) =>
            byTag(tc, "p").map(extractParagraph).join(" ")
          )
          lines.push(cells.join(" | "))
        }
        break

      case "sdt": {
        const content = child.getElementsByTagNameNS(W, "sdtContent")[0]
        if (content) lines.push(extractBody(content))
        break
      }
    }
  }

  return lines.filter((l) => l.trim()).join("\n")
}

// ─── DOCX extraction ──────────────────────────────────────────────────────

async function extractDocx(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer)
  const docFile = zip.file("word/document.xml")
  if (!docFile) throw new Error("word/document.xml not found")

  const xml = await docFile.async("text")
  const hasRevisions = xml.includes("<w:ins ") || xml.includes("<w:del ")

  const xmlDoc = new DOMParser().parseFromString(xml, "text/xml")
  if (xmlDoc.querySelector("parsererror")) throw new Error("XML parse error")

  const body = xmlDoc.getElementsByTagNameNS(W, "body")[0]
  if (!body) throw new Error("No <w:body> found")

  const text = extractBody(body)

  if (!hasRevisions) return text

  const header = [
    "[검토 지침] 이 문서에는 변경이력(Track Changes)이 포함되어 있습니다.",
    "  [INSERTED: 텍스트] = 삽입 제안된 내용 (최종 채택될 텍스트)",
    "  [DELETED: 텍스트]  = 삭제 제안된 내용 (제거될 텍스트)",
    "구조·언어·품질 검토 항목: [INSERTED:] 내용을 현재 텍스트로 간주하고 [DELETED:]는 무시하라.",
    "변경사항 명확성 검토 항목: 마커가 존재하면 변경이력이 올바르게 기록되어 있다는 증거이다.",
  ].join("\n")

  return `${header}\n\n${text}`
}

// ─── public API ───────────────────────────────────────────────────────────

/**
 * Extract text from a file.
 *
 * - DOCX: revision-aware extraction with inline markers if tracked changes exist.
 *         Falls back to mammoth if XML parsing fails.
 * - Other formats: plain text read.
 */
export async function extractText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase()

  if (ext !== "docx") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }

  const buffer = await file.arrayBuffer()

  try {
    return await extractDocx(buffer)
  } catch {
    // XML parsing failed — fall back to mammoth
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    return result.value
  }
}
