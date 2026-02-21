---
description: Middleware — security, CORS, logging; keep business logic in services, not middleware
globs: "**/middleware.py", "config/settings.py"
alwaysApply: false
---

## Middleware (Project Standard)

- **Security first**: Enable Django security middleware, HTTPS, HSTS in production.
- **CORS**: Use `django-cors-headers` configured per environment.
- **Static**: Use WhiteNoise for static files.
- **No business logic**: Middleware must not call models/services for domain operations.
- **Request/Response logging**: Centralize minimal, PII-safe logs.

### Required Settings (example)

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

### Guidance

- Configure allowed origins, methods, and headers via env.
- Avoid heavy processing; push to services or async tasks.