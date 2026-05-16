# Step 5: settings-ui

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `/AGENTS.md`
- `/docs/HARNESS.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `projects/DraftReviewr/phases/project-manifest.json`
- `projects/DraftReviewr/phases/baselines/1-mvp-hardening.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/module-map.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/step4-output.json`
- `projects/DraftReviewr/lib/llm-provider.ts`
- `projects/DraftReviewr/lib/storage/local-storage.ts`
- `projects/DraftReviewr/lib/types.ts`
- `projects/DraftReviewr/components/settings/api-key-settings.tsx`

## 모듈 할당

- module: `settings-ui`
- owned_paths:
  - `projects/DraftReviewr/components/settings/api-key-settings.tsx`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step5-output.json`
- read_contracts:
  - `projects/DraftReviewr/lib/llm-provider.ts`
  - `projects/DraftReviewr/lib/storage/local-storage.ts`
  - `projects/DraftReviewr/lib/types.ts`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step4-output.json`
- forbidden_paths:
  - `projects/DraftReviewr/.git/`
  - `projects/DraftReviewr/node_modules/`
  - `projects/DraftReviewr/.next/`
  - `projects/DraftReviewr/app/admin/**`
  - `projects/DraftReviewr/components/admin/**`

## 계약 및 베이스라인

- 기존 OpenAI API key 입력 필드는 유지하되, multi-provider로 확장한다.
- Provider 선택 드롭다운: OpenAI, Grok, OpenRouter, Kimi.
- 각 provider별 API key + model 입력 필드.
- `llmProviderStorage`를 사용해 설정을 저장/로드한다.
- 기존 `draftreviewr:api-key`가 있으면 OpenAI provider로 자동 마이그레이션한다.

## 작업

1. `api-key-settings.tsx`에 provider 선택 탭/드롭다운을 추가한다.
2. 각 provider별 API key 입력 필드를 추가한다.
3. provider별 model명 입력 필드를 추가한다.
4. `llmProviderStorage`를 사용해 persistent 저장한다.
5. 기존 OpenAI key 마이그레이션 로직을 첫 로드 시 실행한다.
6. API key 마스킹/삭제 기능을 각 provider별로 확장한다.

## Acceptance Criteria

```bash
python3 scripts/validate_phase.py 2-multi-llm-support --root projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
npm run typecheck --prefix projects/DraftReviewr
```

- [ ] Settings 페이지에서 provider 선택이 가능하다.
- [ ] 각 provider의 API key와 model을 설정/삭제할 수 있다.
- [ ] 기존 OpenAI key가 자동 마이그레이션된다.
- [ ] 기존 OpenAI 단일 key 흐름이 깨지지 않는다.

## 검증 절차

1. Acceptance Criteria 명령을 실행한다.
2. `api-key-settings.tsx`가 `llmProviderStorage`를 import하는지 확인한다.
3. `owned_paths` 밖의 구현 파일이 변경되지 않았는지 확인한다.
4. `phases/2-multi-llm-support/index.json` 과 `step5-output.json` 에 상태와 handoff를 기록한다.

## 금지사항

- 관리자 페이지를 수정하지 마라.
- `lib/openai-client.ts`를 수정하지 마라.
- localStorage 스토리지 구조를 변경하지 마라 (Step 1에서 완료).
