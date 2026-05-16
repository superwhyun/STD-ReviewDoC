# Step 0: contracts

## 읽어야 할 파일
- `phases/baselines/3-provider-model-ui.json`
- `phases/project-manifest.json`
- `phases/4-standards-seed/module-map.json`
- `lib/types.ts`
- `lib/storage/local-storage.ts`
- `lib/storage/default-data.json`
- `components/export-import-dialog.tsx`
- `lib/openai-client.ts`

## 모듈 할당
- module: `contracts`
- owned_paths: `phases/4-standards-seed/*`, `phases/project-manifest.json`
- forbidden_paths: `.git/`, `node_modules/`, `.next/`, `app/**`, `components/**`, `lib/**`, `public/**`

## 확인 목표

위 파일들을 읽어 기존 구현의 현재 상태를 파악한다.

1. `lib/storage/default-data.json` — 문서타입·검토항목이 어떻게 정의되어 있는지
2. `components/export-import-dialog.tsx` — 기존 export/import가 어디까지 구현되어 있는지
3. `lib/storage/local-storage.ts` — `initializeDefaultData` 진입점 및 스토리지 key 구조
4. `lib/openai-client.ts` — 리뷰 호출 시 system prompt 조립 위치

## 계약 및 베이스라인

### A. Seed JSON 파일 위치 및 스키마
```
public/data/document-types/itu-t-draft.json
public/data/document-types/itu-t-contribution.json
public/data/document-types/jtc1-draft.json
public/data/document-types/jtc1-contribution.json
public/data/common-review-items.json
```

문서타입 JSON 스키마:
```json
{
  "id": "string (slug, unique)",
  "name": "string",
  "description": "string",
  "review_items": [
    { "id": "string", "name": "string", "prompt": "string", "order_index": "number" }
  ]
}
```

공통항목 JSON 스키마:
```json
{
  "items": [
    { "id": "string", "name": "string", "prompt": "string", "order_index": "number" }
  ]
}
```

### B. 전체 설정 단일 Export/Import 포맷
```json
{
  "version": "1",
  "exported_at": "ISO8601",
  "language": "ko | en",
  "document_types": [
    { "id": "...", "name": "...", "description": "...",
      "review_items": [ { "id": "...", "name": "...", "prompt": "...", "order_index": 0 } ]
    }
  ],
  "common_review_items": [
    { "id": "...", "name": "...", "prompt": "...", "order_index": 0 }
  ]
}
```

### C. 언어 설정 계약
- localStorage key: `draftreviewr:language` = `"ko"` | `"en"`, 기본값 `"ko"`
- LLM 리뷰 호출 시 system prompt 말미에 언어 지시 추가
  - ko: `"검토 결과는 반드시 한국어로 작성하라."`
  - en: `"Write all review results in English."`

### D. Seed Loader 계약
- `SeedInitializer` 컴포넌트: 앱 마운트 시 1회, localStorage에 해당 타입이 없을 때만 삽입
- "기본값으로 초기화" 버튼: `public/data/` JSON 파일을 다시 fetch → 전체 교체 (document_types, common_review_items)
- 기존 `export-import-dialog.tsx`와 충돌 여부를 이 step에서 확인하고 module-map에 기록

## 작업
1. 위 파일들 읽고 현재 구현 상태 파악
2. 기존 export/import·default-data 구조와 이번 phase 설계 간 충돌 지점 정리 → module-map.json에 기록
3. 충돌이 step 진행을 막으면 `blocking-fix` step 추가, 그렇지 않으면 계속 진행
4. module-map.json의 placeholder를 실제 경로/계약으로 교체
5. `phases/project-manifest.json`의 `active_phase` → `4-standards-seed`, `status` → `standards-seed-in-progress`

## Acceptance Criteria
```bash
python3 scripts/validate_phase.py 4-standards-seed --root projects/DraftReviewr
```
- module-map.json에 placeholder가 없어야 한다
- project-manifest.json active_phase가 `4-standards-seed`여야 한다

## 검증 절차
1. AC 명령 실행 및 결과 확인
2. 기존 export-import, default-data 코드가 이 phase 설계와 충돌하는지 정리하여 module-map에 기록
3. 구현 파일 미변경 확인 (`owned_paths` 외 파일 git diff 없어야 함)
4. `phases/4-standards-seed/index.json`과 `step0-output.json`에 상태와 handoff 기록

## 금지사항
- 구현 파일 수정 금지
- 기존 export-import 코드 삭제 금지
