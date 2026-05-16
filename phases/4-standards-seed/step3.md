# Step 3: language-setting — 검토 결과 언어 설정

## 읽어야 할 파일
- `phases/4-standards-seed/module-map.json`
- `lib/storage/local-storage.ts`
- `lib/openai-client.ts` (system prompt 조립 위치 확인)
- `app/settings/page.tsx`

## 모듈 할당
- module: `language-setting`
- owned_paths:
  - `lib/storage/language-storage.ts`
  - `app/settings/page.tsx` (언어 선택 UI 추가)
  - `lib/openai-client.ts` (언어 지시 주입 한 줄만)
- read_contracts: `lib/types.ts`, `lib/storage/local-storage.ts`
- forbidden_paths: `.git/`, `node_modules/`, `.next/`, `public/**`, `components/export-import-dialog.tsx`

## 계약 및 베이스라인
- localStorage key: `draftreviewr:language` = `"ko"` | `"en"`, 기본값 `"ko"`
- LLM 호출 system prompt 말미에 추가:
  - ko: `"검토 결과는 반드시 한국어로 작성하라."`
  - en: `"Write all review results in English."`
- 언어 설정은 UI preference일 뿐 — 기존 저장된 검토항목 prompt는 변경하지 않는다

## 작업

### 1. `lib/storage/language-storage.ts` 생성
```ts
export type Language = 'ko' | 'en'
export const LANGUAGE_KEY = 'draftreviewr:language'
export function getLanguage(): Language { ... }        // localStorage 읽기, 없으면 'ko'
export function setLanguage(lang: Language): void { ... }
export function getLanguageInstruction(lang: Language): string { ... }
// ko → "검토 결과는 반드시 한국어로 작성하라."
// en → "Write all review results in English."
```

### 2. `lib/openai-client.ts` 수정
- 리뷰 호출 시 system prompt를 조립하는 위치를 찾아
- `getLanguage()` 호출 → `getLanguageInstruction()` 결과를 system prompt 말미에 append

### 3. `app/settings/page.tsx` 수정
- 언어 선택 UI 추가: 라디오 버튼 또는 Select 컴포넌트 (한국어 / English)
- 변경 즉시 `setLanguage()` 호출 + toast("언어 설정이 저장되었습니다")
- 페이지 로드 시 현재 설정값으로 초기화

## 검증 절차
1. typecheck, build AC 실행
2. settings 페이지에 언어 선택 UI 존재 확인
3. `lib/openai-client.ts`에 언어 지시 주입 코드 있음 확인
4. `owned_paths` 외 파일 변경 없음 확인
5. `step3-output.json`에 handoff 기록

## Acceptance Criteria
```bash
npm run typecheck --prefix projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
```
- `lib/storage/language-storage.ts` 파일이 존재한다
- settings 페이지에 언어 선택 UI가 있다
- openai-client.ts의 system prompt에 언어 지시가 추가된다

## 금지사항
- 기존 검토항목 prompt 텍스트 변경 금지
- 언어 설정이 다른 설정(API key, provider 등)에 영향을 주지 않도록 격리
