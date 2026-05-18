# Step 0: score-schema — 타입 확장 및 모듈맵 확정

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `phases/baselines/4-standards-seed.json` — 이전 phase baseline
- `phases/5-scoring-prompt-edit/module-map.json` — 이 phase 모듈 경계
- `lib/types.ts` — 현재 타입 정의 (ReviewResult 포함)
- `lib/storage/local-storage.ts` — reviewResultStorage 인터페이스 확인

이전 step의 구현 파일이나 긴 handoff를 기본 입력으로 삼지 마라.
baseline, module-map, public contract를 먼저 읽고, AC 달성에 꼭 필요한 경우에만 구현을 제한적으로 읽어라.

## 모듈 할당

- module: `score-schema`
- owned_paths:
  - `phases/5-scoring-prompt-edit/module-map.json`
  - `lib/types.ts`
- read_contracts:
  - `lib/storage/local-storage.ts` (reviewResultStorage 인터페이스 파악용 — 수정 금지)
- forbidden_paths:
  - `lib/providers/*.ts`
  - `lib/openai-client.ts`
  - `components/`
  - `app/`

## 계약 및 베이스라인

- 이 phase의 baseline은 `phases/baselines/4-standards-seed.json`이다.
- `lib/types.ts`는 이 step이 소유하는 public contract다. 변경 후 step1~3이 이를 기준으로 사용한다.
- `lib/storage/local-storage.ts`는 읽기 전용 참조다. 수정하지 마라.
- contract가 부족하거나 틀려 AC를 통과할 수 없으면 현재 step을 `blocked`로 기록하고 `blocking-fix` step을 append한다.
- 현재 step을 막지 않는 개선사항은 phase 마지막에 `backlog-fix` step으로 append한다.

## 작업

### 1. `lib/types.ts` — ReviewResult에 score 필드 추가

`ReviewResult` 인터페이스에 아래 필드를 추가한다.

```typescript
export interface ReviewResult {
  id: string
  document_id: string
  review_item_id: string | null
  common_review_item_id: string | null
  result: string
  score?: number          // 0~100, LLM이 출력한 점수. 없으면 표시 생략.
  created_at: string
}
```

score 범위는 0~100 정수이며, LLM이 10점 단위로 반환하도록 step1에서 유도한다.
`score`는 optional(`?`)로 선언하여 기존 결과 데이터와 하위 호환을 유지한다.

### 2. `phases/5-scoring-prompt-edit/module-map.json` — placeholder 제거 확인

scaffold가 생성한 `{replace-with-...}` placeholder가 모두 실제 경로로 채워졌는지 확인한다.
이 step 실행 전에 이미 module-map.json을 작성했다면 placeholder 잔존 여부를 grep으로 확인한다.

```bash
grep -r "replace-with" projects/STD-ReviewDoC/phases/5-scoring-prompt-edit/module-map.json
```

잔존하면 해당 항목을 채운다.

## Acceptance Criteria

```bash
# 1. TypeScript 타입 오류 없음
npm run typecheck --prefix projects/STD-ReviewDoC

# 2. placeholder 없음
grep -r "replace-with" projects/STD-ReviewDoC/phases/5-scoring-prompt-edit/module-map.json
# → 출력 없어야 함

# 3. ReviewResult에 score 필드 존재
grep "score" projects/STD-ReviewDoC/lib/types.ts
# → "score?: number" 포함된 줄이 보여야 함
```

## 검증 절차

1. `npm run typecheck --prefix projects/STD-ReviewDoC` 실행 → 오류 0개 확인.
2. `grep "replace-with" projects/STD-ReviewDoC/phases/5-scoring-prompt-edit/module-map.json` → 출력 없음 확인.
3. `owned_paths` 밖의 파일이 변경되지 않았는지 `git diff --name-only` 로 확인.
4. `phases/5-scoring-prompt-edit/index.json`의 step0 상태를 `completed`로 업데이트.
5. `step0-output.json` handoff 작성.

## 금지사항

- `lib/providers/*.ts`, `lib/openai-client.ts` 를 수정하지 마라 (step1 소유).
- `components/` 아래 파일을 수정하지 마라 (step2·3 소유).
- score 색상 로직이나 UI를 이 step에 섞지 마라.
- handoff 없이 종료하지 마라.
