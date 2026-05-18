# Step 4: blocking-fix-score-storage-contract — score 저장 계약 연결

## 배경

`step1-llm-score-output`은 LLM 응답에서 `SCORE:`를 파싱한 뒤 review result 저장 시 `score`를 포함해야 한다.
하지만 현재 계약은 아래 이유로 step1 소유 파일만으로 완료할 수 없다.

- `lib/llm-provider.ts`의 provider `ReviewResult` 타입에 `score` 필드가 없다.
- `lib/storage/local-storage.ts`의 `reviewResultStorage.create()` 입력 타입에 `score` 필드가 없다.
- `components/documents/document-upload-section.tsx`가 provider/legacy 결과를 저장 형식으로 매핑할 때 `score`를 전달하지 않는다.

## 읽어야 할 파일

- `lib/types.ts` — step0에서 추가한 `ReviewResult.score` public contract
- `lib/llm-provider.ts` — provider review result contract
- `lib/storage/local-storage.ts` — `reviewResultStorage.create()` 저장 contract
- `components/documents/document-upload-section.tsx` — provider/legacy 결과를 저장 형식으로 매핑하는 호출부

## 모듈 할당

- module: `score-storage-contract`
- type: `blocking-fix`
- unblocks: `step1-llm-score-output`
- owned_paths:
  - `lib/llm-provider.ts`
  - `lib/storage/local-storage.ts`
  - `components/documents/document-upload-section.tsx`
- read_contracts:
  - `lib/types.ts`
- forbidden_paths:
  - `lib/providers/*.ts`
  - `lib/openai-client.ts`

## 계약 및 베이스라인

- 이 step은 step1을 막는 contract 부족을 해소하는 `blocking-fix`다.
- `lib/types.ts`의 `ReviewResult.score?: number`는 이미 확정된 public contract이며 수정하지 않는다.
- provider별 SCORE 지시와 파싱은 step1에서 처리한다.
- 이 step 완료 후 step1은 다시 `pending` 상태가 되어야 한다.

## 작업

1. `lib/llm-provider.ts`
   - provider `ReviewResult`에 `score?: number`를 추가한다.

2. `lib/storage/local-storage.ts`
   - `reviewResultStorage.create()` 입력 타입에 `score?: number`를 추가한다.
   - 생성되는 `ReviewResult`에 `score: data.score`를 포함한다.
   - 기존 저장 데이터와 하위 호환을 유지한다.

3. `components/documents/document-upload-section.tsx`
   - provider 결과를 저장 형식으로 매핑할 때 `score: pr.score`를 포함한다.
   - fallback `processDocumentReview()` 결과도 같은 저장 형식 타입을 사용하도록 `score?: number`를 허용한다.
   - `reviewResultStorage.create()` 호출에 `score: result.score`를 전달한다.

4. 완료 후 `phases/5-scoring-prompt-edit/index.json`
   - step4를 `completed`로 업데이트한다.
   - step1을 다시 `pending`으로 돌리고 `blocked_by`를 제거한다.

## Acceptance Criteria

```bash
npm run typecheck --prefix projects/STD-ReviewDoC
python3 scripts/validate_phase.py 5-scoring-prompt-edit --root projects/STD-ReviewDoC
```

## 검증 절차

1. `npm run typecheck --prefix projects/STD-ReviewDoC` 실행.
2. `python3 scripts/validate_phase.py 5-scoring-prompt-edit --root projects/STD-ReviewDoC` 실행.
3. `phases/5-scoring-prompt-edit/index.json`에서 step4가 `completed`, step1이 `pending`인지 확인.
4. `step4-output.json` handoff를 작성한다.

## 금지사항

- provider별 SCORE 프롬프트/파싱 구현은 이 step에 섞지 마라. 그것은 step1 소유다.
- `lib/openai-client.ts`를 수정하지 마라. step1 소유다.
