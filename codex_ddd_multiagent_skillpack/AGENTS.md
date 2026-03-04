# Codex Workflow Contract (DDD + Clean Architecture + Feedback Loop)

## 0) 최상위 원칙 (불변 조건)
- “사용자 궁극 의도 + 성공 기준”이 최상위 도메인 목표다. 모든 계획/구현/리뷰는 여기로 트레이스 가능해야 한다.
- 사용자가 “구현”을 명시적으로 요청하기 전에는 파일 수정/코드 구현을 하지 않는다(계획/리뷰/조사만).
- 계획은 반드시 파일로 남긴다: `.agents/plans/PLAN.<slug>.md`
- 계획 이후에는 병렬 리뷰(실현가능성/불확실성/스멜/의도정렬)로 결함을 선제 제거한다.
- 구현은 Wave/Task로 쪼개고, Wave 단위로 “구현→검증”을 반복한다.
- 불확실성은 Wave 0(스파이크/계약정의)로 먼저 깨뜨리고, 계약이 생기면 최소 계약 테스트(골든/엣지/회귀)부터 고정한다.
- 사후 감사(Post)도 병렬(보안/요구사항/품질)로 돌려서 누락을 잡는다.

## 1) 의도/요구사항 단계
- 사용자가 아직 잘 모르는 상태(아이디어, 옵션 탐색, 라이브러리 추천 필요):
  - $intent-discovery를 사용해 질문/조사/옵션을 통해 “Intent Brief”를 만들고 합의한다.
- 사용자가 이미 어느 정도 알고 지시하는 상태:
  - $intent-inference로 “사용자 진의(Why) + 성공 기준(How to verify)”를 먼저 고정하고, 필요한 최소 질문만 한다.

## 2) 계획 단계
- $plan-writer-ddd로 PLAN 파일 생성:
  - 목적/비목적(Out of scope), 수용 기준(실행 가능한 검증 커맨드), DDD 경계, Clean Architecture 레이어, Wave/Task, 리스크/불확실성, 테스트 전략(Contract-driven)을 포함한다.

## 3) 계획 리뷰 단계
- $plan-review-fanout으로 4개 관점 리뷰를 병렬로 수행한다:
  - feasibility_reviewer: 실현 가능성/실행 가능성(명령/의존성/환경)
  - uncertainty_analyst: unknown/assumption/스파이크 설계
  - smell_detector: DDD 경계 붕괴/과추상화/과결합/스멜
  - intent_guard: 사용자 궁극 의도 정렬/스코프 드리프트
- 각 리뷰는 고정된 출력 계약(VERDICT + Blocking + Suggestions)을 준수한다.
- 리뷰 결과를 반영해 PLAN을 업데이트한다. (반영 후 “변경 이유”를 PLAN에 기록)

## 4) 구현 단계 (사용자 요청 시)
- $wave-executor로 PLAN을 읽고 Wave별로 실행한다.
- Wave마다:
  - Task 단위로 병렬 처리(충돌/의존성 고려)
  - Task 완료 시 “최소 검증”을 수행(계약/테스트/커맨드)
  - Wave 종료 시 “Wave 검증 커맨드” 실행
- Wave 0(스파이크)은 “정의 만들기(계약/데이터/예제/제약)”가 목적이며, 여기서는 데모/관측 결과를 남긴다.

## 5) 사후 감사 단계 (완료 후)
- $post-implementation-audit로 병렬 사후 리뷰:
  - security_auditor: 보안/취약점/비밀키/권한
  - requirements_auditor: PLAN 수용 기준/요구사항 충족 여부
  - quality_reviewer: 코드 품질/테스트/리팩터링 안전성/스멜
- Reject가 있으면 수정 후 해당 감사만 재실행한다.

## 6) 산출물 규칙
- PLAN 파일에는 다음이 항상 있어야 한다:
  - “목적/성공 기준/비목적”
  - “Wave/Task + 의존성”
  - “불확실성 레지스터 + Wave 0 설계”
  - “테스트 전략(Contract-first, Risk-driven)”
  - “리뷰 로그(누가 무엇을 지적했고 어떻게 반영했는지)”
