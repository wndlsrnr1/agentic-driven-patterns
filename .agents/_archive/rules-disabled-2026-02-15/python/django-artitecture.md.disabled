---
description: Django layered architecture — Controller/Service/Repository/Model; Kantar STT·AI요약·비동기·파일·역할
globs: "**/*.py"
alwaysApply: false
---

## Layered Architecture (Kantar 음성 분석 시스템)

### 프로젝트 특성

이 프로젝트는 **Kantar 음성 녹음 및 AI 분석 시스템**으로, 다음 도메인 특성을 가집니다:
- **STT 변환**: 다글로/네이버 API 통합, 화자 구분
- **AI 요약**: ChatGPT API를 통한 요약 생성
- **비동기 작업**: STT 변환, 요약 생성 등 장시간 작업
- **파일 처리**: 오디오 파일 업로드/저장/다운로드
- **역할 기반**: 사용자/관리자 기능 분리

## Layered Architecture (Project Standard)

### Layers

- **Controller (APIView)**: Request parsing, serializer validation, response mapping. No ORM/business logic.
- **Service**: Business rules, authorization, transactions, orchestration. The only layer allowed to call repositories/models.
- **Repository (optional)**: Encapsulate ORM queries and persistence.
- **Model**: Domain state and intrinsic validation.

### Golden Rules

- Views/serializers must not import models or repositories.
- Serializers never execute queries for validation.
- Services expose clear methods (e.g., `create`, `update`, `list`, `retrieve`, `delete`).
- Services raise domain-specific errors carrying HTTP status hints.

### Example Wiring

```python
# controller.py
class ThingCreateAPIView(APIView):
    def post(self, request):
        s = ThingCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            obj = ThingService.create(s.validated_data, user=request.user)
        except ServiceError as e:
            return Response({"detail": str(e)}, status=e.status_code)
        return Response(ThingReadSerializer(obj).data, status=201)

# services.py
class ThingService:
    @staticmethod
    def create(data: dict, user) -> Thing:
        with transaction.atomic():
            # business rules + repository calls
            return ThingRepository.create(data | {"owner": user})

# repositories.py
class ThingRepository:
    @staticmethod
    def create(data: dict) -> Thing:
        return Thing.objects.create(**data)
```

### Prohibited

- Model/ViewSet/Generic CBV that directly reference models.
- Business logic in views/serializers or middleware.

## Practical Layer Guide (Integrated)

Below is a concise, practical guide for splitting Django into `utils / serializer / service / validationservice / repository / model / view`, the "no direct reference" rules, and the Generic `BaseRepository` inheritance conventions. Only essential dependency and lifecycle boundaries are defined.

Note: This project standardizes on DRF APIView controllers (no ViewSets) for HTTP endpoints. Any mentions of ViewSet below are general guidance; in this codebase use APIView.

---

# 1) Layer Role Summary

* **Model**

  * Domain entity mapped 1:1 to a DB table.
  * Field constraints (unique, null, choices) and minimal invariants only.
  * No business-flow or transaction logic.

* **Repository**

  * Persistence layer for a specific model (encapsulates the ORM).
  * CRUD, read optimizations (`select_related`, `prefetch_related`), locking (`select_for_update`).
  * No business rules or state transitions.

* **ValidationService**

  * Validates domain rules that span beyond a single model field (e.g., refundable state, ownership, limits, cross-entity constraints).
  * Responsible only for evaluation. No side effects (no writes, no notifications).

* **Service**

  * Use-case orchestration (call multiple repositories, apply ValidationService checks, define transaction boundaries).
  * Drives state transitions, emits domain events, writes audit logs.
  * Ignorant of HTTP/serialization formats.

* **Serializer (DRF)**

  * Input parsing → `validated_data`; output serialization → `.data`.
  * Only simple field-level checks; complex domain rules go to ValidationService.
  * No DB access or business transitions.

* **View (DRF View/APIView)**

  * HTTP endpoint: auth/permissions, bind serializers, call services, return responses.
  * No domain logic.

* **Utils**

  * Domain-agnostic pure functions (dates/strings/images/hashes).
  * No side effects or DB access.

---

# 2) "No Direct Reference" Matrix

| From \ To             | Utils | Serializer | ValidationService |    Repository |         Model |  Service |     View |
| --------------------- | ----: | ---------: | ----------------: | ------------: | ------------: | -------: | -------: |
| **Utils**             |     ✅ |         🚫 |                🚫 |            🚫 |            🚫 |       🚫 |       🚫 |
| **Serializer**        |     ✅ |   ✅(self) |          ✅(delegate rules) |            🚫 |            🚫 |       🚫 |       🚫 |
| **ValidationService** |     ✅ |         🚫 |       ✅(internal calls OK) |             ✅ |   ✅(types/constants) |       🚫 |       🚫 |
| **Repository**        |     ✅ |         🚫 |                🚫 | ✅(self/peer repos) |             ✅ |       🚫 |       🚫 |
| **Service**           |     ✅ |         🚫 |                 ✅ |             ✅ |      ✅(types/constants) | ✅(internal helpers) |       🚫 |
| **View**              |     ✅ |          ✅ |                 ✅ |             ✅ | 🚫(no direct ORM) |        ✅ | ✅(framework) |

*Key prohibitions*

  * Forbid View↔Model direct queries, Serializer↔Repository direct calls, Service↔Serializer mutual dependencies.
  * Repository must not make business judgements; ValidationService must not perform writes or side effects.

---

# 3) Lifecycle (Request → Response) Flow

`View → Serializer (input parsing) → ValidationService (rule checks) → Service (transactions/state transitions) → Repository (DB) → Service → Serializer (output) → View (Response)`

* Transaction boundaries live in **Service** (`@transaction.atomic`).
* Repository handles **DB I/O only**, ValidationService handles **rules only**, Serializer handles **transformations only**.

---

# 4) BaseRepository (Generic) Conventions

The current approach is solid. Add these practical conventions in production.

## 4.1 Mandatory conventions

* **One repository per model**: `UserSocialAccountRepository(BaseRepository[UserSocialAccount])`.
* **Clarify return types**: `Optional[T]`, `QuerySet[T]`.
* **Separate read vs write method names**: `find_/get_/list_` vs `create/update/delete`.
* **Defend against duplicates/races**: `exists_*`, `get_or_create_*`, `update_or_create_*`.
* **Performance hot spots**: `select_related`, `prefetch_related`, `only/defer`, batch `bulk_create/bulk_update`.
* **Locking** (contention domains): provide `select_for_update()` methods for services.

## 4.2 Improvement patterns

* **Query/read layering**

  * `get_by_id(pk)` returns None if absent (service maps to error).
  * When "raise if missing" is needed, transform to exceptions in the service.

* **Write safety**

  * `update(instance, **fields)` sets `update_fields` to only changed fields.
  * For bulk changes, expose dedicated `QuerySet.update()` methods.

* **Consistent error policy**

  * Repository should not leak ORM exceptions (return None), or map to a repository-specific exception.
  * Service maps these to domain/HTTP errors.

* **Slice/pagination**

  * Provide a thin wrapper like `paginate(filters, page, size) -> Page[T]` (views must not slice querysets directly).

---

# 5) ValidationService vs Serializer Boundary

* **Serializer**: format checks (required/type/range), light cross-field checks.
* **ValidationService**: domain rules (e.g., "already purchased episodes cannot be repurchased", "refund window is 7 days", "must have sufficient points").
* **Dependency**: ValidationService reads via repositories and only evaluates; Service performs the state transition based on the result.

---

# 6) Service Conventions (Transactions & Orchestration)

* **Transaction boundary** per use case (`@transaction.atomic`).
* **Locking when needed**: repositories expose `get_for_update(...)` and services call it.
* **Events/notifications**: emit in post-commit hooks to avoid double execution.
* **I/O format ignorance**: serializers own request/response shaping.

---

# 7) View & Serializer Conventions (HTTP Boundary)

* **View**

  * Auth/permissions → parse input via serializer → call ValidationService as needed → execute service → respond with output serializer.
  * Never call ORM/repositories directly (hurts testability).

* **Serializer**

  * Use `.is_valid()` for input parsing/format checks, delegate domain validation.
  * Do not hide service calls inside `.save()`; call services explicitly in views.

---

# 8) Utils Conventions

* **Pure functions only** (inputs → output, no side effects/state).
* Do not reference domain-owned constants/policy values (those belong to ValidationService/Service).

---

# 9) Directory Example (Kantar 프로젝트 구조)

```
app/
  models/
    project.py
    session.py
    audio_file.py
    stt_data.py
    summary.py
  repositories/
    base.py
    project_repository.py
    session_repository.py
    audio_file_repository.py
    stt_data_repository.py
    summary_repository.py
  services/
    project_service.py
    stt_service.py
    advanced_stt_service.py
    summary_service.py
    file_service.py
  validations/
    project_rules.py
    stt_rules.py
  serializers/
    project.py
    stt.py
    summary.py
  views/
    project_view.py
    stt_view.py
    summary_view.py
  utils/
    audio_utils.py
    file_utils.py
  tasks/  # Celery tasks for async operations
    stt_tasks.py
    summary_tasks.py
```

---

# 10) Brief Comments on Repository Code

* The current structure is good. We recommend:

  1. Provide `get_for_update(pk)` (mandatory in contention-prone domains).
  2. Add `exists_*`, `get_or_create_*` to defend against duplicates/races.
  3. Bundle read-optimized methods like `list_with_relations()` with `select_related/prefetch_related`.
  4. Standardize exception exposure (None when absent; map other ORM exceptions to `RepoException`).
  5. Strengthen return type hints (`QuerySet[ModelT]`, `Optional[ModelT]`) to maximize static typing benefits.