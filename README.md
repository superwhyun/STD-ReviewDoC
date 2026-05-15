# DraftReviewr

AI 기반 한국 표준 초안 문서 자동 검토 시스템 - **완전한 클라이언트 사이드 애플리케이션**

## 🎯 주요 특징

- ✅ **서버리스 아키텍처** - 데이터베이스 불필요, 완전한 브라우저 기반
- ✅ **localStorage 기반** - 모든 설정이 브라우저에 저장
- ✅ **직접 OpenAI 연동** - 서버를 거치지 않고 브라우저에서 직접 API 호출
- ✅ **Export/Import** - 검토 설정을 JSON 파일로 내보내기/가져오기
- ✅ **지식 거래 가능** - 잘 정제된 검토 항목 세트를 판매/공유 가능
- ✅ **프라이버시** - 파일이 서버에 저장되지 않음

## 기술 스택

- **Next.js 15** (App Router, 클라이언트 사이드만 사용)
- **React 19**
- **TypeScript**
- **OpenAI GPT-4o** (직접 API 호출)
- **localStorage** (데이터 저장)
- **Tailwind CSS + shadcn/ui**

## 시작하기

### 사전 요구사항

- Node.js 18+
- OpenAI API 키

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 시작
npm run dev
```

브라우저에서 http://localhost:3000 열기

### 초기 설정

1. **설정 페이지**로 이동
2. **OpenAI API 키** 입력 및 저장
3. **관리자 대시보드**에서 문서 유형 및 검토 항목 설정
4. 완료!

## 주요 기능

### 1. 📝 문서 검토

- PDF, DOC, DOCX, TXT 파일 지원
- 브라우저에서 직접 OpenAI에 업로드
- 커스터마이징 가능한 검토 항목
- 실시간 진행 상황 표시

### 2. ⚙️ 검토 항목 관리

**공통 검토 항목**
- 모든 문서 유형에 적용
- 예: 문서 형식, 맞춤법, 용어 일관성

**유형별 검토 항목**
- 특정 문서 유형에만 적용
- 예: 표준초안의 경우 - 적용 범위, 인용 표준, 기술 내용

### 3. 📦 Export / Import

#### 설정 파일 내보내기 (판매/공유용)
```json
{
  "version": "1.0.0",
  "document_types": [...],
  "review_items": [...],
  "common_review_items": [...]
}
```

이 파일은 **전문 지식**입니다:
- 잘 정제된 검토 기준
- 표준 분야 전문가의 노하우
- 판매하거나 공유 가능

#### 전체 백업 (개인용)
- API 키 포함
- 검토 이력 포함
- 개인 백업 및 복원용

### 4. 🛡️ 보안 & 프라이버시

- API 키는 브라우저에만 저장
- 파일이 서버에 업로드되지 않음
- OpenAI에 직접 전송 후 자동 삭제
- 완전한 클라이언트 사이드 처리

## 프로젝트 구조

```
DraftReviewr/
├── app/
│   ├── page.tsx                    # 홈 (문서 업로드)
│   ├── admin/page.tsx              # 관리자 대시보드
│   ├── settings/page.tsx           # 설정 (API 키)
│   └── layout.tsx                  # 루트 레이아웃
├── components/
│   ├── admin/                      # 관리자 컴포넌트
│   ├── documents/                  # 문서 관련 컴포넌트
│   ├── settings/                   # 설정 컴포넌트
│   ├── export-import-dialog.tsx    # Export/Import UI
│   └── ui/                         # 재사용 UI 컴포넌트
├── lib/
│   ├── storage/
│   │   └── local-storage.ts        # localStorage 관리
│   ├── openai-client.ts            # OpenAI API 클라이언트
│   ├── types.ts                    # TypeScript 타입
│   └── utils.ts                    # 유틸리티
└── public/                         # 정적 파일
```

## 사용 시나리오

### 개인 사용자
1. OpenAI API 키 등록
2. 검토 항목 커스터마이징
3. 문서 업로드 및 검토
4. 백업 파일 저장 (개인용)

### 전문가 (지식 판매)
1. 표준 문서 검토 전문 지식 축적
2. 검토 항목 세트 정제
3. 설정 파일 Export
4. JSON 파일 판매 (예: "표준문서 전문가 검토 팩 v1.0")

### 구매자
1. 전문가의 설정 파일 구매
2. Import (병합 또는 교체)
3. 즉시 전문가 수준의 검토 사용

## 스크립트

```bash
# 개발 서버 (nodemon으로 자동 재시작)
npm run dev

# 개발 서버 (일반)
npm run dev:simple

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm run start

# 린트
npm run lint
```

## 배포

### Vercel (권장)

```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel
```

환경 변수 설정 불필요! 사용자가 앱 내에서 API 키를 설정합니다.

### 기타 정적 호스팅

```bash
npm run build
```

`.next` 폴더를 Netlify, Cloudflare Pages 등에 배포

## 데이터 구조

모든 데이터는 localStorage에 저장됩니다:

```
draftreviewr:document-types         # 문서 유형
draftreviewr:review-items           # 유형별 검토 항목
draftreviewr:common-review-items    # 공통 검토 항목
draftreviewr:documents              # 문서 목록
draftreviewr:review-results         # 검토 결과
draftreviewr:api-key                # OpenAI API 키
draftreviewr:user-id                # 사용자 ID (자동 생성)
```

## OpenAI API 사용

### 비용

- 파일 업로드: 무료
- GPT-4o 사용: 토큰당 과금
- 평균 문서 검토 (5개 항목): 약 $0.50-1.00

### API 키 발급

1. https://platform.openai.com 방문
2. API Keys 섹션에서 새 키 생성
3. 앱의 설정 페이지에서 입력

## 비즈니스 모델 아이디어

### 1. 지식 마켓플레이스
- 전문가들이 검토 설정 파일 판매
- 카테고리: 표준문서, 법률문서, 의학논문 등

### 2. SaaS 래퍼
- 기본 앱 무료 제공
- 프리미엄 검토 팩 판매

### 3. 컨설팅
- 기업별 맞춤 검토 기준 제작
- JSON 파일로 납품

## 라이선스

MIT

## 기여

이슈와 PR 환영합니다!

## 문의

프로젝트 관련 문의사항은 GitHub Issues를 이용해주세요.
