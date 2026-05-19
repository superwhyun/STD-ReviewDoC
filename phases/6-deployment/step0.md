# Step 0: static-export-config — next.config.mjs 정리 및 정적 export 설정

## 읽어야 할 파일

- `phases/baselines/5-scoring-prompt-edit.json`
- `phases/6-deployment/module-map.json`
- `next.config.mjs` (현재 상태 확인)

이전 step의 구현 파일을 기본 입력으로 삼지 마라.

## 모듈 할당

- module: `static-export-config`
- owned_paths:
  - `next.config.mjs`
- read_contracts:
  - 없음
- forbidden_paths:
  - `vercel.json` (step1 소유)
  - `Dockerfile`, `nginx.conf`, `docker-compose.yml`, `.dockerignore` (step2 소유)
  - `app/`, `components/`, `lib/` (수정 금지)

## 계약 및 베이스라인

- 이 phase의 baseline은 `phases/baselines/5-scoring-prompt-edit.json`이다.
- `next.config.mjs`는 이 step이 소유하는 public contract다. step1·2는 이 파일이 `output: 'export'`를 포함한다고 가정한다.
- contract가 부족하거나 틀려 AC를 통과할 수 없으면 현재 step을 `blocked`로 기록하고 `blocking-fix` step을 append한다.

## 작업

### 1. `next.config.mjs` 수정

아래 세 가지를 적용한다.

**제거**: 프로덕션 빌드 오류를 숨기는 옵션

```js
// 제거 대상
typescript: { ignoreBuildErrors: true }
eslint: { ignoreDuringBuilds: true }
```

**추가**: 정적 export 모드

```js
output: 'export'
```

최종 형태:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
```

`images.unoptimized: true`는 static export에 필수이므로 유지한다.

### 2. 빌드 결과 확인

`next build`를 실행하면 프로젝트 루트에 `out/` 디렉터리가 생성된다.
아래를 확인한다.

- `out/index.html` 존재
- `out/admin.html` 또는 `out/admin/index.html` 존재
- `out/settings.html` 또는 `out/settings/index.html` 존재
- `out/_next/` 정적 에셋 존재
- `out/data/` — `public/data/` 시드 JSON이 복사되었는지 확인

## Acceptance Criteria

```bash
# 1. 타입 오류 없음 (ignoreBuildErrors 제거 후 클린 빌드)
npm run typecheck --prefix projects/STD-ReviewDoC

# 2. 정적 export 빌드 성공 + out/ 생성
npm run build --prefix projects/STD-ReviewDoC

# 3. out/ 디렉터리 존재
ls projects/STD-ReviewDoC/out/index.html

# 4. placeholder 없음
grep -r "replace-with" projects/STD-ReviewDoC/phases/6-deployment/module-map.json
# → 출력 없어야 함
```

## 검증 절차

1. `npm run typecheck` → 오류 0개.
2. `npm run build` → 빌드 성공, `out/` 생성 확인.
3. `ls out/` 로 주요 파일 존재 확인.
4. `owned_paths` 밖의 파일이 변경되지 않았는지 `git diff --name-only` 확인.
5. `phases/6-deployment/index.json`의 step0 상태를 `completed`로 업데이트.

## 금지사항

- `app/`, `components/`, `lib/` 소스 파일을 수정하지 마라.
- `vercel.json`, `Dockerfile` 등 배포 파일을 이 step에 생성하지 마라.
- `out/` 디렉터리를 git에 커밋하지 마라 (이미 `.gitignore`에 `/out` 포함 확인 필요).
