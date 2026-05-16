# Step 2: seed-loader — 초기 로드 + 기본값 초기화

## 읽어야 할 파일
- `phases/4-standards-seed/module-map.json`
- `phases/4-standards-seed/step0-output.json`
- `lib/storage/local-storage.ts`
- `lib/storage/default-data.json`
- `components/export-import-dialog.tsx`
- `app/layout.tsx` 또는 루트 컴포넌트 (SeedInitializer 삽입 위치 파악용)

## 모듈 할당
- module: `seed-loader`
- owned_paths:
  - `lib/storage/seed-loader.ts`
  - `components/seed-initializer.tsx`
  - `app/layout.tsx` (SeedInitializer 삽입 한 줄만)
  - `app/admin/page.tsx` (기본값 초기화 버튼 추가)
- read_contracts: `lib/storage/local-storage.ts`, `lib/types.ts`
- forbidden_paths: `.git/`, `node_modules/`, `.next/`, `public/**`, `lib/openai-client.ts`

## 계약 및 베이스라인
- step0에서 정의한 seed 파일 경로: `public/data/document-types/*.json`, `public/data/common-review-items.json`
- 기존 `export-import-dialog.tsx` 코드를 삭제하거나 이동하지 않는다. 이 step은 seed 로딩 로직만 추가한다.

## 작업

### 1. `lib/storage/seed-loader.ts` 생성

두 가지 함수를 구현한다:

**`initializeSeedData()`** — 초기 로드 (idempotent)
- `public/data/document-types/` 4개 파일 + `public/data/common-review-items.json` fetch
- localStorage에 해당 document_type id가 없을 때만 삽입 (기존 데이터 보호)
- 이미 존재하면 skip

**`resetToSeedData()`** — 기본값 초기화 (전체 교체)
- 동일한 seed 파일들 fetch
- document_types, review_items, common_review_items를 localStorage에서 전체 삭제 후 재삽입
- language 설정은 초기화하지 않는다 (사용자 설정 보호)
- 완료 후 toast 알림

### 2. `components/seed-initializer.tsx` 생성

```tsx
'use client'
// 앱 마운트 시 1회 실행 — useEffect + initializeSeedData() 호출
// 로딩 상태 없음, 에러는 console.warn으로만 처리
```

### 3. `app/layout.tsx` 수정
- `<SeedInitializer />` 를 body 내부에 추가 (한 줄)

### 4. 관리자 페이지에 "기본값으로 초기화" 버튼 추가
- `app/admin/page.tsx`의 적절한 위치에 버튼 추가
- 클릭 시 `resetToSeedData()` 호출
- 확인 다이얼로그 없이 즉시 실행 (단, toast로 결과 알림)

## 검증 절차
1. typecheck, build AC 실행
2. 브라우저 로드 시 SeedInitializer가 동작하는지 확인 (localStorage에 itu-t-draft 타입이 생성됨)
3. 관리자 페이지에 "기본값으로 초기화" 버튼 존재 확인
4. `owned_paths` 외 파일 변경 없음 확인
5. `step2-output.json`에 handoff 기록

## Acceptance Criteria
```bash
npm run typecheck --prefix projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
```
- `lib/storage/seed-loader.ts` 파일이 존재한다
- `components/seed-initializer.tsx` 파일이 존재한다
- `app/layout.tsx`에 `SeedInitializer` import 및 사용이 추가되어 있다
- `app/admin/page.tsx`에 "기본값으로 초기화" 버튼이 있다

## 금지사항
- `components/export-import-dialog.tsx` 삭제 또는 대폭 수정 금지
- 기존 localStorage 데이터 구조 변경 금지 (기존 key 이름 유지)
