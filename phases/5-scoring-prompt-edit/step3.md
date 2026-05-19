# Step 3: prompt-edit-in-results — 결과 화면 내 검토 프롬프트 인라인 편집

## 읽어야 할 파일

- `phases/5-scoring-prompt-edit/module-map.json`
- `lib/types.ts` — ReviewItem, CommonReviewItem 타입 확인
- `lib/storage/local-storage.ts` — reviewItemStorage.update, commonReviewItemStorage.update 인터페이스 확인
- 구현 파악이 필요한 경우에만 targeted read:
  - `components/documents/document-review-dialog.tsx` (step2 완료 상태)

이전 step의 구현 파일을 기본 입력으로 삼지 마라.

## 모듈 할당

- module: `prompt-edit-in-results`
- owned_paths:
  - `components/documents/document-review-dialog.tsx`
- read_contracts:
  - `lib/types.ts` (ReviewItem, CommonReviewItem — 수정 금지)
  - `lib/storage/local-storage.ts` (reviewItemStorage, commonReviewItemStorage 인터페이스 — 수정 금지)
- forbidden_paths:
  - `lib/providers/*.ts` (step1 소유)
  - `lib/openai-client.ts` (step1 소유)
  - `lib/types.ts` (수정 금지)
  - `lib/storage/local-storage.ts` (수정 금지)
  - `app/`

## 계약 및 베이스라인

- 이 step은 step0의 `lib/types.ts`(ReviewItem, CommonReviewItem)와 `lib/storage/local-storage.ts`의 update 인터페이스를 contract로 사용한다.
- step2가 완료한 `document-review-dialog.tsx`를 기반으로 확장한다. 기존 score badge는 유지한다.
- contract가 부족하거나 틀려 AC를 통과할 수 없으면 현재 step을 `blocked`로 기록하고 `blocking-fix` step을 append한다.
- 현재 step을 막지 않는 개선사항은 phase 마지막에 `backlog-fix` step으로 append한다.

## 작업

### 1. 편집 상태 관리

`DocumentReviewDialog` 컴포넌트 안에 편집 상태를 관리한다.

```typescript
// 현재 편집 중인 result의 id (null이면 편집 중 없음)
const [editingId, setEditingId] = useState<string | null>(null)
// 편집 중인 프롬프트 텍스트 (초기값 = 기존 prompt)
const [editingPrompt, setEditingPrompt] = useState<string>("")
```

카드 1개만 편집 모드를 열 수 있다. 다른 카드 편집 버튼 클릭 시 이전 편집은 취소(discard)된다.

### 2. 편집 버튼 (연필 아이콘)

각 결과 카드의 프롬프트 표시 영역(`CardDescription`) 바로 우측 또는
`CardHeader` 내 기존 버튼 영역에 연필 아이콘 버튼을 추가한다.

- 아이콘: `lucide-react`의 `Pencil` (이미 프로젝트에 설치되어 있음)
- 버튼: `variant="ghost" size="icon"` (기존 admin 패턴과 동일)
- 클릭 시:
  1. `setEditingId(result.id)`
  2. `setEditingPrompt(item?.prompt ?? "")`

### 3. 인라인 편집 모드 렌더링

해당 카드가 편집 모드(`editingId === result.id`)일 때:

- 기존 `CardDescription`(프롬프트 텍스트 표시)를 **숨기고**
- 그 자리에 `<Textarea>` 를 렌더링한다.
  - `value={editingPrompt}`
  - `onChange={(e) => setEditingPrompt(e.target.value)}`
  - `rows={4}` 또는 적당한 초기 높이
- Textarea 아래에 "저장" / "취소" 버튼을 나란히 배치한다.

### 4. 저장 처리

"저장" 버튼 클릭 시:

```typescript
const handleSavePrompt = (result: ReviewResultWithItem) => {
  const item = result.common_review_items || result.review_items
  if (!item || editingPrompt.trim() === "") return

  if (result.common_review_item_id) {
    commonReviewItemStorage.update(item.id, { prompt: editingPrompt.trim() })
  } else if (result.review_item_id) {
    reviewItemStorage.update(item.id, { prompt: editingPrompt.trim() })
  }

  // 로컬 results 상태도 즉시 반영 (리로드 없이 UI 업데이트)
  setResults((prev) =>
    prev.map((r) =>
      r.id === result.id
        ? {
            ...r,
            common_review_items: r.common_review_items
              ? { ...r.common_review_items, prompt: editingPrompt.trim() }
              : undefined,
            review_items: r.review_items
              ? { ...r.review_items, prompt: editingPrompt.trim() }
              : undefined,
          }
        : r
    )
  )

  setEditingId(null)
  setEditingPrompt("")
}
```

### 5. 취소 처리

"취소" 버튼 클릭 시:
- `setEditingId(null)`
- `setEditingPrompt("")`
- 기존 프롬프트 복원 (results 상태 변경 없음)

### 편집 UI 레이아웃 (프롬프트 영역)

```
비편집 모드:
  [프롬프트 텍스트] [연필 아이콘]

편집 모드:
  [Textarea — 기존 프롬프트 내용 prefill]
  [저장] [취소]
```

결과(result) 텍스트(마크다운 영역)는 편집 모드에서도 변경하지 않는다.
프롬프트만 편집 대상이다.

## Acceptance Criteria

```bash
# 1. TypeScript 타입 오류 없음
npm run typecheck --prefix projects/STD-ReviewDoC

# 2. 빌드 성공
npm run build --prefix projects/STD-ReviewDoC

# 3. Pencil 아이콘 임포트 확인
grep "Pencil" projects/STD-ReviewDoC/components/documents/document-review-dialog.tsx

# 4. 저장 함수 존재 확인
grep "handleSavePrompt\|commonReviewItemStorage.update\|reviewItemStorage.update" \
  projects/STD-ReviewDoC/components/documents/document-review-dialog.tsx

# 5. phase 검증
python3 scripts/validate_phase.py 5-scoring-prompt-edit --root projects/STD-ReviewDoC
```

## 검증 절차

1. `npm run typecheck --prefix projects/STD-ReviewDoC` → 오류 0개.
2. `npm run build --prefix projects/STD-ReviewDoC` → 빌드 성공.
3. `grep "Pencil"` → 존재 확인.
4. `grep "handleSavePrompt"` → 존재 확인.
5. `python3 scripts/validate_phase.py 5-scoring-prompt-edit --root projects/STD-ReviewDoC` → 통과.
6. `owned_paths` 밖의 파일이 변경되지 않았는지 `git diff --name-only` 확인.
7. `phases/5-scoring-prompt-edit/index.json`의 step3 상태를 `completed`로 업데이트.
8. phase 마감: `phases/index.json`의 phase5 상태를 `completed`로 업데이트.
10. phase 마감: `phases/baselines/5-scoring-prompt-edit.json` 작성.
11. phase 마감: `git tag STD-ReviewDoC-phase5-done` (프로젝트 git repo 안에서).

## 금지사항

- `result.result`(마크다운 검토 결과)를 편집하는 기능을 추가하지 마라.
- 편집 저장 후 전체 `fetchResults()`를 재호출하지 마라. 로컬 상태만 업데이트한다.
- `lib/providers/*.ts`, `lib/openai-client.ts` 를 수정하지 마라 (step1 소유).
- `lib/types.ts` 를 수정하지 마라 (step0 소유).
- `lib/storage/local-storage.ts` 인터페이스를 변경하지 마라.
