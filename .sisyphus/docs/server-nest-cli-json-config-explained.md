# server-nest-cli-json-config-explained

> [!NOTE] 30초 요약
> - `nest-cli.json`은 Nest CLI가 build/start/generate를 수행할 때 기준이 되는 플랫폼 설정이다.
> - 핵심은 `sourceRoot`(탐색 기준), `deleteOutDir`(stale 산출물 제거), `collection`(생성 규칙)이다.
> - 작아 보이지만 잘못 바꾸면 명령 실패·생성물 불일치·빌드 오염으로 이어진다.

## 0. 독자와 목표
- 대상 독자: `mixed` (Nest CLI 초급 + 빌드 파이프라인 담당자)
- 이 문서의 목표: `server/nest-cli.json`이 `nest build/start/generate`에서 어떤 기준값으로 쓰이는지 설명한다.
- 분석 대상 파일: `server/nest-cli.json`
- 관련 근거 파일: `server/package.json`, `server/tsconfig*.json`
- 용어 브릿지:
  - `schematics`: Nest 코드 생성 템플릿/규칙 묶음
  - `sourceRoot`: Nest CLI가 애플리케이션 소스 루트로 간주하는 경로

## 1. 한눈에 보는 오버뷰
- 이 파일의 존재 이유: Nest CLI 동작(소스 탐색, 컴파일 출력 정리, 코드 생성 컬렉션)을 명시적으로 고정한다.
- 시스템에서 차지하는 위치: `package.json`의 `nest build`, `nest start` 실행 시 참조되는 CLI 설정이다.
- 읽는 주체: `@nestjs/cli`
- 영향 범위: 빌드 입력 루트, 생성 코드 규칙, 산출물 정리 정책

## 2. 파일 문법 설명
- 문서 형식: JSON
- 파서 규칙: Nest CLI가 JSON을 읽어 내부 config 객체로 로드한다.
- 자주 틀리는 문법 포인트:
  - `$schema`는 런타임 설정이 아니라 편집 시 검증 힌트다.
  - `sourceRoot`는 tsconfig `include`와 역할이 다르며 Nest CLI 기준값이다.

## 3. 프레임워크-모듈-라이브러리 연결
| 설정 키 | 직접 소비 주체 | 간접 영향 주체 | 근거 파일/패키지 |
| --- | --- | --- | --- |
| `$schema` | JSON schema validator/IDE | 설정 오타 예방 | `server/nest-cli.json` |
| `collection` | Nest schematics engine | `nest g` 생성물 스타일 | `server/nest-cli.json`, `@nestjs/schematics` |
| `sourceRoot` | Nest CLI build/start | 엔트리 탐색 경로 | `server/nest-cli.json`, `server/package.json` |
| `compilerOptions.deleteOutDir` | Nest compiler pipeline | 빌드 산출물 정합성 | `server/nest-cli.json`, `server/package.json` |

## 4. 키별 시니어 해설

### 4.1 요약 표
| 키 | 한 줄 의미 | 어디서 읽는가 | 변경 영향 |
| --- | --- | --- | --- |
| `$schema` | 편집 시 자동완성/검증 기준 제공 | IDE/schema validator | 실수 탐지율 저하 가능 |
| `collection` | 코드 생성 기본 컬렉션 지정 | Nest schematics | `nest g` 생성물 규칙 변동 |
| `sourceRoot` | Nest 소스 탐색 루트 지정 | Nest CLI | build/start 경로 실패 가능 |
| `deleteOutDir` | 빌드 전 outDir 정리 | Nest compiler | stale 산출물 잔존 위험 |

### 4.2 상세 근거 표
| 키 | 현재값 | 타입/문법 | 어디서 읽는가 | 라이프사이클 시점 | 라이프사이클 내 역할 | 설계/패러다임 관점 | 왜 존재하는가 | 자주 생기는 오해 | 변경 영향 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `$schema` | `https://json.schemastore.org/nest-cli` | URL 문자열 | IDE/Schema validator | 편집 시 | 자동완성/유효성 검사 | DX 품질 | 설정 오타를 작성 단계에서 차단 | "실행에 무관하니 불필요" | 제거 시 실수 탐지율 저하 |
| `collection` | `@nestjs/schematics` | 패키지명 문자열 | Nest generate 명령 | 코드 생성 시 | 기본 schematics 제공자 지정 | 생성 규칙 표준화 | 팀 내 생성 코드 일관성 확보 | "build/start에는 영향 없음" | 생성물 스타일/구조 변경 가능 |
| `sourceRoot` | `src` | 상대 경로 문자열 | Nest build/start | 빌드/실행 초기화 | 앱 소스 루트 탐색 기준 | 경계 명시 | 엔트리포인트/모듈 탐색 기준 통일 | "tsconfig include가 대신" | 경로 불일치 시 Nest 명령 실패 가능 |
| `compilerOptions.deleteOutDir` | `true` | boolean | Nest compiler | 빌드 직전 | outDir 정리 후 재생성 | 깨끗한 빌드 | stale 산출물 제거로 회귀 방지 | "false가 항상 더 빠르다" | false 시 오래된 파일 잔존 위험 |

## 5. 라이프사이클 타임라인
1. 설정 로드: `nest build/start/generate` 시작 시 Nest CLI가 파일을 읽는다.
2. 코드 생성: `collection` 값으로 schematics를 선택한다.
3. 빌드 시작: `sourceRoot` 기준으로 소스 트리를 탐색한다.
4. 빌드 직전: `deleteOutDir` 정책에 따라 출력 디렉터리를 정리한다.

## 6. 패러다임 및 아키텍처 관점
- 계층 분리 관점: Nest 플랫폼 설정을 TypeScript 컴파일 옵션과 분리해 책임을 명확히 한다.
- DI/IoC 관점: Nest DI 이전, 플랫폼 부트스트랩 단계의 정책 파일이다.
- 도메인 경계(DDD) 관점: 도메인 규칙이 아니라 프레임워크 운영 경계 설정이다.
- 운영 안정성 관점: 산출물 정리 정책으로 재현 가능한 배포 아티팩트를 유지한다.

## 7. 초보자가 헷갈리는 포인트
- 오해 1:
  - 왜 오해가 생기나: `sourceRoot`와 tsconfig `include`를 동일하게 본다.
  - 정확한 이해: 전자는 Nest CLI 탐색 기준, 후자는 TypeScript 프로그램 입력 기준이다.
- 오해 2:
  - 왜 오해가 생기나: `deleteOutDir=true`를 단순 성능 저하 설정으로 본다.
  - 정확한 이해: 오래된 산출물 잔존을 막는 안정성 설정이다.

## 8. 변경 전 체크리스트
- [ ] `sourceRoot` 변경 시 실제 소스 디렉터리 구조와 일치하는지 확인했다.
- [ ] `deleteOutDir` 변경 시 stale artifact 위험을 팀에 공유했다.
- [ ] `collection` 변경 시 `nest g` 생성물 diff를 검토했다.
- [ ] 변경 후 `npm run build`, `npm run dev`로 기본 명령 회귀를 점검했다.
- [ ] IDE schema 경고 여부를 확인했다.

## 9. 3줄 요약
1. `nest-cli.json`은 Nest 명령의 플랫폼 기준점을 제공하는 설정 파일이다.
2. 핵심 키는 `sourceRoot`와 `deleteOutDir`이며 빌드 안정성에 직접 영향한다.
3. 단순해 보여도 변경 시 build/start/generate 전 단계에 파급된다.
