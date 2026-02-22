# server-dockerignore-config-explained

> [!NOTE] 30초 요약
> - `.dockerignore`는 컨테이너 내부 파일 삭제가 아니라 Docker build context 전송 대상을 제어한다.
> - 핵심 목적은 재현성(캐시 안정성), 보안(`.env` 제외), 빌드 효율(불필요 파일 제거)이다.
> - `node_modules`, `dist*`, `.env` 규칙을 임의로 풀면 속도와 보안이 동시에 악화될 수 있다.

## 0. 독자와 목표
- 대상 독자: `mixed` (Docker 초급 + NestJS 운영 담당자)
- 이 문서의 목표: `server/.dockerignore` 각 패턴이 왜 필요한지와 변경 위험을 빌드 라이프사이클 관점에서 설명한다.
- 분석 대상 파일: `server/.dockerignore`
- 관련 근거 파일: `server/Dockerfile`, `docker-compose.yml`, `server/package.json`
- 용어 브릿지:
  - `Build Context`: Docker 빌드 시작 전에 데몬으로 전송되는 파일 집합
  - `패턴 제외`: 특정 파일/폴더를 build context에서 제거하는 규칙

## 1. 한눈에 보는 오버뷰
- 이 파일의 존재 이유: 이미지 빌드에 필요 없는 파일과 민감 파일을 미리 차단해 빌드 속도/보안/재현성을 확보한다.
- 시스템에서 차지하는 위치: `docker-compose.yml`의 `server` 서비스가 `context: ./server`를 전송할 때 가장 먼저 적용되는 필터다.
- 이 파일을 읽는 주체: Docker Engine/BuildKit
- 영향 범위: 빌드(context 전송량, 캐시 키), 보안(secret 유입), 운영(이미지 크기)

## 2. 파일 문법 설명
- 문서 형식: `.dockerignore` 텍스트 패턴 목록
- 파서 규칙: 한 줄당 한 패턴, glob 매칭, 주석은 `#`로 시작
- 자주 틀리는 문법 포인트:
  - `.gitignore`와 유사하지만 적용 시점/주체는 Docker build context다.
  - 패턴 제외는 컨테이너 내부 삭제가 아니라 "전송 차단"이다.

## 3. 프레임워크-모듈-라이브러리 연결
| 설정 키 | 직접 소비 주체 | 간접 영향 주체 | 근거 파일/패키지 |
| --- | --- | --- | --- |
| `node_modules` | Docker BuildKit context loader | `RUN npm ci` 설치 정합성/속도 | `server/.dockerignore`, `server/Dockerfile` |
| `dist`, `dist-local` | Docker BuildKit context loader | `nest build` 산출물 재현성 | `server/.dockerignore`, `server/package.json` |
| `npm-debug.log*` | Docker BuildKit context loader | 로그 유출/캐시 노이즈 | `server/.dockerignore` |
| `.env` | Docker BuildKit context loader | 비밀정보 관리 | `server/.dockerignore`, `server/src/main.ts` |

## 4. 키별 시니어 해설

### 4.1 요약 표
| 키 | 한 줄 의미 | 어디서 읽는가 | 변경 영향 |
| --- | --- | --- | --- |
| `node_modules` | 호스트 모듈 폴더 전송 차단 | Docker BuildKit | 제외 해제 시 context 비대화/캐시 미스 증가 |
| `dist` | 구버전 빌드 산출물 유입 차단 | Docker BuildKit | 제외 해제 시 stale artifact 잔존 가능 |
| `dist-local` | 로컬 빌드 부산물 유입 차단 | Docker BuildKit | 제외 해제 시 캐시 변동/전송 증가 |
| `npm-debug.log*` | 디버그 로그 전송 차단 | Docker BuildKit | 제외 해제 시 정보 노출면 증가 |
| `.env` | 비밀값 파일 이미지 포함 차단 | Docker BuildKit | 제외 해제 시 secret bake-in 위험 |

### 4.2 상세 근거 표
| 키 | 현재값 | 타입/문법 | 어디서 읽는가 | 라이프사이클 시점 | 라이프사이클 내 역할 | 설계/패러다임 관점 | 왜 존재하는가 | 자주 생기는 오해 | 변경 영향 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `node_modules` | `node_modules` | 디렉터리 패턴 | Docker BuildKit | 빌드 시작 전 | 호스트 의존성 전송 차단 | 불변 인프라(환경 분리) | OS/아키텍처 차이로 인한 네이티브 모듈 불일치 방지 | "제외하면 모듈이 없어 실행 안 된다" | 제외 해제 시 context 비대화, 캐시 미스 증가 |
| `dist` | `dist` | 디렉터리 패턴 | Docker BuildKit | 빌드 시작 전 | 구버전 산출물 유입 차단 | 산출물/소스 분리 | stale artifact가 이미지에 섞이는 문제 방지 | "어차피 새 빌드가 덮어쓴다" | 제외 해제 시 오래된 JS가 레이어에 잔존 가능 |
| `dist-local` | `dist-local` | 디렉터리 패턴 | Docker BuildKit | 빌드 시작 전 | 로컬 전용 산출물 차단 | 로컬/컨테이너 경계 분리 | 로컬 빌드 부산물이 Docker 캐시 키를 오염시키는 문제 방지 | "docker 빌드와 무관" | 제외 해제 시 불필요 전송 및 캐시 변동 증가 |
| `npm-debug.log*` | `npm-debug.log*` | 와일드카드 패턴 | Docker BuildKit | 빌드 시작 전 | 디버그 로그 전송 차단 | 최소 공개 원칙 | 실패 로그에 경로/환경 정보가 남는 리스크 완화 | "텍스트 파일이라 영향 미미" | 제외 해제 시 정보 노출면/이미지 크기 증가 |
| `.env` | `.env` | 파일 패턴 | Docker BuildKit | 빌드 시작 전 | 비밀값 파일 이미지 포함 차단 | 비밀값 분리 원칙 | secret bake-in 방지 | "런타임 env를 쓰면 파일 포함해도 안전" | 제외 해제 시 이미지 유출 시 비밀값 노출 가능 |

## 5. 라이프사이클 타임라인
1. 빌드 단계: `docker-compose.yml`가 `context: ./server`를 평가할 때 `.dockerignore`가 먼저 적용된다.
2. 애플리케이션 시작 단계: 직접 읽히지는 않지만, 빌드 입력 품질을 통해 시작 안정성에 간접 영향한다.
3. 요청 처리 단계: 직접 영향 없음.
4. 운영/배포 단계: 이미지 크기, 보안 스캔 결과, 캐시 재사용성에 지속 영향한다.

## 6. 패러다임 및 아키텍처 관점
- 계층 분리 관점: 실행 로직(`package.json`, `main.ts`)과 빌드 입력 정책(`.dockerignore`)을 분리한다.
- DI/IoC 관점: 직접 적용 없음(플랫폼 레이어 설정).
- 도메인 경계(DDD) 관점: 도메인 규칙이 아닌 컨테이너 빌드 운영 경계 설정이다.
- 운영 안정성 관점: 동일 입력만 빌드에 투입되도록 제한해 재현성을 높인다.

## 7. 초보자가 헷갈리는 포인트
- 오해 1:
  - 왜 오해가 생기나: `.gitignore`와 동일하게 학습하기 쉽다.
  - 정확한 이해: Git 추적 여부가 아니라 Docker context 전송 여부를 제어한다.
- 오해 2:
  - 왜 오해가 생기나: `.env`를 개발 편의 파일로만 인식한다.
  - 정확한 이해: 이미지에 포함되면 배포 아티팩트가 비밀을 영구 저장하게 된다.

## 8. 변경 전 체크리스트
- [ ] `docker-compose.yml`의 `context` 경로와 패턴 영향 범위를 확인했다.
- [ ] 제외 해제 시 보안/캐시/이미지 크기 영향을 문서화했다.
- [ ] `server/Dockerfile`의 `RUN npm ci` 동작과 충돌 여부를 확인했다.
- [ ] 민감 파일 제외 규칙(`.env`)을 유지했다.
- [ ] 변경 후 `docker compose build server`로 context 영향 변화를 점검했다.

## 9. 3줄 요약
1. `.dockerignore`는 컨테이너 내부 파일이 아니라 빌드 입력(context)을 제어한다.
2. 핵심 목적은 재현성, 캐시 안정성, 비밀값 유출 방지다.
3. `node_modules`, `dist*`, `.env` 규칙 완화는 속도와 보안을 동시에 악화시킬 수 있다.
