# Step 0: contracts

## 읽어야 할 파일
- `/AGENTS.md` `/docs/HARNESS.md` `/docs/ARCHITECTURE.md` `/docs/ADR.md`
- `phases/baselines/2-multi-llm-support.json`, `lib/llm-provider.ts`, `lib/providers/openai.ts`

## 모듈 할당
- module: `contracts`
- owned_paths: `phases/3-provider-model-ui/*`, `phases/project-manifest.json`
- forbidden_paths: `.git/`, `node_modules/`, `.next/`, `app/**`, `components/**`, `lib/**`

## 계약 및 베이스라인
- `LLMProvider`에 `listModels(): Promise<LLMModel[]>` 추가
- `LLMProviderConfig`에 optional `reasoning?: { effort }` 추가
- `ReviewRequest`에 optional `providerType?` 추가

## 작업
1. contract 문서화 및 module-map 작성
2. `phases/project-manifest.json` active_phase 갱신

## Acceptance Criteria
```bash
python3 scripts/validate_phase.py 3-provider-model-ui --root projects/DraftReviewr
```

## 검증 절차
1. AC 실행
2. 구현 파일 미변경 확인

## 금지사항
- 구현 파일 수정 금지
