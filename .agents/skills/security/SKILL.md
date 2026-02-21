---
name: security
description: Frontend security — no secrets in code, token handling, XSS; match backend (JWT, CORS)
---

# Security (Frontend)

- **Secrets**: API 키·비밀은 코드에 두지 말 것. `import.meta.env` 등 빌드 시 주입; `.env`는 `.gitignore`.
- **Token**: JWT는 httpOnly cookie 우선. `localStorage`는 XSS에 취약; 사용 시 저장·전송 최소화.
- **XSS**: `dangerouslySetInnerHTML` 지양. 사용자 입력 표시 시 이스케이프; 리치 텍스트면 sanitize 라이브러리.

## Tests

- 401/403/200·201 시나리오: 미인증·권한없음·성공. → spring-security, django security와 동일한 인증/인가 테스트.
