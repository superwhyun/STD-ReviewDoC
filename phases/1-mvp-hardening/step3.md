# Step 3: product-contract-alignment

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 상태를 파악하라.

- `/AGENTS.md`
- `/docs/HARNESS.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `projects/DraftReviewr/phases/project-manifest.json`
- `projects/DraftReviewr/phases/baselines/0-onboarding.json`
- `projects/DraftReviewr/phases/1-mvp-hardening/module-map.json`
- `projects/DraftReviewr/phases/1-mvp-hardening/step2-output.json`
- `projects/DraftReviewr/README.md`
- `projects/DraftReviewr/components/settings/api-key-settings.tsx`
- `projects/DraftReviewr/components/documents/document-upload-section.tsx`
- `projects/DraftReviewr/lib/openai-client.ts`

## 모듈 할당

- module: `product-contract-alignment`
- owned_paths:
  - `projects/DraftReviewr/README.md`
  - `projects/DraftReviewr/components/settings/api-key-settings.tsx`
  - `projects/DraftReviewr/components/documents/document-upload-section.tsx`
  - `projects/DraftReviewr/lib/openai-client.ts`
  - `projects/DraftReviewr/phases/1-mvp-hardening/step3-output.json`
- read_contracts:
  - `projects/DraftReviewr/lib/types.ts`
  - `projects/DraftReviewr/lib/storage/local-storage.ts`
  - `projects/DraftReviewr/phases/1-mvp-hardening/step2-output.json`
- forbidden_paths:
  - `projects/DraftReviewr/.git/`
  - `projects/DraftReviewr/node_modules/`
  - `projects/DraftReviewr/.next/`
  - `projects/DraftReviewr/components/admin/**`
  - `projects/DraftReviewr/components/ui/**`

## 계약 및 베이스라인

- 사용자에게 보이는 문구는 실제 구현과 일치해야 한다.
- API key 저장 방식은 브라우저 localStorage 저장으로 명확히 설명한다.
- 모델명은 코드와 README/UI가 일치해야 한다.
- 파일 지원 범위는 실제 텍스트 추출 가능 범위와 일치해야 한다. PDF를 제대로 지원하지 않으면 PDF 지원 문구와 accept 목록을 조정한다.

## 작업

1. README의 모델명, 보안 설명, 파일 지원 설명을 실제 코드에 맞춘다.
2. 설정 화면의 “암호화 저장” 문구를 localStorage 기반 저장의 실제 보안 수준에 맞춘다.
3. 문서 업로드 UI와 accept 목록에서 실제 지원하지 않는 파일 형식을 제거하거나, 지원 구현이 이미 충분한 형식만 명시한다.
4. `lib/openai-client.ts`의 public comment가 실제 Responses API 경로와 모델 contract를 설명하게 정리한다. 동작 변경은 최소화한다.
5. `step3-output.json`에 사용자가 이해해야 할 보안/지원 범위 결정을 기록한다.

## Acceptance Criteria

```bash
python3 scripts/validate_phase.py 1-mvp-hardening --root projects/DraftReviewr
npm run build --prefix projects/DraftReviewr
```

- [ ] README, 설정 UI, 업로드 UI가 API 키 저장 방식과 지원 파일 형식을 과장하지 않는다.
- [ ] README와 `lib/openai-client.ts`의 모델 설명이 일치한다.
- [ ] PDF 지원을 남기는 경우 실제 PDF 텍스트 추출 구현 또는 명시적 fallback이 있어야 한다.
- [ ] 사용자가 full backup에 API key가 포함될 수 있음을 알 수 있다.

## 검증 절차

1. Acceptance Criteria 명령을 실행한다.
2. README와 UI 문구를 검색해 `GPT-4o`, `암호화`, `PDF` 관련 문구가 실제 구현과 충돌하지 않는지 확인한다.
3. `owned_paths` 밖의 구현 파일이 변경되지 않았는지 확인한다.
4. `phases/1-mvp-hardening/index.json` 과 `step3-output.json` 에 상태와 handoff를 기록한다.

## 금지사항

- 서버/API route 아키텍처로 전환하지 마라.
- localStorage 데이터 모델을 바꾸지 마라.
- 관리자 CRUD를 리팩터링하지 마라.
