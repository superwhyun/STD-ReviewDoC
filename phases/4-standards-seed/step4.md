# Step 4: export — 전체 설정 단일 JSON 내보내기

## 읽어야 할 파일
- `phases/4-standards-seed/module-map.json`
- `lib/storage/local-storage.ts`
- `lib/storage/language-storage.ts`
- `components/export-import-dialog.tsx` (기존 export 구현 파악)
- `app/admin/page.tsx`

## 모듈 할당
- module: `export`
- owned_paths:
  - `lib/storage/settings-serializer.ts`
  - `components/export-import-dialog.tsx` (기존 파일 확장 또는 대체)
- read_contracts: `lib/types.ts`, `lib/storage/local-storage.ts`, `lib/storage/language-storage.ts`
- forbidden_paths: `.git/`, `node_modules/`, `.next/`, `public/**`, `lib/openai-client.ts`

## 계약 및 베이스라인

Export 결과물 포맷 (step0 contracts 참조):
```json
{
  "version": "1",
  "exported_at": "ISO8601",
  "language": "ko | en",
  "document_types": [
    {
      "id": "...", "name": "...", "description": "...",
      "review_items": [ { "id": "...", "name": "...", "prompt": "...", "order_index": 0 } ]
    }
  ],
  "common_review_items": [
    { "id": "...", "name": "...", "prompt": "...", "order_index": 0 }
  ]
}
```
- 파일명: `draftreviewr-settings-{YYYY-MM-DD}.json`
- 기존 export-import-dialog.tsx가 이 포맷과 다른 방식으로 구현되어 있다면, 신규 포맷으로 **통합**한다 (기존 기능 삭제 금지, 포맷 업그레이드)

## 작업

### 1. `lib/storage/settings-serializer.ts` 생성
```ts
export function exportSettings(): SettingsExport { ... }
// localStorage에서 document_types + review_items(각 타입별) + common_review_items + language를 읽어 단일 객체로 조립
```

### 2. 관리자 UI에 Export 버튼 연결
- 기존 `components/export-import-dialog.tsx`를 확인하여:
  - 기존 export가 신규 포맷과 동일하면 `exportSettings()` 함수만 연결
  - 포맷이 다르면 신규 포맷으로 통합 (기존 기능 유지하며 포맷 업그레이드)
- 버튼 클릭 → `exportSettings()` 호출 → JSON blob 생성 → `draftreviewr-settings-{date}.json`으로 다운로드

## 검증 절차
1. typecheck, build AC 실행
2. `lib/storage/settings-serializer.ts`에 `exportSettings()` 함수 존재 확인
3. 관리자 화면 Export 버튼 연결 확인
4. `owned_paths` 외 파일 변경 없음 확인
5. `step4-output.json`에 handoff 기록

## Acceptance Criteria
```bash
npm run typecheck --prefix projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
```
- `lib/storage/settings-serializer.ts` 파일이 존재한다
- 관리자 화면에서 Export 버튼이 동작한다 (build 통과로 간접 검증)

## 금지사항
- 기존 export-import-dialog.tsx 전체 삭제 금지 — 기존 기능은 유지하며 포맷만 통합
- API key, 문서 이력(review results)은 export 대상에서 제외 (설정만 export)
