---
description: AI 요약 생성 — ChatGPT API 통합, 프롬프트 관리, Advanced 요약
globs: "**/services/**/*summary*.py", "**/services/**/*ai*.py", "**/clients/**/*chatgpt*.py"
alwaysApply: false
---

## AI 요약 생성 가이드

### 통합 원칙

1. **Service Layer에서만 호출**: ChatGPT API 호출은 Service Layer에서만 수행
2. **프롬프트 관리**: 사용자 프롬프트와 관리자 프롬프트 결합 전송
3. **에러 처리**: API 실패 시 적절한 에러 처리 및 재시도 로직
4. **비동기 처리**: 요약 생성은 장시간 작업이므로 반드시 비동기 처리
5. **토큰 관리**: 토큰 사용량 모니터링 및 제한 관리

### ChatGPT Client 구조

**Base Client 인터페이스**:
- `complete(prompt, model, max_tokens)`: 프롬프트 전송 및 응답 받기
- API 키 및 base_url 설정

**구현 클래스**:
- `OpenAIChatGPTClient`: OpenAI API 클라이언트
- 필요시 다른 제공업체 클라이언트 추가 가능

### Summary Service 패턴

**기본 요약 생성**:
- Pipeline: `load STT → load prompts → combine → call ChatGPT → save summary`
- 프롬프트 결합: 관리자 프롬프트 + 사용자 프롬프트 + STT 텍스트
- 토큰 사용량 저장: 모니터링을 위해 사용량 정보 저장

**Advanced 요약 생성**:
- Pipeline: `load Advanced STT → format with speakers → combine prompts → call ChatGPT → save`
- 화자별 포맷팅: `[화자명]: 텍스트` 형식으로 포맷팅
- 화자별 의견 구분: Advanced STT의 화자 정보 활용

### 프롬프트 관리

**모델 구조**:
- `name`: 프롬프트 이름
- `text`: 프롬프트 내용
- `is_default`: 기본 프롬프트 여부
- `is_active`: 활성화 여부

**Repository 메서드**:
- `get_default_prompt()`: 기본 프롬프트 조회
- `get_active_prompts()`: 활성화된 프롬프트 목록 조회

### 비동기 처리

**Celery 태스크 패턴**:
- `@shared_task(bind=True, max_retries=3)`: 재시도 가능한 태스크
- Service Layer 호출하여 실제 로직 수행
- 재시도 로직: 지수 백오프
- 최대 재시도 후 상태 업데이트

### 토큰 사용량 모니터링

**모니터링 항목**:
- 총 토큰 사용량
- 프롬프트 토큰 사용량
- 완성 토큰 사용량
- 월별 집계

**Repository 메서드**:
- `find_by_date_range(start_date, end_date)`: 기간별 요약 조회
- 토큰 사용량 집계 및 반환

### 설정 관리

```python
# settings.py
CHATGPT_API_KEY = env("CHATGPT_API_KEY", default="")
CHATGPT_BASE_URL = env("CHATGPT_BASE_URL", default="https://api.openai.com/v1")
CHATGPT_MODEL = env("CHATGPT_MODEL", default="gpt-4")
CHATGPT_MAX_TOKENS = env.int("CHATGPT_MAX_TOKENS", default=2000)
CHATGPT_TIMEOUT = env.int("CHATGPT_TIMEOUT", default=60)  # 1 minute
CHATGPT_MONTHLY_TOKEN_LIMIT = env.int("CHATGPT_MONTHLY_TOKEN_LIMIT", default=1000000)
```

### 테스트 가이드

**모킹 전략**:
- ChatGPT Client를 모킹하여 실제 API 호출 방지
- Repository를 모킹하여 DB 접근 최소화
- 프롬프트 결합 로직 검증

**테스트 케이스**:
- 성공 시나리오: 요약 생성 성공 및 저장
- 실패 시나리오: API 에러 처리
- 프롬프트 결합: 관리자 + 사용자 프롬프트 결합 검증

### 금지 사항

1. **View에서 직접 호출**: ChatGPT API는 View에서 직접 호출하지 않음
2. **동기 처리**: 요약 생성을 동기로 처리하지 않음 (타임아웃 위험)
3. **하드코딩**: API 키나 모델을 코드에 하드코딩하지 않음
4. **프롬프트 하드코딩**: 프롬프트를 코드에 하드코딩하지 않고 DB에서 관리
5. **토큰 무시**: 토큰 사용량을 모니터링하지 않음
6. **재시도 없음**: 네트워크 에러 시 재시도 로직 없이 실패 처리하지 않음