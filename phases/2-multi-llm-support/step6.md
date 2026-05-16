# Step 6: integration

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `/AGENTS.md`
- `/docs/HARNESS.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `projects/DraftReviewr/phases/project-manifest.json`
- `projects/DraftReviewr/phases/baselines/1-mvp-hardening.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/module-map.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/step5-output.json`
- `projects/DraftReviewr/lib/llm-provider.ts`
- `projects/DraftReviewr/lib/storage/local-storage.ts`
- `projects/DraftReviewr/components/documents/document-upload-section.tsx`

## 모듈 할당

- module: `integration`
- owned_paths:
  - `projects/DraftReviewr/components/documents/document-upload-section.tsx`
  - `projects/DraftReviewr/lib/storage/local-storage.ts`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step6-output.json`
- read_contracts:
  - `projects/DraftReviewr/lib/llm-provider.ts`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step5-output.json`
- forbidden_paths:
  - `projects/DraftReviewr/.git/`
  - `projects/DraftReviewr/node_modules/`
  - `projects/DraftReviewr/.next/`
  - `projects/DraftReviewr/app/admin/**`
  - `projects/DraftReviewr/components/admin/**`
  - `projects/DraftReviewr/components/settings/**`

## 계약 및 베이스라인

- `document-upload-section.tsx`의 `handleUpload()`가 활성 provider를 읽어 `createProvider()`로 인스턴스를 생성한다.
- Provider가 없으면 기존 OpenAI `processDocumentReview()`로 fallback한다.
- Streaming provider의 경우 `onToken` callback으로 실시간 진행 텍스트를 표시한다.
- 기존 문서 히스토리 및 검토 결과 저장 흐름은 유지한다.

## 작업

1. `document-upload-section.tsx`에서 `createProvider()`를 import하고 활성 provider를 읽는다.
2. `handleUpload()`에서 `processDocumentReview` 대신 `provider.review()`를 사용하도록 변경한다.
3. Streaming provider의 경우 `provider.reviewStream()`을 사용해 `onToken` callback으로 실시간 토큰을 표시한다.
4. Provider가 설정되지 않은 경우 적절한 에러 메시지를 표시한다.
5. Provider 변경 시 기존 문서 히스토리와의 호환성을 유지한다.

## Acceptance Criteria

```bash
python3 scripts/validate_phase.py 2-multi-llm-support --root projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
npm run typecheck --prefix projects/DraftReviewr
```

- [ ] 설정된 provider로 문서 리뷰가 실행된다.
- [ ] Streaming provider에서 실시간 토큰 출력이 UI에 반영된다.
- [ ] Provider가 설정되지 않은 경우 적절한 에러 메시지가 표시된다.
- [ ] 기존 OpenAI-only 흐름이 fallback으로 작동한다.

## 검증 절차

1. Acceptance Criteria 명령을 실행한다.
2. `document-upload-section.tsx`가 `lib/llm-provider.ts`를 import하는지 확인한다.
3. `owned_paths` 밖의 구현 파일이 변경되지 않았는지 확인한다.
4. `phases/2-multi-llm-support/index.json` 과 `step6-output.json` 에 상태와 handoff를 기록한다.

## 금지사항

- 관리자 페이지를 수정하지 마라.
- `lib/openai-client.ts`를 직접 호출하는 새 코드를 추가하지 마라 (llm-provider를 통할 것).
- 문서 리뷰 결과 저장 로직을 변경하지 마라.
