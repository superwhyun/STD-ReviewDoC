# Step 7: phase-close — Phase 4 마감

## 읽어야 할 파일
- `phases/4-standards-seed/index.json` (모든 step 완료 확인)
- `phases/4-standards-seed/module-map.json`
- `phases/project-manifest.json`

## 모듈 할당
- module: `phase-close`
- owned_paths:
  - `phases/index.json`
  - `phases/project-manifest.json`
  - `phases/baselines/4-standards-seed.json`
  - `phases/4-standards-seed/index.json`
- forbidden_paths: `.git/`, `node_modules/`, `.next/`, `app/**`, `components/**`, `lib/**`, `public/**`

## 계약 및 베이스라인
- 모든 이전 step(0~6)이 completed 상태여야 한다
- baseline 파일은 다음 phase의 첫 번째 읽기 대상이 된다
- project-manifest.json은 이 phase의 산출물을 누적한다

## 검증 절차
1. `phases/4-standards-seed/index.json`의 모든 step이 completed인지 확인
2. typecheck, build, validate_phase AC 실행
3. git tag 생성 확인
4. `step7-output.json`에 최종 handoff 기록

## 작업

### 1. 최종 검증
```bash
npm run typecheck --prefix projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
```

### 2. phase index 상태 업데이트
- `phases/4-standards-seed/index.json` — step7 status → `completed`
- `phases/index.json` — 4-standards-seed 항목 추가 또는 status → `completed`

### 3. baseline 작성
`phases/baselines/4-standards-seed.json` 생성:
```json
{
  "schema_version": 1,
  "phase": "4-standards-seed",
  "tag": "draft-reviewer-phase4-done",
  "modules": [
    { "name": "seed-json-files", "paths": ["public/data/document-types/*.json", "public/data/common-review-items.json"] },
    { "name": "seed-loader", "paths": ["lib/storage/seed-loader.ts", "components/seed-initializer.tsx"] },
    { "name": "language-setting", "paths": ["lib/storage/language-storage.ts"] },
    { "name": "settings-serializer", "paths": ["lib/storage/settings-serializer.ts"] }
  ],
  "shared_contracts": [
    "lib/storage/seed-loader.ts",
    "lib/storage/language-storage.ts",
    "lib/storage/settings-serializer.ts",
    "public/data/document-types/itu-t-draft.json",
    "public/data/document-types/itu-t-contribution.json",
    "public/data/document-types/jtc1-draft.json",
    "public/data/document-types/jtc1-contribution.json",
    "public/data/common-review-items.json"
  ],
  "integration_points": [
    "app/layout.tsx (SeedInitializer)",
    "app/admin/page.tsx (기본값 초기화 버튼, Export/Import)",
    "app/settings/page.tsx (언어 선택)",
    "lib/openai-client.ts (언어 지시 주입)"
  ],
  "export_import_format": "version:1 — document_types + common_review_items + language 단일 JSON",
  "seed_files_location": "public/data/",
  "seed_reset_trigger": "관리자 UI '기본값으로 초기화' 버튼 → resetToSeedData()"
}
```

### 4. project-manifest.json 업데이트
- `status` → `standards-seed-completed`
- `active_phase` → null 또는 다음 phase
- `history` 배열에 phase 4 완료 항목 추가
- `modules` 배열에 신규 모듈 추가:
  - `seed-data`: public/data/ 아래 4개 문서타입 + 공통항목 JSON
  - `seed-loader`: 초기 로드 + 기본값 초기화
  - `language-setting`: 검토 결과 언어 설정
  - `settings-serializer`: export/import 직렬화

### 5. git tag
```bash
cd projects/DraftReviewr
git add -A
git commit -m "feat(draft-reviewer/step7): phase-close — standards seed phase complete"
git tag draft-reviewer-phase4-done
```

## Acceptance Criteria
```bash
npm run typecheck --prefix projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
python3 scripts/validate_phase.py 4-standards-seed --root projects/DraftReviewr
```
- `phases/baselines/4-standards-seed.json` 파일이 존재한다
- `phases/index.json`에 4-standards-seed가 `completed`로 기록되어 있다
- git tag `draft-reviewer-phase4-done`이 존재한다

## 금지사항
- 구현 파일 수정 금지
- 이미 completed된 step의 output.json 수정 금지
