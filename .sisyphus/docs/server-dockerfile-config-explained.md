# server-dockerfile-config-explained

> [!NOTE] 30초 요약
> - `Dockerfile`은 서버 컨테이너의 빌드/실행 계약을 레이어 단위로 고정한다.
> - 핵심 포인트는 `ADP_BUILD_MODE=docker`, `npm ci`, `CMD npm run dev`의 연결이다.
> - 지시어 순서/값 변경은 캐시, 호환성, 운영 접근성에 즉시 파급된다.

## 0. 독자와 목표
- 대상 독자: `mixed` (Dockerfile 초급 + 서버 운영/CI 담당자)
- 이 문서의 목표: `server/Dockerfile` 지시어가 빌드/실행 단계에서 어떤 결정을 내리는지 설명한다.
- 분석 대상 파일: `server/Dockerfile`
- 관련 근거 파일: `server/.dockerignore`, `server/package.json`, `docker-compose.yml`, `README.md`
- 용어 브릿지:
  - `Layer`: Dockerfile 각 지시어가 만드는 이미지 스냅샷 단위
  - `Entry point(CMD)`: 컨테이너 시작 시 기본 실행 명령

## 1. 한눈에 보는 오버뷰
- 이 파일의 존재 이유: 개발용 컨테이너를 재현 가능하게 만들고 `npm run dev` 실행 환경을 표준화한다.
- 시스템에서 차지하는 위치: `docker-compose.yml`의 `server.build.dockerfile`로 지정된 빌드 명세서다.
- 읽는 주체: Docker Engine/BuildKit, 컨테이너 런타임
- 영향 범위: 빌드 캐시, 의존성 설치 재현성, 런타임 기본 명령, 포트 메타데이터

## 2. 파일 문법 설명
- 문서 형식: Dockerfile DSL (`FROM`, `WORKDIR`, `ENV`, `COPY`, `RUN`, `EXPOSE`, `CMD`)
- 파서 규칙: 위에서 아래 순서로 레이어 생성, 지시어 순서가 캐시 적중률에 영향
- 자주 틀리는 문법 포인트:
  - `CMD`는 빌드 시가 아니라 컨테이너 시작 시 실행된다.
  - `EXPOSE`는 메타데이터이며 실제 외부 공개는 compose `ports`가 결정한다.

## 3. 프레임워크-모듈-라이브러리 연결
| 설정 키 | 직접 소비 주체 | 간접 영향 주체 | 근거 파일/패키지 |
| --- | --- | --- | --- |
| `FROM node:20-alpine` | Docker image resolver | Node 런타임/ABI 호환성 | `server/Dockerfile` |
| `ENV ADP_BUILD_MODE=docker` | 셸 환경 + npm script | `scripts.build` 분기 | `server/Dockerfile`, `server/package.json` |
| `RUN npm ci` | npm CLI installer | `package-lock.json` 재현성 | `server/Dockerfile`, `server/package-lock.json` |
| `CMD ["npm","run","dev"]` | 컨테이너 런타임 | Nest watch 실행 | `server/Dockerfile`, `server/package.json`, `docker-compose.yml` |

## 4. 키별 시니어 해설

### 4.1 요약 표
| 키 | 한 줄 의미 | 어디서 읽는가 | 변경 영향 |
| --- | --- | --- | --- |
| `FROM` | Node 런타임 기반 이미지 고정 | Docker builder | 런타임 호환성/빌드 속도 변동 |
| `WORKDIR` | 이후 상대 경로 기준점 고정 | Docker builder/runtime | `COPY`, `RUN`, `CMD` 경로 동시 영향 |
| `ENV ADP_BUILD_MODE` | build 분기 플래그 제공 | shell + npm scripts | local/docker 분기 실패 가능 |
| `RUN npm ci` | lock 기반 재현성 설치 | npm CLI | drift 차단 또는 설치 실패 |
| `CMD` | 컨테이너 시작 기본 명령 | Docker runtime | 실행 모드/운영 전략 영향 |

### 4.2 상세 근거 표
| 키 | 현재값 | 타입/문법 | 어디서 읽는가 | 라이프사이클 시점 | 라이프사이클 내 역할 | 설계/패러다임 관점 | 왜 존재하는가 | 자주 생기는 오해 | 변경 영향 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `FROM` | `node:20-alpine` | 이미지 참조 | Docker builder | 빌드 시작 | 기본 런타임/패키지 환경 고정 | 재현 가능한 기반 계층 | 팀/CI/로컬에서 동일 Node LTS 보장 | "alpine은 무조건 최적" | 네이티브 패키지 빌드 호환성/속도 변동 가능 |
| `WORKDIR` | `/app` | 절대 경로 | Docker builder/runtime | 빌드~실행 | 이후 상대 경로 기준 통일 | 경로 계약 고정 | `COPY`, `RUN`, `CMD` 경로 혼선 방지 | "없어도 동작" | 경로 변경 시 명령 전부 영향 |
| `ENV ADP_BUILD_MODE` | `docker` | key=value | shell + npm scripts | build 실행 시 | `npm run build` 분기 플래그 제공 | 환경 기반 정책 분리 | local/docker 산출물 전략 분기 | "로컬 빌드에도 항상 적용" | Docker 내부에서만 적용, 값 오변경 시 분기 깨짐 |
| `COPY package*.json ./` | 패턴 복사 | Docker copy | 의존성 설치 전 | manifest 선복사로 캐시 분리 | 캐시 효율 우선 | 코드 변경 시 `npm ci` 재실행 최소화 | "`COPY . .` 하나면 동일" | 캐시 재활용률 급락 가능 |
| `RUN npm ci` | lock 기반 설치 | npm CLI | 빌드 중 | 정확한 의존성 트리 설치 | 재현성/공급망 안전 | lock 불일치 조기 실패로 drift 차단 | "npm install과 같다" | install 사용 시 예측불가 업데이트 가능 |
| `COPY . .` | 전체 소스 복사 | Docker copy | 의존성 설치 후 | 애플리케이션 코드 반영 | 실행 가능한 이미지 완성 | 이미지 단독 실행 보장 | compose bind mount와 별개로 이미지 실행 보장 | "개발 바인드마운트면 필요 없음" | 제거 시 이미지 단독 실행 실패 가능 |
| `EXPOSE` | `3001` | 포트 정수 | Docker metadata | 런타임 전 | 서비스 포트 문서화 | 운영 가시성 | 기본 포트 계약 공유 | "EXPOSE만으로 외부 접근 가능" | compose ports 불일치 시 혼란 |
| `CMD` | `["npm","run","dev"]` | JSON array command | Docker runtime | 컨테이너 시작 시 | 개발 서버 시작 | 명령 책임 분리 | 개발 루프 표준화 | "빌드 시 실행" | prod 전략과 혼선 가능 |

## 5. 라이프사이클 타임라인
1. 빌드 단계: `.dockerignore` 적용 후 Dockerfile 순서대로 레이어 생성.
2. 의존성 단계: `COPY package*.json` -> `RUN npm ci`로 lock 기반 설치.
3. 코드 반영 단계: `COPY . .`로 소스 반영.
4. 시작 단계: 컨테이너 실행 시 `CMD npm run dev` 실행.

## 6. 패러다임 및 아키텍처 관점
- 계층 분리 관점: 빌드 명세(Dockerfile)와 실행 정책(package scripts), 앱 코드(main.ts)를 분리한다.
- DI/IoC 관점: 직접 적용은 없지만 Nest 런타임 진입 환경을 안정화한다.
- 도메인 경계(DDD) 관점: 도메인 규칙이 아닌 인프라 bounded context다.
- 운영 안정성 관점: lock 기반 설치 + 환경 분기(`ADP_BUILD_MODE`)로 환경차 회귀를 줄인다.

## 7. 초보자가 헷갈리는 포인트
- 오해 1:
  - 왜 오해가 생기나: `EXPOSE`를 publish 동작으로 오해.
  - 정확한 이해: 실제 외부 노출은 compose `ports`가 담당한다.
- 오해 2:
  - 왜 오해가 생기나: `RUN`과 `CMD`를 모두 "명령 실행"으로만 이해.
  - 정확한 이해: `RUN`은 이미지 생성 시, `CMD`는 컨테이너 시작 시 실행된다.

## 8. 변경 전 체크리스트
- [ ] 베이스 이미지 변경 시 Node/Nest 호환성 검증 계획을 세웠다.
- [ ] `ADP_BUILD_MODE` 변경 시 `server/package.json` 분기 로직을 함께 검토했다.
- [ ] `COPY` 순서 변경 시 캐시 성능 영향 측정 기준을 정했다.
- [ ] `CMD` 변경 시 `docker-compose.yml` command와 충돌 여부를 확인했다.
- [ ] `EXPOSE` 변경 시 compose 포트 매핑/README를 동기화했다.

## 9. 3줄 요약
1. Dockerfile은 서버 컨테이너의 빌드/실행 계약을 레이어 단위로 고정한다.
2. 핵심 결정은 `ADP_BUILD_MODE` 분기와 `npm ci` 기반 재현성이다.
3. 지시어 순서/값 변경은 캐시·호환성·운영 접근성에 즉시 영향을 준다.
