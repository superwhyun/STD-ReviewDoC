# DraftReviewr - AI 문서 검토 시스템

## 프로젝트 개요

DraftReviewr(저장소명 STD-ReviewDoC)는 ITU-T / JTC1(ISO) 계열 표준 초안·기고문을 대상으로 하는
AI 기반 자동 검토 도구임. **서버·데이터베이스가 전혀 없는 완전 클라이언트 사이드 애플리케이션**으로,
Next.js 정적 export(`output: "export"`)로 빌드되어 브라우저에서 직접 LLM API를 호출함.

> 이 문서는 이전 버전(Supabase + Next.js API Routes 기반 설계)을 서술하고 있었으나,
> 실제 코드는 이미 완전 클라이언트 사이드 + localStorage 구조로 전환되어 있어 2026-08-30에 재작성함.
> Supabase, `app/api/*`, `lib/crypto.ts`, `scripts/*.sql`은 현재 저장소에 존재하지 않음.

## 아키텍처 특징

- **서버리스**: 백엔드 서버, 데이터베이스 없음. Vercel 정적 호스팅 또는 Docker+Nginx로 정적 파일만 서빙.
- **localStorage 기반**: 문서 유형/검토 항목/검토 결과/LLM 설정/API 키를 전부 브라우저 localStorage에 저장.
- **멀티 LLM 직접 연동**: 브라우저에서 각 프로바이더 API를 직접 호출(서버 프록시 없음).
- **시드 데이터**: `public/data/*.json`에 ITU-T/JTC1 문서 유형별 기본 검토 항목을 정적으로 제공.
- **Export/Import**: 검토 설정을 JSON 파일로 내보내기/가져오기 가능.

## 기술 스택

- **Next.js 15.3.9** (App Router, `output: "export"`, `images.unoptimized: true`)
- **React 19**, **TypeScript 5**
- **Tailwind CSS 4** + **Radix UI** + **shadcn/ui**
- **localStorage** (모든 데이터 저장, 서버 없음)
- **mammoth + JSZip** (브라우저에서 DOCX 텍스트/추적 변경 내용 추출)
- **pnpm** (패키지 매니저; `package-lock.json`은 사용하지 않음)

## LLM 프로바이더 (`lib/providers/`)

`lib/llm-provider.ts`가 프로바이더를 동적 import로 로드하는 공통 인터페이스(`LLMProvider`)를 정의함.

| 프로바이더 | 파일 | API 엔드포인트 |
|---|---|---|
| OpenAI | `providers/openai.ts` | `https://api.openai.com/v1` |
| Grok (xAI) | `providers/grok.ts` | `https://api.x.ai/v1/responses` |
| Kimi (Moonshot) | `providers/kimi.ts` | `https://api.moonshot.cn/v1/chat/completions` |
| OpenRouter | `providers/openrouter.ts` | `https://openrouter.ai/api/v1/chat/completions` (설정 가능) |

각 프로바이더는 `review()`(전체 완료), `reviewStream()`(스트리밍), `validateApiKey()`, `listModels()`를 구현함.
설정(`LLMProviderConfig`: provider/apiKey/model/baseUrl/reasoning)은 `lib/storage/local-storage.ts`의
`llmProviderStorage`에 프로바이더별로 저장됨.

## 프로젝트 구조

```
STD-ReviewDoC/
├── app/
│   ├── page.tsx              # 홈: 문서 업로드 & 목록 & 검토 결과
│   ├── admin/page.tsx        # 관리자: 문서 유형/검토 항목 관리
│   └── settings/page.tsx     # 설정: LLM 프로바이더/API 키 관리
├── components/
│   ├── admin/                # 문서 유형·검토 항목 CRUD UI
│   ├── documents/            # 업로드, 목록, 검토 결과 다이얼로그
│   ├── settings/              # API 키/프로바이더 설정 UI
│   ├── ui/                   # shadcn/ui 기반 재사용 컴포넌트 (70+개)
│   ├── export-import-dialog.tsx
│   └── seed-initializer.tsx  # 최초 실행 시 public/data 시드를 localStorage로 로드
├── lib/
│   ├── types.ts               # 도메인 타입 정의
│   ├── document-processor.ts  # DOCX(mammoth+JSZip, 추적변경 마커 포함)/TXT 텍스트 추출
│   ├── llm-provider.ts        # 프로바이더 추상화 계층
│   ├── openai-client.ts       # (레거시) OpenAI 전용 직접 호출 헬퍼
│   ├── providers/             # 프로바이더별 구현체 (openai/grok/kimi/openrouter)
│   └── storage/
│       ├── local-storage.ts          # localStorage 키/CRUD 전반 (KEYS 상수 참고)
│       ├── openai-settings-storage.ts
│       ├── language-storage.ts
│       ├── seed-loader.ts            # public/data/*.json → localStorage 초기 시드
│       └── settings-serializer.ts    # export/import JSON 직렬화
└── public/data/                # ITU-T/JTC1 문서 유형별 기본 검토 항목 시드
```

## 데이터 모델 (`lib/types.ts`, localStorage 저장)

Supabase 테이블이 아니라 localStorage에 저장되는 순수 TypeScript 인터페이스임 (`created_at`/`updated_at` 등
필드명은 과거 DB 스키마의 흔적이 남아있을 뿐 실제 DB는 없음).

- `DocumentType`: 문서 유형(예: "표준초안")
- `ReviewItem`: 문서 유형별 검토 항목(name, prompt, order_index)
- `CommonReviewItem`: 모든 문서에 공통 적용되는 검토 항목
- `Document`: 업로드된 문서 메타데이터, `status: pending | processing | completed | failed`
- `ReviewResult`: 검토 항목별 결과 텍스트 + 0~100 `score`
- `LLMProviderConfig`: provider/apiKey/model/baseUrl/reasoning effort

localStorage 키(`lib/storage/local-storage.ts`의 `KEYS`):
`draftreviewr:document-types`, `draftreviewr:review-items`, `draftreviewr:common-review-items`,
`draftreviewr:documents`, `draftreviewr:review-results`, `draftreviewr:api-key`(레거시),
`draftreviewr:llm-configs`, `draftreviewr:active-provider`, `draftreviewr:user-id`

## 주요 기능

1. **문서 업로드 & 검토**: DOCX/TXT 업로드 → 브라우저에서 텍스트(및 추적 변경 내용) 추출 → 공통 검토 항목 +
   문서 유형별 검토 항목을 순서대로 LLM에 전달 → 항목별 0~100점 스코어와 피드백 표시.
2. **관리자 대시보드**: 문서 유형/공통 검토 항목/유형별 검토 항목 CRUD.
3. **프롬프트 인라인 편집**: 검토 결과 화면에서 프롬프트를 바로 수정, 다음 검토부터 반영.
4. **설정**: 프로바이더 선택, API 키 입력/검증, 모델 목록 조회.
5. **Export/Import**: 검토 항목 설정 전체를 JSON으로 내보내기/가져오기 (`settings-serializer.ts`).

## 보안 관련 알려진 트레이드오프

- **API 키는 암호화 없이 localStorage에 평문 저장**되며, 각 프로바이더 API를 브라우저에서 직접
  `Authorization: Bearer {apiKey}`로 호출함. "서버 없음"이라는 설계 목표상 의도된 구조이지만,
  XSS가 발생하면 키가 그대로 유출될 수 있음.
- 유일한 방어선은 CSP 등 응답 헤더임 — `vercel.json`과 `nginx.conf`에 각 프로바이더 도메인만
  허용하는 `Content-Security-Policy`를 설정해 둠. 배포 방식을 늘릴 경우 반드시 CSP를 함께 적용할 것.
- 서버가 없으므로 인증/권한 개념도 없음(단일 브라우저 사용자 전제). 여러 사용자가 공유하는 환경에는
  적합하지 않음.

## 배포

세 가지 방식 모두 `next build` 결과물(`out/`)을 정적으로 서빙하는 동일한 산출물 기반임.

- **Vercel**: `vercel.json`에서 보안 헤더(CSP 포함) 설정.
- **Docker + Nginx**: `Dockerfile`(멀티스테이지: pnpm 빌드 → nginx:alpine 서빙) + `nginx.conf`
  (SPA 라우팅 fallback, 정적 에셋 캐싱, 보안 헤더). Nginx는 `add_header`를 location 블록에 재선언하지
  않으면 상위(server) 블록에서 상속되지 않으므로, 헤더를 추가할 때는 각 location에 반복 선언해야 함.
- **정적 export 로컬 확인**: `pnpm build` → `out/` 디렉터리를 임의의 정적 서버로 서빙.

패키지 매니저는 **pnpm으로 통일**되어 있음 (`pnpm-lock.yaml`, `pnpm-workspace.yaml`). `package.json`에는
pnpm 필드를 두지 않으며, 빌드 스크립트 허용 여부는 `pnpm-workspace.yaml`의 `allowBuilds`에서 관리함
(`sharp`는 이미지 최적화가 꺼져 있어 false, `unrs-resolver`도 false).

## 알려진 제한사항

1. 단일 브라우저/단일 사용자 전제 — 여러 기기 간 데이터 동기화 없음(localStorage 특성상 당연).
2. PDF 지원 없음 — 현재 DOCX/TXT만 처리(`lib/document-processor.ts`).
3. API 키 평문 저장 — 위 "보안 관련 알려진 트레이드오프" 참고.
4. localStorage 용량 한계 — 문서/결과가 많아지면 QuotaExceededError 가능(코드에서 알림 처리는 되어 있음).
