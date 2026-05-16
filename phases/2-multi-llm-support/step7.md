# Step 7: phase-close

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `/AGENTS.md`
- `/docs/HARNESS.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `projects/DraftReviewr/phases/project-manifest.json`
- `projects/DraftReviewr/phases/baselines/1-mvp-hardening.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/module-map.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/step1-output.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/step2-output.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/step3-output.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/step4-output.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/step5-output.json`
- `projects/DraftReviewr/phases/2-multi-llm-support/step6-output.json`
- `projects/DraftReviewr/package.json`
- `projects/DraftReviewr/app/page.tsx`
- `projects/DraftReviewr/app/admin/page.tsx`
- `projects/DraftReviewr/app/settings/page.tsx`

## 모듈 할당

- module: `runtime-smoke-and-phase-close`
- owned_paths:
  - `projects/DraftReviewr/phases/index.json`
  - `projects/DraftReviewr/phases/project-manifest.json`
  - `projects/DraftReviewr/phases/baselines/2-multi-llm-support.json`
  - `projects/DraftReviewr/phases/2-multi-llm-support/index.json`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step7-output.json`
- read_contracts:
  - `projects/DraftReviewr/package.json`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step1-output.json`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step2-output.json`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step3-output.json`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step4-output.json`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step5-output.json`
  - `projects/DraftReviewr/phases/2-multi-llm-support/step6-output.json`
- forbidden_paths:
  - `projects/DraftReviewr/.git/`
  - `projects/DraftReviewr/node_modules/`
  - `projects/DraftReviewr/.next/`
  - `projects/DraftReviewr/app/**`
  - `projects/DraftReviewr/components/**`
  - `projects/DraftReviewr/lib/**`

## 계약 및 베이스라인

- 이 step은 phase 마감 step이다. 구현 파일은 수정하지 않는다.
- `/`, `/admin`, `/settings`가 빌드 후 런타임에서 접근 가능해야 한다.
- Phase 완료 시 `phases/baselines/2-multi-llm-support.json`을 작성한다.
- Phase 완료 후 `draft-reviewer-phase2-done` tag를 생성한다.

## 작업

1. Step 1-6 output을 종합해 runtime smoke 검증 범위를 확정한다.
2. build, typecheck, validate를 실행한다.
3. `phases/baselines/2-multi-llm-support.json`에 변경된 public surface, routes, integration points, known issues를 기록한다.
4. `phases/index.json`, `phases/project-manifest.json`, `phases/2-multi-llm-support/index.json` 상태를 완료로 동기화한다.

## Acceptance Criteria

```bash
python3 scripts/validate_phase.py 2-multi-llm-support --root projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
npm run typecheck --prefix projects/DraftReviewr
```

- [ ] `/`, `/admin`, `/settings`가 빌드 후 static prerender 된다.
- [ ] `phases/baselines/2-multi-llm-support.json`이 작성된다.
- [ ] Phase 완료 tag `draft-reviewer-phase2-done`이 생성된다.
- [ ] `phases/index.json`과 `phases/2-multi-llm-support/index.json` 상태가 일치한다.

## 검증 절차

1. Acceptance Criteria 명령을 실행한다.
2. 브라우저 또는 동등한 런타임 확인으로 주요 route smoke 결과를 기록한다.
3. Phase 상태 파일 정합성을 확인한다.
4. `git status`로 변경 범위를 확인한다.
5. `phases/2-multi-llm-support/index.json` 과 `step7-output.json` 에 상태와 handoff를 기록한다.
6. step 커밋 후 phase 완료 태그를 생성한다.

## 금지사항

- 구현 파일을 이 step에서 수정하지 마라.
- 실패한 smoke 결과를 숨기지 마라. 실패하면 step을 `error` 또는 `blocked`로 기록한다.
- 기존 step을 renumber 하지 마라.
