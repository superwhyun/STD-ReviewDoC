# Step 1: llm-score-output — LLM 응답에서 점수 추출 및 저장

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `phases/5-scoring-prompt-edit/module-map.json`
- `lib/types.ts` — ReviewResult.score 필드 확인 (step0 완료 후)
- `lib/storage/local-storage.ts` — reviewResultStorage 저장 인터페이스 확인

구현 파악이 필요한 경우에만 targeted read:
- `lib/providers/openai.ts`
- `lib/providers/grok.ts`
- `lib/providers/openrouter.ts`
- `lib/providers/kimi.ts`
- `lib/openai-client.ts`

이전 step의 구현 파일이나 긴 handoff를 기본 입력으로 삼지 마라.

## 모듈 할당

- module: `llm-score-output`
- owned_paths:
  - `lib/providers/openai.ts`
  - `lib/providers/grok.ts`
  - `lib/providers/openrouter.ts`
  - `lib/providers/kimi.ts`
  - `lib/openai-client.ts`
- read_contracts:
  - `lib/types.ts` (ReviewResult.score 타입 — 수정 금지)
  - `lib/storage/local-storage.ts` (reviewResultStorage 인터페이스 — 수정 금지)
- forbidden_paths:
  - `lib/types.ts` (step0 소유)
  - `lib/storage/local-storage.ts` (수정 금지)
  - `components/`
  - `app/`

## 계약 및 베이스라인

- 이 step은 step0의 `lib/types.ts`(ReviewResult.score 필드)를 public contract로 사용한다.
- `lib/storage/local-storage.ts`는 읽기 전용 참조다. 인터페이스를 변경하지 마라.
- contract가 부족하거나 틀려 AC를 통과할 수 없으면 현재 step을 `blocked`로 기록하고 `blocking-fix` step을 append한다.
- 현재 step을 막지 않는 개선사항은 phase 마지막에 `backlog-fix` step으로 append한다.

## 작업

### 1. 시스템 프롬프트 수정

모든 provider(`openai.ts`, `grok.ts`, `openrouter.ts`, `kimi.ts`)와 레거시 폴백(`openai-client.ts`)의
시스템 프롬프트(system message)에 아래 지시를 추가한다.

```
응답 첫 줄은 반드시 아래 형식으로만 작성하시오:
SCORE: {점수}
점수는 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 중 하나의 정수이다.
판정 기준: 80~100은 기준 충족 수준, 50~70은 일부 개선 필요, 0~40은 중대한 문제 존재.
두 번째 줄부터 검토 내용을 작성하시오.
```

### 2. SCORE 파싱 함수

파일마다 중복 구현하지 말고, 적절한 위치(각 provider 파일 내 helper 또는 공유 util)에 아래 로직을 한 번만 구현한다.

```typescript
function parseScoreFromResult(raw: string): { score: number | undefined; result: string } {
  const firstLine = raw.split('\n')[0].trim()
  const match = firstLine.match(/^SCORE:\s*(\d+)$/)
  if (match) {
    const score = Math.min(100, Math.max(0, parseInt(match[1], 10)))
    const result = raw.slice(raw.indexOf('\n') + 1).trimStart()
    return { score, result }
  }
  return { score: undefined, result: raw }
}
```

### 3. score를 포함하여 저장

각 provider가 검토 결과를 저장하는 시점에 `score` 필드를 함께 포함한다.

- SSE 스트리밍 도중에는 파싱하지 않는다.
- **전체 응답이 완료된 후** `parseScoreFromResult`를 호출한다.
- `result`는 SCORE 줄을 제거한 나머지 텍스트로 저장한다.
- `score`를 파싱할 수 없으면 `score: undefined`로 저장한다 (기존 결과 하위 호환).

## Acceptance Criteria

```bash
# 1. TypeScript 타입 오류 없음
npm run typecheck --prefix projects/STD-ReviewDoC

# 2. 빌드 성공
npm run build --prefix projects/STD-ReviewDoC

# 3. 모든 provider에 SCORE 지시 포함 확인
grep -r "SCORE:" projects/STD-ReviewDoC/lib/providers/
grep "SCORE:" projects/STD-ReviewDoC/lib/openai-client.ts
```

## 검증 절차

1. `npm run typecheck --prefix projects/STD-ReviewDoC` → 오류 0개.
2. `npm run build --prefix projects/STD-ReviewDoC` → 빌드 성공.
3. `grep -r "SCORE:" projects/STD-ReviewDoC/lib/providers/` → 4개 파일 모두 출력.
4. `grep "SCORE:" projects/STD-ReviewDoC/lib/openai-client.ts` → 존재 확인.
5. `owned_paths` 밖의 파일이 변경되지 않았는지 `git diff --name-only` 확인.
6. `phases/5-scoring-prompt-edit/index.json`의 step1 상태를 `completed`로 업데이트.
7. `step1-output.json` handoff 작성.

## 금지사항

- SSE 스트리밍 도중 SCORE를 파싱하지 마라. 전체 응답 완료 후 파싱한다.
- `lib/types.ts` 를 수정하지 마라 (step0 소유).
- `lib/storage/local-storage.ts` 인터페이스를 변경하지 마라.
- `components/` 아래 파일을 수정하지 마라 (step2·3 소유).
- handoff 없이 종료하지 마라.
