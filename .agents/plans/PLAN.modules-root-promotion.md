# Modules Root Promotion Implementation Plan

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `modules` 패키지 경계를 저장소 루트로 승격하고, 이동으로 깨지는 실행 경로·문서 경로·검증 경로를 함께 재정의합니다.

**Architecture:** `client`와 `server`는 그대로 독립 패키지로 유지합니다. 현재 `modules` 아래의 학습용 TypeScript/Python 실행 경계만 루트로 승격하고, `node_modules`/`venv`는 이동하지 않고 루트에 새로 생성합니다.

**Tech Stack:** Node.js, TypeScript, Python, Markdown docs, AGENTS/skills metadata

---

## 현재 프로젝트 컨텍스트

### 시스템 개요

- 프로젝트명: `adp`
- 핵심 도메인: React/Nest 앱 + 별도 LLM workflow 학습 샘플
- 기술 스택: 루트 문서/메타데이터, `client` React/Vite, `server` NestJS, `modules` TypeScript/Python 샘플
- 이 계획에 필요한 skills:
  - `loading-project-context`
  - `intent-inference`
  - `writing-plans`
  - `plan-writer-ddd`
  - `contract-driven-testing`
  - `refactoring-safely`
  - `test-driven-development`
  - `verification-before-completion`
  - `systematic-debugging`
  - `typescript-foundation-rules`

### 현재 상황

- 문제/요구사항:
  - 실사용 대상이 사실상 `modules` 하나로 수렴하여 이를 저장소 최상위 계층으로 올리고 싶다.
  - 이동 자체뿐 아니라 AGENTS/skills/문서/코드 주석/실행 커맨드까지 파생 경로를 같이 정리해야 한다.
- 관련 코드/모듈:
  - `/home/jik/projects/adp/modules/package.json`
  - `/home/jik/projects/adp/modules/package-lock.json`
  - `/home/jik/projects/adp/modules/tsconfig.json`
  - `/home/jik/projects/adp/modules/requirements.txt`
  - `/home/jik/projects/adp/modules/.env`
  - `/home/jik/projects/adp/modules/01-prompts-chaining`
  - `/home/jik/projects/adp/modules/02-routing-patterns`
  - `/home/jik/projects/adp/modules/03-paralleization`
  - `/home/jik/projects/adp/modules/04-reflection`
  - `/home/jik/projects/adp/modules/05-tool`
  - `/home/jik/projects/adp/README.md`
  - `/home/jik/projects/adp/AGENTS.md`
  - `/home/jik/projects/adp/.agents/skills/comment-docstring-for-langchain-and-external-libs/references/prompt-template.ko.md`
  - `/home/jik/projects/adp/.agents/plans`
  - `/home/jik/projects/adp/.sisyphus/plans`
- 제약 조건:
  - `modules/node_modules`, `modules/venv`는 옮기지 않는다.
  - 루트에 새 `node_modules`, `venv`를 생성한다.
  - 파일 삭제는 사용자 수동으로 수행한다.
  - `client`/`server` 구조와 실행 경계는 유지한다.
  - archive 성격의 과거 계획/회고 문서는 기본 수정 대상에서 제외한다.
- 기존 시도 및 결과:
  - `cd /home/jik/projects/adp/modules && npm run typecheck` 는 현재 통과한다.
  - `cd /home/jik/projects/adp/modules && npm test` 는 exit 0 이지만 `tests 0` 이다. 현재 `package.json` 테스트 글롭이 실디렉토리(`01-`, `02-`, `03-`)와 어긋나서 거짓 녹색이다.
  - 실제 글롭으로 실행하면 `36 pass / 4 fail` 이고, 실패 4건은 `/home/jik/projects/adp/modules/04-reflection/example-code/typescript/reflextion-openai.spec.ts` 의 기존 `API_KEY or OPENAI_API_KEY is missing.` 이슈다. 이번 이동 작업의 비목적 범위로 분리해야 한다.

## 1. 프로젝트/문제 요약

- 이번 작업의 본질은 폴더 이동이 아니라 “학습 샘플 실행 경계”를 루트로 승격하는 구조 리팩터링입니다.
- 현재는 `modules` 전용 패키지 경계가 있고, 다수의 README/주석/skill reference/plan 파일이 `cd modules`, `modules/.env`, `modules/package.json` 에 결합되어 있습니다.
- 루트에는 이미 `docker-compose` 용 `.env.example` 가 있어서, `modules/.env` 를 무비판적으로 루트 `.env` 로 올리면 운영 경계가 섞일 수 있습니다.
- 검증도 이미 왜곡돼 있습니다. `npm test` 가 0개 테스트로 성공하므로, 이번 계획은 “루트 승격 + 거짓 녹색 제거”를 같이 다룹니다.
- 반대로 `.sisyphus/plans`, 과거 `.agents/plans` 까지 일괄 수정하면 스코프가 불필요하게 커지므로 live 자산만 다루어야 합니다.

## 2. 궁극적인 목표 + 측정 기준

| 목표 | 측정 기준 |
| ---- | --------- |
| `modules` 실행 경계를 루트로 승격 | 루트에 `01-prompts-chaining`, `02-routing-patterns`, `03-paralleization`, `04-reflection`, `05-tool`, `example`, `package.json`, `package-lock.json`, `tsconfig.json`, `requirements.txt` 가 존재 |
| 라이브 경로 참조 정합성 확보 | 활성 자산에서 `cd modules`, `modules/.env`, `modules/package.json`, `/home/jik/projects/adp/modules` 참조가 제거되거나 명시 allowlist 로 분류 |
| 검증 경로를 실제 테스트가 돌도록 수정 | 루트 `npm test` 가 0 tests 가 아니라 실제 spec 를 탐지하고, 루트 modules 검증 커맨드가 통과 |
| 운영 경계 충돌 방지 | 루트 모듈 실행용 env 파일을 `docker-compose` 기본 `.env` 와 분리하거나 충돌 없음이 증명됨 |
| 기존 앱 경계 비침범 | `client`/`server` 의 typecheck smoke 가 기존과 동일하게 통과 |

## TL;DR

- Objective: `modules` 를 저장소 루트 실행 경계로 승격하고 파생 경로를 재정의합니다.
- Deliverables: 루트 승격된 디렉토리/패키지 파일, 경로 계약 검증, 활성 문서/skills/README 정리, 새 루트 `node_modules`/`venv` 생성 절차
- Effort: 중간 이상
- Parallelism: Wave 2 일부 병렬 가능

## Intent Brief (inferred)

- Ultimate intent (Why):
  - 실사용하지 않는 `modules/` 래퍼를 제거하고, 현재 실제로 사용하는 학습 샘플 집합을 저장소 최상위에서 직접 다루고 싶다.
- Deliverables (What):
  - 디렉토리 승격 계획
  - 파생 수정 범위
  - 검증 게이트
  - 수동 삭제를 전제로 한 마이그레이션 절차
- Success criteria (verifiable):
  - 루트 패키지/디렉토리 구조가 재정의된다.
  - 활성 경로 참조가 최신화된다.
  - 루트 검증 커맨드가 실제 테스트/타입체크를 수행한다.
- Non-goals:
  - `modules` 잔존 디렉토리 삭제
  - `client`/`server` 를 workspace 로 통합
  - 기존 reflection 로직 버그 전체 수리
- Constraints:
  - `node_modules`, `venv` 는 이동 금지
  - 파일 삭제는 사용자 수동
  - 필요 최소 범위만 수정
- Assumptions (and how to verify):
  - 모듈용 env 파일은 루트 `.env` 대신 별도 이름(`.env.modules`)으로 분리하는 것이 안전하다.
  - 검증 방법: `docker-compose.yml`, `.env.example`, 루트 실행 스크립트의 `--env-file` 사용처 확인
- Minimal questions (<=3):
  - 없음. 현재 정보로 계획 수립 가능
- Next step: `plan-writer-ddd`

## 3. Domain Model (DDD)

- Bounded context:
  - `Modules Runtime Boundary`: 학습 샘플 실행/테스트/의존성 경계
  - `Repository Guidance Boundary`: AGENTS/skills/README/plan 등 운영 문서 경계
  - `Archive Boundary`: 과거 회고/실험 플랜 등 역사 보존 자산
- Entities / Value Objects:
  - `Path Contract`: 실행 커맨드, 파일 경로, cwd 기대값
  - `Dependency Boundary`: `package.json`, `package-lock.json`, `tsconfig.json`, `requirements.txt`, `.env.modules`
  - `Promotion Set`: 루트로 승격될 디렉토리 집합(`01`~`05`, `example`)
- Domain invariants:
  - 라이브 실행 자산은 더 이상 `cd modules` 를 요구하면 안 된다.
  - 루트 `npm test` 는 0-test 성공이 아니라 실제 테스트 탐지를 보장해야 한다.
  - `client`/`server` 패키지 경계를 침범하지 않는다.
  - `modules/node_modules`, `modules/venv` 는 이동하지 않는다.
  - 역사 보존 문서는 live contract 검증에서 분리할 수 있어야 한다.
  - 루트 모듈용 env 파일은 `.gitignore` 에서 추적 제외되어야 한다.
- Domain events (if any):
  - `ModulesPromotedToRoot`
  - `LivePathContractsRewritten`
  - `RootDependencyBoundaryRecreated`

## 4. Architecture (Clean Architecture)

- Layers:
  - Domain: 경로 계약, 이동 대상, 허용/비허용 참조 규칙
  - Application: 이동 순서, 검증 순서, allowlist 분류
  - Interface: README, AGENTS, skill references, source header comments
  - Infrastructure: npm scripts, TypeScript config, Python venv, env-file
- Dependency rule:
  - 구조 결정이 먼저, 파일 이동이 다음, 문서/주석 갱신이 그 다음, 검증이 마지막입니다.
  - 루트 npm 실행 경계와 env 주입 경로를 먼저 고정하지 않으면 파일 이동을 시작하지 않습니다.
  - 역사 자산은 현재 실행 경계를 오염시키지 않는 범위에서만 수정합니다.
- Module boundaries + file layout proposal:
  - 유지: `/home/jik/projects/adp/client`, `/home/jik/projects/adp/server`
  - 승격:
    - `/home/jik/projects/adp/01-prompts-chaining`
    - `/home/jik/projects/adp/02-routing-patterns`
    - `/home/jik/projects/adp/03-paralleization`
    - `/home/jik/projects/adp/04-reflection`
    - `/home/jik/projects/adp/05-tool`
    - `/home/jik/projects/adp/example`
    - `/home/jik/projects/adp/package.json`
    - `/home/jik/projects/adp/package-lock.json`
    - `/home/jik/projects/adp/tsconfig.json`
    - `/home/jik/projects/adp/requirements.txt`
    - `/home/jik/projects/adp/.env.modules` (권장)

## 5. 의존성 다이어그램

```text
P0 -> P1
P0 -> P2
P1 -> P3
P2 -> P3
P3 -> P4
```

## 6. Uncertainty Register (Risk-driven)

| 항목 | 조사 이유 | 조사 방법 | 결정 기준 |
| ---- | --------- | --------- | --------- |
| U1. env 파일 이름 | 루트 `.env` 는 docker-compose 관례와 겹침 | `docker-compose.yml`, `.env.example`, 기존 `modules/.env` 키 비교 | compose 경계와 혼선이 있으면 `.env.modules` 로 분리 |
| U2. 테스트 글롭 기준 | 현재 `npm test` 가 0 tests 로 거짓 녹색 | 루트 패키지 스크립트와 실제 spec 위치 비교 | 루트 `npm test` 가 실 spec 를 탐지하고 0-tests 성공을 금지해야 함 |
| U3. live vs archive 문서 경계 | `.agents/plans`, `.sisyphus/plans` 의 수정 범위가 다름 | 참조 소비 주체를 분류 | 실행에 쓰이는 live 자산만 강제 갱신, archive 는 allowlist 또는 주석화 |
| U4. reflection 실패 4건 | 기존 적색을 이동 회귀와 혼동하면 안 됨 | 현재 실패 원인 캡처 유지 | move acceptance 에 포함하지 않고 baseline 으로 명시 |
| U5. 루트 npm 경계 충돌 | 루트로 `package.json` 을 올리면 `client`/`server` 와 충돌 가능 | 루트 `package.json`, `.npmrc`, workspace 설정 부재, 서브패키지 유지 구조 점검 | 루트 패키지는 modules 샘플만 관리하고 `client`/`server` 는 독립 패키지로 유지됨이 증명돼야 함 |
| U6. env 추적/주입 위험 | `.env.modules` 신규 생성 시 커밋 또는 오주입 위험 | `.gitignore`, `docker-compose.yml`, 실행 스크립트의 `--env-file` 사용처 점검 | `.env.modules` 추적 제외 + 모듈 실행 명령에서만 참조되면 통과 |

## 7. Wave Plan

### Wave 0 (Spike / Contract Definition)

- Goal:
  - 승격 대상, env 전략, live/archive 경계, 검증 기준을 고정합니다.
- Steps:
  - `modules` 관련 참조를 전수 수집하고 `runtime-critical / live-doc / archive` 로 분류
  - 루트 npm 환경 경계를 점검한다: 루트 `package.json` 부재, `.npmrc` 부재, workspace 미사용, `client`/`server` 독립 유지 여부 확인
  - env 충돌 주입점을 수집한다: `.env.example`, `docker-compose.yml`, `modules/.env`, 현재 `--env-file=.env` 사용처
  - 루트 env 파일 전략을 `.env.modules` 권장안으로 확정
  - live 수정 allowlist와 archive no-touch 규칙을 확정
  - 루트 `package.json` 스크립트 재작성 요구사항(`typecheck`, `test`, tutorial commands`)을 확정
  - 기존 reflection 실패 4건을 baseline 으로 캡처
- Output artifacts:
  - allowlist가 반영된 경로 검증 기준
  - archive no-touch 규칙
  - live 경로 검색 허용 기준: active targets에서는 `cd modules` hit 0건, archive 경로만 예외
  - 루트 타깃 트리
  - 루트 npm/env 경계 체크리스트
  - known-failure baseline
- Stop condition:
  - 어떤 참조를 반드시 고치고 어떤 참조를 보존할지 명확히 설명 가능

### Wave 1 (Root Boundary Promotion)

- Goal:
  - 루트 패키지 경계와 이동 대상 디렉토리를 실제로 승격합니다.
- Parallel Tasks list:
  - T1. 루트 dependency boundary + script boundary 승격
  - T2. 루트 디렉토리 승격

### Wave 2 (Path Rewrite)

- Goal:
  - 라이브 경로 참조와 검증 경로를 최신 구조에 맞춰 재작성합니다.
- Parallel Tasks list:
  - T3. 실행 문서 및 소스 헤더 커맨드 갱신
  - T4. AGENTS / active skills metadata 갱신

### Wave 3 (Verification / Handoff)

- Goal:
  - 새 루트 경계에서 의존성을 재생성하고 이동 회귀만 분리 검증합니다.
- Parallel Tasks list:
  - T5. 루트 `node_modules` / `venv` 재생성
  - T6. modules runtime 검증 및 수동 삭제 인수인계

## 8. 작업 목록

## [P0] 경로 계약 스파이크 - 상태: 🔴 대기

**목적**: 실제 수정 전에 live/archive 경계와 env 전략을 확정합니다.
**목표 연결**: 불필요한 역사 문서 churn 을 막고, 루트 승격 acceptance 를 명확히 합니다.
**의존성**: `depends_on: []`
**병렬 가능 여부**: `parallelizable: false`
**필요 스킬**: `[intent-inference, contract-driven-testing, loading-project-context]`

**주요 변경 지점 (정확한 경로):**

- Inspect: `/home/jik/projects/adp/modules`
- Inspect: `/home/jik/projects/adp/README.md`
- Inspect: `/home/jik/projects/adp/AGENTS.md`
- Inspect: `/home/jik/projects/adp/.agents/skills`
- Inspect: `/home/jik/projects/adp/.agents/plans`
- Inspect: `/home/jik/projects/adp/.sisyphus/plans`

**예상 난이도**: 🟡 중간
**리스크**: archive 와 live 를 잘못 분류하면 과수정 또는 누락이 생깁니다.
**롤백 계획**: 스파이크 단계는 읽기 중심이므로 롤백 필요 없음.

**완료 기준:**

- [ ] `modules/.env` 와 루트 `.env` 충돌 전략이 결정됨
- [ ] 루트 npm 경계 충돌 없음이 점검됨
- [ ] live 수정 allowlist 와 archive no-touch 규칙이 문장으로 고정됨
- [ ] move acceptance 에 포함할 live path 검증 범위가 고정됨
- [ ] 기존 reflection 실패 4건을 baseline 으로 문서화함
- [ ] 검증 명령 + 기대 결과
  - Command: `rg -n 'cd modules|modules/\\.env|modules/package\\.json|/home/jik/projects/adp/modules' /home/jik/projects/adp --glob '!**/node_modules/**' --glob '!**/venv/**' --glob '!**/package-lock.json'`
  - Expected: 수정 대상과 archive 후보가 모두 식별됨
  - Command: `find /home/jik/projects/adp -maxdepth 1 \( -name 'package.json' -o -name '.npmrc' \)`
  - Expected: 루트 패키지/패키지 매니저 경계의 초기 상태가 확인됨

## [P1] 루트 실행 경계 승격 - 상태: 🔴 대기

**목적**: 루트에 새 modules runtime boundary 를 만듭니다.
**목표 연결**: 더 이상 `modules/` 하위 패키지에 의존하지 않게 만듭니다.
**의존성**: `depends_on: [P0]`
**병렬 가능 여부**: `parallelizable: false`
**필요 스킬**: `[test-driven-development, refactoring-safely, typescript-foundation-rules]`

**주요 변경 지점 (정확한 경로):**

- Move to root: `/home/jik/projects/adp/modules/package.json`
- Move to root: `/home/jik/projects/adp/modules/package-lock.json`
- Move to root: `/home/jik/projects/adp/modules/tsconfig.json`
- Move to root: `/home/jik/projects/adp/modules/requirements.txt`
- Rename on move: `/home/jik/projects/adp/modules/.env` -> `/home/jik/projects/adp/.env.modules`
- Modify: `/home/jik/projects/adp/.gitignore`

**예상 난이도**: 🟡 중간
**리스크**: 루트 `.env` 충돌, 기존 package script 오작동, root npm boundary 혼선
**롤백 계획**: 이동 파일과 `.gitignore` 수정만 원래 상태로 되돌립니다.

**완료 기준:**

- [ ] 루트 `package.json` 이 실제 numbered 디렉토리를 가리킴
- [ ] 루트 `package.json` 의 `typecheck`/`test`/실행 스크립트가 `modules/` 접두사 없이 동작하도록 재작성됨
- [ ] 루트 env 파일 전략이 적용됨 (`.env.modules` 권장)
- [ ] `.env.modules` 가 `.gitignore` 에서 추적 제외됨
- [ ] 검증 명령 + 기대 결과
  - Command: `cd /home/jik/projects/adp && npm run typecheck`
  - Expected: 루트 `tsconfig.json` 기준으로 numbered 디렉토리 타입체크가 실행됨
  - Command: `cd /home/jik/projects/adp && npm test`
  - Expected: 0 tests 가 아니라 실제 spec 가 탐지됨
  - Command: `rg -n '^\\.env\\.modules$' /home/jik/projects/adp/.gitignore`
  - Expected: `.env.modules` ignore 규칙이 존재

## [P2] 디렉토리 승격 - 상태: 🔴 대기

**목적**: 실제 학습 샘플 디렉토리를 루트로 승격합니다.
**목표 연결**: `modules` 래퍼 없이 루트에서 직접 실행 가능한 구조를 만듭니다.
**의존성**: `depends_on: [P0, P1]`
**병렬 가능 여부**: `parallelizable: false`
**필요 스킬**: `[refactoring-safely, systematic-debugging]`

**주요 변경 지점 (정확한 경로):**

- Move: `/home/jik/projects/adp/modules/01-prompts-chaining` -> `/home/jik/projects/adp/01-prompts-chaining`
- Move: `/home/jik/projects/adp/modules/02-routing-patterns` -> `/home/jik/projects/adp/02-routing-patterns`
- Move: `/home/jik/projects/adp/modules/03-paralleization` -> `/home/jik/projects/adp/03-paralleization`
- Move: `/home/jik/projects/adp/modules/04-reflection` -> `/home/jik/projects/adp/04-reflection`
- Move: `/home/jik/projects/adp/modules/05-tool` -> `/home/jik/projects/adp/05-tool`
- Move: `/home/jik/projects/adp/modules/example` -> `/home/jik/projects/adp/example`

**예상 난이도**: 🟡 중간
**리스크**: 상대경로 기반 실행 커맨드가 깨질 수 있습니다.
**롤백 계획**: 승격 디렉토리를 원위치로 되돌립니다.

**완료 기준:**

- [ ] 승격 대상 디렉토리가 모두 루트에 존재
- [ ] `modules/node_modules`, `modules/venv` 는 이동되지 않음
- [ ] 루트 파일 이동 직후 `package.json` 스크립트 경로와 numbered 디렉토리 실제 경로가 일치함
- [ ] 검증 명령 + 기대 결과
  - Command: `find /home/jik/projects/adp -maxdepth 1 -type d | sort`
  - Expected: 루트에 `01-prompts-chaining` ~ `05-tool`, `example`, `client`, `server`, `modules` 가 함께 보이고, `modules` 는 삭제되지 않음
  - Command: `find /home/jik/projects/adp -maxdepth 1 -type f | sort`
  - Expected: 루트에 `package.json`, `package-lock.json`, `tsconfig.json`, `requirements.txt`, `.env.modules` 가 존재

## [P3] 라이브 경로 참조 재작성 - 상태: 🔴 대기

**목적**: 실행 주석, README, AGENTS, skill reference 의 경로 계약을 루트 승격 구조로 맞춥니다.
**목표 연결**: 사용자가 루트에서 바로 실행/탐색할 수 있게 만듭니다.
**의존성**: `depends_on: [P1, P2]`
**병렬 가능 여부**: `parallelizable: true`
**필요 스킬**: `[refactoring-safely, typescript-foundation-rules]`

**주요 변경 지점 (정확한 경로):**

- Modify: `/home/jik/projects/adp/README.md`
- Modify: `/home/jik/projects/adp/AGENTS.md`
- Modify: `/home/jik/projects/adp/01-prompts-chaining/README.md`
- Modify: `/home/jik/projects/adp/02-routing-patterns/README.md`
- Modify: `/home/jik/projects/adp/01-prompts-chaining/*.ts`
- Modify: `/home/jik/projects/adp/02-routing-patterns/*.ts`
- Modify: `/home/jik/projects/adp/03-paralleization/*.ts`
- Modify: `/home/jik/projects/adp/04-reflection/**/*.ts`
- Modify: `/home/jik/projects/adp/05-tool/**/*.ts`
- Modify: `/home/jik/projects/adp/.agents/skills/comment-docstring-for-langchain-and-external-libs/references/prompt-template.ko.md`

**예상 난이도**: 🔴 높음
**리스크**: 라이브 자산과 archive 자산을 혼동해 과잉 수정할 수 있습니다.
**롤백 계획**: 문서/주석 경로만 되돌리고, 구조 이동은 유지합니다.

**완료 기준:**

- [ ] 활성 자산에 `cd modules` 지시가 남지 않음
- [ ] `.env.modules` 또는 최종 env 전략이 모든 실행 커맨드에 반영됨
- [ ] archive 범위(`/home/jik/projects/adp/.sisyphus/**`, 과거 `.agents/plans/**`)는 no-touch 원칙으로 분리됨
- [ ] `.agents/skills` 는 active reference 파일만 최소 변경됨
- [ ] 검증 명령 + 기대 결과
  - Command: `rg -n 'cd modules|modules/\\.env|modules/package\\.json|/home/jik/projects/adp/modules' /home/jik/projects/adp/README.md /home/jik/projects/adp/AGENTS.md /home/jik/projects/adp/.agents/skills/comment-docstring-for-langchain-and-external-libs/references/prompt-template.ko.md /home/jik/projects/adp/01-prompts-chaining /home/jik/projects/adp/02-routing-patterns /home/jik/projects/adp/03-paralleization /home/jik/projects/adp/04-reflection /home/jik/projects/adp/05-tool --glob '!**/node_modules/**' --glob '!**/venv/**'`
  - Expected: 0 hits 또는 P0 에서 합의한 allowlist 만 남음

## [P4] 의존성 재생성 및 검증 - 상태: 🔴 대기

**목적**: 새 루트 `modules runtime` 경계에서 실제 설치/실행/검증이 되는지 증명합니다.
**목표 연결**: “옮겼다”가 아니라 “루트에서 modules 샘플을 실제로 쓸 수 있다”를 증명합니다.
**의존성**: `depends_on: [P3]`
**병렬 가능 여부**: `parallelizable: false`
**필요 스킬**: `[verification-before-completion, systematic-debugging]`

**주요 변경 지점 (정확한 경로):**

- Create: `/home/jik/projects/adp/node_modules`
- Create: `/home/jik/projects/adp/venv`
- Verify: `/home/jik/projects/adp/package.json`
- Verify: `/home/jik/projects/adp/tsconfig.json`
- Verify: `/home/jik/projects/adp/requirements.txt`
- Create: `/home/jik/projects/adp/docs/modules-root-promotion-baseline.md`

**예상 난이도**: 🔴 높음
**리스크**: 기존 reflection 실패, Python/Node 설치 환경 차이, 루트 env 파일 사용 실수
**롤백 계획**: 루트 `node_modules`, `venv` 제거 후 구조/문서만 유지하고 검증 실패 원인을 분리 기록합니다.

**완료 기준:**

- [ ] 루트 `npm install` 후 `npm run typecheck` 통과
- [ ] 루트 `npm test` 가 실제 spec 를 탐지하고, 기본 스크립트는 reflection baseline spec 을 제외한 green 경로만 다룸
- [ ] 비reflection JS/TS spec 통과
- [ ] Python 파일 compile 검증 통과
- [ ] 기존 reflection 실패는 신규 회귀가 아님이 분리 기록됨
- [ ] 수동 삭제 대상 목록이 필수/비필수로 구분돼 인수인계됨
- [ ] 검증 명령 + 기대 결과
  - Command: `cd /home/jik/projects/adp && npm install && npm run typecheck`
  - Expected: PASS
  - Command: `cd /home/jik/projects/adp && npm test`
  - Expected: 0 tests 가 아니라 실제 spec 가 탐지되고, 기본 스크립트는 reflection baseline spec 을 제외한 target만 실행
  - Command: `cd /home/jik/projects/adp && node --test --experimental-strip-types ./01-prompts-chaining/*.spec.ts ./03-paralleization/*.spec.ts ./05-tool/practice/*.spec.ts ./05-tool/typescript/*.spec.ts`
  - Expected: PASS
  - Command: `cd /home/jik/projects/adp && python3 -m venv venv && ./venv/bin/pip install -r requirements.txt && find ./01-prompts-chaining ./03-paralleization ./04-reflection/example-code/python ./05-tool/origin -name '*.py' -print0 | xargs -0 ./venv/bin/python -m py_compile`
  - Expected: PASS
  - Command: `cd /home/jik/projects/adp && node --test --experimental-strip-types ./04-reflection/example-code/typescript/*.spec.ts`
  - Expected: 기존 4 fail 이 baseline 으로 동일 재현되고 `docs/modules-root-promotion-baseline.md` 에 분리 기록됨

## 9. 검증/완료 기준

## 전체 완료 조건

- [ ] 모든 P* 작업이 🟢 완료
- [ ] 루트 승격 후 실제 테스트가 0개가 아닌 상태로 수행됨
- [ ] 루트 `node_modules`, `venv` 가 새로 생성됨
- [ ] 활성 경로 참조가 최신 구조로 갱신됨
- [ ] 기존 reflection 실패 4건이 신규 회귀와 분리 기록됨
- [ ] `.env.modules` 가 추적 제외됨
- [ ] 사용자가 수동 삭제할 `modules/` 잔존물 목록이 인수인계됨

## 10. Plan Review Gate

- Reviewers: feasibility / uncertainty / smell / intent
- Merge policy: blocking first, then non-blocking

## 11. Implementation & Verification Loop

- Per-task verification:
  - 각 P 작업 종료 시 해당 경로/검증 명령을 즉시 실행하고 출력 근거를 남깁니다.
- Per-wave verification:
  - Wave 1 종료 후 루트 트리와 루트 package/script 경계 확인
  - Wave 2 종료 후 live path grep
  - Wave 3 종료 후 modules runtime 기준의 typecheck/test/py_compile/baseline 분리 확인
- Post-implementation audit:
  - requirements: 계획과 실제 변경 파일 1:1 대조
  - quality: 거짓 녹색 제거 여부, archive no-touch 규칙 준수 여부
  - security: `.env.modules` 가 불필요하게 compose/runtime 에 섞이지 않는지 확인

## 12. 다른 모델/세션 전달용 컨텍스트

## 📌 컨텍스트 요약 (다른 세션 전달용)

### 현재 진행 상황

- 완료:
  - 구조/문서/skills/검증 영향 범위 조사
  - 현재 baseline 검증 확보 (`modules` typecheck PASS, `npm test` 거짓 녹색, 실제 spec 36 pass / 4 fail)
- 진행중:
  - 없음. 아직 구현 시작 전
- 블로킹:
  - 없음. 단, `.env.modules` 전략과 archive allowlist 를 Wave 0 에서 먼저 고정해야 함

### 핵심 결정 사항

- 루트 승격은 `client`/`server` 유지, `modules` runtime boundary 만 이동
- `modules/node_modules`, `modules/venv` 는 이동하지 않고 루트에 새로 생성
- 루트 env 파일은 `.env.modules` 분리안을 기본 권장
- `.sisyphus/**`, 과거 `.agents/plans/**` 는 archive no-touch 기본 원칙으로 둠
- 기존 reflection 실패 4건은 이번 이동 acceptance 에 포함하지 않음

### 주의 사항

- 현재 `npm test` success 를 그대로 신뢰하면 안 됩니다. 0 tests 입니다.
- `.sisyphus/plans/**` 와 과거 `.agents/plans/**` 는 archive 성격이 강하므로 live contract 검증과 구분해서 다뤄야 합니다.
- 사용자가 직접 삭제할 `modules/` 잔존물까지 자동 정리하지 않습니다.

## 13. Plan Review Gate Results

- Feasibility: APPROVE with changes
- Uncertainty: REJECT before changes, addressed
- Smell: REJECT before changes, addressed
- Intent: APPROVE with changes

### Review Log

- Change 1: `.agents/plans`/`.sisyphus/plans` 전체 수정 범위를 제거하고 archive no-touch 원칙을 명시했습니다.
  - Reason: 실행 자산 경로 갱신에 필요한 최소 범위만 수정해 스코프 드리프트를 막기 위해서입니다.
- Change 2: `modules-root-promotion.contract.spec.ts` 도입을 제거하고 1회성 셸 검증으로 대체했습니다.
  - Reason: 구조 승격 전용 테스트 부채를 남기지 않고, 사용자 요청 범위에 맞는 검증만 유지하기 위해서입니다.
- Change 3: Wave 0에 루트 npm 경계 점검과 env 주입점 수집을 추가했습니다.
  - Reason: 루트 `package.json` 승격 후 실행 계약 충돌 가능성을 사전에 제거하기 위해서입니다.
- Change 4: 루트 `package.json` 스크립트 재작성을 P1 완료 기준으로 명시했습니다.
  - Reason: 현재 `npm test` 0-tests 거짓 녹색을 계획 수준에서 직접 해소해야 하기 때문입니다.
- Change 5: `.gitignore`에 `.env.modules` 추적 제외를 필수 단계로 포함했습니다.
  - Reason: 민감 정보 우발 커밋을 방지하는 안전 가드가 필수라는 리뷰를 반영했습니다.
- Change 6: `client`/`server` typecheck 를 필수 acceptance 에서 제거하고 modules runtime 검증으로 범위를 축소했습니다.
  - Reason: 사용자 요청은 modules 승격이며, 교차 패키지 실패 원인 분리를 흐리지 않기 위해서입니다.
- Change 7: reflection 4 fail baseline 분리 기록 파일과 수동 삭제 대상 인수인계를 완료 기준에 추가했습니다.
  - Reason: 기존 실패와 신규 회귀를 분리하고, 사용자의 수동 삭제 작업을 정확히 이어주기 위해서입니다.
