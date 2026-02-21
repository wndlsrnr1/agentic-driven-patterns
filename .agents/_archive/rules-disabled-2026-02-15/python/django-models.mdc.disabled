---
description: Django Models — domain state only; access strictly via services/repositories
globs: "**/models.py", "**/models/*.py"
alwaysApply: false
---

## Django Models (Project Standard)

- **Pure domain**: Keep models focused on fields, constraints, and simple invariants.
- **No business orchestration**: Complex rules and workflows live in services.
- **Access via services**: Views and serializers never touch models directly; only services/repositories query/modify models.
- **Validation**: Use model `clean()`/validators for intrinsic invariants; use service validation for cross-entity/business rules.
- **Indexes**: Add DB indexes for frequent filters/sorts.

### Example

```python
class Account(models.Model):
    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    def clean(self):
        if not self.name.strip():
            raise ValidationError("Name cannot be empty")
```

### Repositories (Data Access Abstraction)

```python
class AccountRepository:
    @staticmethod
    def get_by_email(email: str) -> Account | None:
        return Account.objects.filter(email=email).first()

    @staticmethod
    def create(data: dict) -> Account:
        return Account.objects.create(**data)
```

### Prohibited

- Business logic inside models that touches other aggregates.
- Calling repositories/models from views or serializers.