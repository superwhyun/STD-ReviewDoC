# Step 2: llm-client-abstraction

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `/AGENTS.md`
- `/docs/HARNESS.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `projects/DraftReviewr/phases/project-manifest.json`
- `projects/DraftReviewr/phases/baselines/1-mvp-hardening.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/module-map.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/step1-output.json`
- `projects/DraftReviewr/lib/types.ts`
- `projects/DraftReviewr/lib/storage/local-storage.ts`
- `projects/DraftReviewr/lib/openai-client.ts`

## 모듈 할당

- module: `llm-client-abstraction`
- owned_paths:
  - `projects/DraftReviewr/lib/llm-provider.ts`
  - `projects/DraftReviewr/lib/providers/openai.ts`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step2-output.json`
- read_contracts:
  - `projects/DraftReviewr/lib/types.ts`
  - `projects/DraftReviewr/lib/storage/local-storage.ts`
  - `projects/DraftReviewr/lib/openai-client.ts`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step1-output.json`
- forbidden_paths:
  - `projects/DraftReviewr/.git/`
  - `projects/DraftReviewr/node_modules/`
  - `projects/DraftReviewr/.next/`
  - `projects/DraftReviewr/app/**`
  - `projects/DraftReviewr/components/**`

## 계약 및 베이스라인

- `LLMProvider` 인터페이스는 모든 LLM 제공자가 구현해야 할 공통 계약이다.
- `review(request: ReviewRequest): Promise<ReviewResult[]>`는 동기 리뷰 메서드다.
- `reviewStream(request: ReviewRequest): AsyncGenerator<string>`는 streaming 리뷰 메서드다 (Step 4에서 구현).
- `validateApiKey(): Promise<boolean>`는 API key 유효성 검증이다.
- `ProviderFactory.createProvider(config)`는 설정에 따라 적절한 provider 인스턴스를 반환한다.
- 기존 `lib/openai-client.ts`는 낡은(deprecated) 헬퍼로 유지한다.

## 작업

1. `lib/llm-provider.ts`를 생성하고 `LLMProvider` 인터페이스, `ReviewRequest`, `ReviewResult` 타입을 정의한다.
2. `ProviderFactory`(`createProvider` 함수)를 구현한다.
3. `lib/providers/openai.ts`를 생성해 기존 `processDocumentReview()` 로직을 `LLMProvider` 구현체로 리팩터링한다.
4. `lib/openai-client.ts`에 deprecation 주석을 추가한다.
5. 디렉터리 `lib/providers/`를 생성한다.

## Acceptance Criteria

```bash
python3 scripts/validate_phase.py 2-multi-llm-support --root projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
npm run typecheck --prefix projects/DraftReviewr
```

- [ ] `LLMProvider` 인터페이스가 `lib/llm-provider.ts`에 정의된다.
- [ ] OpenAI provider가 신규 인터페이스를 구현한다.
- [ ] 기존 `processDocumentReview()` 호출이 깨지지 않는다.

## 검증 절차

1. Acceptance Criteria 명령을 실행한다.
2. 신규 파일 `lib/llm-provider.ts`, `lib/providers/openai.ts`가 존재하는지 확인한다.
3. `owned_paths` 밖의 구현 파일이 변경되지 않았는지 확인한다.
4. `phases/2-multi-llm-support/index.json` 과 `step2-output.json` 에 상태와 handoff를 기록한다.

## 금지사항

- UI 컴포넌트를 수정하지 마라.
- `lib/openai-client.ts`의 동작을 변경하지 마라 (deprecation 주석만 추가).
- 다른 provider를 이 step에서 구현하지 마라.
