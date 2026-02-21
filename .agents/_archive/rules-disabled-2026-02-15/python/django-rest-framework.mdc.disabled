---
description: DRF usage — APIView + serializers for I/O, services for business logic, no ViewSets
globs: "**/serializers.py", "**/views.py"
alwaysApply: false
---

## DRF (Project Standard)

- **Views**: Use `APIView` only. No `ViewSet`/`ModelViewSet`.
- **Serializers**: Request/response schema + primitive validation only; no ORM queries.
- **Services**: All business logic and database access via service/repository layer.
- **Permissions**: Implement with DRF permission classes; keep views thin.
- **Pagination/Filters**: Apply in services or dedicated utilities, not inside serializers.

### Serializer Pattern

```python
from rest_framework import serializers

class ExampleCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=100)

    def validate(self, attrs):
        # Basic, non-DB validation only
        return attrs

class ExampleReadSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    name = serializers.CharField()
```

### View + Service Wiring

```python
class ExampleAPIView(APIView):
    def post(self, request):
        s = ExampleCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        obj = ExampleService.create(s.validated_data)
        return Response(ExampleReadSerializer(obj).data, status=201)
```

### Authentication & Permissions

- Use JWT (simplejwt) and DRF permissions (`IsAuthenticated`, custom permissions).
- Authorization checks should happen in services with clear exceptions surfaced to views.

### Error Model

- Services raise `ServiceError`/domain exceptions with an attached HTTP status code.
- Views map exceptions to DRF `Response` consistently.

### Performance

- Avoid N+1 issues in services using `select_related`/`prefetch_related`.
- Use pagination limits at the service/query level; views only pass parameters.