---
description: Pagination — Controller, Service, Repository에서의 페이지네이션 처리 원칙
globs: "**/controller/**/*.java", "**/service/**/*.java", "**/repository/**/*.java"
alwaysApply: false
---

## Pagination (Project Standard)

This project uses Spring Data's `Pageable` and `Page` interfaces for pagination, with Django-style response format via `PageResponse<T>`.

### Layer Responsibilities

- **Controller**: Accept `Pageable` parameter, convert `Page<ServiceDto>` to `PageResponse<ControllerDto>`
- **Service**: Receive `Pageable`, pass to repository, convert `Page<Entity>` to `Page<ServiceDto>`, validate sort fields
- **Repository**: Accept `Pageable`, return `Page<Entity>`
- **Response DTO**: Use `PageResponse<T>` for Django-style pagination (count, next, previous, results)

---

## Controller Layer

### Pageable Parameter Binding

Controllers accept `Pageable` parameter directly. Spring Data automatically binds query parameters (`page`, `size`, `sort`, `direction`) to `Pageable`.

```java
@GetMapping
@Operation(summary = "사용자 목록 조회 / Get user list")
public ResponseEntity<RestResponse<PageResponse<UserListResponse>>> listUsers(
        @Parameter(description = "검색 키워드 / Search keyword") @RequestParam(required = false) String keyword,
        @Parameter(description = "페이지네이션 및 정렬 파라미터 / Pagination and sorting parameters") Pageable pageable) {
    
    // Call service
    Page<UserDetailDto> userPage = userService.listUsers(keyword, pageable);
    
    // Convert Service DTO to Controller DTO
    List<UserListResponse> results = userPage.getContent().stream()
            .map(UserListResponse::of)
            .collect(Collectors.toList());
    
    // Convert to Django-style pagination response
    PageResponse<UserListResponse> pageResponse = PageResponse.of(userPage, results);
    
    return ResponseEntity.ok(RestResponse.success(pageResponse));
}
```

### Query Parameters

- `page`: Page number (0-based, default: 0)
- `size`: Page size (default: 20, max: 100)
- `sort`: Sort field name (e.g., `createdAt`, `email`)
- `direction`: Sort direction (`asc` or `desc`, default: `asc`)

Example: `GET /api/v1/users?page=0&size=20&sort=createdAt&direction=desc`

### Response Format

Response uses Django-style pagination format:

```json
{
  "errorCode": null,
  "errorMessage": null,
  "body": {
    "count": 100,
    "next": "http://example.com/api/v1/users?page=1&size=20",
    "previous": null,
    "results": [
      {
        "id": 1,
        "email": "user@example.com",
        "username": "홍길동"
      }
    ]
  }
}
```

---

## Service Layer

### Pageable Handling

Services receive `Pageable` parameter and pass it to repository. After receiving `Page<Entity>`, convert to `Page<ServiceDto>` using `page.map()`.

```java
@Override
@Transactional(readOnly = true)
public Page<UserDetailDto> listUsers(String keyword, Pageable pageable) {
    // Validate sort fields
    validateSortFields(pageable);
    
    // Call repository
    Page<User> userPage = userRepository.findAllWithFilters(keyword, pageable);
    
    // Convert Page<User> to Page<UserDetailDto>
    return userPage.map(user -> UserDetailDto.of(user, null));
}
```

### Sort Field Validation

Services should validate sort fields to prevent SQL injection and invalid field access. Define allowed sort fields as a constant set.

```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
        "email", "username", "createdAt", "updatedAt");

private void validateSortFields(Pageable pageable) {
    if (pageable.getSort().isUnsorted()) {
        return; // No sort specified, skip validation
    }
    
    pageable.getSort().forEach(order -> {
        String field = order.getProperty();
        if (!ALLOWED_SORT_FIELDS.contains(field)) {
            throw new ClientException(ErrorCode.BAD_REQUEST,
                    "Invalid sort field: %s. Allowed fields: %s".formatted(
                            field, ALLOWED_SORT_FIELDS));
        }
    });
}
```

### Page Conversion Pattern

Use `page.map()` to convert `Page<Entity>` to `Page<ServiceDto>`:

```java
// Single entity conversion
Page<UserDetailDto> userPage = entityPage.map(user -> UserDetailDto.of(user, null));

// With additional data lookup (if needed)
Page<UserDetailDto> userPage = entityPage.map(user -> {
    Optional<UserAgreement> agreement = userAgreementRepository.findByUserId(user.getId());
    return UserDetailDto.of(user, agreement.orElse(null));
});
```

**Note**: For list views, avoid loading related entities (e.g., `UserAgreement`) for performance. Load them only in detail views.

---

## Repository Layer

### Page Return Type

Repositories accept `Pageable` parameter and return `Page<Entity>`. Use Spring Data JPA's `Page` interface.

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Page<User> findAllWithFilters(
            String keyword,
            UserType type,
            Boolean isActive,
            Pageable pageable);
}
```

### Custom Repository Implementation

For complex queries, implement custom repository:

```java
@Repository
@RequiredArgsConstructor
public class CustomUserRepositoryImpl implements CustomUserRepository {
    private final EntityManager entityManager;
    
    @Override
    public Page<User> findAllWithFilters(
            String keyword,
            UserType type,
            Boolean isActive,
            Pageable pageable) {
        
        // Build query with filters
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<User> query = cb.createQuery(User.class);
        Root<User> root = query.from(User.class);
        
        List<Predicate> predicates = new ArrayList<>();
        
        if (keyword != null) {
            Predicate emailPredicate = cb.like(
                    cb.lower(root.get("email")), 
                    "%" + keyword.toLowerCase() + "%");
            Predicate usernamePredicate = cb.like(
                    cb.lower(root.get("username")), 
                    "%" + keyword.toLowerCase() + "%");
            predicates.add(cb.or(emailPredicate, usernamePredicate));
        }
        
        if (type != null) {
            predicates.add(cb.equal(root.get("type"), type));
        }
        
        if (isActive != null) {
            predicates.add(cb.equal(root.get("isActive"), isActive));
        }
        
        query.where(predicates.toArray(new Predicate[0]));
        
        // Apply pagination
        TypedQuery<User> typedQuery = entityManager.createQuery(query);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        
        // Apply sorting
        if (pageable.getSort().isSorted()) {
            pageable.getSort().forEach(order -> {
                Path<?> path = root.get(order.getProperty());
                Order jpaOrder = order.isAscending() 
                        ? cb.asc(path) 
                        : cb.desc(path);
                query.orderBy(jpaOrder);
            });
        }
        
        List<User> results = typedQuery.getResultList();
        
        // Count total elements
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<User> countRoot = countQuery.from(User.class);
        countQuery.select(cb.count(countRoot));
        countQuery.where(predicates.toArray(new Predicate[0]));
        Long total = entityManager.createQuery(countQuery).getSingleResult();
        
        return new PageImpl<>(results, pageable, total);
    }
}
```

---

## Response DTO: PageResponse

### Django-Style Pagination Response

Use `PageResponse<T>` for consistent pagination response format. This class wraps Spring Data's `Page<T>` into Django-style format.

```java
// Controller usage
Page<UserDetailDto> userPage = userService.listUsers(keyword, pageable);
List<UserListResponse> results = userPage.getContent().stream()
        .map(UserListResponse::of)
        .collect(Collectors.toList());
PageResponse<UserListResponse> pageResponse = PageResponse.of(userPage, results);
return ResponseEntity.ok(RestResponse.success(pageResponse));
```

### PageResponse Structure

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    /** Total number of items across all pages. */
    private Long count;
    
    /** URL to the next page (null if this is the last page). */
    private String next;
    
    /** URL to the previous page (null if this is the first page). */
    private String previous;
    
    /** List of items in the current page. */
    private List<T> results;
    
    public static <S, T> PageResponse<T> of(Page<S> page, List<T> results) {
        return PageResponse.<T>builder()
                .count(page.getTotalElements())
                .next(page.hasNext() ? buildNextUrl(page.getNumber() + 1) : null)
                .previous(page.hasPrevious() ? buildPreviousUrl(page.getNumber() - 1) : null)
                .results(results)
                .build();
    }
}
```

### URL Generation

`PageResponse` uses `ServletUriComponentsBuilder` to generate next/previous URLs, preserving all query parameters from the current request and only updating the `page` parameter.

---

## Testing

### Controller Test

Test pagination in controller tests:

```java
@Test
void testListUsers_Pagination() {
    // Given: Multiple pages exist (page 1 of 3)
    Pageable pageable = PageRequest.of(1, 20);
    UserDetailDto userDetailDto = UserDetailDto.builder()
            .id(userId)
            .email("test@example.com")
            .build();
    
    Page<UserDetailDto> userPage = new PageImpl<>(
            List.of(userDetailDto), pageable, 50);
    
    // Setup request context for URL generation
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setRequestURI("/api/v1/admin/users");
    request.setMethod("GET");
    request.setParameter("page", "1");
    request.setParameter("size", "20");
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    
    when(adminUserService.listUsers(null, null, null, null, null, null, null, pageable))
            .thenReturn(userPage);
    
    // When: List users (page 1)
    ResponseEntity<RestResponse<PageResponse<UserListResponse>>> response = 
            adminUserController.listUsers(null, null, null, null, null, null, null, pageable);
    
    // Then: Verify pagination
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody().getBody().getCount()).isEqualTo(50);
    assertThat(response.getBody().getBody().getNext()).isNotNull(); // Next page exists
    assertThat(response.getBody().getBody().getPrevious()).isNotNull(); // Previous page exists
}
```

### Service Test

Test pagination in service tests:

```java
@Test
void testListUsers_Success() {
    // Given: Users exist
    Pageable pageable = PageRequest.of(0, 20);
    Page<User> userPage = new PageImpl<>(List.of(activeUser), pageable, 1);
    
    when(userRepository.findAllWithFilters(
            null, null, null, null, null, null, null, pageable))
            .thenReturn(userPage);
    
    // When: List users
    Page<UserDetailDto> result = adminUserService.listUsers(
            null, null, null, null, null, null, null, pageable);
    
    // Then: Verify result
    assertThat(result).isNotNull();
    assertThat(result.getContent()).hasSize(1);
    assertThat(result.getTotalElements()).isEqualTo(1);
}
```

### Sort Field Validation Test

Test sort field validation:

```java
@Test
void testListUsers_InvalidSortField() {
    // Given: Invalid sort field
    Pageable pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "invalidField"));
    
    // When & Then: Should throw ClientException
    ClientException exception = assertThrows(ClientException.class,
            () -> adminUserService.listUsers(null, null, null, null, null, null, null, pageable));
    
    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST);
    assertThat(exception.getMessage()).contains("Invalid sort field");
}
```

---

## Best Practices

1. **Sort Field Validation**: Always validate sort fields in service layer to prevent SQL injection and invalid field access.

2. **Performance**: For list views, avoid loading related entities. Load them only in detail views.

3. **Page Size Limits**: Consider setting maximum page size (e.g., max 100) to prevent performance issues.

4. **URL Generation**: `PageResponse` automatically preserves all query parameters when generating next/previous URLs.

5. **Type Safety**: Use explicit types (`Page<Entity>`, `Page<ServiceDto>`, `PageResponse<ControllerDto>`) throughout the pagination flow.

6. **Test Coverage**: Test pagination with different scenarios:
   - First page (no previous)
   - Last page (no next)
   - Middle page (both next and previous)
   - Empty results
   - Invalid sort fields
