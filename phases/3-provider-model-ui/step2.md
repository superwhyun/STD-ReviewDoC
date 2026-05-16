# Step 2: model-dropdown

## 읽어야 할 파일
- `components/settings/api-key-settings.tsx`, `lib/llm-provider.ts`

## 모듈 할당
- module: `model-dropdown`
- owned_paths: `components/settings/api-key-settings.tsx`
- forbidden_paths: `.git/`, `node_modules/`, `.next/`, `app/admin/**`, `components/admin/**`

## 계약 및 베이스라인
- Settings 페이지: provider 선택 시 해당 provider의 model 목록을 fetch하여 Select dropdown으로 표시
- Fetch 불가 시 기존 수동 입력 fallback
- Reasoning effort 설정 UI (OpenAI/Grok 전용)

## 작업
1. provider 선택 시 `provider.listModels()` 호출
2. model 필드를 Select dropdown으로 변경
3. reasoning toggle/select 추가

## Acceptance Criteria
```bash
npm run typecheck --prefix projects/DraftReviewr && npm run build --prefix projects/DraftReviewr
```

## 검증 절차
1. typecheck/build 실행
2. model dropdown이 provider별 model 목록을 표시하는지 확인

## 금지사항
- admin 페이지 수정 금지
