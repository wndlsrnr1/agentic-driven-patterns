---
description: STT API 통합 — 다글로/네이버 STT API 통합 패턴, 화자 구분, Advanced STT
globs: "**/services/**/*stt*.py", "**/clients/**/*stt*.py"
alwaysApply: false
---

## STT API 통합 가이드

### 통합 원칙

1. **Service Layer에서만 호출**: STT API 호출은 Service Layer에서만 수행
2. **Provider 추상화**: 다글로/네이버 등 여러 제공업체 지원
3. **에러 처리**: API 실패 시 적절한 에러 처리 및 재시도 로직
4. **비동기 처리**: STT 변환은 장시간 작업이므로 반드시 비동기 처리
5. **설정 관리**: API 키 및 제공업체 선택은 Django 설정으로 관리

### STT Client 구조

**Client Factory 패턴**:
- `STTClientFactory.create(provider)`: 설정 기반으로 적절한 클라이언트 반환
- 다글로/네이버 등 여러 제공업체 지원

**Base Client 인터페이스**:
- `transcribe(audio_path)`: 기본 STT 변환
- `transcribe_with_speakers(audio_path)`: 화자 구분 STT 변환

**구현 클래스**:
- `DagloSTTClient`: 다글로 API 클라이언트
- `NaverSTTClient`: 네이버 API 클라이언트

### STT Service 패턴

**기본 STT Service**:
- Pipeline: `validate → load audio → call STT API → save result`
- 상태 관리: `pending` → `processing` → `completed`/`failed`
- 에러 처리: API 실패 시 상태를 `failed`로 업데이트

**Advanced STT Service**:
- Pipeline: `STT with speakers → ChatGPT filtering → Speaker matching → save`
- ChatGPT 필터링: 텍스트 정리 및 불필요한 부분 제거
- 화자 매칭: 참가자 이름 기반 화자 구분

### 비동기 처리

**Celery 태스크 패턴**:
- `@shared_task(bind=True, max_retries=3)`: 재시도 가능한 태스크
- Service Layer 호출하여 실제 로직 수행
- 재시도 로직: 지수 백오프 (exponential backoff)
- 최대 재시도 후 상태를 `failed`로 업데이트

### 에러 처리

**에러 분류**:
- **재시도 가능**: 타임아웃, Rate limit (429), 서버 에러 (503)
- **재시도 불가**: 인증 실패 (401, 403), 잘못된 요청 (400)

**에러 처리 흐름**:
- API 에러 발생 → 로깅 → 재시도 가능 여부 확인 → 재시도 또는 실패 처리

### 설정 관리

```python
# settings.py
STT_PROVIDER = env("STT_PROVIDER", default="naver")  # "daglo" or "naver"
DAGLO_API_KEY = env("DAGLO_API_KEY", default="")
NAVER_API_KEY = env("NAVER_API_KEY", default="")

# STT API 설정
STT_MAX_FILE_SIZE = env.int("STT_MAX_FILE_SIZE", default=100 * 1024 * 1024)  # 100MB
STT_TIMEOUT = env.int("STT_TIMEOUT", default=300)  # 5 minutes
STT_RETRY_COUNT = env.int("STT_RETRY_COUNT", default=3)
```

### 테스트 가이드

**모킹 전략**:
- STT Client를 모킹하여 실제 API 호출 방지
- Repository를 모킹하여 DB 접근 최소화
- 상태 업데이트 검증

**테스트 케이스**:
- 성공 시나리오: STT 변환 성공 및 상태 업데이트
- 실패 시나리오: API 에러 처리 및 상태 업데이트
- 재시도 시나리오: 네트워크 에러 시 재시도 로직

### 금지 사항

1. **View에서 직접 호출**: STT API는 View에서 직접 호출하지 않음
2. **동기 처리**: STT 변환을 동기로 처리하지 않음 (타임아웃 위험)
3. **하드코딩**: API 키나 제공업체를 코드에 하드코딩하지 않음
4. **에러 무시**: STT API 에러를 무시하거나 로그만 남기지 않음
5. **재시도 없음**: 네트워크 에러 시 재시도 로직 없이 실패 처리하지 않음
