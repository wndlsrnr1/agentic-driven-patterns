---
description: Security — DRF + JWT, React SPA, test-driven security validations
globs: "config/settings.py", "**/views.py", "**/serializers.py"
alwaysApply: false
---

## Security (TDD-First)

- **Auth**: Use JWT (simplejwt). Permissions enforced in services; views only check permissions classes.
- **React SPA**: JSON APIs only; CSRF relevant only for server-rendered forms.
- **Headers**: Enforce HSTS/secure headers in production.
- **CORS**: Restrict to known origins via env.

### Tests First

- Write tests for: unauthorized → 401, forbidden → 403, successful → 200/201.
- Verify security headers in responses for production config.
- Serializer input sanitization (length, regex) without ORM calls.

```python
def test_requires_auth(self):
    res = self.client.get('/api/v1/accounts/me/')
    assert res.status_code == 401
```

### Settings Checklist

- `SecurityMiddleware`, `CORS_ALLOW_*` via env, HTTPS in prod, secure cookies.