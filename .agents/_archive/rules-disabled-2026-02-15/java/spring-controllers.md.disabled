---
description: Project-aligned Spring Controllers — @RestController-only, service-layer delegation, no direct entity access
globs: "**/controller/**/*.java", "**/*Controller.java"
alwaysApply: false
---

## Spring Controllers (Project Standard)

- **@RestController only**: Use `@RestController` exclusively for REST endpoints. Do not use `@Controller` for REST APIs in this project.
- **No direct entity access in controllers**: Controllers never call entities or JPA directly. Delegate all business logic to the Service layer.
- **DTO scope**: Use DTOs for request/response schema and primitive validation only. No JPA queries in DTOs.
- **Error handling**: Catch service-layer exceptions and return proper `ResponseEntity` with status codes.
- **Auth/Perms**: Use Spring Security annotations; no ad-hoc checks in controllers.

### Minimal Controller Skeleton

**Preferred Pattern: Global Exception Handler**

Controllers should throw exceptions and let `@RestControllerAdvice` handle them:

```java
@RestController
@RequestMapping("/v1/products")
@RequiredArgsConstructor
@Validated
public class ProductController {
    private final ProductService productService;
    
    @PostMapping
    public ApiResponse<ProductResponse> createProduct(
            @AuthenticationPrincipal ServiceUser user,
            @RequestBody @Valid ProductCreateRequest request) {
        // Convert Controller DTO to Service DTO
        ProductCreateRequestDto requestDto = request.toDto(user.getId());
        
        // Call service (exceptions are handled by @RestControllerAdvice)
        ProductDto product = productService.createProduct(requestDto);
        
        // Convert Service DTO to Controller DTO
        ProductResponse response = ProductResponse.of(product);
        return ApiResponse.success(response);
    }
}
```

**Alternative Pattern: Try-Catch in Controller**

For cases where you need controller-specific error handling:

```java
@RestController
@RequestMapping("/api/v1/examples")
public class ExampleController {
    private final ExampleService exampleService;
    
    public ExampleController(ExampleService exampleService) {
        this.exampleService = exampleService;
    }
    
    @PostMapping
    public ResponseEntity<ExampleResponseDto> create(
            @Valid @RequestBody ExampleCreateRequestDto request,
            Authentication authentication) {
        try {
            ExampleResponseDto response = exampleService.create(request, authentication);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (ServiceException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(new ErrorResponseDto(e.getMessage()));
        }
    }
}
```

### Do / Don't

- **Do**: `@RestController` methods call `Service` methods with validated DTOs.
- **Do**: Map service outcomes to HTTP codes (201 create, 200 read, 204 delete, 400/403/404/409 as needed).
- **Don't**: Import entities into controllers.
- **Don't**: Write business rules in controllers.

### Status Codes

- **200/201/204**: Success (GET/POST/DELETE)
- **400**: Validation/business rule failure
- **401/403**: Authentication/authorization failure
- **404**: Resource not found
- **409**: Conflict (e.g., duplicate unique fields)

### Dependency Injection

- **Constructor injection**: Always use constructor injection, not field injection
- **Final fields**: Make service dependencies `final` for immutability

```java
// GOOD: Constructor injection
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {
    private final ProjectService projectService;
    
    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }
}

// BAD: Field injection
@RestController
public class ProjectController {
    @Autowired
    private ProjectService projectService;  // BAD
}
```

### Request/Response Handling

- **Use DTOs**: Always use DTOs for request and response, never expose entities directly
- **DTO conversion**: Convert between Controller DTOs (HTTP layer) and Service DTOs (service layer)
- **Validation**: Use `@Valid` on request DTOs to trigger Bean Validation
- **Type safety**: All methods must have explicit return types
- **Response wrapper**: Consider using `ApiResponse<T>` wrapper for consistent response format

```java
@RestController
@RequestMapping("/v1/products")
@RequiredArgsConstructor
@Validated
public class ProductController {
    private final ProductService productService;
    
    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getProduct(@PathVariable Long id) {
        // Service returns Service DTO
        ProductDto productDto = productService.getProduct(id);
        
        // Convert Service DTO to Controller DTO
        ProductResponse response = ProductResponse.of(productDto);
        return ApiResponse.success(response);
    }
    
    @PostMapping
    public ApiResponse<ProductResponse> createProduct(
            @AuthenticationPrincipal ServiceUser user,
            @RequestBody @Valid ProductCreateRequest request) {
        // Convert Controller DTO to Service DTO
        ProductCreateRequestDto requestDto = request.toDto(user.getId());
        
        // Service returns Service DTO
        ProductDto product = productService.createProduct(requestDto);
        
        // Convert Service DTO to Controller DTO
        ProductResponse response = ProductResponse.of(product);
        return ApiResponse.success(response);
    }
}
```

**Response Wrapper Pattern (Optional)**

For consistent API response format:

```java
@Data
@RequiredArgsConstructor
public class ApiResponse<T> {
    private final ErrorCode errorCode;
    private final String errorMessage;
    private final T body;
    
    public static <T> ApiResponse<T> success(T body) {
        return new ApiResponse<>(null, null, body);
    }
    
    public static <T> ApiResponse<T> fail(ErrorCode errorCode) {
        return new ApiResponse<>(errorCode, errorCode.getClientMessage(), null);
    }
}
```

### Exception Handling

**Preferred Pattern: Global Exception Handler with @RestControllerAdvice**

Use `@RestControllerAdvice` to handle exceptions globally. Controllers throw exceptions and let the global handler map them to HTTP responses:

```java
@RestControllerAdvice
@Slf4j
public class ControllerExceptionHandler {
    
    @ExceptionHandler(ClientException.class)
    public ResponseEntity<ApiResponse<Void>> handleClientException(ClientException exception) {
        log.warn("클라이언트 에러 발생", exception);
        ApiResponse<Void> response = ApiResponse.fail(exception.getErrorCode());
        return ResponseEntity.status(exception.getErrorCode().getHttpStatus()).body(response);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(
            MethodArgumentNotValidException exception) {
        log.warn("클라이언트 에러 발생", exception);
        ErrorCode errorCode = ErrorCode.BAD_REQUEST;
        ApiResponse<Void> response = ApiResponse.fail(errorCode);
        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }
    
    @ExceptionHandler(ServerException.class)
    public ResponseEntity<ApiResponse<Void>> handleServerException(ServerException exception) {
        log.error("내부 서버 에러 발생", exception);
        ApiResponse<Void> response = ApiResponse.fail(exception.getErrorCode());
        return ResponseEntity.status(exception.getErrorCode().getHttpStatus()).body(response);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnknownException(Exception exception) {
        log.error("알 수 없는 에러 발생", exception);
        ErrorCode errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
        ApiResponse<Void> response = ApiResponse.fail(errorCode);
        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }
}
```

**Controller Pattern with Global Exception Handler**

Controllers are simplified - they just throw exceptions:

```java
@RestController
@RequestMapping("/v1/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;
    
    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getProduct(@PathVariable Long id) {
        // Service throws ClientException if not found - handled by @RestControllerAdvice
        ProductDto productDto = productService.getProduct(id);
        ProductResponse response = ProductResponse.of(productDto);
        return ApiResponse.success(response);
    }
    
    @PostMapping
    public ApiResponse<ProductResponse> createProduct(
            @AuthenticationPrincipal ServiceUser user,
            @RequestBody @Valid ProductCreateRequest request) {
        // Service throws ClientException on validation failure - handled by @RestControllerAdvice
        ProductCreateRequestDto requestDto = request.toDto(user.getId());
        ProductDto product = productService.createProduct(requestDto);
        ProductResponse response = ProductResponse.of(product);
        return ApiResponse.success(response);
    }
}
```

**Alternative Pattern: Try-Catch in Controller**

For cases where you need controller-specific error handling:

```java
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {
    private final ProjectService projectService;
    
    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody ProjectUpdateRequestDto request,
            Authentication authentication) {
        try {
            ProjectResponseDto response = projectService.update(id, request, authentication);
            return ResponseEntity.ok(response);
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (ServiceException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(new ErrorResponseDto(e.getMessage()));
        }
    }
}
```

### Controller JavaDoc Documentation

All controller classes and methods should have comprehensive JavaDoc following Google style conventions, including HTTP request/response examples.

**Why Write JavaDoc in English?**

JavaDoc comments must be written in English for the following reasons:

1. **International Collaboration**: English is the standard language for software development, enabling collaboration with international developers and contributors
2. **Tool Support**: IDEs, documentation generators, and code analysis tools work best with English JavaDoc
3. **Industry Standard**: Following Java community conventions and best practices established by Oracle and major open-source projects
4. **Code Review**: Makes code reviews accessible to non-Korean-speaking team members and external contributors
5. **Maintainability**: English documentation is more widely understood and maintainable in long-term projects
6. **API Documentation**: Generated API documentation (e.g., via Swagger/OpenAPI) benefits from English descriptions

**Controller Class JavaDoc Pattern**

Every controller class should include:

1. **Purpose**: What the controller does
2. **Controller role**: List key responsibilities
3. **Service delegation**: How it delegates to service layer
4. **Response format**: What response wrapper is used

```java
/**
 * Controller providing REST API endpoints for bookmark operations.
 * 
 * <p>
 * This controller provides HTTP APIs for users to save and manage products as bookmarks.
 * 
 * <p>
 * Controller responsibilities:
 * <ul>
 * <li>Receives HTTP requests and extracts parameters</li>
 * <li>Delegates business logic processing to the service layer</li>
 * <li>Converts service results to HTTP response format and returns them</li>
 * </ul>
 * 
 * <p>
 * This controller does not contain business logic and is responsible only for HTTP request/response
 * processing. All business logic is handled through the {@link BookmarkService} interface.
 * The implementation class of the {@link BookmarkService} interface is automatically injected
 * via Spring's dependency injection.
 * 
 * <p>
 * The {@code @RestController} annotation indicates that this class is a REST API controller,
 * and method return values are automatically converted to JSON format and included in the HTTP
 * response body.
 */
@RestController
@RequiredArgsConstructor
public class BookmarkController {
    // ...
}
```

**Controller Method JavaDoc Pattern**

Every controller method should include:

1. **Summary**: One-line description of what the endpoint does
2. **HTTP method**: What HTTP method is used
3. **Request example**: HTTP request example using `<pre>{@code ... }</pre>`
4. **Response example**: Success response example using `<pre>{@code ... }</pre>`
5. **Parameters**: `@param` tags for all parameters
6. **Return value**: `@return` tag describing the response
7. **Exceptions**: `@throws` tags for important exceptions

```java
/**
 * Retrieves all bookmarks for a specific user.
 * 
 * <p>
 * This method handles GET requests and receives a user ID as a parameter,
 * returning all bookmarks saved by that user.
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
public ApiResponse<List<BookmarkResponse>> getBookmarks(
        @RequestParam(value = "userId") Long userId) {
    // ...
}
```

**POST Method JavaDoc Example**

```java
/**
 * Adds a specific product as a bookmark.
 * 
 * <p>
 * This method handles POST requests and receives a user ID and product ID,
 * creating a new bookmark.
 * 
 * <p>
 * If the same user has already bookmarked the same product,
 * {@link meetings.common.exception.ClientException} is thrown.
 * 
 * <p>
 * HTTP request example:
 * 
 * <pre>{@code
 * POST /v1/products/456/bookmarks?userId=123
 * }</pre>
 * 
 * <p>
 * Success response example:
 * 
 * <pre>{@code
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "userId": 123,
 *     "productId": 456,
 *     "createdAt": "2024-01-01T00:00:00"
 *   }
 * }
 * }</pre>
 * 
 * @param userId    ID of the user adding the bookmark (required parameter)
 * @param productId ID of the product to bookmark (path variable)
 * @return Response object containing success status and created bookmark information
 * @throws meetings.common.exception.ClientException if the same bookmark already exists
 */
@PostMapping("/v1/products/{productId}/bookmarks")
public ApiResponse<BookmarkResponse> addBookmark(
        @RequestParam(value = "userId") Long userId,
        @PathVariable(value = "productId") Long productId) {
    // ...
}
```

**DELETE Method JavaDoc Example**

```java
/**
 * Deletes a bookmark for a specific product.
 * 
 * <p>
 * This method handles DELETE requests and receives a user ID and product ID,
 * deleting the corresponding bookmark.
 * 
 * <p>
 * If the bookmark does not exist,
 * {@link meetings.common.exception.ClientException} is thrown.
 * 
 * <p>
 * HTTP request example:
 * 
 * <pre>{@code
 * DELETE /v1/products/456/bookmarks?userId=123
 * }</pre>
 * 
 * <p>
 * Success response example:
 * 
 * <pre>{@code
 * {
 *   "success": true,
 *   "data": null
 * }
 * }</pre>
 * 
 * @param userId    ID of the user deleting the bookmark (required parameter)
 * @param productId ID of the product whose bookmark is to be deleted (path variable)
 * @return Response object containing only success status (data is null)
 * @throws meetings.common.exception.ClientException if the bookmark does not exist
 */
@DeleteMapping("/v1/products/{productId}/bookmarks")
public ApiResponse<Void> removeBookmark(
        @RequestParam(value = "userId") Long userId,
        @PathVariable(value = "productId") Long productId) {
    // ...
}
```

**JavaDoc Best Practices for Controllers**

- **Use `<pre>{@code ... }</pre>` for HTTP examples**: Makes examples clearly formatted and syntax-highlighted
- **Include both request and response examples**: Helps API consumers understand the endpoint
- **Document all parameters**: Use `@param` tags with descriptions and constraints
- **Document exceptions**: Use `@throws` tags for important exceptions
- **Be specific about HTTP methods**: Mention GET, POST, DELETE, etc. in the description
- **Explain response format**: Describe the structure of success and error responses

### Field Documentation

All controller class fields should have JavaDoc comments explaining their purpose:

```java
/** Service interface for handling bookmark business logic (Spring automatically injects implementation class). */
private final BookmarkService bookmarkService;
```

**Field JavaDoc Best Practices**

- Use `/** */` format for field documentation
- Explain the purpose and role of the field
- For injected dependencies, explain what is being injected and how
- Keep descriptions concise but informative

### Prohibited Patterns

- **Direct repository access**: Never inject or use repositories in controllers
- **Direct entity access**: Never import or use entities in controllers
- **Business logic**: Never implement business rules in controllers
- **Field injection**: Never use `@Autowired` on fields, use constructor injection

```java
// BAD: Direct repository access
@RestController
public class ProjectController {
    @Autowired
    private ProjectRepository projectRepository;  // BAD
    
    @GetMapping
    public List<Project> list() {
        return projectRepository.findAll();  // BAD
    }
}

// GOOD: Use service
@RestController
public class ProjectController {
    private final ProjectService projectService;
    
    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }
    
    @GetMapping
    public List<ProjectResponseDto> list() {
        return projectService.listAll();  // GOOD
    }
}
```
