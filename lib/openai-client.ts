/**
 * @deprecated Legacy OpenAI client. Use `lib/llm-provider.ts` and `lib/providers/` instead.
 * Client-side OpenAI API integration
 * Handles document upload and review directly from browser
 */

import { apiKeyStorage } from "./storage/local-storage"
import { getCurrentLanguageInstruction } from "./storage/language-storage"
import { parseScoreFromResult, SCORE_INSTRUCTIONS } from "./providers/openai"
import mammoth from "mammoth"

const OPENAI_API_BASE = "https://api.openai.com/v1"

export interface OpenAIError {
  error: string
  details?: any
}

export interface UploadFileResponse {
  id: string
  object: string
  bytes: number
  created_at: number
  filename: string
  purpose: string
}

export interface ResponsesAPIResponse {
  id: string
  object: string
  created_at: number
  status: string
  model: string
  output: Array<{
    id: string
    type: string
    status?: string
    content?: Array<{
      type: string
      text: string
    }>
  }>
  output_text?: string
  usage: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
}

/**
 * Upload file to OpenAI
 */
export async function uploadFileToOpenAI(file: File): Promise<UploadFileResponse> {
  const apiKey = apiKeyStorage.get()
  if (!apiKey) {
    throw new Error("OpenAI API key not found. Please set it in Settings.")
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("purpose", "assistants")

  const response = await fetch(`${OPENAI_API_BASE}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "Failed to upload file to OpenAI")
  }

  return response.json()
}

/**
 * Delete file from OpenAI
 */
export async function deleteFileFromOpenAI(fileId: string): Promise<void> {
  const apiKey = apiKeyStorage.get()
  if (!apiKey) return

  await fetch(`${OPENAI_API_BASE}/files/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })
}

/**
 * Create assistant for document review
 */
async function createAssistant(fileId: string): Promise<string> {
  const apiKey = apiKeyStorage.get()
  if (!apiKey) {
    throw new Error("OpenAI API key not found")
  }

  const response = await fetch(`${OPENAI_API_BASE}/assistants`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify({
      name: "Document Reviewer",
      instructions: `You are a professional document reviewer specializing in standard draft documents. Provide detailed, constructive feedback. ${getCurrentLanguageInstruction()}\n${SCORE_INSTRUCTIONS}`,
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "Failed to create assistant")
  }

  const data = await response.json()
  return data.id
}

/**
 * Create thread with file
 */
async function createThread(fileId: string): Promise<string> {
  const apiKey = apiKeyStorage.get()
  if (!apiKey) {
    throw new Error("OpenAI API key not found")
  }

  const response = await fetch(`${OPENAI_API_BASE}/threads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify({
      tool_resources: {
        file_search: {
          vector_stores: [
            {
              file_ids: [fileId],
            },
          ],
        },
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "Failed to create thread")
  }

  const data = await response.json()
  return data.id
}

/**
 * Add message to thread
 */
async function addMessage(threadId: string, prompt: string): Promise<string> {
  const apiKey = apiKeyStorage.get()
  if (!apiKey) {
    throw new Error("OpenAI API key not found")
  }

  const response = await fetch(`${OPENAI_API_BASE}/threads/${threadId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify({
      role: "user",
      content: prompt,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "Failed to add message")
  }

  const data = await response.json()
  return data.id
}

/**
 * Run assistant
 */
async function runAssistant(threadId: string, assistantId: string): Promise<string> {
  const apiKey = apiKeyStorage.get()
  if (!apiKey) {
    throw new Error("OpenAI API key not found")
  }

  const response = await fetch(`${OPENAI_API_BASE}/threads/${threadId}/runs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify({
      assistant_id: assistantId,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "Failed to run assistant")
  }

  const data = await response.json()
  return data.id
}

/**
 * Wait for run completion
 */
async function waitForRun(threadId: string, runId: string): Promise<void> {
  const apiKey = apiKeyStorage.get()
  if (!apiKey) {
    throw new Error("OpenAI API key not found")
  }

  let attempts = 0
  const maxAttempts = 60 // 60 seconds max

  while (attempts < maxAttempts) {
    const response = await fetch(`${OPENAI_API_BASE}/threads/${threadId}/runs/${runId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to check run status")
    }

    const data = await response.json()

    if (data.status === "completed") {
      return
    } else if (data.status === "failed" || data.status === "cancelled" || data.status === "expired") {
      throw new Error(`Run failed with status: ${data.status}`)
    }

    // Wait 1 second before checking again
    await new Promise((resolve) => setTimeout(resolve, 1000))
    attempts++
  }

  throw new Error("Run timed out")
}

/**
 * Get messages from thread
 */
async function getMessages(threadId: string): Promise<string> {
  const apiKey = apiKeyStorage.get()
  if (!apiKey) {
    throw new Error("OpenAI API key not found")
  }

  const response = await fetch(`${OPENAI_API_BASE}/threads/${threadId}/messages`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Beta": "assistants=v2",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to get messages")
  }

  const data = await response.json()
  const assistantMessage = data.data.find((msg: any) => msg.role === "assistant")

  if (!assistantMessage) {
    throw new Error("No assistant response found")
  }

  return assistantMessage.content[0].text.value
}

/**
 * Extract text from file
 * Supports .docx, .txt, and other text files
 */
async function extractTextFromFile(file: File): Promise<string> {
  const fileExtension = file.name.split(".").pop()?.toLowerCase()

  // Handle Word documents (.docx)
  if (fileExtension === "docx") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          const result = await mammoth.extractRawText({ arrayBuffer })
          resolve(result.value)
        } catch (error) {
          reject(new Error("Failed to extract text from Word document"))
        }
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsArrayBuffer(file)
    })
  }

  // Handle plain text files (.txt, etc.)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      resolve(content)
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

/**
 * Review document with OpenAI using Responses API
 */
export async function reviewDocumentWithOpenAI(fileContent: string, prompt: string): Promise<{ result: string; score?: number }> {
  const apiKey = apiKeyStorage.get()
  if (!apiKey) {
    throw new Error("OpenAI API key not found")
  }

  const systemPrompt = `You are a professional document reviewer specializing in standard draft documents. Provide detailed, constructive feedback. ${getCurrentLanguageInstruction()}
${SCORE_INSTRUCTIONS}`
  const userInput = `${systemPrompt}\n\n검토 항목: ${prompt}\n\n--- 문서 내용 ---\n${fileContent}`

  const response = await fetch(`${OPENAI_API_BASE}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5",
      input: userInput,
      reasoning: {
        effort: "medium", // minimal, low, medium, high
      },
      text: {
        verbosity: "medium", // low, medium, high
      },
      max_output_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "Failed to review document")
  }

  const data: ResponsesAPIResponse = await response.json()
  return parseScoreFromResult(data.output_text || "No response from OpenAI")
}

/**
 * Process full document review with single API call
 */
export async function processDocumentReview(
  file: File,
  commonReviewItems: Array<{ id: string; name: string; prompt: string }>,
  typeReviewItems: Array<{ id: string; name: string; prompt: string }>,
  onProgress?: (current: number, total: number, itemName: string) => void
): Promise<
  Array<{
    review_item_id?: string
    common_review_item_id?: string
    result: string
    score?: number
  }>
> {
  // Extract text from file
  const fileContent = await extractTextFromFile(file)

  const allItems = [
    ...commonReviewItems.map((item) => ({ ...item, isCommon: true })),
    ...typeReviewItems.map((item) => ({ ...item, isCommon: false })),
  ]

  // Build comprehensive prompt with all review items
  const systemPrompt = `You are a professional document reviewer specializing in standard draft documents. Provide detailed, constructive feedback. ${getCurrentLanguageInstruction()}
${SCORE_INSTRUCTIONS}`

  const reviewInstructions = allItems
    .map((item, index) => `${index + 1}. [${item.name}]\n${item.prompt}`)
    .join("\n\n")

  const fullPrompt = `${systemPrompt}

다음 문서를 여러 관점에서 검토해주세요. 각 검토 항목에 대해 명확하게 구분하여 답변해주세요.

=== 검토 항목 ===
${reviewInstructions}

=== 응답 형식 ===
각 검토 항목에 대해 다음 형식으로 답변해주세요:

### [검토 항목 번호]. [검토 항목 이름]
SCORE: {점수}
[검토 내용]

---

=== 문서 내용 ===
${fileContent}`

  onProgress?.(1, 1, "모든 검토 항목 처리 중...")

  const apiKey = apiKeyStorage.get()
  if (!apiKey) {
    throw new Error("OpenAI API key not found")
  }

  const response = await fetch(`${OPENAI_API_BASE}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5",
      input: fullPrompt,
      reasoning: {
        effort: "medium",
      },
      text: {
        verbosity: "high", // More detailed for multiple items
      },
      max_output_tokens: 16000, // Large enough for comprehensive multi-item reviews
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "Failed to review document")
  }

  const data: ResponsesAPIResponse = await response.json()

  // Extract text from Responses API format
  let fullReview = ""

  // Find the message output in the output array
  const messageOutput = data.output?.find(item => item.type === "message")
  if (messageOutput?.content) {
    const textContent = messageOutput.content.find(c => c.type === "output_text")
    if (textContent) {
      fullReview = textContent.text
    }
  }

  if (!fullReview) {
    console.error("Could not extract text from response:", data)
    throw new Error("No text content found in API response")
  }

  // Parse the response and split by review items
  const results: Array<{
    review_item_id?: string
    common_review_item_id?: string
    result: string
    score?: number
  }> = []

  // Try multiple parsing strategies
  let sections: string[] = []

  // Strategy 1: Try ### with number and period
  sections = fullReview.split(/###\s*\d+\.\s*/).slice(1)

  // Strategy 2: If that didn't work, try just ### with any text
  if (sections.length === 0 || sections[0].trim() === "") {
    sections = fullReview.split(/###\s*/).slice(1)
  }

  // Strategy 3: If still nothing, try numbered list format
  if (sections.length === 0 || sections[0].trim() === "") {
    sections = fullReview.split(/\n\d+\.\s*\[/).slice(1).map(s => "[" + s)
  }

  allItems.forEach((item, index) => {
    // Try to find the corresponding section
    let reviewResult = sections[index] || `검토 항목 "${item.name}"에 대한 응답을 찾을 수 없습니다.`

    // Clean up the result (remove leading/trailing whitespace and separators)
    reviewResult = reviewResult.split("---")[0].trim()
    const parsed = parseScoreFromResult(reviewResult)

    results.push({
      review_item_id: item.isCommon ? undefined : item.id,
      common_review_item_id: item.isCommon ? item.id : undefined,
      result: parsed.result,
      score: parsed.score,
    })
  })

  return results
}

/**
 * Validate API key
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${OPENAI_API_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
    return response.ok
  } catch {
    return false
  }
}
