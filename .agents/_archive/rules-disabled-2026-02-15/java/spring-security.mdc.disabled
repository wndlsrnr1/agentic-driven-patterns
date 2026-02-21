---
description: Security — Spring Security + JWT, REST API, test-driven security validations
globs: "**/config/**/*Security*.java", "**/controller/**/*.java"
alwaysApply: false
---

## Security (TDD-First)

- **Auth**: Use JWT (Spring Security JWT). Permissions enforced in services; controllers only check security annotations.
- **REST API**: JSON APIs only; CSRF relevant only for state-changing operations.
- **Headers**: Enforce security headers in production.
- **CORS**: Restrict to known origins via configuration.

### Tests First

- Write tests for: unauthorized → 401, forbidden → 403, successful → 200/201.
- Verify security headers in responses for production config.
- DTO input sanitization (length, regex) without JPA calls.

```java
@Test
void testRequiresAuth() throws Exception {
    mockMvc.perform(get("/api/v1/projects/1"))
            .andExpect(status().isUnauthorized());
}
```

### Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt());
        return http.build();
    }
}
```

### Controller Security

```java
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {
    @PreAuthorize("hasRole('USER')")
    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponseDto> getById(@PathVariable Long id) {
        // ...
    }
}
```
