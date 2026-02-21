---
description: 비동기 작업 — Celery 태스크, 장시간 작업 처리, 상태 관리
globs: "**/tasks/**/*.py", "**/services/**/*async*.py"
alwaysApply: false
---

## 비동기 작업 가이드

### 원칙

1. **장시간 작업은 반드시 비동기**: STT 변환, 요약 생성 등은 Celery 태스크로 처리
2. **상태 관리**: 작업 상태를 DB에 저장하고 주기적으로 업데이트
3. **재시도 로직**: 네트워크 에러 등은 자동 재시도
4. **에러 처리**: 실패 시 상태를 명확히 기록하고 로깅

### 사용 시나리오

**비동기 처리 필요**:
- STT 변환 (다글로/네이버 API 호출)
- AI 요약 생성 (ChatGPT API 호출)
- Advanced STT (ChatGPT 필터링 + 화자 매칭)
- 대용량 파일 처리

**동기 처리 가능**:
- 간단한 CRUD 작업
- 빠른 응답이 필요한 작업 (< 1초)

### Celery 태스크 패턴

#### 기본 구조

```python
from celery import shared_task

@shared_task(bind=True, max_retries=3)
def long_running_task(self, resource_id: int):
    # 1) 상태를 "processing"으로 업데이트
    # 2) Service Layer 호출
    # 3) 성공/실패에 따라 상태 업데이트
    # 4) 재시도 로직 (필요시)
    pass
```

#### Service에서 트리거

```python
class AudioService:
    def upload_and_convert(self, audio_file, user):
        # 1) 리소스 저장 (status="pending")
        # 2) Celery 태스크 트리거
        # 3) 즉시 응답 반환
        pass
```

### 상태 관리

**상태 값**:
- `pending`: 대기 중
- `processing`: 처리 중
- `completed`: 완료
- `failed`: 실패

**상태 업데이트 시점**:
- 작업 시작: `pending` → `processing`
- 작업 완료: `processing` → `completed`
- 작업 실패: `processing` → `failed`

### 재시도 전략

**재시도 조건**:
- 네트워크 타임아웃
- 일시적 API 에러 (429, 503 등)
- 재시도 가능한 에러

**재시도 불가 조건**:
- 인증 실패 (401, 403)
- 잘못된 요청 (400)
- 최대 재시도 횟수 초과

### 에러 처리

**로깅**:
- 작업 시작/완료: INFO 레벨
- 에러 발생: ERROR 레벨 (상세 정보 포함)
- 재시도: WARNING 레벨

**상태 업데이트**:
- 실패 시 `failed` 상태로 업데이트
- 에러 메시지 저장 (선택)

### 금지 사항

1. **View에서 직접 태스크 호출**: Service Layer를 통해서만 트리거
2. **동기 처리**: 장시간 작업을 동기로 처리하지 않음
3. **상태 무시**: 작업 상태를 추적하지 않음
4. **재시도 없음**: 네트워크 에러 시 재시도 로직 없음
5. **에러 무시**: 실패 시 상태 업데이트 없음