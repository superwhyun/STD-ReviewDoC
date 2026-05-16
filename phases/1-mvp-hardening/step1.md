# Step 1: default-data-loading

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `/AGENTS.md`
- `/docs/HARNESS.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `projects/DraftReviewr/phases/project-manifest.json`
- `projects/DraftReviewr/phases/baselines/0-onboarding.json`
- `projects/DraftReviewr/phases/1-mvp-hardening/module-map.json`
- `projects/DraftReviewr/phases/1-mvp-hardening/step0-output.json`
- `projects/DraftReviewr/lib/storage/local-storage.ts`
- `projects/DraftReviewr/lib/storage/default-data.json`
- `projects/DraftReviewr/app/page.tsx`
- `projects/DraftReviewr/app/admin/page.tsx`

## 모듈 할당

- module: `default-data-loading`
- owned_paths:
  - `projects/DraftReviewr/lib/storage/local-storage.ts`
  - `projects/DraftReviewr/lib/storage/default-data.json`
  - `projects/DraftReviewr/public/default-data.json`
  - `projects/DraftReviewr/phases/1-mvp-hardening/step1-output.json`
- read_contracts:
  - `projects/DraftReviewr/lib/types.ts`
  - `projects/DraftReviewr/phases/baselines/0-onboarding.json`
  - `projects/DraftReviewr/phases/1-mvp-hardening/step0-output.json`
- forbidden_paths:
  - `projects/DraftReviewr/.git/`
  - `projects/DraftReviewr/node_modules/`
  - `projects/DraftReviewr/.next/`
  - `projects/DraftReviewr/components/**`
  - `projects/DraftReviewr/app/settings/**`

## 계약 및 베이스라인

- `initializeDefaultData()`는 첫 실행 시 기본 문서 타입과 공통 검토 항목을 안정적으로 적재해야 한다.
- 기본 데이터의 JSON shape는 `document_types`, `common_review_items`, `review_items`를 유지한다.
- 기존 localStorage 키 이름은 마이그레이션 없이 유지한다.

## 작업

1. 현재 `/lib/storage/default-data.json` fetch 경로가 실제 브라우저에서 접근 가능한지 확인한다.
2. 필요한 경우 기본 데이터를 `public/default-data.json`으로 공개하고 `initializeDefaultData()` fetch 경로를 변경한다.
3. fetch 실패 시 조용히 빈 상태가 되지 않도록 최소한의 fallback 또는 명확한 console error를 유지한다.
4. 기본 데이터 중복 삽입이 발생하지 않도록 기존 guard 동작을 유지한다.
5. `step1-output.json`에 변경 이유, 검증 결과, 다음 step이 읽을 계약을 기록한다.

## Acceptance Criteria

```bash
python3 scripts/validate_phase.py 1-mvp-hardening --root projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
```

- [ ] 새 브라우저 세션에서 기본 문서 타입 `표준초안`과 공통 검토 항목 3개가 로드되는 경로가 코드상 유효하다.
- [ ] 기존 사용자의 localStorage 데이터가 있으면 기본 데이터가 덮어써지지 않는다.
- [ ] `lib/storage/default-data.json` 또는 그 공개 사본의 JSON shape가 깨지지 않는다.

## 검증 절차

1. Acceptance Criteria 명령을 실행한다.
2. 기본 데이터 파일 존재 여부와 fetch 경로를 확인한다.
3. `owned_paths` 밖의 구현 파일이 변경되지 않았는지 확인한다.
4. `phases/1-mvp-hardening/index.json` 과 `step1-output.json` 에 상태와 handoff를 기록한다.

## 금지사항

- localStorage 키 이름을 변경하지 마라.
- 관리자/문서 UI를 같이 리팩터링하지 마라.
- OpenAI 호출 로직을 수정하지 마라.
