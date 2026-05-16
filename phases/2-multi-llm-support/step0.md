# Step 0: multi-llm-contracts

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `/AGENTS.md`
- `/docs/HARNESS.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `projects/DraftReviewr/phases/index.json`
- `projects/DraftReviewr/phases/project-manifest.json`
- `projects/DraftReviewr/phases/baselines/1-mvp-hardening.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/index.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/module-map.json` (이 step에서 생성)
- `projects/DraftReviewr/lib/openai-client.ts`
- `projects/DraftReviewr/lib/storage/local-storage.ts`
- `projects/DraftReviewr/lib/types.ts`
- `projects/DraftReviewr/components/settings/api-key-settings.tsx`

이전 phase의 구현 전체를 다시 읽지 마라. 먼저 baseline, project manifest를 기준으로 phase 범위가 요구사항을 충분히 덮는지 확인하라.

## 모듈 할당

- module: `multi-llm-contracts`
- owned_paths:
  - `projects/DraftReviewr/phases/2-multi-llm-support/module-map.json`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step0-output.json`
  - `projects/DraftReviewr/phases/project-manifest.json`
- read_contracts:
  - `projects/DraftReviewr/phases/baselines/1-mvp-hardening.json`
  - `projects/DraftReviewr/phases/project-manifest.json`
  - `projects/DraftReviewr/phases/2-multi-llm-support/index.json`
- forbidden_paths:
  - `projects/DraftReviewr/.git/`
  - `projects/DraftReviewr/node_modules/`
  - `projects/DraftReviewr/.next/`
  - `projects/DraftReviewr/app/**`
  - `projects/DraftReviewr/components/**`
  - `projects/DraftReviewr/lib/**`

## 계약 및 베이스라인

- 이 phase는 `phases/baselines/1-mvp-hardening.json`을 입력 기준선으로 삼는다.
- Step 0에서는 구현 파일을 수정하지 않는다.
- Phase 범위가 부족하면 기존 step을 renumber 하지 말고 새 step을 append한다.

## 작업

1. 현재 `lib/openai-client.ts` 구조를 분석해 추상화할 인터페이스 포인트를 식별한다:
   - `processDocumentReview()` — 문서 리뷰 엔트리 포인트
   - `reviewDocumentWithOpenAI()` — 단일 호출 헬퍼
   - API key lookup (`apiKeyStorage.get()`)
   - 응답 파싱 (`ResponsesAPIResponse`)
2. OpenRouter, Grok, Kimi의 API 스펙을 고려한 공통 `LLMProvider` 인터페이스 contract를 설계한다.
3. Grok의 Responses API 경로와 요청/응답 형식을 문서화한다.
4. Streaming이 모든 provider에서 어떻게 동작할지 contract를 설계한다.
5. `module-map.json`에 8개 모듈의 owned_paths, contracts, dependencies를 기록한다.
6. `project-manifest.json`의 `active_phase`와 `next_phase`를 갱신한다.
7. `step0-output.json`에 contract 설계 결정을 기록한다.

## Acceptance Criteria

```bash
python3 scripts/validate_phase.py 2-multi-llm-support --root projects/DraftReviewr
```

- [ ] `phases/2-multi-llm-support/module-map.json`이 8개 모듈을 명확한 contract로 정의한다.
- [ ] 구현 파일이 수정되지 않았다.
- [ ] `project-manifest.json`이 phase 2를 반영한다.

## 검증 절차

1. Acceptance Criteria 명령을 실행한다.
2. 결과를 확인한다.
3. `owned_paths` 밖의 구현 파일이 변경되지 않았는지 확인한다.

## 금지사항

- 구현 파일을 수정하지 마라.
- Phase scope를 넓히기 위해 기존 step 번호를 바꾸지 마라.
- 다음 세션을 위한 handoff 없이 종료하지 마라.
