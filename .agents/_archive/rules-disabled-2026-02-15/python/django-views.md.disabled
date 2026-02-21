---
description: Project-aligned Django Views — APIView-only, service-layer delegation, no direct model access
globs: "**/views.py", "**/views/*.py"
alwaysApply: false
---

## Django Views (Project Standard)

- **APIView only**: Use DRF `APIView` exclusively. Do not use `GenericAPIView`, `ViewSet`, or `ModelViewSet` in this project.
- **No direct model access in views**: Views never call models or ORM directly. Delegate all business logic to the Service layer.
- **Serializer scope**: Use serializers for request/response schema and primitive validation only. No model queries in serializers.
- **Error handling**: Catch service-layer exceptions and return proper DRF `Response` with status codes.
- **Auth/Perms**: Use DRF permission classes; no ad-hoc checks in views.

### Minimal View Skeleton

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .serializers import ExampleCreateSerializer, ExampleReadSerializer
from .services.example_service import ExampleService, ServiceError


class ExampleCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ExampleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            obj = ExampleService.create(serializer.validated_data, user=request.user)
        except ServiceError as exc:
            return Response({"detail": str(exc)}, status=exc.status_code)

        return Response(ExampleReadSerializer(obj).data, status=status.HTTP_201_CREATED)
```

### Do / Don’t

- **Do**: `APIView` methods call `Service` methods with validated data.
- **Do**: Map service outcomes to HTTP codes (201 create, 200 read, 204 delete, 400/403/404/409 as needed).
- **Don’t**: Import models into views.
- **Don’t**: Write business rules in views.

### Status Codes

- **200/201/204**: Success (GET/POST/DELETE)
- **400**: Validation/business rule failure
- **401/403**: Authentication/authorization failure
- **404**: Resource not found
- **409**: Conflict (e.g., duplicate unique fields)