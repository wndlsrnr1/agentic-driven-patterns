---
description: Development workflow — APIView-only controllers, strict service-layer access to models
globs: "**/*.py"
alwaysApply: false
---

## Development Workflow (Project Standard)

- **Controller**: DRF `APIView` only; thin request handling.
- **Service**: All business logic, transactions, authorization, and orchestration.
- **Repository**: Optional data-access abstraction over ORM queries.
- **Model**: Domain state + intrinsic invariants; no cross-aggregate rules.

### Rules

- No direct model access from views/serializers.
- Serializers do not perform ORM queries.
- Service methods accept validated input and return domain objects/DTOs.
- Map service exceptions to HTTP responses in views.

### Error Handling

- Define `ServiceError` with `status_code`.
- Log at service level; views must not log secrets/PII.

### Testing

- Unit-test services and repositories directly.
- API tests focus on wiring, permissions, and status codes.
