# Step 6: review-result-width — 검토 결과 화면 2배 넓게

## 읽어야 할 파일
- `phases/4-standards-seed/module-map.json`
- `components/` 디렉터리 탐색 → 검토 결과를 표시하는 Dialog/Modal/Sheet 컴포넌트 찾기
- `app/page.tsx` (결과 표시 위치 파악)

## 모듈 할당
- module: `review-result-width`
- owned_paths:
  - 검토 결과 Dialog 컴포넌트 파일 (step 시작 전 실제 파일명 확인 필요)
- read_contracts: `lib/types.ts`
- forbidden_paths: `.git/`, `node_modules/`, `.next/`, `public/**`, `lib/**`, `app/admin/**`, `app/settings/**`

## 계약 및 베이스라인
- 변경 대상: 검토 결과 표시 컴포넌트의 너비 CSS 클래스만
- 현재 너비 클래스를 확인하고 2배 값으로 변경한다
- 데이터 흐름, 상태 관리, 로직은 건드리지 않는다

## 작업

### 1. 검토 결과 컴포넌트 찾기
- `components/` 하위에서 review result, result dialog, document review 관련 컴포넌트 파악
- `app/page.tsx`에서 결과 표시 방식 확인 (Dialog, Sheet, 인라인 등)

### 2. 너비 확장
현재 너비 클래스를 확인 후:
- Dialog 방식이면: `max-w-*` 클래스를 현재의 2배 값으로 변경
  - 예: `max-w-2xl` → `max-w-4xl`, `max-w-3xl` → `max-w-6xl`, `max-w-lg` → `max-w-3xl`
- Sheet 방식이면: `w-*` 또는 `max-w-*`를 현재의 2배로 변경
- 반응형 고려: 작은 화면에서 넘치지 않도록 `w-full` 또는 `sm:max-w-*` 조합 사용

### 3. 내용 레이아웃 확인
- 너비가 넓어졌을 때 내용이 지나치게 길게 늘어지지 않는지 확인
- 필요하면 2컬럼 레이아웃 또는 max-w를 적절히 조정

## 검증 절차
1. typecheck, build AC 실행
2. 변경된 컴포넌트 파일을 git diff로 확인 — 너비 클래스만 변경되었는지 검토
3. `owned_paths` 외 파일 변경 없음 확인
4. `step6-output.json`에 변경된 파일 경로와 변경 전/후 클래스명 기록

## Acceptance Criteria
```bash
npm run typecheck --prefix projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
```
- 검토 결과 컴포넌트의 너비 관련 CSS 클래스가 변경되어 있다
- 변경된 컴포넌트 파일 경로를 output.json에 기록한다

## 금지사항
- 검토 결과 컴포넌트 외의 다른 Dialog/Modal 너비 변경 금지
- 결과 표시 로직, 데이터 흐름 변경 금지
