# Step 2: docker-config — Docker 배포 설정

## 읽어야 할 파일

- `phases/6-deployment/module-map.json`
- `next.config.mjs` — `output: 'export'` 확인 (step0 완료 후)
- `package.json` — Node 버전, 빌드 스크립트 확인

이전 step의 구현 파일을 기본 입력으로 삼지 마라.

## 모듈 할당

- module: `docker-config`
- owned_paths:
  - `Dockerfile`
  - `nginx.conf`
  - `docker-compose.yml`
  - `.dockerignore`
  - `public/robots.txt`
- read_contracts:
  - `next.config.mjs` (output: export 전제 — 수정 금지)
  - `package.json` (빌드 명령 확인 — 수정 금지)
- forbidden_paths:
  - `next.config.mjs` (step0 소유)
  - `vercel.json` (step1 소유)
  - `app/`, `components/`, `lib/`

## 계약 및 베이스라인

- `next build` 결과물은 `out/` 디렉터리에 위치한다 (step0 전제).
- Docker 이미지는 빌드 단계(Node)와 서빙 단계(nginx) 두 스테이지로 구성한다.
- contract가 부족하거나 틀려 AC를 통과할 수 없으면 현재 step을 `blocked`로 기록하고 `blocking-fix` step을 append한다.

## 작업

### 1. `Dockerfile` — 멀티 스테이지 빌드

```dockerfile
# Stage 1: 빌드
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: 서빙
FROM nginx:alpine AS runner
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

패키지 매니저가 `pnpm`이 아닌 `npm`이면 아래로 대체:
```dockerfile
RUN npm ci
RUN npm run build
```

`package.json`의 실제 패키지 매니저와 lockfile을 확인 후 적용한다.

### 2. `nginx.conf` — SPA 라우팅

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # 정적 에셋 캐싱
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 라우팅 — 핵심 설정
    # /admin, /settings 등 직접 접근 시 index.html로 fallback
    location / {
        try_files $uri $uri.html $uri/ /index.html;
    }

    # 보안 헤더
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

`try_files`의 `$uri.html`은 Next.js static export가 `/admin` → `admin.html`로 생성할 때 필요하다.

### 3. `docker-compose.yml`

```yaml
services:
  app:
    build: .
    ports:
      - "3000:80"
    restart: unless-stopped
```

포트 `3000`은 변경 가능하다. 호스트 포트를 바꾸려면 `3000:80`에서 앞 숫자만 수정한다.

### 4. `.dockerignore`

```
node_modules
.next
out
.git
.gitignore
*.md
phases
.harness
.env*
```

빌드 컨텍스트에서 불필요한 파일을 제외해 이미지 빌드 속도를 높인다.

### 5. `public/robots.txt`

```
User-agent: *
Disallow: /
```

검색엔진 인덱싱을 차단한다. 공개 서비스로 전환 시 이 파일을 삭제하거나 수정한다.

## Acceptance Criteria

```bash
# 1. 파일 존재 확인
ls projects/STD-ReviewDoC/Dockerfile
ls projects/STD-ReviewDoC/nginx.conf
ls projects/STD-ReviewDoC/docker-compose.yml
ls projects/STD-ReviewDoC/.dockerignore
ls projects/STD-ReviewDoC/public/robots.txt

# 2. Docker 빌드 성공 (Docker 설치된 환경에서만)
docker build -t std-reviewdoc projects/STD-ReviewDoC/

# 3. Next.js 빌드 여전히 성공
npm run build --prefix projects/STD-ReviewDoC

# 4. phase 검증
python3 scripts/validate_phase.py 6-deployment --root projects/STD-ReviewDoC
```

Docker가 설치되지 않은 환경이면 항목 2는 skip하고 파일 내용 리뷰로 대체한다.

## 검증 절차

1. 파일 5개 모두 존재 확인.
2. `nginx.conf`에 `try_files $uri $uri.html $uri/ /index.html` 포함 확인.
3. `Dockerfile`에 `COPY --from=builder /app/out` 포함 확인 (`out/` 경로 일치 여부).
4. `.dockerignore`에 `node_modules`, `.next`, `out` 포함 확인.
5. `npm run build` → 성공 확인.
6. `python3 scripts/validate_phase.py 6-deployment --root projects/STD-ReviewDoC` 통과.
7. `owned_paths` 밖의 파일이 변경되지 않았는지 `git diff --name-only` 확인.
8. `phases/6-deployment/index.json`의 step2 상태를 `completed`로 업데이트.
9. phase 마감: `phases/index.json`의 phase6 상태를 `completed`로 업데이트.
10. phase 마감: `phases/baselines/6-deployment.json` 작성.
11. phase 마감: `git tag STD-ReviewDoC-phase6-done` (프로젝트 git repo 안에서).

## 금지사항

- `next.config.mjs`를 수정하지 마라 (step0 소유).
- `vercel.json`을 수정하지 마라 (step1 소유).
- `app/`, `components/`, `lib/` 소스 파일을 수정하지 마라.
- nginx에 Node.js 런타임을 추가하지 마라. 이 배포 방식은 순수 정적 파일 서빙이다.
- `out/` 디렉터리를 git에 커밋하지 마라.
