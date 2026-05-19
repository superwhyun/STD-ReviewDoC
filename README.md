# DraftReviewr

AI 기반 표준 초안 문서 자동 검토 시스템 — 완전한 클라이언트 사이드 애플리케이션

## 특징

- 서버·데이터베이스 불필요 — 브라우저만으로 동작
- 모든 데이터는 브라우저 localStorage에 저장
- OpenAI, Grok, OpenRouter, Kimi 멀티 LLM 지원
- 검토 항목별 0~100점 스코어 자동 산출 및 색상 표시
- 검토 결과 화면에서 프롬프트 직접 편집 가능
- 검토 설정을 JSON 파일로 내보내기/가져오기

## 기술 스택

- Next.js 15 (App Router, static export)
- React 19, TypeScript
- Tailwind CSS + shadcn/ui
- localStorage (데이터 저장)

---

## 설치 및 로컬 실행

### 사전 요구사항

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- LLM 제공자 API 키 (OpenAI, Grok, OpenRouter, Kimi 중 하나 이상)

### 설치

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev
```

브라우저에서 http://localhost:3000 접속

### 빌드

```bash
# 프로덕션 빌드 (out/ 디렉터리에 정적 파일 생성)
pnpm build
```

---

## 초기 설정

1. 상단 **설정** 메뉴로 이동
2. 사용할 LLM 제공자 선택 후 API 키 입력
3. 상단 **관리자** 메뉴에서 문서 유형 및 검토 항목 설정
4. 홈에서 문서 업로드 후 검토 시작

---

## 주요 기능

### 문서 검토

- DOCX, TXT 파일 지원 (브라우저에서 직접 텍스트 추출)
- 공통 검토 항목 + 문서 유형별 검토 항목 자동 적용
- 검토 항목당 **0~100점 스코어** 자동 산출
  - 80~100점: 초록 (기준 충족)
  - 50~79점: 노란색 (일부 개선 필요)
  - 0~49점: 빨간색 (중대한 문제)
- 전체 평균 점수 요약 표시

### 프롬프트 인라인 편집

검토 결과 화면에서 연필 아이콘을 클릭하면 해당 검토 항목의 프롬프트를 바로 수정할 수 있습니다. 다음 검토 시 즉시 반영됩니다.

### LLM 제공자

| 제공자 | 비고 |
|--------|------|
| OpenAI | GPT-5, Responses API |
| Grok | xAI Responses API |
| OpenRouter | 다양한 모델 선택 가능 |
| Kimi | Moonshot AI |

설정 페이지에서 제공자와 모델을 선택하고, 검토 시작 시 선택 제공자가 사용됩니다.

### 표준 기구 시드 데이터

앱 최초 실행 시 아래 문서 유형이 자동으로 로드됩니다.

- ITU-T 표준 초안
- ITU-T 기고서
- JTC 1 표준 초안
- JTC 1 기고서

관리자 메뉴에서 기본값으로 초기화할 수 있습니다.

### Export / Import

- **설정 내보내기**: 문서 유형·검토 항목·언어 설정을 JSON 파일로 저장 (API 키·검토 이력 제외)
- **설정 가져오기**: JSON 파일을 불러와 설정을 복원 (기존 설정 전체 교체)

---

## 배포

### Vercel

#### CLI로 수동 배포

```bash
# Vercel CLI 설치
npm install -g vercel

# 최초 배포 (로그인 및 프로젝트 연결)
vercel

# 프로덕션 배포
vercel deploy --prod
```

- 환경 변수 설정 불필요 (API 키는 사용자가 앱에서 직접 입력)
- 배포 후 HTTPS 자동 적용
- `vercel.json`에 CSP 보안 헤더가 포함되어 있습니다

#### GitHub 연동으로 자동 배포

GitHub 저장소와 연결하면 `main` 브랜치에 푸시할 때마다 자동으로 프로덕션 배포됩니다.

1. [vercel.com](https://vercel.com) 대시보드에서 프로젝트 선택
2. **Settings → Git → Connect Git Repository**
3. GitHub 저장소(`superwhyun/STD-ReviewDoC`) 연결

연결 후 동작:

| 이벤트 | 결과 |
|--------|------|
| `main` 브랜치 푸시 | 프로덕션 자동 배포 |
| PR 생성 | 미리보기 URL 자동 생성 |
| PR 병합 | 프로덕션 자동 반영 |

> **참고**: CLI로 처음 배포한 경우 GitHub 연동이 자동으로 설정되지 않습니다. Vercel 대시보드에서 별도로 연결해야 합니다.

### Docker

```bash
# 이미지 빌드 및 컨테이너 실행
docker compose up -d

# 접속
# http://localhost:3000
```

포트를 바꾸려면 `docker-compose.yml`의 `3000:80`에서 앞 숫자를 수정합니다.

Docker 없이 정적 파일만 서빙하려면:

```bash
pnpm build        # out/ 생성
npx serve out/    # 임시 서버로 확인
```

---

## 스크립트

| 명령 | 설명 |
|------|------|
| `pnpm dev` | 개발 서버 (nodemon, 파일 변경 시 자동 재시작) |
| `pnpm dev:simple` | 개발 서버 (일반) |
| `pnpm build` | 프로덕션 빌드 (`out/` 생성) |
| `pnpm lint` | ESLint 검사 |
| `pnpm typecheck` | TypeScript 타입 검사 |

---

## 데이터 저장 구조

모든 데이터는 브라우저 localStorage에 저장됩니다.

| 키 | 내용 |
|----|------|
| `draftreviewr:document-types` | 문서 유형 |
| `draftreviewr:review-items` | 유형별 검토 항목 |
| `draftreviewr:common-review-items` | 공통 검토 항목 |
| `draftreviewr:documents` | 문서 목록 |
| `draftreviewr:review-results` | 검토 결과 |
| `draftreviewr:language` | 검토 출력 언어 (ko/en) |
| `draftreviewr:llm-*` | LLM 제공자 설정 |

---

## 보안 참고사항

- API 키는 브라우저 localStorage에 저장됩니다 (암호화되지 않음)
- 공용 PC에서는 사용 후 설정 페이지에서 API 키를 삭제하세요
- 문서 파일은 서버에 저장되지 않고 LLM API로 직접 전송됩니다

---

## 라이선스

MIT
