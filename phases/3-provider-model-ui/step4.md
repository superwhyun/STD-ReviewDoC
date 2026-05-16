# Step 4: phase-close

## 읽어야 할 파일
- `phases/index.json`, `phases/project-manifest.json`

## 모듈 할당
- module: `phase-close`
- owned_paths: `phases/index.json`, `phases/baselines/3-provider-model-ui.json`
- forbidden_paths: `.git/`, `node_modules/`, `.next/`, `app/**`, `components/**`, `lib/**`

## 계약 및 베이스라인
- Phase 마감: baseline 작성, 상태 동기화, tag 생성

## 작업
1. verification 실행 (typecheck, build, validate)
2. baseline 작성
3. tag `draft-reviewer-phase3-done`

## Acceptance Criteria
```bash
npm run typecheck --prefix projects/DraftReviewr && npm run build --prefix projects/DraftReviewr
```

## 검증 절차
1. 모든 AC 실행
2. route smoke 확인
3. tag 생성

## 금지사항
- 구현 파일 수정 금지
