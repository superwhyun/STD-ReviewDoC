# Step 0: hardening-contracts

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `/AGENTS.md`
- `/docs/HARNESS.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `projects/DraftReviewr/phases/index.json`
- `projects/DraftReviewr/phases/project-manifest.json`
- `projects/DraftReviewr/phases/baselines/0-onboarding.json`
- `projects/DraftReviewr/phases/1-mvp-hardening/index.json`
- `projects/DraftReviewr/phases/1-mvp-hardening/module-map.json`

이전 phase의 구현 전체를 다시 읽지 마라. 먼저 baseline, project manifest, module-map을 기준으로 phase 범위가 현재 요구사항을 충분히 덮는지 확인하라.

## 모듈 할당

- module: `hardening-contracts`
- owned_paths:
  - `projects/DraftReviewr/phases/1-mvp-hardening/module-map.json`
  - `projects/DraftReviewr/phases/1-mvp-hardening/step0-output.json`
  - `projects/DraftReviewr/phases/project-manifest.json`
- read_contracts:
  - `projects/DraftReviewr/phases/baselines/0-onboarding.json`
  - `projects/DraftReviewr/phases/project-manifest.json`
  - `projects/DraftReviewr/phases/1-mvp-hardening/index.json`
- forbidden_paths:
  - `projects/DraftReviewr/.git/`
  - `projects/DraftReviewr/node_modules/`
  - `projects/DraftReviewr/.next/`
  - `projects/DraftReviewr/app/**`
  - `projects/DraftReviewr/components/**`
  - `projects/DraftReviewr/lib/**`

## 계약 및 베이스라인

- 이 phase는 `phases/baselines/0-onboarding.json`을 입력 기준선으로 삼는다.
- Step 0에서는 구현 파일을 수정하지 않는다.
- phase 범위가 부족하면 기존 step을 renumber 하지 말고 새 step을 append한다.
- 현재 phase를 막지 않는 개선사항은 `deferred_backlog`에 남긴다.

## 작업

1. `1-mvp-hardening/module-map.json`이 발견된 리스크를 모두 덮는지 확인한다.
2. 각 step의 `owned_paths`, `read_contracts`, `forbidden_paths`가 충돌하지 않는지 확인한다.
3. `project-manifest.json`의 `active_phase`를 이 phase로 갱신하고, phase 목적과 known risk를 기록한다.
4. `step0-output.json`에 phase 범위 확정, 제외 범위, 다음 step 진입 조건을 남긴다.

## Acceptance Criteria

```bash
python3 scripts/validate_phase.py 1-mvp-hardening --root projects/DraftReviewr
if rg "replace[-]with" projects/DraftReviewr/phases/1-mvp-hardening; then exit 1; else true; fi
```

- [ ] placeholder marker 검색 명령은 결과가 없어야 한다.
- [ ] `phases/1-mvp-hardening/module-map.json`의 모든 contract 경로가 존재하거나 해당 step에서 생성 예정인 owned path로 명시되어 있다.
- [ ] 구현 파일이 수정되지 않았다.

## 검증 절차

1. Acceptance Criteria 명령을 실행한다.
2. 결과를 확인한다.
3. `owned_paths` 밖의 구현 파일이 변경되지 않았는지 확인한다.
4. `phases/1-mvp-hardening/index.json` 과 `step0-output.json` 에 상태와 handoff를 기록한다.

## 금지사항

- 구현 파일을 수정하지 마라.
- phase scope를 넓히기 위해 기존 step 번호를 바꾸지 마라.
- 다음 세션을 위한 handoff 없이 종료하지 마라.
