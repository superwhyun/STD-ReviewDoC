# Step 6 (blocking-fix): fix-openai-response-type

## 읽어야 할 파일

- `projects/DraftReviewr/lib/openai-client.ts`
- `projects/DraftReviewr/phases/1-mvp-hardening/step4-output.json`

## 모듈 할당

- module: `blocking-fix-openai-type`
- owned_paths:
  - `projects/DraftReviewr/lib/openai-client.ts`
  - `projects/DraftReviewr/phases/1-mvp-hardening/step6-output.json`
- read_contracts:
  - `projects/DraftReviewr/lib/types.ts`
  - `projects/DraftReviewr/phases/1-mvp-hardening/step4-output.json`
- forbidden_paths:
  - `projects/DraftReviewr/.git/`
  - `projects/DraftReviewr/node_modules/`
  - `projects/DraftReviewr/.next/`
  - `projects/DraftReviewr/app/**`
  - `projects/DraftReviewr/components/**`

- unblocks: step 4

## 계약 및 베이스라인

- `ResponsesAPIResponse` 인터페이스에 `output_text` 속성이 없어 `reviewDocumentWithOpenAI()`에서 타입 오류 발생
- 이 함수는 `processDocumentReview()`에 비해 덜 사용되는 레거시 헬퍼 함수지만, public export이므로 타입 오류를 해결해야 함
- API 응답에서 실제 텍스트는 `output[0].content[0].text` 경로로 추출됨 (processDocumentReview 참조)

## 작업

1. `ResponsesAPIResponse` 인터페이스에 `output_text?: string` optional 속성을 추가한다.
2. `reviewDocumentWithOpenAI()`의 `data.output_text` 참조가 타입 호환되도록 한다.
3. 기존 `processDocumentReview()` 동작을 깨지 않는다.

## Acceptance Criteria

```bash
npm run typecheck --prefix projects/DraftReviewr
```

- [ ] `tsc --noEmit`가 오류 없이 통과한다.
- [ ] `npm run build`가 통과한다.

## 검증 절차

1. Acceptance Criteria 명령을 실행한다.
2. `lib/openai-client.ts`만 수정되었는지 확인한다.
3. `step6-output.json`을 작성하고 index.json을 갱신한다.
4. 이후 Step 4를 다시 `pending`으로 변경한다.

## 금지사항

- processDocumentReview()의 텍스트 추출 로직을 바꾸지 마라.
- 다른 파일을 수정하지 마라.
