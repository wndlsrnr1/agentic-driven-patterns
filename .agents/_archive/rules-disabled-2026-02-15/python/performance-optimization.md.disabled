---
description: Performance — service-level optimization with TDD-style performance checks
globs: "**/services/**/*.py", "**/views.py"
alwaysApply: false
---

## Performance (TDD-First)

- **Service-level optimization**: Use `select_related/prefetch_related` in services.
- **Caching**: Add cache in services with invalidation tests.
- **Background tasks**: Offload I/O-bound work to Celery with idempotent tasks.

### Tests First

- Assert query counts for hot paths (e.g., django-test `assertNumQueries`).
- Ensure pagination limits are enforced.
- Measure response time budget in integration tests (loose, informative).

```python
with self.assertNumQueries(2):
    EpisodeService.list_popular(limit=10)
```


