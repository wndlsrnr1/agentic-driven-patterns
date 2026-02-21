# ADP Server 파일 매핑 (인라인 vs 사이드카)

## 분류 기준
- `인라인`: 파일 내부에 직접 JSDoc/주석 작성
- `사이드카`: 파일 자체는 유지하고 별도 문서에서 구조/역할 설명

## 인라인 대상
| 경로/패턴 | 방식 | 이유 |
|---|---|---|
| `src/**/*.ts` | 인라인 JSDoc | 실행 코드/테스트 코드의 호출 흐름을 코드 근처에서 이해해야 하기 때문 |
| `jest.config.ts` | 인라인 JSDoc | 테스트 런타임 모듈 해석 규칙 설명 필요 |
| `Dockerfile` | 인라인 주석 | 빌드 레이어/런타임 모드(`ADP_BUILD_MODE`) 의도 설명 필요 |
| `.dockerignore` | 인라인 주석 | 이미지 컨텍스트 제외 규칙의 목적 설명 필요 |

## 사이드카 대상 (설정 JSON)
| 경로 | 방식 | 참조 문서 |
|---|---|---|
| `package.json` | 사이드카 | `config-json-explained-ko.md` |
| `nest-cli.json` | 사이드카 | `config-json-explained-ko.md` |
| `tsconfig.json` | 사이드카 | `config-json-explained-ko.md` |
| `tsconfig.build.json` | 사이드카 | `config-json-explained-ko.md` |
| `tsconfig.build.docker.json` | 사이드카 | `config-json-explained-ko.md` |

## 사이드카 대상 (생성/외부 아티팩트)
| 경로/패턴 | 방식 | 참조 문서 |
|---|---|---|
| `package-lock.json` | 사이드카 | `generated-artifacts-explained-ko.md` |
| `node_modules/**` | 사이드카 | `generated-artifacts-explained-ko.md` |

## 운영 보조 파일
| 경로 | 방식 | 설명 |
|---|---|---|
| `src/config/.env` | 사이드카 | 런타임 비밀값, Git 추적 제외 대상 |
| `src/config/.env.example` | 사이드카 | 환경 변수 템플릿 |
| `src/config/.gitignore` | 사이드카 | `.env` 추적 방지 규칙 |

## 검증 기준
- 모든 `src/**/*.ts`에 핵심 선언 앞 JSDoc 존재
- JSON/생성 파일은 사이드카 문서에서 목적/호출자/영향 범위 설명
