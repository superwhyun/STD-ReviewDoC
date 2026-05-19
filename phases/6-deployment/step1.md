# Step 1: vercel-config — Vercel 배포 설정

## 읽어야 할 파일

- `phases/6-deployment/module-map.json`
- `next.config.mjs` — `output: 'export'` 설정 확인 (step0 완료 후)

이전 step의 구현 파일을 기본 입력으로 삼지 마라.

## 모듈 할당

- module: `vercel-config`
- owned_paths:
  - `vercel.json`
- read_contracts:
  - `next.config.mjs` (output: export 전제 — 수정 금지)
- forbidden_paths:
  - `next.config.mjs` (step0 소유)
  - `Dockerfile`, `nginx.conf`, `docker-compose.yml`, `.dockerignore` (step2 소유)
  - `app/`, `components/`, `lib/`

## 계약 및 베이스라인

- step0의 `next.config.mjs`(`output: 'export'`)를 전제로 한다.
- `vercel.json`을 새로 생성한다. 기존 Vercel 설정 파일이 있으면 내용을 확인하고 병합한다.
- contract가 부족하거나 틀려 AC를 통과할 수 없으면 현재 step을 `blocked`로 기록하고 `blocking-fix` step을 append한다.

## 작업

### `vercel.json` 생성

Vercel은 Next.js를 자동으로 인식하고 `output: 'export'`를 정적 사이트로 배포한다.
추가 설정 없이도 동작하지만, CSP 헤더를 명시하면 브라우저 보안이 강화된다.

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.openai.com https://api.x.ai https://openrouter.ai https://api.moonshot.ai; frame-src 'none'; object-src 'none';"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

**CSP `connect-src` 설명:**
- `https://api.openai.com` — OpenAI
- `https://api.x.ai` — Grok
- `https://openrouter.ai` — OpenRouter
- `https://api.moonshot.ai` — Kimi

새로운 provider가 추가되면 이 목록도 함께 업데이트해야 한다.

## Acceptance Criteria

```bash
# 1. vercel.json 존재
ls projects/STD-ReviewDoC/vercel.json

# 2. JSON 형식 유효성
python3 -c "import json; json.load(open('projects/STD-ReviewDoC/vercel.json'))" && echo "valid JSON"

# 3. 빌드 여전히 성공
npm run build --prefix projects/STD-ReviewDoC
```

## 검증 절차

1. `vercel.json` 파일이 생성됐는지 확인.
2. `python3 -c "import json; ..."` 로 JSON 파싱 오류 없음 확인.
3. `npm run build` → `out/` 생성 확인 (step0 설정이 유지되는지 검증).
4. `owned_paths` 밖의 파일이 변경되지 않았는지 `git diff --name-only` 확인.
5. `phases/6-deployment/index.json`의 step1 상태를 `completed`로 업데이트.

## 금지사항

- `next.config.mjs`를 수정하지 마라 (step0 소유).
- `app/`, `components/`, `lib/` 소스 파일을 수정하지 마라.
- Dockerfile, nginx.conf 등 Docker 관련 파일을 이 step에 생성하지 마라 (step2 소유).
