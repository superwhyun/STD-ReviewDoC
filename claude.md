# DraftReviewr - AI 문서 검토 시스템

## 프로젝트 개요

DraftReviewr는 한국 표준 초안 문서를 위한 AI 기반 자동 검토 시스템입니다. **완전한 클라이언트 사이드 애플리케이션**으로, 데이터베이스나 백엔드 서버 없이 브라우저에서 직접 OpenAI GPT-4o API를 호출하여 문서를 분석합니다.

## 아키텍처 특징

- **서버리스**: 데이터베이스, API 서버 불필요
- **localStorage 기반**: 모든 데이터가 브라우저에 저장
- **직접 OpenAI 연동**: 서버를 거치지 않고 브라우저에서 직접 API 호출
- **Export/Import**: 검토 설정을 JSON 파일로 내보내기/가져오기 가능
- **지식 거래**: 잘 정제된 검토 항목 세트를 판매/공유 가능

## 기술 스택

### 핵심 프레임워크
- **Next.js 15.2.4** (App Router, 클라이언트 사이드만 사용)
- **React 19**
- **TypeScript 5**

### 데이터 & API
- **localStorage** (모든 데이터 저장)
- **OpenAI API** (GPT-4o, 브라우저에서 직접 호출)

### UI & 스타일링
- **Tailwind CSS 4.1.9**
- **Radix UI** (33+ 컴포넌트)
- **shadcn/ui**
- **Lucide React** (아이콘)

### 주요 라이브러리
- **React Hook Form + Zod** (폼 관리 & 검증)
- **date-fns** (날짜 처리)
- **sonner** (토스트 알림)
- **recharts** (차트)

## 프로젝트 구조

```
DraftReviewr/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 홈 (문서 업로드 & 목록)
│   ├── admin/page.tsx           # 관리자 대시보드
│   ├── settings/page.tsx        # 설정 (API 키 관리)
│   └── api/                      # API 라우트
│       ├── documents/
│       │   ├── upload/          # 파일 업로드
│       │   ├── review/          # AI 검토 처리
│       │   └── [id]/results/   # 검토 결과 조회
│       ├── document-types/      # 문서 유형 관리
│       ├── review-items/        # 유형별 검토 항목
│       ├── common-review-items/ # 공통 검토 항목
│       └── user/api-key/        # API 키 관리
├── components/                   # React 컴포넌트
│   ├── admin/                   # 관리자 컴포넌트
│   ├── documents/               # 문서 관련 컴포넌트
│   ├── settings/                # 설정 컴포넌트
│   └── ui/                      # 재사용 UI 컴포넌트 (70+개)
├── lib/                         # 유틸리티 라이브러리
│   ├── types.ts                # TypeScript 타입 정의
│   ├── document-processor.ts   # 문서 텍스트 추출
│   ├── crypto.ts               # API 키 암호화/복호화
│   └── supabase/               # Supabase 클라이언트
└── scripts/                     # 데이터베이스 스크립트
    ├── 001_create_tables.sql
    └── 002_add_common_review_items.sql
```

## 데이터베이스 스키마

### 주요 테이블

#### document_types
문서 유형 정의 (예: "표준초안", "기술보고서")
```sql
- id: UUID (PK)
- name: TEXT (UNIQUE)
- description: TEXT
- created_at, updated_at: TIMESTAMP
```

#### review_items
유형별 검토 기준
```sql
- id: UUID (PK)
- document_type_id: UUID (FK)
- name: TEXT
- prompt: TEXT (AI 검토용 프롬프트)
- order_index: INTEGER
```

#### common_review_items
모든 문서에 공통 적용되는 검토 기준
```sql
- id: UUID (PK)
- name: TEXT
- prompt: TEXT
- order_index: INTEGER
```

#### documents
업로드된 문서
```sql
- id: UUID (PK)
- user_id: TEXT
- document_type_id: UUID (FK)
- file_name: TEXT
- file_url: TEXT (Supabase Storage)
- status: TEXT ('pending' | 'processing' | 'completed' | 'failed')
```

#### review_results
AI 생성 검토 결과
```sql
- id: UUID (PK)
- document_id: UUID (FK)
- review_item_id: UUID (FK, nullable)
- common_review_item_id: UUID (FK, nullable)
- result: TEXT
```

#### user_api_keys
사용자 OpenAI API 키 (암호화 저장)
```sql
- id: UUID (PK)
- user_id: TEXT (UNIQUE)
- encrypted_api_key: TEXT
- provider: TEXT (default: 'openai')
```

## TypeScript 타입 정의

`lib/types.ts`에 정의된 주요 타입:

```typescript
interface DocumentType {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

interface ReviewItem {
  id: string
  document_type_id: string
  name: string
  prompt: string
  order_index: number
  created_at: string
  updated_at: string
}

interface CommonReviewItem {
  id: string
  name: string
  prompt: string
  order_index: number
  created_at: string
  updated_at: string
}

interface Document {
  id: string
  user_id: string
  document_type_id: string
  file_name: string
  file_url: string
  status: "pending" | "processing" | "completed" | "failed"
  created_at: string
  updated_at: string
}

interface ReviewResult {
  id: string
  document_id: string
  review_item_id: string | null
  common_review_item_id: string | null
  result: string
  created_at: string
}
```

## API 엔드포인트

### 문서 관리

#### POST /api/documents/upload
문서 파일 업로드
- **Body**: FormData (file, document_type_id, user_id)
- **프로세스**:
  1. Supabase Storage에 파일 업로드
  2. DB에 문서 레코드 생성
  3. 자동으로 검토 프로세스 트리거

#### POST /api/documents/review
AI 문서 검토 처리
- **Body**: `{ document_id: string }`
- **프로세스**:
  1. 문서 상태를 "processing"으로 업데이트
  2. 사용자 API 키 복호화
  3. OpenAI Files API에 파일 업로드
  4. 공통 검토 항목 처리
  5. 유형별 검토 항목 처리
  6. 결과를 review_results 테이블에 저장
  7. OpenAI에서 파일 삭제
  8. 상태를 "completed" 또는 "failed"로 업데이트

#### GET /api/documents/[id]/results
문서의 검토 결과 조회

### 문서 유형 관리

#### GET /api/document-types
모든 문서 유형 조회

#### POST /api/document-types
새 문서 유형 생성
- **Body**: `{ name: string, description?: string }`

#### PUT /api/document-types/[id]
문서 유형 수정

#### DELETE /api/document-types/[id]
문서 유형 삭제 (관련 검토 항목도 cascade 삭제)

#### GET /api/document-types/[id]/review-items
특정 문서 유형의 모든 검토 항목 조회

### 검토 항목 관리

#### POST /api/review-items
유형별 검토 항목 생성
- **Body**: `{ document_type_id: string, name: string, prompt: string }`

#### PUT /api/review-items/[id]
검토 항목 수정

#### DELETE /api/review-items/[id]
검토 항목 삭제

### 공통 검토 항목 관리

#### GET /api/common-review-items
모든 공통 검토 항목 조회 (order_index 순)

#### POST /api/common-review-items
공통 검토 항목 생성
- **Body**: `{ name: string, prompt: string }`

#### PUT /api/common-review-items/[id]
공통 검토 항목 수정

#### DELETE /api/common-review-items/[id]
공통 검토 항목 삭제

### 사용자 API 키 관리

#### GET /api/user/api-key?user_id={userId}
사용자 API 키 정보 조회 (마스킹됨)

#### POST /api/user/api-key
API 키 저장/업데이트
- **Body**: `{ user_id: string, api_key: string, provider?: string }`
- **프로세스**: 저장 전 API 키 암호화

#### DELETE /api/user/api-key?user_id={userId}
API 키 삭제

## 주요 기능

### 1. 문서 업로드 & 관리
- 드래그 앤 드롭 파일 업로드 인터페이스
- PDF, DOC, DOCX, TXT 형식 지원
- Supabase Storage에 파일 저장
- 문서 상태 추적 (pending → processing → completed/failed)

### 2. AI 기반 문서 검토
- OpenAI GPT-4o 모델 통합
- OpenAI Files API를 사용한 파일 기반 문서 분석
- 문서 유형별 커스터마이징 가능한 검토 프롬프트
- 한국어 검토 피드백 지원
- Temperature: 0.7, Max tokens: 2000

### 3. 유연한 검토 시스템
- **공통 검토 항목**: 유형에 관계없이 모든 문서에 적용
- **유형별 검토 항목**: 특정 유형의 문서에만 적용
- 커스터마이징 가능한 프롬프트와 순서가 있는 검토 항목
- 구조화된 검토 결과 저장

### 4. 관리자 대시보드
- 문서 유형 생성 및 관리
- 각 문서 유형별 검토 항목 구성
- 공통 검토 항목 관리
- 모든 문서 및 검토 결과 조회

### 5. 사용자 설정
- 안전한 API 키 관리
- 암호화된 저장소
- 보안을 위한 마스킹된 API 키 표시
- API 키 업데이트 및 삭제

### 6. 사용자 경험
- 한국어 UI
- 모바일 지원 반응형 디자인
- 실시간 상태 업데이트
- 사용자 액션에 대한 토스트 알림
- 검토 결과용 모달 다이얼로그

## 핵심 비즈니스 로직

### 문서 검토 워크플로우

`app/api/documents/review/route.ts`에 구현됨:

1. **초기화**
   - DB에서 문서 세부정보 조회
   - 상태를 "processing"으로 업데이트
   - 사용자 API 키 조회 및 복호화

2. **OpenAI에 파일 업로드**
   - Supabase Storage에서 파일 다운로드
   - OpenAI Files API에 업로드 (purpose: "assistants")
   - Chat completions에서 사용할 file ID 수신

3. **공통 검토 처리**
   - order_index 순으로 모든 공통 검토 항목 조회
   - 각 항목에 대해:
     - 파일 참조와 함께 OpenAI Chat Completions API 호출
     - common_review_item_id와 함께 review_results 테이블에 저장

4. **유형별 검토 처리**
   - 문서 유형의 검토 항목 조회
   - 각 항목에 대해:
     - 파일 참조와 함께 OpenAI Chat Completions API 호출
     - review_item_id와 함께 review_results 테이블에 저장

5. **정리**
   - OpenAI 스토리지에서 파일 삭제
   - 문서 상태를 "completed"로 업데이트
   - 오류 발생 시 상태를 "failed"로 업데이트

### OpenAI 통합 세부사항

**파일 업로드**
```typescript
POST https://api.openai.com/v1/files
Headers: Authorization: Bearer {apiKey}
Body: FormData with file and purpose="assistants"
```

**문서 검토**
```typescript
POST https://api.openai.com/v1/chat/completions
Model: gpt-4o
System Prompt: "You are a professional document reviewer specializing in standard draft documents. Provide detailed, constructive feedback in Korean."
User Message:
  - { type: "text", text: {prompt} }
  - { type: "file", file_id: {fileId} }
Temperature: 0.7
Max Tokens: 2000
```

**파일 삭제**
```typescript
DELETE https://api.openai.com/v1/files/{fileId}
```

### 암호화 구현

`lib/crypto.ts`에 구현됨:

**주의**: 현재 구현은 간단한 base64 인코딩을 사용합니다. 프로덕션용이 아닙니다.

```typescript
// 암호화
function encryptApiKey(apiKey: string): string {
  const combined = `${ENCRYPTION_KEY}:${apiKey}`
  return Buffer.from(combined).toString("base64")
}

// 복호화
function decryptApiKey(encrypted: string): string {
  const combined = Buffer.from(encrypted, "base64").toString("utf-8")
  const [key, apiKey] = combined.split(":")
  if (key !== ENCRYPTION_KEY) throw new Error("Invalid encryption key")
  return apiKey
}
```

**프로덕션 권장사항**: AES-256-GCM 암호화 또는 키 관리 서비스 사용

## 주요 컴포넌트

### 페이지 컴포넌트

1. **홈 페이지** (`app/page.tsx`)
   - 문서 업로드 섹션
   - 상태 배지가 있는 문서 목록
   - 검토 결과 다이얼로그

2. **관리자 대시보드** (`app/admin/page.tsx`)
   - 공통 검토 항목 관리
   - 문서 유형 관리
   - 문서 유형별 검토 항목 관리

3. **설정 페이지** (`app/settings/page.tsx`)
   - API 키 구성
   - 보안 정보 표시

### 주요 클라이언트 컴포넌트

#### 문서 관리
- **DocumentUploadSection**: 드래그 앤 드롭 파일 업로드, 유형 선택
- **DocumentsList**: 상태 표시가 있는 문서 카드 그리드
- **DocumentReviewDialog**: AI 검토 결과를 표시하는 모달

#### 관리자 컴포넌트
- **DocumentTypesList**: 문서 유형 CRUD 인터페이스
- **CommonReviewItemsList**: 공통 검토 항목 관리
- **ReviewItemCard**: 유형별 검토 항목 표시
- **ReviewItemForm**: 검토 항목 생성/편집 폼

#### 설정 컴포넌트
- **ApiKeySettings**: 암호화/복호화가 있는 API 키 관리

## 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ENCRYPTION_KEY=your_encryption_key_change_in_production
```

## 현재 제한사항 & 프로덕션 권장사항

### 보안
1. **API 키 암호화**: base64 인코딩을 AES-256-GCM 암호화로 교체
2. **인증**: 현재 정적 `user_id = "demo-user"` 사용 - 적절한 인증 구현 필요
3. **권한**: Supabase에 행 수준 보안(RLS) 정책 추가
4. **API 키 저장**: 시크릿 관리자(AWS Secrets Manager, Vault) 사용 고려

### 문서 처리
1. **텍스트 추출**: PDF, DOCX 형식용 적절한 파서 구현 필요
2. **파일 검증**: 파일 크기 제한 및 콘텐츠 검증 추가
3. **에러 처리**: 에러 메시지 및 재시도 로직 개선

### 성능
1. **페이지네이션**: 대용량 문서 목록에 페이지네이션 추가
2. **캐싱**: 자주 액세스되는 데이터 캐싱 구현
3. **백그라운드 작업**: 장시간 실행 검토용 큐 기반 처리 고려

### 기능
1. **사용자 인증**: Supabase Auth로 적절한 사용자 인증 구현
2. **협업**: 문서 공유 및 다중 사용자 지원 추가
3. **내보내기**: 검토 결과 PDF/DOCX 내보내기 추가
4. **히스토리**: 문서 수정 이력 추적
5. **분석**: 검토 통계 및 인사이트 추가

## 주목할 만한 구현 세부사항

1. **정적 사용자 ID**: 애플리케이션은 현재 코드베이스 전체에서 하드코딩된 `"demo-user"`를 사용합니다. 실제 인증으로 교체 필요.

2. **Supabase 클라이언트 패턴**: 앱은 두 개의 별도 Supabase 클라이언트 사용:
   - 서버 클라이언트 (SSR 지원) - 서버 컴포넌트 및 API 라우트용
   - 브라우저 클라이언트 (싱글톤) - 클라이언트 컴포넌트용

3. **한국어**: 모든 UI 텍스트와 시스템 프롬프트가 한국어로 되어 있습니다.

4. **파일 저장**: 문서는 Supabase Storage의 `documents` 버킷에 저장됩니다.
   - 경로 구조: `{userId}/{timestamp}.{extension}`

5. **검토 순서**: 공통 검토 항목이 항상 유형별 항목보다 먼저 처리되며, `order_index`로 순서 제어.

6. **OpenAI 파일 라이프사이클**: 파일은 검토 시작 시 OpenAI에 업로드되고 검토 완료 후 삭제됩니다.

7. **Cascade 삭제**: 문서 유형을 삭제하면 관련된 모든 검토 항목과 결과가 삭제됩니다.

8. **상태 추적**: 문서는 네 가지 상태를 가집니다:
   - `pending`: 업로드됨
   - `processing`: 검토 중
   - `completed`: 성공
   - `failed`: 오류 발생
