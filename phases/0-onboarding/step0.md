# Step 0: project-state-map

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `/AGENTS.md`
- `/docs/HARNESS.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `projects/DraftReviewr/phases/index.json`
- `projects/DraftReviewr/phases/project-manifest.json`
- `projects/DraftReviewr/phases/0-onboarding/index.json`
- `projects/DraftReviewr/phases/0-onboarding/module-map.json`
- `projects/DraftReviewr/README.md`
- `projects/DraftReviewr/package.json`
- `projects/DraftReviewr/lib/types.ts`
- `projects/DraftReviewr/lib/storage/default-data.json`
- 필요한 경우에만 `projects/DraftReviewr/app/`, `components/`, `lib/`의 영향 파일을 targeted read 하라.

이전 step의 구현 파일이나 긴 handoff를 기본 입력으로 삼지 마라. 먼저 baseline, module-map, public contract를 읽고, Acceptance Criteria 달성에 꼭 필요한 경우에만 영향 모듈의 구현을 제한적으로 읽어라.

## 모듈 할당

이 step이 소유하는 모듈과 파일 경계를 명시하라.

- module: `project-state-map`
- owned_paths:
  - `projects/DraftReviewr/phases/0-onboarding/module-map.json`
  - `projects/DraftReviewr/phases/0-onboarding/step0-output.json`
  - `projects/DraftReviewr/phases/project-manifest.json`
  - `projects/DraftReviewr/phases/baselines/0-onboarding.json`
- read_contracts:
  - `projects/DraftReviewr/README.md`
  - `projects/DraftReviewr/package.json`
  - `projects/DraftReviewr/lib/types.ts`
  - `projects/DraftReviewr/lib/storage/default-data.json`
- forbidden_paths:
  - `projects/DraftReviewr/.git/`
  - `projects/DraftReviewr/node_modules/`
  - `projects/DraftReviewr/.next/`

## 계약 및 베이스라인

- 의존 모듈은 구현 내부가 아니라 `read_contracts`에 적힌 public contract만 기준으로 사용한다.
- contract가 부족하거나 틀려 현재 step의 AC를 통과할 수 없으면 현재 step을 `blocked`로 기록하고 `blocking-fix` 또는 `contract-change` step을 append한다.
- 현재 step을 막지 않는 개선사항은 현재 step을 완료한 뒤 phase 마지막에 `backlog-fix` step으로 append한다.

## 작업

기존 앱을 하네스 방식으로 이어받기 위한 상태 지도를 만든다.

1. README, package metadata, 타입, 기본 데이터, 라우트 진입점을 기준으로 현재 public surface를 요약한다.
2. `phases/0-onboarding/module-map.json`을 실제 모듈 경계와 계약 경로로 보강한다.
3. `phases/project-manifest.json`에 전체 프로젝트 누적 현황을 기록한다.
4. `phases/baselines/0-onboarding.json`에 온보딩 기준선을 작성한다.
5. 구현 파일은 읽기만 하고 수정하지 않는다. `app/`, `components/`, `lib/` 변경이 필요하면 다음 phase의 별도 step으로 append한다.

## Acceptance Criteria

```bash
python3 scripts/validate_phase.py 0-onboarding --root projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
```

- [ ] `projects/DraftReviewr/phases/0-onboarding/module-map.json`의 `contracts` 경로에 적힌 파일이 모두 실제로 존재한다.
- [ ] `projects/DraftReviewr/phases/project-manifest.json`이 현재 라우트, 저장소, OpenAI 연동, 설정 import/export 계약을 요약한다.
- [ ] `projects/DraftReviewr/phases/baselines/0-onboarding.json`이 다음 phase가 전체 소스 재탐색 없이 시작할 수 있을 만큼 public surface를 요약한다.
- [ ] placeholder marker `replace-with`가 남아 있지 않다.

## 검증 절차

1. Acceptance Criteria 명령을 실행한다.
2. 결과를 확인한다.
3. contract test 또는 integration test가 이 step 범위에 있으면 함께 실행한다.
4. `owned_paths` 밖의 구현 파일이 변경되지 않았는지 확인한다.
5. `phases/0-onboarding/module-map.json`의 `contracts` 항목에 적힌 파일이 실제로 존재하는지 확인한다.
6. `phases/0-onboarding/index.json` 과 `step0-output.json` 에 상태와 handoff를 기록한다.

## 금지사항

- 현재 step 범위를 벗어난 기능을 추가하지 마라.
- 이전 step의 구현 파일을 일반 참고 자료처럼 다시 읽고 재설계하지 마라.
- `owned_paths` 밖의 구현 파일을 몰래 수정하지 마라.
- public contract 변경이 필요하면 현재 step 안에 섞지 말고 별도 `contract-change` step으로 승격하라.
- 다음 세션을 위한 handoff 없이 종료하지 마라.
