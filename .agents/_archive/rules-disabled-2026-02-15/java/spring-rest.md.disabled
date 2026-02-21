---
description: Spring REST API usage — @RestController + DTOs for I/O, services for business logic
globs: "**/controller/**/*.java"
alwaysApply: false
---

## Spring REST API (Project Standard)

- **Controllers**: Use `@RestController` only. No `@Controller` for REST APIs.
- **DTOs**: Request/response schema + primitive validation only via Bean Validation; no JPA queries.
- **Services**: All business logic and database access via service/repository layer.
- **Permissions**: Implement with Spring Security annotations; keep controllers thin.
- **Pagination/Filters**: Apply in services or dedicated utilities, not inside DTOs.

### Controller Pattern

```java
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {
    private final ProjectService projectService;
    
    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponseDto> getById(@PathVariable Long id) {
        ProjectResponseDto response = projectService.getById(id);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping
    public ResponseEntity<ProjectResponseDto> create(
            @Valid @RequestBody ProjectCreateRequestDto request,
            Authentication authentication) {
        ProjectResponseDto response = projectService.create(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
```

### HTTP Methods

- **GET**: Retrieve resources
- **POST**: Create resources
- **PUT**: Update entire resource
- **PATCH**: Partial update
- **DELETE**: Delete resources

### Status Codes

- **200 OK**: Successful GET, PUT, PATCH
- **201 Created**: Successful POST
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Validation/business rule failure
- **401 Unauthorized**: Authentication failure
- **403 Forbidden**: Authorization failure
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate unique fields

### Exception Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponseDto> handleNotFound(NotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDto(e.getMessage()));
    }
    
    @ExceptionHandler(ServiceException.class)
    public ResponseEntity<ErrorResponseDto> handleServiceException(ServiceException e) {
        return ResponseEntity.status(e.getStatusCode())
                .body(new ErrorResponseDto(e.getMessage()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDto> handleValidation(MethodArgumentNotValidException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDto("Validation failed", e.getBindingResult()));
    }
}
```

### Prohibited Patterns

- **Repository calls in Controllers**: Never call Repository or execute JPA queries in Controllers
- **Business logic in Controllers**: Complex domain rules must go to Service, not Controller
- **Service calls in DTOs**: Never call Service methods from DTOs
- **Missing type annotations**: All Controller methods should have type hints for request and response
