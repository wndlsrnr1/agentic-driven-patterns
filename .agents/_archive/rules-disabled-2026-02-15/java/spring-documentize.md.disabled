---
description: Spring API Documentation — Swagger/OpenAPI annotations for Controller and DTO documentation
globs: "**/controller/**/*.java", "**/model/**/*.java", "**/dto/**/*.java"
alwaysApply: false
---

## Spring API Documentation (Swagger/OpenAPI)

This project uses Springdoc OpenAPI (Swagger) to automatically generate API documentation. All REST API endpoints and DTOs must be properly documented using Swagger annotations.

### Core Principles

1. **Bilingual descriptions**: All descriptions must include both Korean and English (format: "한글 설명 / English description")
2. **Complete documentation**: Every endpoint must have `@Operation`, `@ApiResponses`, and parameter descriptions
3. **DTO schema**: All DTO classes and fields must have `@Schema` annotations with descriptions and examples
4. **JavaDoc**: Include detailed class/method documentation with HTTP request/response examples
5. **Required fields**: Use `requiredMode = Schema.RequiredMode.REQUIRED` instead of deprecated `required=true`

---

## Controller Documentation

### 1. @Tag (Class Level)

**Purpose**: Groups related API endpoints in Swagger UI.

**Usage**: Place on controller class level.

**Example**:
```java
@Tag(name = "account", description = "Account management API")
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    // ...
}
```

**Guidelines**:
- Use domain-based tag names (e.g., `"account"`, `"bookmark"`)
- Use hierarchical tags for admin APIs (e.g., `"admin/account"`)
- Tag names should be consistent across related controllers

### 2. @Operation (Method Level)

**Purpose**: Describes individual API endpoint metadata.

**Usage**: Place on controller method level.

**Example**:
```java
@Operation(
    summary = "현재 사용자 정보 조회 / Get current user information",
    description = "인증된 사용자의 기본 정보를 조회합니다. 로그인 상태 확인 및 기본 프로필 표시에 사용됩니다. / Retrieves basic information of the authenticated user. Used to check login status and display basic user profile."
)
@GetMapping("/me")
public ResponseEntity<RestResponse<UserResponse>> getCurrentUser(
    Authentication authentication) {
    // ...
}
```

**Guidelines**:
- `summary`: Brief one-line description (bilingual)
- `description`: Detailed explanation (bilingual)
- Always include both Korean and English

### 3. @ApiResponses / @ApiResponse (Method Level)

**Purpose**: Documents all possible HTTP response codes for an endpoint.

**Usage**: Place on controller method level.

**Example**:
```java
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "조회 성공 / Retrieval successful"),
    @ApiResponse(responseCode = "400", description = "잘못된 요청 / Bad Request"),
    @ApiResponse(responseCode = "401", description = "인증 실패 / Authentication failed"),
    @ApiResponse(responseCode = "404", description = "리소스 없음 / Not Found")
})
@GetMapping("/me")
public ResponseEntity<RestResponse<UserResponse>> getCurrentUser(
    Authentication authentication) {
    // ...
}
```

**Guidelines**:
- Document all possible response codes (200, 201, 204, 400, 401, 403, 404, 409, 500)
- Use bilingual descriptions
- Match actual exception handling behavior

### 4. @Parameter (Method Parameter Level)

**Purpose**: Describes request parameters (query params, path variables, headers).

**Usage**: Place on method parameters.

**Example**:
```java
@GetMapping("/v1/bookmarks")
public RestResponse<List<BookmarkResponse>> getBookmarks(
    @Parameter(
        description = "조회할 사용자 ID / ID of the user to retrieve",
        required = true,
        example = "1"
    )
    @RequestParam(value = "userId") Long userId) {
    // ...
}
```

**Guidelines**:
- Provide `description` (bilingual)
- Set `required = true` for mandatory parameters
- Provide `example` values for all parameters
- Use for `@RequestParam`, `@PathVariable`, `@RequestHeader`

### Complete Controller Example

```java
/**
 * REST API controller for bookmark-related endpoints.
 * 
 * <p>
 * This controller provides HTTP APIs for users to save and manage product bookmarks.
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "bookmark", description = "Bookmark management API")
public class BookmarkController {

    private final BookmarkService bookmarkService;

    /**
     * Retrieves all bookmarks for a specific user.
     * 
     * <p>
     * HTTP request example:
     * 
     * <pre>{@code
     * GET /v1/bookmarks?userId=123
     * }</pre>
     * 
     * <p>
     * Success response example:
     * 
     * <pre>{@code
     * {
     *   "success": true,
     *   "data": [
     *     {
     *       "id": 1,
     *       "userId": 123,
     *       "productId": 456,
     *       "createdAt": "2024-01-01T00:00:00"
     *     }
     *   ]
     * }
     * }</pre>
     * 
     * @param userId ID of the user to retrieve (required parameter)
     * @return Response object containing success status and bookmark list
     */
    @GetMapping("/v1/bookmarks")
    @Operation(
        summary = "북마크 목록 조회 / Get bookmark list",
        description = "특정 사용자의 모든 북마크를 조회합니다. / Retrieves all bookmarks for a specific user."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공 / Retrieval successful"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 파라미터 / Invalid request parameters"),
        @ApiResponse(responseCode = "401", description = "인증 실패 / Authentication failed")
    })
    public RestResponse<List<BookmarkResponse>> getBookmarks(
        @Parameter(
            description = "조회할 사용자 ID / ID of the user to retrieve",
            required = true,
            example = "1"
        )
        @RequestParam(value = "userId") Long userId) {
        List<BookmarkResponse> response = bookmarkService.getBookmarks(userId)
            .stream()
            .map(BookmarkResponse::of)
            .toList();
        return RestResponse.success(response);
    }
}
```

---

## DTO Documentation

### 1. @Schema (Class Level)

**Purpose**: Describes the DTO class schema.

**Usage**: Place on DTO class level.

**Example**:
```java
@Schema(description = "북마크 응답 정보 / Bookmark response information")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookmarkResponse {
    // ...
}
```

### 2. @Schema (Field Level)

**Purpose**: Describes individual DTO fields.

**Usage**: Place on each field.

**Example**:
```java
@Schema(description = "사용자 ID / User ID", example = "1")
private Long id;

@Schema(description = "이메일 주소 / Email address", example = "user@example.com")
private String email;

@Schema(
    description = "현재 비밀번호 / Current password for verification",
    example = "oldPassword123",
    requiredMode = Schema.RequiredMode.REQUIRED
)
@NotBlank(message = "Current password is required")
private String currentPassword;
```

**Guidelines**:
- Provide `description` (bilingual) for all fields
- Provide `example` values for all fields
- Use `requiredMode = Schema.RequiredMode.REQUIRED` for required fields (not deprecated `required=true`)
- Combine with Bean Validation annotations (`@NotBlank`, `@NotNull`, `@Size`, etc.)

### Complete DTO Example

```java
/**
 * Response DTO for user basic information.
 * 
 * <p>
 * This DTO represents the HTTP response body for the user basic info endpoint.
 * It contains essential user information that can be used to check login status
 * and display basic user profile.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "사용자 응답 정보 / User response information")
public class UserResponse {

    @Schema(description = "사용자 ID / User ID", example = "1")
    private Long id;

    @Schema(description = "이메일 주소 / Email address", example = "user@example.com")
    private String email;

    @Schema(description = "사용자 이름 / Username", example = "홍길동")
    private String username;

    @Schema(description = "사용자 타입 / User type", example = "USER")
    private UserType type;

    @Schema(description = "계정 활성화 상태 / Account activation status", example = "true")
    private Boolean isActive;

    /**
     * Creates a UserResponse from a service DTO.
     * 
     * @param dto Service DTO containing user information (must not be null)
     * @return UserResponse instance
     */
    public static UserResponse of(UserDto dto) {
        return UserResponse.builder()
            .id(dto.getId())
            .email(dto.getEmail())
            .username(dto.getUsername())
            .type(dto.getType())
            .isActive(dto.getIsActive())
            .build();
    }
}
```

### Request DTO Example

```java
/**
 * Request DTO for password change.
 * 
 * <p>
 * This DTO is used to receive password change requests from clients.
 * Contains the current password for verification and the new password.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "비밀번호 변경 요청 / Password change request")
public class PasswordChangeRequest {

    @Schema(
        description = "현재 비밀번호 / Current password for verification",
        example = "oldPassword123",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "Current password is required")
    @Size(min = 1, max = 128, message = "Password length must be between 1 and 128 characters")
    private String currentPassword;

    @Schema(
        description = "새 비밀번호 / New password to set (minimum 8 characters)",
        example = "newSecurePassword456",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotBlank(message = "New password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String newPassword;
}
```

---

## Best Practices

### 1. Bilingual Descriptions

Always include both Korean and English in all descriptions:

```java
// Good
@Operation(
    summary = "현재 사용자 정보 조회 / Get current user information",
    description = "인증된 사용자의 기본 정보를 조회합니다. / Retrieves basic information of the authenticated user."
)

// Bad
@Operation(summary = "Get current user information")
```

### 2. Complete Response Code Documentation

Document all possible HTTP response codes:

```java
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "조회 성공 / Retrieval successful"),
    @ApiResponse(responseCode = "400", description = "잘못된 요청 / Bad Request"),
    @ApiResponse(responseCode = "401", description = "인증 실패 / Authentication failed"),
    @ApiResponse(responseCode = "403", description = "권한 없음 / Forbidden"),
    @ApiResponse(responseCode = "404", description = "리소스 없음 / Not Found"),
    @ApiResponse(responseCode = "409", description = "충돌 / Conflict")
})
```

### 3. Provide Examples

Always provide example values for parameters and fields:

```java
@Parameter(
    description = "조회할 사용자 ID / ID of the user to retrieve",
    required = true,
    example = "1"
)
@RequestParam(value = "userId") Long userId

@Schema(description = "사용자 ID / User ID", example = "1")
private Long id;
```

### 4. Use RequiredMode (Not Deprecated required)

Use `requiredMode = Schema.RequiredMode.REQUIRED` instead of deprecated `required=true`:

```java
// Good
@Schema(
    description = "비밀번호 / Password",
    requiredMode = Schema.RequiredMode.REQUIRED
)

// Bad (deprecated)
@Schema(description = "비밀번호 / Password", required = true)
```

### 5. JavaDoc for Complex Logic

Include detailed JavaDoc for complex endpoints with HTTP examples:

```java
/**
 * Retrieves all bookmarks for a specific user.
 * 
 * <p>
 * HTTP request example:
 * 
 * <pre>{@code
 * GET /v1/bookmarks?userId=123
 * }</pre>
 * 
 * <p>
 * Success response example:
 * 
 * <pre>{@code
 * {
 *   "success": true,
 *   "data": [...]
 * }
 * }</pre>
 * 
 * @param userId ID of the user to retrieve (required parameter)
 * @return Response object containing success status and bookmark list
 */
```

### 6. Tag Organization

Use consistent tag naming:
- Domain-based: `"account"`, `"bookmark"`, `"product"`
- Hierarchical for admin: `"admin/account"`, `"admin/user"`
- Group related endpoints together

---

## Reference Documentation

For detailed Swagger/OpenAPI lifecycle and annotation principles, see:
- `docs/solution/2025-12-23-swagger-docs.md` - Comprehensive Swagger documentation guide

## Accessing Documentation

- **Swagger UI**: `http://localhost:8080/swagger-ui/index.html`
- **OpenAPI JSON**: `http://localhost:8080/v3/api-docs`
