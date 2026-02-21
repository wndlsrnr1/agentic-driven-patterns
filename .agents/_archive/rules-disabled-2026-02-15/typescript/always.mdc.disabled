---
description: React state and effects — derived in render/useMemo; React Query for async; useReducer for compound; useEffect only for real side effects; mobile-first; no verbose or over-optimization
globs: "**/*.ts", "**/*.tsx"
alwaysApply: false
---

파생 상태는 계산으로 처리: props/state로 바로 렌더하거나, 꼭 필요할 때만 useMemo로 계산 값을 만들고 별도 상태로 두지 않습니다. 불필요한 sync용 useEffect를 줄입니다.

이벤트 기반으로 갱신: 사용자 입력/이벤트 시 setState로 바로 상태를 갱신하고, 후속 로직은 그 값에 의존해 렌더에서 계산합니다. "값 변경 → 후속 계산"을 useEffect에 두지 말고 계산식으로 표현합니다.

비동기 데이터는 React Query v5: useQuery/useMutation으로 서버 상태를 관리하고, 로딩/에러/데이터를 바로 JSX에 사용합니다. 별도 useEffect로 fetch/setState 하지 않습니다.

복합 상태 전환은 useReducer: 여러 상태가 함께 변할 때 effect 대신 "액션 → 리듀서"로 명시적 전이 테이블을 만듭니다.

커스텀 훅으로 역할 분리: 데이터 로딩, 폼 상태, 타이머 등 effect가 필요한 로직을 훅으로 감싸고, 컴포넌트는 "무엇을 한다"만 호출합니다. 의존성을 훅 내부에서 단일 책임으로 관리합니다.

의존성 명시 원칙: "이 값이 바뀔 때마다 해야 하는 일인가?"를 먼저 확인하고, 아니라면 effect 대신 계산/이벤트/리듀서로 전환합니다. effect는 진짜로 외부 I/O나 구독 해제 등이 필요한 경우에만 사용합니다.

적용 순서 가이드
fetch/setState 형태의 useEffect → React Query로 이동
입력값 변화에 따른 파생 값 setState → 렌더 계산 또는 최소 useMemo
여러 상태를 동시에 맞추는 effect → useReducer로 상태 전이 정의
남는 effect는 "구독/타이머/브라우저 API 사용/로그 전송" 같은 진짜 사이드이펙트만 유지

**모바일**: 웹·앱 패키징 전제. 모바일 환경에 맞는 CSS·className 사용.

**필수**: 구현 전 공통 로직 존재 여부 검토.

**금지**: 한 번에 긴 코드, 장황한 코드, useEffect 남발, 과도한 방어 코드, useMemo 남발, 깊은 depth.
