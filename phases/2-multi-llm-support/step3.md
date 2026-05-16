# Step 3: grok-openrouter-kimi

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `/AGENTS.md`
- `/docs/HARNESS.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `projects/DraftReviewr/phases/project-manifest.json`
- `projects/DraftReviewr/phases/baselines/1-mvp-hardening.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/module-map.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/step2-output.json`
- `projects/DraftReviewr/lib/llm-provider.ts`
- `projects/DraftReviewr/lib/providers/openai.ts`

## 모듈 할당

- module: `grok-openrouter-kimi`
- owned_paths:
  - `projects/DraftReviewr/lib/providers/grok.ts`
  - `projects/DraftReviewr/lib/providers/openrouter.ts`
  - `projects/DraftReviewr/lib/providers/kimi.ts`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step3-output.json`
- read_contracts:
  - `projects/DraftReviewr/lib/llm-provider.ts`
  - `projects/DraftReviewr/lib/providers/openai.ts`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step2-output.json`
- forbidden_paths:
  - `projects/DraftReviewr/.git/`
  - `projects/DraftReviewr/node_modules/`
  - `projects/DraftReviewr/.next/`
  - `projects/DraftReviewr/app/**`
  - `projects/DraftReviewr/components/**`

## 계약 및 베이스라인

- Grok: xAI Responses API (`https://api.x.ai/v1/responses`), OpenAI Responses와 유사한 요청/응답 형식.
- OpenRouter: Chat Completions API (`https://openrouter.ai/api/v1/chat/completions`).
- Kimi: Chat Completions API (`https://api.moonshot.cn/v1/chat/completions`), OpenAI-compatible.
- 모든 provider는 `LLMProvider` 인터페이스를 구현해야 한다.
- `Authorization: Bearer {apiKey}` 헤더를 사용한다.

## 작업

1. `lib/providers/grok.ts`: xAI Responses API 구현. 요청 body는 input/prompt 형식, 응답은 ResponsesAPIResponse와 유사.
2. `lib/providers/openrouter.ts`: OpenRouter Chat Completions API 구현. messages 형식 + model routing.
3. `lib/providers/kimi.ts`: Kimi Chat Completions API 구현. OpenAI-compatible messages 형식.
4. ProviderFactory에 Grok, OpenRouter, Kimi provider 등록.

## Acceptance Criteria

```bash
python3 scripts/validate_phase.py 2-multi-llm-support --root projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
npm run typecheck --prefix projects/DraftReviewr
```

- [ ] Grok, OpenRouter, Kimi provider가 각각 `LLMProvider`를 구현한다.
- [ ] Grok은 Responses API endpoint, OpenRouter/Kimi는 Chat Completions endpoint를 사용한다.
- [ ] 각 provider의 `validateApiKey()`가 올바른 endpoint로 검증한다.

## 검증 절차

1. Acceptance Criteria 명령을 실행한다.
2. 신규 파일 `lib/providers/grok.ts`, `lib/providers/openrouter.ts`, `lib/providers/kimi.ts`가 존재하는지 확인한다.
3. `owned_paths` 밖의 구현 파일이 변경되지 않았는지 확인한다.
4. `phases/2-multi-llm-support/index.json` 과 `step3-output.json` 에 상태와 handoff를 기록한다.

## 금지사항

- UI 컴포넌트를 수정하지 마라.
- `lib/openai-client.ts`를 수정하지 마라.
- Streaming을 이 step에서 구현하지 마라 (Step 4에서 구현).
