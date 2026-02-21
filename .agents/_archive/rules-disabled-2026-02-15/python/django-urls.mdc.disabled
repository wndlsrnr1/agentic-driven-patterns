---
description: Django URL patterns — APIView routing only, versioned API, no DRF routers
globs: "**/urls.py"
alwaysApply: false
---

## Django URLs (Project Standard)

- **APIView routing**: Wire endpoints directly to `APIView` subclasses via `path()`/`re_path()`.
- **No routers/ViewSets**: Do not use DRF routers or `ViewSet`/`ModelViewSet`.
- **Versioning**: Namespace URLs by API version (e.g., `api/v1/`).
- **App includes**: Each app exposes its own `urls.py` consumed from `config/urls.py`.

### config/urls.py

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/accounts/', include('accounts.urls', namespace='accounts_v1')),
]
```

### accounts/urls.py

```python
from django.urls import path
from .views.api import SignupAPIView, MeAPIView

app_name = 'accounts'

urlpatterns = [
    path('signup/', SignupAPIView.as_view(), name='signup'),
    path('me/', MeAPIView.as_view(), name='me'),
]
```

### Rules

- **Name every route** with `name=` for reverse lookups.
- **Keep URL params simple**; validate complex inputs in serializers, not converters.
- **Security**: Validate IDs inside services; never leak sensitive identifiers via URLs.