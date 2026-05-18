# Step 2: score-display-ui — 검토 결과 화면에 점수 badge 표시

## 읽어야 할 파일

- `phases/5-scoring-prompt-edit/module-map.json`
- `lib/types.ts` — ReviewResult.score 타입 확인
- 구현 파악이 필요한 경우에만 targeted read:
  - `components/documents/document-review-dialog.tsx`

이전 step의 구현 파일이나 긴 handoff를 기본 입력으로 삼지 마라.

## 모듈 할당

- module: `score-display-ui`
- owned_paths:
  - `components/documents/document-review-dialog.tsx`
- read_contracts:
  - `lib/types.ts` (ReviewResult.score — 수정 금지)
- forbidden_paths:
  - `lib/providers/*.ts` (step1 소유)
  - `lib/openai-client.ts` (step1 소유)
  - `lib/types.ts` (수정 금지)
  - `lib/storage/local-storage.ts` (수정 금지)
  - `app/`

## 계약 및 베이스라인

- 이 step은 step0의 `lib/types.ts`(ReviewResult.score)와 step1의 score 저장 동작을 contract로 사용한다.
- `lib/types.ts`와 `lib/storage/local-storage.ts`는 읽기 전용 참조다. 수정하지 마라.
- contract가 부족하거나 틀려 AC를 통과할 수 없으면 현재 step을 `blocked`로 기록하고 `blocking-fix` step을 append한다.
- 현재 step을 막지 않는 개선사항은 phase 마지막에 `backlog-fix` step으로 append한다.

## 작업

### 1. 점수 색상 분기 함수

`document-review-dialog.tsx` 안에 아래 헬퍼를 추가한다.
컴포넌트 외부(파일 스코프)에 순수 함수로 선언한다.

```typescript
function getScoreBadgeClass(score: number): string {
  if (score >= 80) return "bg-green-500 text-white"
  if (score >= 50) return "bg-amber-400 text-black"
  return "bg-red-500 text-white"
}
```

### 2. 결과 카드 헤더에 score badge 추가

각 결과 카드 `CardTitle` 영역(item name 우측)에 score badge를 표시한다.

- `result.score`가 `undefined`이면 badge를 렌더링하지 않는다 (기존 결과 호환).
- badge는 `<span>` 또는 shadcn `<Badge>` 컴포넌트를 활용한다.
- 표시 텍스트: `{score}점`
- 위치: item name 바로 우측, 기존 "공통" badge 왼쪽에 배치.

레이아웃 예시:
```
[항목명]         [80점 ●green] [공통]  2026-01-01
```

### 3. 다이얼로그 상단 전체 평균 점수 요약

score가 있는 결과가 1개 이상 있을 때, 다이얼로그 헤더 아래(`DialogDescription` 바로 아래)에
전체 평균 점수를 한 줄로 표시한다.

- 평균 = `Math.round(score가 있는 항목들의 합계 / 개수)`
- 평균 점수도 동일한 색상 분기 적용.
- score가 있는 항목이 없으면 표시하지 않는다.

표시 예시:
```
전체 평균: 73점
```

### 색상 스펙 (확정)

| 점수 범위 | 배경 | 텍스트 | Tailwind 클래스 |
|----------|------|--------|----------------|
| 80 ~ 100 | 초록 | 흰색 | `bg-green-500 text-white` |
| 50 ~ 79 | 진한 노란색 | 검정 | `bg-amber-400 text-black` |
| 0 ~ 49 | 빨간색 | 흰색 | `bg-red-500 text-white` |

amber-400은 faded가 아닌 선명한 노란색이므로 `bg-yellow-*`를 사용하지 마라.

## Acceptance Criteria

```bash
# 1. TypeScript 타입 오류 없음
npm run typecheck --prefix projects/STD-ReviewDoC

# 2. 빌드 성공
npm run build --prefix projects/STD-ReviewDoC

# 3. 색상 함수 존재 확인
grep "getScoreBadgeClass" projects/STD-ReviewDoC/components/documents/document-review-dialog.tsx

# 4. amber-400 사용 확인 (yellow 미사용)
grep "amber-400" projects/STD-ReviewDoC/components/documents/document-review-dialog.tsx
```

## 검증 절차

1. `npm run typecheck --prefix projects/STD-ReviewDoC` → 오류 0개.
2. `npm run build --prefix projects/STD-ReviewDoC` → 빌드 성공.
3. `grep "getScoreBadgeClass"` → 존재 확인.
4. `grep "amber-400"` → 존재 확인.
5. `grep "bg-yellow"` → 출력 없음 확인 (yellow 계열 미사용).
6. `owned_paths` 밖의 파일이 변경되지 않았는지 `git diff --name-only` 확인.
7. `phases/5-scoring-prompt-edit/index.json`의 step2 상태를 `completed`로 업데이트.
8. `step2-output.json` handoff 작성.

## 금지사항

- `lib/providers/*.ts`, `lib/openai-client.ts` 를 수정하지 마라 (step1 소유).
- `lib/types.ts` 를 수정하지 마라 (step0 소유).
- `bg-yellow-*` 계열 클래스를 사용하지 마라. 진한 노란색은 `bg-amber-400`만 사용한다.
- score 없는 결과에 빈 badge를 렌더링하지 마라 (조건부 렌더링 필수).
- 프롬프트 편집 기능을 이 step에 섞지 마라 (step3 소유).
- handoff 없이 종료하지 마라.
