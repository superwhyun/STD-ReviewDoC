# Step 1: seed-json-files

## 읽어야 할 파일
- `phases/4-standards-seed/module-map.json`
- `phases/4-standards-seed/step0-output.json`

## 모듈 할당
- module: `seed-json-files`
- owned_paths: `public/data/**`
- forbidden_paths: `.git/`, `node_modules/`, `.next/`, `app/**`, `components/**`, `lib/**`

## 계약 및 베이스라인
- 스키마: step0 contracts의 문서타입 JSON 및 공통항목 JSON 형식을 따른다
- 기존 `lib/storage/default-data.json`과 중복되지 않도록 step0-output.json에서 충돌 여부 확인 후 진행
- 이 step은 JSON 파일 생성만 담당, 로딩 로직은 step2에서 구현

## 작업

아래 5개 파일을 생성한다. 스키마는 step0 contracts를 따른다.

### 1. `public/data/document-types/itu-t-draft.json`

```json
{
  "id": "itu-t-draft",
  "name": "ITU-T 표준초안",
  "description": "ITU-T Recommendation 표준초안 (Draft Recommendation). TSB 편집 지침 및 ITU-T 스타일 가이드 기준으로 검토한다.",
  "review_items": [
    { "id": "itu-t-draft-01", "name": "절 번호 체계", "prompt": "ITU-T 스타일의 계층형 절 번호(1, 1.1, 1.1.1)가 일관되게 적용되어 있는지 확인하라. 번호가 누락되거나 순서가 어긋난 부분을 지적하라.", "order_index": 1 },
    { "id": "itu-t-draft-02", "name": "문서 구조 완성도", "prompt": "Scope, References, Definitions and abbreviations, Main body, Annex 순의 ITU-T 표준 구조가 갖춰져 있는지 확인하라. 누락된 필수 절이 있으면 지적하라.", "order_index": 2 },
    { "id": "itu-t-draft-03", "name": "Modal verb 일관성", "prompt": "shall(필수), should(권고), may(허용), can(가능성) 네 가지 modal verb가 ISO/IEC Directives 및 ITU-T 편집 지침에 따라 올바르게 사용되었는지 확인하라. 혼용 또는 오용된 사례를 지적하라.", "order_index": 3 },
    { "id": "itu-t-draft-04", "name": "용어 및 정의 형식", "prompt": "Terms and definitions 절의 각 항목이 '용어: 정의문' 형식을 따르고 있는지, 순환 정의나 부적절한 표현이 없는지 확인하라.", "order_index": 4 },
    { "id": "itu-t-draft-05", "name": "규범적 참조 형식", "prompt": "References 절의 인용 형식이 '[ITU-T G.xxx]' 또는 '[ISO/IEC xxxxx]' 등 ITU-T 편집 지침에 맞는지 확인하라. 본문에서 참조하지 않는 항목이나 참조는 있으나 목록에 없는 항목을 지적하라.", "order_index": 5 },
    { "id": "itu-t-draft-06", "name": "그림·표 번호 및 캡션", "prompt": "그림과 표에 일련번호와 캡션이 있고, 본문에서 정확히 참조되는지 확인하라. ITU-T 스타일에서 그림 캡션은 아래, 표 캡션은 위에 위치한다.", "order_index": 6 },
    { "id": "itu-t-draft-07", "name": "Annex 규범성 분류", "prompt": "각 Annex가 normative(규범적) 또는 informative(참고용)으로 명확히 표시되어 있는지 확인하라. 본문에서 shall/must로 참조하는 Annex가 informative로 표시된 경우를 지적하라.", "order_index": 7 },
    { "id": "itu-t-draft-08", "name": "보안 고려사항", "prompt": "보안에 영향을 미치는 Recommendation이라면 Security considerations 절이 있어야 한다. 해당 절이 없거나 내용이 지나치게 단순한 경우 지적하라.", "order_index": 8 },
    { "id": "itu-t-draft-09", "name": "IPR 선언", "prompt": "ITU-T 특허 정책에 따른 IPR 선언(Patent Statement and Licensing Declaration) 포함 여부를 확인하라. 표준 구현에 특허가 필요한 경우 적절한 선언이 있어야 한다.", "order_index": 9 },
    { "id": "itu-t-draft-10", "name": "Scope·Abstract 정합성", "prompt": "Abstract 또는 Summary에 기술된 내용이 Scope 절과 일치하는지 확인하라. 범위를 벗어난 내용이 본문에 포함되어 있으면 지적하라.", "order_index": 10 },
    { "id": "itu-t-draft-11", "name": "교차 참조 정확성", "prompt": "본문의 절·그림·표·수식 교차 참조 번호가 실제로 존재하는지 확인하라. 잘못된 번호나 누락된 참조를 지적하라.", "order_index": 11 },
    { "id": "itu-t-draft-12", "name": "약어 정의 완성도", "prompt": "본문에 등장하는 모든 약어가 Abbreviations 절 또는 처음 등장 시 정의되어 있는지 확인하라. 미정의 약어나 정의 후 사용되지 않는 약어를 지적하라.", "order_index": 12 },
    { "id": "itu-t-draft-13", "name": "정의 용어 사용 일관성", "prompt": "Definitions 절에서 정의한 용어가 본문 전체에서 동일한 표현으로 일관되게 사용되고 있는지 확인하라. 유사한 다른 표현을 혼용하는 경우를 지적하라.", "order_index": 13 },
    { "id": "itu-t-draft-14", "name": "적합성 명시", "prompt": "구현 요구사항(conformance requirements)이 shall을 사용하여 명확히 기술되어 있는지 확인하라. 적합성 기준이 불명확하거나 검증 불가능한 표현을 지적하라.", "order_index": 14 },
    { "id": "itu-t-draft-15", "name": "ASN.1/메시지 형식 일관성", "prompt": "ASN.1 모듈이나 메시지 형식이 포함된 경우, 문법 오류·미사용 타입·본문 설명과의 불일치를 확인하라.", "order_index": 15 },
    { "id": "itu-t-draft-16", "name": "편집 일관성", "prompt": "문서 전체에서 용어 표기(대소문자, 하이픈 유무), 날짜 형식, 숫자 표기 방식이 일관되게 사용되는지 확인하라.", "order_index": 16 },
    { "id": "itu-t-draft-17", "name": "언어 명확성", "prompt": "모호한 표현('it is recommended that', 'as appropriate', 'etc.' 남용 등)이 있는지 확인하라. 구현자가 다르게 해석할 수 있는 문장을 지적하라.", "order_index": 17 }
  ]
}
```

### 2. `public/data/document-types/itu-t-contribution.json`

```json
{
  "id": "itu-t-contribution",
  "name": "ITU-T 기고서",
  "description": "ITU-T Study Group 회의에 제출하는 기고서(Contribution/Temporary Document). 회의 문서 서식 및 SG 편집 지침을 기준으로 검토한다.",
  "review_items": [
    { "id": "itu-t-con-01", "name": "표지 완성도", "prompt": "표지에 회의 정보(SG 번호, 회의 일시·장소), 문서 번호, 출처(기관명·국가), 제목, 의제 항목(Agenda Item), 연락처(Contact)가 모두 기재되어 있는지 확인하라.", "order_index": 1 },
    { "id": "itu-t-con-02", "name": "목적 구분 명시", "prompt": "기고서의 목적이 Discussion, Decision, Information, Approval 중 하나로 명확히 표시되어 있는지 확인하라. 목적에 맞는 내용 구성인지 평가하라.", "order_index": 2 },
    { "id": "itu-t-con-03", "name": "배경 및 맥락 섹션", "prompt": "기고서 배경과 관련 히스토리가 설명되어 있는지 확인하라. 관련 이전 문서(TD 번호, Contribution 번호 등)가 올바르게 인용되어 있는지 확인하라.", "order_index": 3 },
    { "id": "itu-t-con-04", "name": "기술적 근거 명확성", "prompt": "제안하는 내용의 기술적 근거가 충분히 설명되어 있는지 확인하라. 주장만 있고 근거가 없는 경우, 또는 주장과 근거가 논리적으로 연결되지 않는 경우를 지적하라.", "order_index": 4 },
    { "id": "itu-t-con-05", "name": "제안 변경사항 명확성", "prompt": "Text-based 기고서의 경우, 제안하는 변경사항이 변경 추적(track changes) 또는 명확한 '기존 텍스트 → 변경 텍스트' 형식으로 기술되어 있는지 확인하라.", "order_index": 5 },
    { "id": "itu-t-con-06", "name": "요청 액션 명시", "prompt": "회의에서 요청하는 액션(예: 'The meeting is invited to...', 'The editor is requested to...')이 구체적으로 명시되어 있는지 확인하라.", "order_index": 6 },
    { "id": "itu-t-con-07", "name": "의제 항목 정합성", "prompt": "기고서가 신청된 의제 항목의 범위 내 내용을 다루고 있는지 확인하라. 의제 범위를 벗어난 내용이 포함된 경우 지적하라.", "order_index": 7 },
    { "id": "itu-t-con-08", "name": "관련 문서 최신성", "prompt": "참조하는 기존 Recommendation, TD, Contribution이 최신 승인 버전을 참조하고 있는지 확인하라. 이미 폐지되거나 개정된 문서를 참조하는 경우 지적하라.", "order_index": 8 },
    { "id": "itu-t-con-09", "name": "분량 적절성", "prompt": "기고서의 길이가 목적에 비례하는지 평가하라. Information 기고서가 지나치게 길거나, Decision을 요청하는 기고서에 핵심 근거가 빈약하면 지적하라.", "order_index": 9 },
    { "id": "itu-t-con-10", "name": "영어 표현 명확성", "prompt": "비영어권 저자가 작성한 경우 문법 오류, 어색한 표현, 다의적 해석이 가능한 문장이 없는지 확인하라. 특히 shall/should/may 오용에 주의하라.", "order_index": 10 }
  ]
}
```

### 3. `public/data/document-types/jtc1-draft.json`

```json
{
  "id": "jtc1-draft",
  "name": "JTC 1 표준초안",
  "description": "ISO/IEC JTC 1 국제표준 초안 (CD/DIS/FDIS). ISO/IEC Directives Part 2 기준으로 검토한다.",
  "review_items": [
    { "id": "jtc1-draft-01", "name": "조항 구조 준수 (ISO Directives Part 2)", "prompt": "문서 조항이 ISO/IEC Directives Part 2의 필수 구조(Foreword, Introduction 선택, 1-Scope, 2-Normative references, 3-Terms and definitions, 이하 본론)를 준수하는지 확인하라. 조항 순서 오류나 누락을 지적하라.", "order_index": 1 },
    { "id": "jtc1-draft-02", "name": "전문 (Foreword) 요건", "prompt": "Foreword에 발행 기관(ISO/IEC JTC 1 및 해당 SC), 문서 번호, 파트 구성(있는 경우), 이전 판과의 차이점, 투표 정보가 포함되어 있는지 확인하라.", "order_index": 2 },
    { "id": "jtc1-draft-03", "name": "범위 (Scope) 정밀성", "prompt": "Scope 절이 표준이 다루는 것과 다루지 않는 것을 명확히 구분하여 기술하고 있는지 확인하라. 지나치게 광범위하거나 내용과 불일치하는 Scope를 지적하라.", "order_index": 3 },
    { "id": "jtc1-draft-04", "name": "규범적 참고문헌 형식", "prompt": "Normative references의 각 항목이 '[ISO xxxx:yyyy, Title]' 형식을 따르는지, dated/undated reference 처리가 적절한지 확인하라. 본문에서 참조하지 않는 항목을 지적하라.", "order_index": 4 },
    { "id": "jtc1-draft-05", "name": "용어 및 정의 형식", "prompt": "Terms and definitions 절의 각 항목이 ISO 형식(용어번호, preferred term, definition, Note, Example 순)을 따르는지 확인하라. 순환 정의, 불완전한 정의, 조항 번호 오류를 지적하라.", "order_index": 5 },
    { "id": "jtc1-draft-06", "name": "Modal verb 사용 (ISO 규칙)", "prompt": "shall(요구사항), should(권고사항), may(허용), need not(불필요), can(가능성), cannot(불가능) 여섯 가지 modal verb가 ISO/IEC Directives Part 2 규칙에 따라 정확하게 사용되는지 확인하라.", "order_index": 6 },
    { "id": "jtc1-draft-07", "name": "Annex 분류 및 표시", "prompt": "각 Annex에 '(normative)' 또는 '(informative)' 표시가 있는지, 본문에서 요구사항으로 참조하는 Annex가 normative로 분류되어 있는지 확인하라.", "order_index": 7 },
    { "id": "jtc1-draft-08", "name": "그림·표·수식 번호 체계", "prompt": "그림, 표, 수식의 번호가 조항 번호를 접두사로 사용하거나(예: Figure 4.1) 전체 일련번호 방식으로 일관되게 사용되는지 확인하라. 캡션 위치(표는 위, 그림은 아래)도 확인하라.", "order_index": 8 },
    { "id": "jtc1-draft-09", "name": "적합성 조항 (Conformance clause)", "prompt": "적합성 조항이 명확히 정의되어 있는지 확인하라. 구현이 full conformance/partial conformance/profile conformance 중 무엇을 달성할 수 있는지 기술되어야 한다.", "order_index": 9 },
    { "id": "jtc1-draft-10", "name": "참고문헌 (Bibliography) 형식", "prompt": "Bibliography의 각 항목이 ISO 스타일(문서 번호, 제목, 발행 연도)을 따르는지 확인하라. Normative references와 Bibliography 간 항목 중복을 지적하라.", "order_index": 10 },
    { "id": "jtc1-draft-11", "name": "특허 선언 (Patent declarations)", "prompt": "특허 정책 관련 ISO/IEC 표준 보일러플레이트 문구가 포함되어 있는지 확인하라. 특허 실시 선언(PSDO)이 필요한 기술이 포함된 경우를 식별하라.", "order_index": 11 },
    { "id": "jtc1-draft-12", "name": "언어 일관성 (British English)", "prompt": "ISO 표준은 British English를 사용한다. American English 철자(color→colour, organize→organise 등)가 혼용된 경우를 지적하라.", "order_index": 12 },
    { "id": "jtc1-draft-13", "name": "측정 단위 (SI 단위)", "prompt": "측정값 표기에 SI 단위(미터, 킬로그램, 초 등)가 사용되는지 확인하라. 비SI 단위 사용 시 병기가 필요하다.", "order_index": 13 },
    { "id": "jtc1-draft-14", "name": "Notes·Examples 형식", "prompt": "NOTE와 EXAMPLE이 규범적 요구사항을 포함하지 않는지 확인하라. NOTE에 shall이 포함된 경우 본문으로 이동해야 한다.", "order_index": 14 },
    { "id": "jtc1-draft-15", "name": "교차 참조 정확성", "prompt": "조항, 그림, 표, 수식 교차 참조가 정확한지 확인하라. 참조 번호와 실제 항목 번호가 일치하지 않는 경우를 모두 지적하라.", "order_index": 15 },
    { "id": "jtc1-draft-16", "name": "시리즈 표준 일관성", "prompt": "같은 시리즈(파트 구성) 표준이 있는 경우 용어 정의, 약어, 구조가 다른 파트와 일관되는지 확인하라.", "order_index": 16 },
    { "id": "jtc1-draft-17", "name": "NB 코멘트 반영 여부", "prompt": "이전 투표에서 제기된 National Body 코멘트에 대한 처리 결과(Accept/Reject/Modify)가 적절히 반영되어 있는지, 반영 내역을 추적할 수 있는지 확인하라.", "order_index": 17 }
  ]
}
```

### 4. `public/data/document-types/jtc1-contribution.json`

```json
{
  "id": "jtc1-contribution",
  "name": "JTC 1 기고서",
  "description": "ISO/IEC JTC 1 국가 기관 기고서 (N-document / NB Contribution). SC 및 WG 문서 서식과 투표 코멘트 응답 지침을 기준으로 검토한다.",
  "review_items": [
    { "id": "jtc1-con-01", "name": "문서 헤더 완성도", "prompt": "문서 헤더에 출처(NB 또는 Liaison 기관), 회의 정보(SC/WG 번호, 회의 일시·장소), 문서 번호(N-번호), 프로젝트 번호, 제목이 모두 기재되어 있는지 확인하라.", "order_index": 1 },
    { "id": "jtc1-con-02", "name": "문서 카테고리 명시", "prompt": "기고서 카테고리(NP, Amendment, Corrigendum, Ballot Comment Response, Liaison Statement 등)가 명확히 표시되어 있는지 확인하라.", "order_index": 2 },
    { "id": "jtc1-con-03", "name": "제안 변경사항 요약", "prompt": "기고서 서두에 제안하는 변경사항 또는 요청사항의 요약이 있는지, 본문 내용과 일치하는지 확인하라.", "order_index": 3 },
    { "id": "jtc1-con-04", "name": "변경 추적 형식", "prompt": "기존 문서 텍스트를 변경하는 기고서의 경우 추가(밑줄/녹색), 삭제(취소선/빨간색) 등 변경 추적이 일관되게 적용되어 있는지 확인하라.", "order_index": 4 },
    { "id": "jtc1-con-05", "name": "투표 코멘트 응답 형식", "prompt": "Ballot comment response인 경우, 각 코멘트에 대해 처리 의견(Accept/Accept in principle/Reject/Noted), 근거, 수정 텍스트가 모두 포함되어 있는지 확인하라.", "order_index": 5 },
    { "id": "jtc1-con-06", "name": "처리 의견 (Proposed disposition)", "prompt": "각 제안에 대해 Accept, Reject 또는 Modify 중 하나의 처리 의견이 명시되어 있는지, 그 근거가 충분한지 확인하라.", "order_index": 6 },
    { "id": "jtc1-con-07", "name": "변경 근거 (Rationale)", "prompt": "제안하는 변경사항 또는 처리 의견에 대한 기술적·편집적 근거가 명확히 기술되어 있는지 확인하라. 근거 없이 Accept/Reject만 표시된 경우를 지적하라.", "order_index": 7 },
    { "id": "jtc1-con-08", "name": "프로젝트 범위 정합성", "prompt": "기고서의 내용이 해당 프로젝트(표준 문서)의 Scope 범위 내에 있는지 확인하라. Scope를 벗어난 내용이 포함된 경우 지적하라.", "order_index": 8 },
    { "id": "jtc1-con-09", "name": "기준 문서 버전 참조", "prompt": "변경 대상 표준 문서의 버전(예: ISO/IEC xxxxx:yyyy, edition N)이 명확히 명시되어 있는지 확인하라. 투표 대상 버전과 참조 버전이 일치하는지 확인하라.", "order_index": 9 },
    { "id": "jtc1-con-10", "name": "IPR 공시", "prompt": "기고서가 새로운 지식재산권(특허, 저작권)을 도입하는 경우 해당 IP 보유자의 라이선싱 의향 선언이 첨부되어 있는지 확인하라.", "order_index": 10 }
  ]
}
```

### 5. `public/data/common-review-items.json`

```json
{
  "items": [
    { "id": "common-01", "name": "문서 내 용어 일관성", "prompt": "동일한 개념을 지칭하는 용어가 문서 전체에서 일관되게 사용되는지 확인하라. 같은 개념에 여러 표현이 혼용된 경우를 모두 지적하라.", "order_index": 1 },
    { "id": "common-02", "name": "문서 제목과 내용의 정합성", "prompt": "문서 제목 또는 Abstract에 기술된 주제와 실제 내용이 일치하는지 확인하라. 제목과 무관한 내용이 포함된 경우 지적하라.", "order_index": 2 },
    { "id": "common-03", "name": "참조 번호 유효성", "prompt": "문서 내에서 참조하는 절 번호, 그림 번호, 표 번호, 외부 문서 번호가 실제로 존재하고 최신 버전인지 확인하라. 존재하지 않거나 폐지된 참조를 지적하라.", "order_index": 3 },
    { "id": "common-04", "name": "그림·표 캡션 완성도", "prompt": "모든 그림과 표에 번호와 설명 캡션이 있는지 확인하라. 캡션이 없거나 내용을 충분히 설명하지 못하는 경우를 지적하라.", "order_index": 4 },
    { "id": "common-05", "name": "날짜·버전 정보 정확성", "prompt": "문서 헤더, 표지, 기준선 등에 표시된 날짜와 버전 번호가 정확하고 일관되는지 확인하라. 미기재 또는 모순된 정보를 지적하라.", "order_index": 5 },
    { "id": "common-06", "name": "오탈자 및 문법 오류", "prompt": "명백한 철자 오류, 문법 오류, 단어 누락, 중복 단어 등 편집 오류를 확인하라. 발견된 오류를 위치(절 번호)와 함께 나열하라.", "order_index": 6 },
    { "id": "common-07", "name": "포맷 일관성", "prompt": "본문 전체에서 글꼴, 줄 간격, 들여쓰기, 목록 스타일, 번호 매기기 방식이 일관되게 적용되는지 확인하라. 포맷이 어긋난 부분을 지적하라.", "order_index": 7 },
    { "id": "common-08", "name": "전반적 완성도 평가", "prompt": "문서의 전반적인 완성도를 평가하라. 미완성 섹션(TBD, TODO, [PLACEHOLDER] 등), 공백 절, 내용이 불충분한 섹션을 모두 지적하라.", "order_index": 8 }
  ]
}
```

## 검증 절차
1. AC 명령 실행 (파일 존재 확인, JSON 파싱, typecheck)
2. 각 문서타입의 review_items가 설계된 개수만큼 있는지 확인
3. `owned_paths` 외 파일 변경 없음 확인
4. `step1-output.json`에 생성된 파일 목록과 handoff 기록

## Acceptance Criteria
```bash
# 5개 파일이 모두 존재해야 한다
ls projects/DraftReviewr/public/data/document-types/itu-t-draft.json
ls projects/DraftReviewr/public/data/document-types/itu-t-contribution.json
ls projects/DraftReviewr/public/data/document-types/jtc1-draft.json
ls projects/DraftReviewr/public/data/document-types/jtc1-contribution.json
ls projects/DraftReviewr/public/data/common-review-items.json
# JSON 파싱 오류 없어야 한다
node -e "require('./projects/DraftReviewr/public/data/document-types/itu-t-draft.json')"
node -e "require('./projects/DraftReviewr/public/data/document-types/itu-t-contribution.json')"
node -e "require('./projects/DraftReviewr/public/data/document-types/jtc1-draft.json')"
node -e "require('./projects/DraftReviewr/public/data/document-types/jtc1-contribution.json')"
node -e "require('./projects/DraftReviewr/public/data/common-review-items.json')"
npm run typecheck --prefix projects/DraftReviewr
```

## 금지사항
- app/, components/, lib/ 파일 수정 금지
- 검토항목 내용을 임의로 삭제하거나 줄이지 마라 — 이 step의 핵심 산출물이다
