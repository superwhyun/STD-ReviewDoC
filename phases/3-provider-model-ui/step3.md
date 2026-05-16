# Step 3: provider-select

## 읽어야 할 파일
- `components/documents/document-upload-section.tsx`

## 모듈 할당
- module: `provider-select`
- owned_paths: `components/documents/document-upload-section.tsx`
- forbidden_paths: `.git/`, `node_modules/`, `.next/`, `app/admin/**`, `components/admin/**`, `components/settings/**`

## 계약 및 베이스라인
- 문서 업로드 페이지에 provider 선택 dropdown 추가
- 기본값: settings의 active provider
- 선택된 provider로 `createProvider(providerType)` 호출

## 작업
1. provider dropdown UI 추가
2. `handleUpload`에서 선택된 providerType을 `createProvider(type)`에 전달
3. provider 미설정 시 에러 메시지

## Acceptance Criteria
```bash
npm run typecheck --prefix projects/DraftReviewr && npm run build --prefix projects/DraftReviewr
```

## 검증 절차
1. typecheck/build 실행
2. provider 선택 dropdown 존재 확인

## 금지사항
- settings 페이지 수정 금지
