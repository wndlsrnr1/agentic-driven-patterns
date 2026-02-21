# ADP Server 한국어 Docstring 가이드

## 목적
- TypeScript/NestJS를 처음 접하는 사람이 코드만 읽고도 호출 흐름과 책임 경계를 이해하도록 돕는다.
- `korean-docstring-context-typescript` 규칙을 서버 코드에 일관되게 적용한다.

## 적용 범위
- 인라인 JSDoc: `adp/server/src/**/*.ts`, `adp/server/jest.config.ts`
- 인라인 주석: `adp/server/Dockerfile`, `adp/server/.dockerignore`
- 사이드카 문서: JSON/생성 파일(`package*.json`, `tsconfig*.json`, `nest-cli.json`, `node_modules/**`)

## 필수 서술 항목
- 호출자/사용자: 누가 이 코드(설정)를 호출하는가
- 사용 목적: 언제 왜 사용하는가
- 데이터 흐름: 입력이 어디서 오고 어디로 가는가
- 부작용: 네트워크 호출, 전역 상태 변경, I/O
- 오류 조건: 어떤 경우 예외가 발생하는가

## JSDoc 템플릿
```ts
/**
 * [한 줄 요약]
 *
 * Context:
 * - 호출자:
 * - 사용 목적:
 * - 데이터 흐름:
 *
 * Side effects:
 * - [없음 또는 구체적 부작용]
 *
 * @param ...
 * @returns ...
 * @throws ...
 */
```

## 작성 원칙
- 타입 시그니처를 반복하지 않고, 의도/제약/실패 조건을 적는다.
- 컨트롤러에는 비즈니스 구현 설명이 아니라 위임 경계를 적는다.
- 유스케이스에는 오케스트레이션 흐름을 적는다.
- 인프라 어댑터에는 외부 의존성과 부작용을 명시한다.
- 테스트 파일에는 “무엇을 보호하는 회귀 테스트인지”를 명시한다.

## 금지 규칙
- 추측 기반 문장 금지(실제 호출 경로를 확인 후 작성).
- “값을 대입한다” 같은 구현 반복형 문장 금지.
- JSON 파일에 인라인 주석 추가 금지(JSON 표준 위반).
