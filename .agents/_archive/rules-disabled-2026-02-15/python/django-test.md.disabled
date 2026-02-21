---
description: Django testing — Red/Green/Refactor with layered tests (service → serializer → API)
globs: "**/tests/**/*.py"
alwaysApply: false
---

## Django Test (TDD Core)

- **Red-Green-Refactor**: Always start with a failing test.
- **Layered**: Prioritize service tests; add API tests for wiring/permissions.
- **Patterns**: AAA and Given-When-Then in docstrings.

### Examples

```python
class AccountServiceTest(TestCase):
    def test_create_rejects_duplicate_email(self):
        """Given existing email, When create, Then raise ServiceError(409)"""
        AccountFactory.create(email='a@b.com')
        with self.assertRaises(ServiceError):
            AccountService.create({"email": "a@b.com", "name": "x"})

class AccountAPITest(APITestCase):
    def test_me_requires_auth(self):
        res = self.client.get('/api/v1/accounts/me/')
        self.assertEqual(res.status_code, 401)
```

### Rules

- Tests must be deterministic and isolated.
- Prefer factories/fixtures; avoid global state.
- Use `override_settings` for per-test config.