---
description: Spring project principles — Effective Java, Spring patterns, human-readable code, test quality, type safety; prohibited patterns
globs: "**/*.java"
alwaysApply: false
---


# Project Principles and Prohibited Patterns

## Core Development Principles

This project follows the following core principles:

1. **Effective Java Patterns First**: This project prioritizes Effective Java patterns and principles.
2. **Spring Framework Patterns (Kim Young-han style)**: This project respects Kim Young-han's Spring framework patterns.
3. **Human-Readable Code Priority**: Code readability is prioritized over clever optimizations.
4. **Test Quality**: Tests verify actual logic correctness, not just pass/fail. Do not avoid writing tests because they are difficult. Do not write tests just to make them pass.
5. **Type Safety First**: All types must be explicit for compile-time error detection.

## Development Principles Behind Prohibitions

The following principles explain why certain patterns are prohibited:

### 1. Premature Optimization Prevention
**Principle**: Only optimize when real problems exist. Avoid optimizing hypothetical performance issues.

**Prohibited Patterns**:
- **Entity index creation**: Do not define indexes in entities. Indexes should be added only when real performance problems are identified.
- **Over-optimization**: Do not optimize performance issues that have not been revealed as actual problems.
- **Unnecessary database indexes**: Do not add database indexes unnecessarily during development.

### 2. Type Safety and Explicit Typing
**Principle**: All types must be explicit for compile-time error detection, static analysis, and code readability.

**Prohibited Patterns**:
- **`var` keyword prohibition**: The `var` keyword is prohibited. All variable declarations must have explicit types.
- **Raw type usage**: Raw types are prohibited. All generic types must be explicitly specified.
- **Dynamic imports**: Dynamic imports are prohibited. All imports must be declared at the top of the file.

**Required Practices**:
- All method input/output types must be explicitly specified.
- All generic types must be explicitly specified.
- All repository methods must have complete type signatures (e.g., `Optional<EntityT>`, `List<EntityT>`, `Page<EntityT>`).
- All DTO fields must have explicit types.
- All utility functions must have complete type signatures.

### 3. Code Readability and Maintainability
**Principle**: Prefer human-readable code over clever optimizations. Balance between safety and readability.

**Prohibited Patterns**:
- **Overly defensive code**: Do not write code that handles every possible edge case if it makes the code unnecessarily long. Do not prepare for situations that realistically will not occur.
- **Excessive nesting depth**: Do not write code with deep nesting depth that is difficult to understand.
- **Long code in one go**: Do not write long code in one go.
- **Verbose code**: Do not write verbose code.

### 4. Static Code Analysis and Type Safety
**Principle**: Use static field access instead of dynamic access for better type safety and static analysis.

**Prohibited Patterns**:
- **Dynamic code (reflection)**: Reflection and dynamic attribute access are prohibited. Use static field access instead.
- **Dynamic attribute access**: Never use reflection or dynamic attribute access patterns.

### 5. Layered Architecture Boundaries
**Principle**: Maintain strict separation of concerns across layers. Each layer has specific responsibilities and access restrictions.

**Prohibited Patterns**:
- **Repository layer access**: Repository layer can only be accessed by Service layer. Controllers, DTOs, and other layers must not call repositories directly.
- **DTO layer scope**: DTO layer can only perform simple validation. Must not call Repository, Service, or other layers. Complex validation must be delegated to Validator.
- **Direct entity/repository access in controllers**: Controllers must not import entities or repositories directly. Never call JPA/repositories directly (hurts testability).
- **Business logic in controllers or DTOs**: Business logic must not be placed in controllers or DTOs.

### 6. Documentation Standards
**Principle**: Consistency and international collaboration require standard documentation language.

**Required Practices**:
- **JavaDoc language**: All JavaDoc comments must be written in English.

## General Coding Principles

- Always consider if common logic exists before implementation.
- Do not write long code in one go.
- Do not write verbose code.
- Do not write overly defensive code that makes code unnecessarily long.
- Do not over-optimize by adding database indexes unnecessarily.
- Do not write code with deep nesting depth.

---

## Layered Architecture (Spring Boot Project Standard)

### Project Characteristics

This project is a **Spring Boot backend system** with the following characteristics:
- **Multi-module architecture**: `APP_MODE=api|worker|scheduler|migrate` for separation of concerns
- **Database**: MySQL with JPA/Hibernate
- **Caching**: Redis for distributed caching
- **Containerization**: Docker Compose for development environment
- **Email**: Google SMTP for production email delivery

### Layers

- **Controller (@RestController)**: HTTP request/response handling, DTO validation, service delegation. No business logic or direct database access.
- **Service (@Service)**: Business rules, authorization, transactions, orchestration. The only layer allowed to call repositories. **Preferred pattern**: Interface-based design following Effective Java Item 20 principle (interface + implementation class).
- **Repository (JPA Repository)**: Data access and persistence. Encapsulates JPA queries.
- **Entity (@Entity)**: Domain state and intrinsic validation. Maps to database tables.

### Golden Rules

- Controllers must not import entities or repositories directly.
- DTOs never execute queries for validation.
- Services expose clear methods (e.g., `create`, `update`, `list`, `retrieve`, `delete`).
- Services raise domain-specific exceptions with HTTP status hints.

### Example Wiring

```java
// Controller.java
@RestController
@RequestMapping("/api/v1/things")
public class ThingController {
    private final ThingService thingService;
    
    public ThingController(ThingService thingService) {
        this.thingService = thingService;
    }
    
    @PostMapping
    public ResponseEntity<ThingResponseDto> create(
            @Valid @RequestBody ThingCreateRequestDto request,
            Authentication authentication) {
        try {
            ThingResponseDto response = thingService.create(request, authentication);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (ServiceException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(new ErrorResponseDto(e.getMessage()));
        }
    }
}

// Service Interface (Preferred Pattern - Effective Java Item 20)
/**
 * Service interface for handling Thing-related business logic.
 * 
 * <p>
 * This interface defines the contract for Thing business logic such as creation, retrieval,
 * update, and deletion. Following Effective Java Item 20 principle, this interface separates
 * implementation from contract.
 */
public interface ThingService {
    /**
     * Creates a new Thing.
     * 
     * @param request Thing creation request DTO (must not be null)
     * @param auth Authentication information (must not be null)
     * @return DTO object containing the created Thing information
     */
    ThingResponseDto create(ThingCreateRequestDto request, Authentication auth);
}

// Service Implementation
/**
 * Service implementation class for handling Thing-related business logic.
 * 
 * <p>
 * This class implements the {@link ThingService} interface and provides actual implementation
 * of Thing business logic such as creation, retrieval, update, and deletion.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ThingServiceImpl implements ThingService {
    private final ThingRepository thingRepository;
    
    @Override
    public ThingResponseDto create(ThingCreateRequestDto request, Authentication auth) {
        // business rules + repository calls
        Thing entity = new Thing();
        entity.setName(request.getName());
        entity.setOwnerId(auth.getName());
        Thing saved = thingRepository.save(entity);
        return ThingResponseDto.from(saved);
    }
}

// Alternative: Concrete Service Class (Acceptable for Simple Services)
// @Service
// @Transactional
// public class ThingService {
//     private final ThingRepository thingRepository;
//     
//     public ThingService(ThingRepository thingRepository) {
//         this.thingRepository = thingRepository;
//     }
//     
//     public ThingResponseDto create(ThingCreateRequestDto request, Authentication auth) {
//         Thing entity = new Thing();
//         entity.setName(request.getName());
//         entity.setOwnerId(auth.getName());
//         Thing saved = thingRepository.save(entity);
//         return ThingResponseDto.from(saved);
//     }
// }

// Repository.java
@Repository
public interface ThingRepository extends JpaRepository<Thing, Long> {
    Optional<Thing> findById(Long id);
    List<Thing> findAll();
}
```

### Prohibited

- Direct entity/repository access in controllers.
- Business logic in controllers or DTOs.
- **Never use reflection or dynamic attribute access**: Use static field access instead.
- **Avoid overly defensive code**: Do not write code that handles every possible edge case if it makes the code unnecessarily long.
- **Repository layer access**: Repository layer can only be used by Service layer.
- **DTO layer scope**: DTO layer can only perform simple validation; it cannot use other layers.

---

## Practical Layer Guide (Integrated)

Below is a concise, practical guide for splitting Spring Boot into `utils / dto / service / validator / repository / entity / controller`, the "no direct reference" rules, and JPA Repository conventions. Only essential dependency and lifecycle boundaries are defined.

Note: This project standardizes on `@RestController` controllers for HTTP endpoints.

---

# 1) Layer Role Summary

* **Entity**

  * Domain entity mapped 1:1 to a DB table via JPA.
  * Field constraints (unique, null, column definitions) and minimal invariants only.
  * No business-flow or transaction logic.
  * **Type annotations**: All entity fields should have clear types; use JPA annotations.

* **Repository**

  * Persistence layer for a specific entity (encapsulates JPA).
  * CRUD, read optimizations (`@EntityGraph`, `JOIN FETCH`), locking (`@Lock`).
  * No business rules or state transitions.
  * **Type annotations**: All methods must have return type annotations (e.g., `Optional<EntityT>`, `List<EntityT>`).
  * **Access restriction**: Can only be used by Service layer.

* **Validator**

  * Validates domain rules that span beyond a single entity field (e.g., refundable state, ownership, limits, cross-entity constraints).
  * Responsible only for evaluation. No side effects (no writes, no notifications).
  * **Component pattern**: Use `@Component` annotation to create reusable validator components.
  * **Repository injection**: Validators can inject repositories to perform existence checks and cross-entity validations.
  * **Type annotations**: All validation methods must have clear input/output types.

```java
@Component
@RequiredArgsConstructor
public class ProductValidator {
    private final ProductRepository productRepository;
    
    public void validateProductExists(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ClientException(ErrorCode.BAD_REQUEST, "product not found. productId=%s".formatted(productId));
        }
    }
}
```

* **Service**

  * Use-case orchestration (call multiple repositories, apply Validator checks, define transaction boundaries).
  * Drives state transitions, emits domain events, writes audit logs.
  * Ignorant of HTTP/serialization formats.
  * **Validator injection**: Services inject Validator components via constructor for domain rule validation.
  * **Type annotations**: All service methods must have explicit parameter and return types.
  * **Return types**: Prefer domain objects, DTOs, or typed collections over `Map<String, Object>`.

```java
@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final UserValidator userValidator;  // Validator component injection
    
    @Transactional
    public ProductDto createProduct(ProductCreateRequestDto requestDto) {
        userValidator.validateUserExists(requestDto.getUserId());  // Use validator
        // ... business logic
    }
}
```

* **DTO (Request/Response)**

  * Input parsing → validated request DTO; output serialization → response DTO.
  * Only simple field-level checks via Bean Validation (`@Valid`, `@NotNull`, `@Size`, etc.); complex domain rules go to Validator.
  * No DB access or business transitions.
  * **Type annotations**: DTO fields should have clear types.
  * **DTO role**: Acts as HTTP input/output DTO.
  * **Access restriction**: Can only perform simple validation; cannot use other layers.

* **Controller (@RestController)**

  * HTTP endpoint: auth/permissions, bind DTOs, call services, return responses.
  * No domain logic.
  * **Type annotations**: Controller methods should have type hints for request and response.

* **Utils**

  * Domain-agnostic pure functions (dates/strings/images/hashes).
  * No side effects or DB access.
  * **Type annotations**: All utility functions must have complete type signatures.

---

# 2) "No Direct Reference" Matrix

| From \ To             | Utils | DTO | Validator | Repository | Entity | Service | Controller |
| --------------------- | ----: | --: | --------: | ---------: | -----: | ------: | ---------: |
| **Utils**             |     ✅ | 🚫 |        🚫 |         🚫 |     🚫 |      🚫 |         🚫 |
| **DTO**               |     ✅ | ✅ |  ✅(delegate rules) |         🚫 |     🚫 |      🚫 |         🚫 |
| **Validator**         |     ✅ | 🚫 | ✅(internal calls OK) |          ✅ | ✅(types/constants) |      🚫 |         🚫 |
| **Repository**        |     ✅ | 🚫 |        🚫 | ✅(self/peer repos) |     ✅ |      🚫 |         🚫 |
| **Service**           |     ✅ | 🚫 |         ✅ |          ✅ | ✅(types/constants) | ✅(internal helpers) |         🚫 |
| **Controller**        |     ✅ | ✅ |         ✅ |          ✅ | 🚫(no direct JPA) |        ✅ | ✅(framework) |

*Key prohibitions*

  * Forbid Controller↔Entity direct queries, DTO↔Repository direct calls, Service↔DTO mutual dependencies.
  * Repository must not make business judgements; Validator must not perform writes or side effects.
  * **Repository layer**: Can only be accessed by Service layer. Controllers, DTOs, and other layers must not call repositories directly.
  * **DTO layer**: Can only perform simple validation. Must not call Repository, Service, or other layers. Complex validation must be delegated to Validator.

---

# 3) Lifecycle (Request → Response) Flow

`Controller → Controller DTO (HTTP input) → Service DTO (conversion) → Validator (rule checks) → Service (transactions/state transitions) → Repository (DB) → Service → Service DTO → Controller DTO (HTTP output) → Controller (Response)`

* Transaction boundaries live in **Service** (`@Transactional`).
* Repository handles **DB I/O only**, Validator handles **rules only**, DTO handles **transformations only**.
* **Type information flow**: Each layer must pass typed data to the next layer. Use Java type system to ensure type safety throughout the flow.
  * Controller receives Controller DTO (HTTP input model)
  * Controller DTO converts to Service DTO via `toDto()` method
  * Service receives Service DTO and returns Service DTO (domain objects, DTOs, or typed collections)
  * Repository returns typed domain objects (`Optional<EntityT>`, `List<EntityT>`)
  * Service DTO converts to Controller DTO via `of()` static method
  * Controller returns Controller DTO as HTTP response

---

# 4) JPA Repository Conventions

## 4.1 Mandatory conventions

* **One repository per entity**: `UserRepository extends JpaRepository<User, Long>`.
* **Clarify return types**: Use Java type syntax (`Optional<T>` instead of nullable return), `List<T>`, `Page<T>`.
* **Separate read vs write method names**: `find*/get*/list*` vs `save/delete`.
* **Defend against duplicates/races**: `exists*`, custom `saveOrUpdate*` methods.
* **Performance hot spots**: `@EntityGraph`, `JOIN FETCH`, batch `saveAll`.
* **Locking** (contention domains): provide `@Lock` methods for services.
* **Type annotations**: All repository methods must have complete type signatures.

## 4.2 Improvement patterns

* **Query/read layering**

  * `findById(id)` returns `Optional<T>` (service maps to error).
  * When "throw if missing" is needed, transform to exceptions in the service.

* **Write safety**

  * `save(entity)` updates only changed fields via JPA dirty checking.
  * For bulk changes, expose dedicated `saveAll()` methods.

* **Consistent error policy**

  * Repository should not leak JPA exceptions (return Optional.empty()), or map to a repository-specific exception.
  * Service maps these to domain/HTTP errors.

* **Slice/pagination**

  * Provide a thin wrapper like `Page<T> findAll(Pageable pageable)` (controllers must not slice results directly).
  * **Controller**: Accept `Pageable` parameter directly (Spring Data auto-binding), convert `Page<ServiceDto>` to `PageResponse<ControllerDto>` using `PageResponse.of()`.
  * **Service**: Receive `Pageable`, pass to repository, convert `Page<Entity>` to `Page<ServiceDto>` using `page.map()`, validate sort fields.
  * **Response DTO**: Use `PageResponse<T>` for Django-style pagination response (count, next, previous, results).

---

# 5) Validator vs DTO Boundary

* **DTO**: format checks (required/type/size) via Bean Validation, light cross-field checks. Acts as HTTP input/output DTO.
* **Validator**: domain rules (e.g., "already purchased items cannot be repurchased", "refund window is 7 days", "must have sufficient balance").
* **Dependency**: Validator reads via repositories and only evaluates; Service performs the state transition based on the result.
* **Type annotations**: Both DTO and Validator methods must have clear type signatures.

---

# 5.5) DTO (Data Transfer Object) Guidelines

## DTO Layer Separation

This project uses **two-layer DTO pattern** to separate HTTP concerns from service layer:

1. **Controller DTO** (HTTP layer): `controller/*/model/` directory
   - `{Entity}CreateRequest`, `{Entity}UpdateRequest` - HTTP request models
   - `{Entity}Response` - HTTP response models
   - Handles HTTP serialization/deserialization
   - Bean Validation for input format checks

2. **Service DTO** (Service layer): `service/*/model/` directory
   - `{Entity}CreateRequestDto`, `{Entity}UpdateRequestDto` - Service request DTOs
   - `{Entity}Dto` - Service response DTOs
   - Used for service-to-service data transfer
   - Contains business domain data structures

### Controller DTO Pattern

```java
// controller/product/model/ProductCreateRequest.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCreateRequest {
    @NotBlank
    private String name;
    
    @Min(0)
    private Long price;
    
    @Min(0)
    private Long quantity;
    
    // Convert to Service DTO
    public ProductCreateRequestDto toDto(Long userId) {
        return ProductCreateRequestDto.builder()
                .userId(userId)
                .name(name)
                .price(price)
                .quantity(quantity)
                .build();
    }
}

// controller/product/model/ProductResponse.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private Long userId;
    private String name;
    private Long price;
    private Long quantity;
    private ProductStatus status;
    
    // Convert from Service DTO
    public static ProductResponse of(ProductDto productDto) {
        return ProductResponse.builder()
                .id(productDto.getId())
                .userId(productDto.getUserId())
                .name(productDto.getName())
                .price(productDto.getPrice())
                .quantity(productDto.getQuantity())
                .status(productDto.getStatus())
                .build();
    }
}
```

### Service DTO Pattern

```java
// service/product/model/ProductCreateRequestDto.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCreateRequestDto {
    private Long userId;
    private String name;
    private Long price;
    private Long quantity;
}

// service/product/model/ProductDto.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {
    private Long id;
    private Long userId;
    private String name;
    private Long price;
    private Long quantity;
    private ProductStatus status;
    
    // Convert from Entity
    public static ProductDto of(Product product) {
        return ProductDto.builder()
                .id(product.getId())
                .userId(product.getUserId())
                .name(product.getName())
                .price(product.getPrice())
                .quantity(product.getQuantity())
                .status(product.getStatus())
                .build();
    }
}
```

### Conversion Flow

```
HTTP Request → Controller DTO (ProductCreateRequest) 
  → toDto() → Service DTO (ProductCreateRequestDto) 
  → Service → Entity → Service DTO (ProductDto) 
  → of() → Controller DTO (ProductResponse) 
  → HTTP Response
```

## When Separate DTO is Needed

Define separate DTO classes inside `dto/` directory when:

### 1. Service-to-Service Data Transfer

When multiple services need to exchange complex data structures:

```java
// dto/ProjectSummaryDto.java
public class ProjectSummaryDto {
    private Project project;
    private Integer sessionCount;
    private Long totalDuration;
    private Integer pendingSummaries;
    
    // constructors, getters, setters
}
```

### 2. External API Integration

When integrating with external APIs where request/response structures differ from internal domain:

```java
// dto/SttResponseDto.java
public class SttResponseDto {
    private String transcript;
    private List<SpeakerDto> speakers;
    private Double confidence;
    private Integer duration;
    
    // constructors, getters, setters
}
```

### 3. Complex Query Results

When encapsulating results from multiple table joins or aggregations:

```java
// dto/DashboardStatsDto.java
public class DashboardStatsDto {
    private Integer totalProjects;
    private Integer activeSessions;
    private Integer pendingSummaries;
    private Integer completedSummaries;
    
    // constructors, getters, setters
}
```

## DTO Best Practices

* **Location**: Define DTOs inside `dto/` directory (e.g., `dto/request/`, `dto/response/`)
* **Type annotations**: Use Java type system (avoid raw types, use generics)
* **Immutability**: Consider using `record` (Java 14+) or `@Builder` pattern for immutability
* **Type safety**: All DTO fields must have explicit types
* **Documentation**: Add JavaDoc for complex DTOs explaining their purpose

```java
/**
 * DTO for project summary data transfer between services.
 */
public class ProjectSummaryDto {
    private final Project project;
    private final Integer sessionCount;
    private final Long totalDuration;
    private final Integer pendingSummaries;
    
    // constructors, getters
}
```

---

# 6) Service Conventions (Transactions & Orchestration)

* **Transaction boundary** per use case (`@Transactional`).
* **Locking when needed**: repositories expose `@Lock` methods and services call them.
* **Events/notifications**: emit in post-commit hooks to avoid double execution.
* **I/O format ignorance**: DTOs own request/response shaping.

## Storage Service (FileStorageService)

* **Mandatory service layer**: All file save/delete operations must go through `FileStorageService` (directly or indirectly) to ensure transaction synchronization and file accumulation tracking.
* **Example**: `FileDto file = fileStorageService.saveFile(multipartFile, "sessions/123/audio.wav");` ✅ | `Files.write(path, content);` ❌
* **Index**: See `meetings.storage.service.FileStorageService` for available methods.

---

# 7) Controller & DTO Conventions (HTTP Boundary)

* **Controller**

  * Auth/permissions → parse input via DTO → call Validator as needed → execute service → respond with output DTO.
  * Never call JPA/repositories directly (hurts testability).
  * **Type annotations**: All controller methods must have type hints for request and response.

```java
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {
    private final ProjectService projectService;
    
    @PostMapping
    public ResponseEntity<ProjectResponseDto> create(
            @Valid @RequestBody ProjectCreateRequestDto request,
            Authentication authentication) {
        try {
            ProjectResponseDto response = projectService.create(request, authentication);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (ServiceException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(new ErrorResponseDto(e.getMessage()));
        }
    }
}
```

* **DTO**

  * Use Bean Validation (`@Valid`, `@NotNull`, `@Size`, etc.) for input parsing/format checks, delegate domain validation.
  * Do not hide service calls inside DTOs; call services explicitly in controllers.
  * **Type annotations**: DTO fields should have clear types; request DTOs should be validated when passed to services.

```java
public class ProjectCreateRequestDto {
    @NotBlank
    @Size(max = 100)
    private String name;
    
    @Size(max = 500)
    private String description;
    
    // getters, setters
}
```

### API Documentation (Swagger/OpenAPI)

* **Controller documentation**: Use `@Tag`, `@Operation`, `@ApiResponses`, `@Parameter` annotations for API documentation.
* **DTO documentation**: Use `@Schema` annotation on class and field level to describe data structures.
* **Bilingual descriptions**: All descriptions must include both Korean and English (format: "한글 설명 / English description").
* **JavaDoc**: Include detailed class/method documentation with HTTP request/response examples.
* **Required fields**: Use `requiredMode = Schema.RequiredMode.REQUIRED` instead of deprecated `required=true`.
* **Response codes**: Document all possible HTTP response codes using `@ApiResponses` (200, 400, 401, 403, 404, 409, etc.).
* **Parameter examples**: Provide `example` values for all parameters to help API consumers.

For detailed documentation guidelines, see `spring-documentize` rule.

---

# 8) Utils Conventions

* **Pure functions only** (inputs → output, no side effects/state).
* Do not reference domain-owned constants/policy values (those belong to Validator/Service).

---

# 9) Directory Example (Spring Boot Project Structure)

```
src/main/java/com/example/
  controller/
    ProjectController.java
    SessionController.java
  service/
    ProjectService.java
    SttService.java
    SummaryService.java
  repository/
    ProjectRepository.java
    SessionRepository.java
  entity/
    Project.java
    Session.java
    AudioFile.java
    SttData.java
    Summary.java
  dto/
    request/
      ProjectCreateRequestDto.java
      ProjectUpdateRequestDto.java
    response/
      ProjectResponseDto.java
      ProjectListResponseDto.java
  validator/
    ProjectValidator.java
    SttValidator.java
  exception/
    ControllerExceptionHandler.java
    ClientException.java
    ServerException.java
  config/
    SecurityConfig.java
    JpaConfig.java
  task/  # Async tasks for long-running operations
    SttTask.java
    SummaryTask.java
  util/
    DateUtils.java
    FileUtils.java
  admin/  # Admin operations (separation for future modularization)
    {domain}/
      controller/
        Admin{Entity}Controller.java
      service/
        Admin{Entity}Service.java
        Admin{Entity}ServiceImpl.java
      repository/  # If admin-specific repository needed
        Admin{Entity}Repository.java
```

## Admin Package Structure

Admin operations are organized under `admin/{domain}/` following the same layer structure as the main project (controller, service, repository, etc.) to enable future separation/modularization.

**Structure**: `admin/{domain}/controller/`, `admin/{domain}/service/`, `admin/{domain}/repository/`

**Example**: `admin/user/controller/AdminUserController.java`, `admin/user/service/AdminUserService.java`

---

# 10) Brief Comments on Repository Code

* The current structure is good. We recommend:

  1. Provide `@Lock` methods (mandatory in contention-prone domains).
  2. Add `exists*`, custom `saveOrUpdate*` to defend against duplicates/races.
  3. Bundle read-optimized methods with `@EntityGraph` or `JOIN FETCH`.
  4. Standardize exception exposure (Optional.empty() when absent; map other JPA exceptions to `RepositoryException`).
  5. Strengthen return type hints:
     * Use `Optional<T>` instead of nullable return
     * Use `List<T>` for collections
     * Use `Page<T>` for paginated results
     * All methods must have complete type signatures

```java
@Repository
public interface ThingRepository extends JpaRepository<Thing, Long> {
    Optional<Thing> findById(Long id);
    
    List<Thing> findAll();
    
    @EntityGraph(attributePaths = {"relatedEntity"})
    Optional<Thing> findWithRelationsById(Long id);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Thing> findByIdForUpdate(Long id);
}
```

---

# 11) Test Execution Guide

## Basic Test Execution

```bash
# Run all tests
./gradlew test

# Run specific test class
./gradlew test --tests BookmarkServiceTest
./gradlew test --tests meetings.bookmark.service.BookmarkServiceTest

# Run specific test method
./gradlew test --tests BookmarkServiceTest.testRegisterBookmark_Success

# Run tests for a package
./gradlew test --tests "meetings.bookmark.*"
```

## Test Profiles

Tests use the `test` profile by default.

```java
@ActiveProfiles("test")
@ExtendWith({SpringExtension.class})
public class BookmarkServiceTest {
    // ...
}
```

```bash
# Run with custom profile
SPRING_PROFILES_ACTIVE=test,integration ./gradlew test
```

## Common Commands

```bash
# Quick test during development
./gradlew test --tests BookmarkServiceTest --no-daemon

# Tests for CI/CD
./gradlew clean test

# View test results
open build/reports/tests/test/index.html  # Mac
xdg-open build/reports/tests/test/index.html  # Linux
```

---

# 12) Test Execution in Docker Environment

## Using Docker Compose (Recommended)

Docker Compose 환경에서 테스트를 실행하는 방법입니다. api 서비스가 실행 중이어야 합니다.

**전제 조건**:
- api 서비스가 실행 중이어야 함 (`docker compose up -d api` 또는 `docker compose up -d`)
- docker-compose.yml의 api 서비스가 `./backend:/app` 볼륨 마운트를 사용

**기본 사용법**:

```bash
# 전체 테스트 실행
docker compose exec -T api bash -c "cd /app && ./gradlew test --no-daemon"

# 특정 테스트 클래스 실행
docker compose exec -T api bash -c "cd /app && ./gradlew test --tests meetings.session.controller.SessionControllerTest --no-daemon"

# 특정 테스트 메서드 실행
docker compose exec -T api bash -c "cd /app && ./gradlew test --tests SessionControllerTest.testUploadAudioFile_Success --no-daemon"

# 특정 패키지의 모든 테스트 실행
docker compose exec -T api bash -c "cd /app && ./gradlew test --tests \"meetings.session.*\" --no-daemon"

# 테스트 클린 후 실행
docker compose exec -T api bash -c "cd /app && ./gradlew clean test --no-daemon"
```

**주의사항**:
- `-T` 플래그는 TTY 할당 없이 실행하여 출력이 깔끔하게 표시됩니다
- api 서비스가 실행 중이지 않으면 `docker compose up -d api`로 먼저 시작해야 합니다
- 테스트 실행 시 생성되는 파일들(`build/` 디렉토리)은 컨테이너 내부에서 생성되지만, 볼륨 마운트로 로컬에 반영됩니다

---

## Additional Test Principles

* **Do not avoid tests because they are difficult**: Tests are essential for code quality and should not be bypassed.
* **Do not write tests just to make them pass**: Test verification should validate that the actual logic is correct, not just achieve test pass status.
* **Effective Java patterns**: This project prioritizes Effective Java patterns.
* **Spring framework patterns (Kim Young-han style)**: This project respects Kim Young-han's Spring framework patterns.
* **JavaDoc in English**: All JavaDoc comments must be written in English.
* **Prohibition of `var` keyword**: The `var` keyword is prohibited. All variable declarations must have explicit types.
* **Prohibition of entity index creation**: Do not define indexes in entities. Indexes should be added only when real performance problems are identified.
