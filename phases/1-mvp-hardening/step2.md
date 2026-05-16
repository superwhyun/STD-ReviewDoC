# Step 2: review-failure-state

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `/AGENTS.md`
- `/docs/HARNESS.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `projects/DraftReviewr/phases/project-manifest.json`
- `projects/DraftReviewr/phases/baselines/0-onboarding.json`
- `projects/DraftReviewr/phases/1-mvp-hardening/module-map.json`
- `projects/DraftReviewr/phases/1-mvp-hardening/step1-output.json`
- `projects/DraftReviewr/components/documents/document-upload-section.tsx`
- `projects/DraftReviewr/components/documents/documents-list.tsx`
- `projects/DraftReviewr/lib/storage/local-storage.ts`
- `projects/DraftReviewr/lib/types.ts`
- `projects/DraftReviewr/lib/openai-client.ts`

## 모듈 할당

- module: `review-failure-state`
- owned_paths:
  - `projects/DraftReviewr/components/documents/document-upload-section.tsx`
  - `projects/DraftReviewr/lib/storage/local-storage.ts`
  - `projects/DraftReviewr/lib/types.ts`
  - `projects/DraftReviewr/phases/1-mvp-hardening/step2-output.json`
- read_contracts:
  - `projects/DraftReviewr/lib/openai-client.ts`
  - `projects/DraftReviewr/phases/1-mvp-hardening/step1-output.json`
- forbidden_paths:
  - `projects/DraftReviewr/.git/`
  - `projects/DraftReviewr/node_modules/`
  - `projects/DraftReviewr/.next/`
  - `projects/DraftReviewr/app/admin/**`
  - `projects/DraftReviewr/app/settings/**`
  - `projects/DraftReviewr/components/admin/**`
  - `projects/DraftReviewr/components/settings/**`

## 계약 및 베이스라인

- 문서 상태 contract는 `pending | processing | completed | failed`를 유지한다.
- 리뷰 처리 실패 시 이미 생성된 문서는 `failed` 상태로 남아야 한다.
- 성공 시 기존 `completed` 흐름과 결과 저장 흐름은 유지한다.

## 작업

1. `handleUpload()`에서 문서 생성 이후 발생하는 실패를 추적할 수 있게 한다.
2. OpenAI 처리, 결과 저장, 상태 갱신 중 오류가 나면 해당 문서를 `failed`로 업데이트한다.
3. 실패 후 부모 목록이 갱신되어 사용자가 실패 상태를 볼 수 있게 한다.
4. 필요한 경우 storage helper를 작게 보강하되, localStorage contract를 바꾸지 않는다.
5. `step2-output.json`에 실패 상태 전이와 잔여 UX 한계를 기록한다.

## Acceptance Criteria

```bash
python3 scripts/validate_phase.py 1-mvp-hardening --root projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
```

- [ ] 문서 생성 후 리뷰 처리에서 예외가 발생하면 해당 문서는 `failed` 상태가 된다.
- [ ] 성공 경로는 `completed` 상태와 review results 저장 동작을 유지한다.
- [ ] 실패 상태가 `DocumentsList`의 기존 `실패` badge로 표시될 수 있다.

## 검증 절차

1. Acceptance Criteria 명령을 실행한다.
2. 실패 경로를 코드 수준으로 추적하여 `failed` 전이가 보장되는지 확인한다.
3. `owned_paths` 밖의 구현 파일이 변경되지 않았는지 확인한다.
4. `phases/1-mvp-hardening/index.json` 과 `step2-output.json` 에 상태와 handoff를 기록한다.

## 금지사항

- OpenAI API request contract를 이 step에서 바꾸지 마라.
- 관리자 설정 기능을 수정하지 마라.
- 결과 파싱 로직을 리팩터링하지 마라.
