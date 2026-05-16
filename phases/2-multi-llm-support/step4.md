# Step 4: streaming-support

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `/AGENTS.md`
- `/docs/HARNESS.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `projects/DraftReviewr/phases/project-manifest.json`
- `projects/DraftReviewr/phases/baselines/1-mvp-hardening.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/module-map.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/step3-output.json`
- `projects/DraftReviewr/lib/llm-provider.ts`
- `projects/DraftReviewr/lib/providers/openai.ts`
- `projects/DraftReviewr/lib/providers/grok.ts`
- `projects/DraftReviewr/lib/providers/openrouter.ts`
- `projects/DraftReviewr/lib/providers/kimi.ts`

## 모듈 할당

- module: `streaming-support`
- owned_paths:
  - `projects/DraftReviewr/lib/llm-provider.ts`
  - `projects/DraftReviewr/lib/providers/openai.ts`
  - `projects/DraftReviewr/lib/providers/grok.ts`
  - `projects/DraftReviewr/lib/providers/openrouter.ts`
  - `projects/DraftReviewr/lib/providers/kimi.ts`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step4-output.json`
- read_contracts:
  - `projects/DraftReviewr/lib/llm-provider.ts`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step3-output.json`
- forbidden_paths:
  - `projects/DraftReviewr/.git/`
  - `projects/DraftReviewr/node_modules/`
  - `projects/DraftReviewr/.next/`
  - `projects/DraftReviewr/app/**`
  - `projects/DraftReviewr/components/**`

## 계약 및 베이스라인

- `LLMProvider.reviewStream()`은 `AsyncGenerator<string>`를 반환한다.
- SSE (Server-Sent Events) 형식으로 응답을 스트리밍한다: `data: {"choices":[{"delta":{"content":"..."}}]}\n\n`.
- `fetch()`의 `response.body`를 `ReadableStream`으로 읽고 청크 단위로 파싱한다.
- Streaming이 지원되지 않는 경우 `review()` 메서드로 fallback한다.
- `onToken` callback은 `ReviewRequest.onToken`을 통해 전달된다.

## 작업

1. `LLMProvider` 인터페이스에 `reviewStream(request): AsyncGenerator<string>` 시그니처를 추가한다.
2. 모든 4개 provider(OpenAI Responses API, Grok Responses API, OpenRouter Chat Completions, Kimi Chat Completions)에 SSE streaming을 구현한다.
3. `ReadableStream`의 `getReader()`로 청크를 읽고 SSE 라인을 파싱한다.
4. `ReviewRequest.onToken` callback으로 각 토큰을 전달한다.
5. 에러 발생 시 generator가 정상적으로 종료되도록 `finally` 블록을 사용한다.

## Acceptance Criteria

```bash
python3 scripts/validate_phase.py 2-multi-llm-support --root projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
npm run typecheck --prefix projects/DraftReviewr
```

- [ ] 모든 4개 provider가 `reviewStream()`을 구현한다.
- [ ] SSE 응답이 올바르게 파싱되어 토큰 단위로 전달된다.
- [ ] 에러 발생 시 stream이 정상 종료된다.

## 검증 절차

1. Acceptance Criteria 명령을 실행한다.
2. 각 provider 파일에 `reviewStream` 메서드가 존재하는지 확인한다.
3. `owned_paths` 밖의 구현 파일이 변경되지 않았는지 확인한다.
4. `phases/2-multi-llm-support/index.json` 과 `step4-output.json` 에 상태와 handoff를 기록한다.

## 금지사항

- UI 컴포넌트를 수정하지 마라.
- `lib/openai-client.ts`를 수정하지 마라.
- 다른 API endpoint나 인증 방식을 변경하지 마라.
