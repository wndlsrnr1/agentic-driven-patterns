다음 파일에 주석/Docstring만 강화해줘. 로직/타입/출력 계약은 절대 바꾸지 마.

대상 파일:
- <TARGET_FILE_PATH>

목표:
- TypeScript/LangChain 초보자가 이 파일만 읽고 전체 흐름을 이해하게 만들기
- 라이브러리 지식이 0인 사람 기준으로 설명

필수 요구:
1) 파일 상단에 "통합 관점 개요" 추가
- 데이터 흐름: 입력 -> 라우팅 결정 -> 분기 실행 -> 결과
- 라이브러리 역할 설명은 특정 목록 예시로 제한하지 말고, 실제 코드에 등장한 모든 LangChain/외부 라이브러리 기준으로 작성

2) 파일에 "미니 용어집" 섹션 추가
- Runnable, Sequence, Branch, Assign, Passthrough, PromptTemplate, OutputParser를 초보자 용어로 1~2문장씩 설명

3) 각 라이브러리의 "실제 사용처" 바로 위에 주석 추가
- 대상: 모든 LangChain 및 외부 라이브러리 사용처
- 형식(반드시 동일):
  - Library Role: 라이브러리의 일반적 역할
  - Why Here: 이 코드에서 왜 필요한지
  - Signature: 이 코드에서의 입력/출력 시그니처
  - Failure Mode: 초보자가 흔히 겪는 실패 포인트
  - Alternative: 대체 접근 1개

4) 함수 JSDoc 규칙
- 핵심 함수에 한국어 JSDoc 추가
- 포함 항목: Context(호출자/목적/데이터 흐름), @param, @returns, 필요 시 Side effects/@throws

5) 금지
- 로직 변경 금지
- export 변경 금지
- 테스트 코드 수정 금지
- 불필요한 리팩토링 금지

완료 보고 형식:
- 어떤 라이브러리 주석을 어느 사용처에 추가했는지 file:line으로 보고
- 아래 명령 실행 결과도 같이 보고
  - cd modules && npm run typecheck
  - cd modules && node --check --experimental-strip-types ./routing-patterns/coordinator-routing.workflow.example.ts

핵심:
- 특정 라이브러리 목록은 예시일 수 있으므로, 실제 코드에 등장한 모든 LangChain/외부 라이브러리를 커버하라.
- 스타일 취향보다 형식 필드 강제를 우선하라.

