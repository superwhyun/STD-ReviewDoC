# Step 1: list-models

## 읽어야 할 파일
- `lib/llm-provider.ts`, `lib/types.ts`, `lib/providers/openai.ts`

## 모듈 할당
- module: `list-models`
- owned_paths: `lib/providers/*.ts`, `lib/llm-provider.ts`, `lib/types.ts`
- forbidden_paths: `.git/`, `node_modules/`, `.next/`, `app/**`, `components/**`

## 계약 및 베이스라인
- 모든 provider에 `listModels()` 구현
- OpenAI/Grok에 `reasoning` 파라미터 지원

## 작업
1. `LLMProviderConfig`에 `reasoning` 필드 추가
2. `LLMProvider` 인터페이스에 `listModels()` 추가
3. 모든 4개 provider에 `listModels()` 구현
4. OpenAI/Grok provider의 review/reviewStream에 reasoning 전달

## Acceptance Criteria
```bash
npm run typecheck --prefix projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
```

## 검증 절차
1. typecheck/build 실행
2. 4개 provider 모두 listModels 존재 확인

## 금지사항
- UI 컴포넌트 수정 금지
