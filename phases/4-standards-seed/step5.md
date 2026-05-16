# Step 5: import — 단일 JSON 파일 가져오기 (전체 교체)

## 읽어야 할 파일
- `phases/4-standards-seed/module-map.json`
- `lib/storage/settings-serializer.ts` (step4 산출물, import 포맷 확인)
- `lib/storage/local-storage.ts`
- `components/export-import-dialog.tsx`

## 모듈 할당
- module: `import`
- owned_paths:
  - `lib/storage/settings-serializer.ts` (importSettings 함수 추가)
  - `components/export-import-dialog.tsx` (import UI 연결)
- read_contracts: `lib/types.ts`, `lib/storage/local-storage.ts`, `lib/storage/language-storage.ts`
- forbidden_paths: `.git/`, `node_modules/`, `.next/`, `public/**`, `lib/openai-client.ts`, `app/**`

## 계약 및 베이스라인

- Import는 **전체 교체** 방식이다:
  1. localStorage에서 document_types, review_items, common_review_items 전체 삭제
  2. import JSON의 값으로 재삽입
  3. language 설정도 import JSON에 포함된 경우 덮어쓴다
- JSON 스키마 검증: `version` 필드가 없거나 필수 키가 누락된 경우 import 거부, toast 에러
- API key, 문서 이력은 import 대상이 아니므로 건드리지 않는다

## 작업

### 1. `lib/storage/settings-serializer.ts`에 `importSettings()` 추가
```ts
export function importSettings(json: unknown): void {
  // 1. 스키마 검증 (version, document_types, common_review_items 키 존재 확인)
  // 2. document_types, review_items, common_review_items localStorage 전체 삭제
  // 3. import 데이터로 재삽입
  // 4. language 설정 반영 (포함된 경우)
  // 5. 실패 시 Error throw
}
```

### 2. `components/export-import-dialog.tsx` 수정
- 기존 import 구현이 있다면:
  - 포맷이 신규와 동일하면 `importSettings()` 함수만 연결
  - 다르면 신규 포맷으로 통합 (기존 기능 유지하며 포맷 업그레이드)
- 파일 input → FileReader → JSON.parse → `importSettings()` 호출
- 성공: toast("설정을 가져왔습니다. 페이지를 새로고침합니다"), `window.location.reload()`
- 실패: toast.error("올바른 설정 파일이 아닙니다")

## 검증 절차
1. typecheck, build AC 실행
2. `settings-serializer.ts`에 `importSettings()` 함수 존재 확인
3. export → import 왕복 시 데이터 일치 여부 확인 (수동 테스트)
4. 잘못된 JSON 파일 import 시 에러 toast 동작 확인
5. `owned_paths` 외 파일 변경 없음 확인
6. `step5-output.json`에 handoff 기록

## Acceptance Criteria
```bash
npm run typecheck --prefix projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
```
- `settings-serializer.ts`에 `importSettings` 함수가 있다
- 관리자 화면에서 Import 버튼이 동작한다 (build 통과로 간접 검증)

## 금지사항
- partial import 금지 — 전체 교체만 지원
- API key, review_results, documents localStorage 키 수정 금지
- import 실패 시 기존 데이터를 손상시키지 않도록 원자성 보장 (삭제 전 검증 완료 후 교체)
