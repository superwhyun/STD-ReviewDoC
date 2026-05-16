# Step 4: verification-tooling

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `/AGENTS.md`
- `/docs/HARNESS.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `projects/DraftReviewr/phases/project-manifest.json`
- `projects/DraftReviewr/phases/baselines/0-onboarding.json`
- `projects/DraftReviewr/phases/1-mvp-hardening/module-map.json`
- `projects/DraftReviewr/phases/1-mvp-hardening/step3-output.json`
- `projects/DraftReviewr/package.json`
- `projects/DraftReviewr/tsconfig.json`
- `projects/DraftReviewr/next.config.mjs`

## 모듈 할당

- module: `verification-tooling`
- owned_paths:
  - `projects/DraftReviewr/package.json`
  - `projects/DraftReviewr/tsconfig.json`
  - `projects/DraftReviewr/next.config.mjs`
  - `projects/DraftReviewr/phases/1-mvp-hardening/step4-output.json`
- read_contracts:
  - `projects/DraftReviewr/phases/1-mvp-hardening/step1-output.json`
  - `projects/DraftReviewr/phases/1-mvp-hardening/step2-output.json`
  - `projects/DraftReviewr/phases/1-mvp-hardening/step3-output.json`
- forbidden_paths:
  - `projects/DraftReviewr/.git/`
  - `projects/DraftReviewr/node_modules/`
  - `projects/DraftReviewr/.next/`
  - `projects/DraftReviewr/app/**`
  - `projects/DraftReviewr/components/**`
  - `projects/DraftReviewr/lib/**`

## 계약 및 베이스라인

- 이 step은 검증 스크립트와 타입 검증 경계를 추가한다.
- phase 마감, baseline 작성, tag 생성은 Step 5에서 수행한다.
- 기존 `npm run build` 동작을 깨지 않는다.

## 작업

1. `package.json`에 현재 프로젝트에서 실행 가능한 최소 검증 스크립트를 추가한다. 우선순위는 `typecheck`, `build`, 필요 시 `verify` 조합이다.
2. Next build가 타입/린트를 의도적으로 skip한다면, 별도 명령으로 타입 검증을 수행할 수 있게 한다.
3. 기존 `npm run build` 동작을 깨지 않는다.
4. `step4-output.json`에 추가한 검증 명령, 한계, 다음 smoke 검증 진입 조건을 기록한다.

## Acceptance Criteria

```bash
python3 scripts/validate_phase.py 1-mvp-hardening --root projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
npm run typecheck --prefix projects/DraftReviewr
```

- [ ] `package.json`에 `typecheck`가 존재하고 통과한다.
- [ ] `package.json`의 기존 scripts를 깨지 않고 새 검증 script가 추가된다.

## 검증 절차

1. Acceptance Criteria 명령을 실행한다.
2. 추가한 검증 script가 실제로 실행 가능한지 확인한다.
3. `git status`로 변경 범위를 확인한다.
4. `phases/1-mvp-hardening/index.json` 과 `step4-output.json` 에 상태와 handoff를 기록한다.
5. phase 완료 처리는 Step 5에 넘긴다.

## 금지사항

- 구현 파일을 이 step에서 수정하지 마라.
- 대규모 테스트 프레임워크 도입은 별도 phase로 미뤄라.
- 기존 step을 renumber 하지 마라.
