# Step 1: storage-migration

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `/AGENTS.md`
- `/docs/HARNESS.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `projects/DraftReviewr/phases/project-manifest.json`
- `projects/DraftReviewr/phases/baselines/1-mvp-hardening.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/module-map.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/step0-output.json`
- `projects/DraftReviewr/lib/types.ts`
- `projects/DraftReviewr/lib/storage/local-storage.ts`

## 모듈 할당

- module: `storage-migration`
- owned_paths:
  - `projects/DraftReviewr/lib/storage/local-storage.ts`
  - `projects/DraftReviewr/lib/types.ts`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step1-output.json`
- read_contracts:
  - `projects/DraftReviewr/lib/types.ts`
  - `projects/DraftReviewr/lib/storage/local-storage.ts`
  - `projects/DraftReviewr/phases/baselines/1-mvp-hardening.json`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step0-output.json`
- forbidden_paths:
  - `projects/DraftReviewr/.git/`
  - `projects/DraftReviewr/node_modules/`
  - `projects/DraftReviewr/.next/`
  - `projects/DraftReviewr/components/**`

## 계약 및 베이스라인

- 기존 localStorage key `draftreviewr:api-key`를 보존한다.
- 신규 key `draftreviewr:llm-configs`에 `LLMProviderConfig[]`를 저장한다.
- 신규 key `draftreviewr:active-provider`에 선택된 제공자 식별자를 저장한다.
- 기존 apiKeyStorage 함수는 하위 호환성을 위해 유지한다.

## 작업

1. `lib/types.ts`에 `LLMProviderType`, `LLMProviderConfig` 타입을 추가한다.
2. `lib/storage/local-storage.ts`에 `draftreviewr:llm-configs` 스토리지 키와 CRUD 함수를 추가한다.
3. 기존 `draftreviewr:api-key` 값을 새 `llm-configs` 형식으로 마이그레이션하는 함수를 추가한다.
4. `draftreviewr:active-provider` 키로 활성 provider 선택을 저장하는 함수를 추가한다.

## Acceptance Criteria

```bash
python3 scripts/validate_phase.py 2-multi-llm-support --root projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
npm run typecheck --prefix projects/DraftReviewr
```

- [ ] `LLMProviderType`과 `LLMProviderConfig`가 `lib/types.ts`에 정의된다.
- [ ] localStorage migration이 기존 API key를 보존한다.
- [ ] 기존 OpenAI 전용 흐름이 깨지지 않는다.

## 검증 절차

1. Acceptance Criteria 명령을 실행한다.
2. 신규 타입이 `lib/types.ts`에 추가되었는지 확인한다.
3. `owned_paths` 밖의 구현 파일이 변경되지 않았는지 확인한다.
4. `phases/2-multi-llm-support/index.json` 과 `step1-output.json` 에 상태와 handoff를 기록한다.

## 금지사항

- OpenAI 호출 로직을 이 step에서 수정하지 마라.
- UI 컴포넌트를 수정하지 마라.
- localStorage key 이름을 변경하지 마라.
