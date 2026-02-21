---
name: spring-code-generation-prompt
description: Spring Boot Code Generation Prompt — comprehensive template for AI-assisted Spring Boot code generation following layered architecture
---

# Spring Boot Code Generation Prompt Template

## Your Role

You are a senior Spring Boot engineer following strict layered architecture principles. Generate production-ready code that adheres to the project's architecture, conciseness rules, and constraints.

## Context

- **Project Type**: Spring Boot-based REST API service
- **Architecture**: Layered architecture (Controller → Service → Repository → Entity)
- **Framework**: Spring Boot with `@RestController` only (no `@Controller` for REST, no direct JPA access in controllers)
- **Java Version**: Java 17+ (use modern type syntax, prefer `Optional<T>` over nullable returns)

## Feature Description

[Describe the specific feature to implement here, e.g., "User profile creation with validation and email notification"]

## Structure Requirements

### File Organization

- **Controller.java**: HTTP request/response handling only (DTO validation + service calls)
- **Service.java**: Business logic, transactions, repository coordination
- **DTO classes**: Input data validation/transformation only (Bean Validation)
- **Repository.java** (if needed): Data access layer (used only by Service layer)
- **Entity.java** (if needed): Domain state and intrinsic validation only

### Layer Responsibilities

**Controller (@RestController)**
- Parse HTTP requests
- Validate input via DTOs with `@Valid`
- Call service methods
- Return HTTP responses
- Handle service exceptions and map to HTTP status codes
- **Never**: Import entities, call repositories, or contain business logic

**Service**
- Business orchestration and workflows
- Transaction boundaries (`@Transactional`)
- Repository coordination
- Domain error handling (`ServiceException`, `NotFoundException`)
- **Never**: Import DTOs for business logic, contain HTTP-specific logic, or bypass repositories

**DTO (Request/Response)**
- Request/response schema definition
- Input parsing → validated request DTO
- Output serialization → response DTO
- Simple field-level validation via Bean Validation only
- **Never**: Execute JPA queries, call repositories, call services, or contain business logic

**Repository**
- Data access and persistence
- JPA query encapsulation
- Read optimizations (`@EntityGraph`, `JOIN FETCH`)
- **Never**: Contain business logic or be called from Controller/DTO (only Service can use repositories)

**Entity**
- Domain entity with fields and constraints
- Intrinsic validation only
- **Never**: Business orchestration or cross-entity logic

## Code Conciseness Rules

- **File length**: ≤150 lines per example file
- **Method length**: ≤30 lines (prefer ≤20 lines)
- **Split complex logic**: Break down if/for loops into small helper methods
- **Separation of concerns**: Minimum 3 classes per feature
- **Extract common logic**: If same logic appears 2+ times, create a helper method
- **Clear naming**: Method/class names must reveal purpose immediately

## Architecture Constraints

### Controller Constraints

```java
// GOOD: Thin controller with service delegation
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

### Service Constraints

**Interface-Based Design (Preferred)**

Following Effective Java Item 20 principle, services should be defined as interfaces with separate implementation classes. This provides better testability, flexibility, and clear API contracts.

```java
// GOOD: Interface-based service design with Google style JavaDoc
/**
 * 예제 관련 비즈니스 로직을 처리하는 서비스 인터페이스입니다.
 * 
 * <p>
 * 이 인터페이스는 예제의 생성, 조회, 수정, 삭제 등의 비즈니스 로직에 대한 계약을 정의합니다.
 * Effective Java Item 20 원칙에 따라 인터페이스를 사용하여 구현과 계약을 분리합니다.
 * 
 * <p>
 * 서비스 계층의 역할:
 * <ul>
 * <li>비즈니스 규칙 검증</li>
 * <li>트랜잭션 관리 (데이터 일관성 보장)</li>
 * <li>리포지토리를 통한 데이터 접근</li>
 * <li>도메인 객체를 DTO로 변환</li>
 * </ul>
 */
public interface ExampleService {
    
    /**
     * 새로운 예제를 생성합니다.
     * 
     * <p>
     * 이 메서드는 예제 생성 요청 DTO를 받아 새로운 예제를 생성합니다.
     * 
     * <p>
     * 비즈니스 규칙:
     * <ul>
     * <li>관련 엔티티가 존재해야 함</li>
     * <li>인증된 사용자만 생성 가능</li>
     * </ul>
     * 
     * <p>
     * 트랜잭션 동작:
     * <ul>
     * <li>이 메서드는 트랜잭션 내에서 실행됩니다</li>
     * <li>중간에 오류가 발생하면 모든 변경사항이 자동으로 되돌려집니다</li>
     * </ul>
     * 
     * @param request 예제 생성 요청 DTO (null이 아니어야 함)
     * @param auth 인증 정보 (null이 아니어야 함)
     * @return 생성된 예제 정보를 담은 DTO 객체
     * @throws NotFoundException 관련 엔티티가 존재하지 않는 경우
     */
    ExampleResponseDto create(ExampleCreateRequestDto request, Authentication auth);
}

// GOOD: Service implementation with transaction and repository coordination
/**
 * 예제 관련 비즈니스 로직을 처리하는 서비스 구현 클래스입니다.
 * 
 * <p>
 * 이 클래스는 {@link ExampleService} 인터페이스의 구현체로,
 * 예제의 생성, 조회, 수정, 삭제 등의 비즈니스 로직을 실제로 구현합니다.
 * 
 * <p>
 * {@code @Service} 어노테이션은 이 클래스가 Spring의 서비스 빈으로 등록되도록 합니다.
 * {@code @Transactional} 어노테이션은 이 클래스의 모든 메서드가
 * 트랜잭션 내에서 실행되도록 합니다.
 */
@Service
@RequiredArgsConstructor
public class ExampleServiceImpl implements ExampleService {
    private final ExampleRepository exampleRepository;
    private final RelatedRepository relatedRepository;
    
    /**
     * 새로운 예제를 생성합니다.
     * 
     * <p>
     * 이 메서드는 예제 생성 요청 DTO를 받아 새로운 예제를 생성합니다.
     * 
     * <p>
     * 비즈니스 규칙:
     * <ul>
     * <li>관련 엔티티가 존재해야 함</li>
     * <li>인증된 사용자만 생성 가능</li>
     * </ul>
     * 
     * <p>
     * 트랜잭션 동작:
     * <ul>
     * <li>이 메서드는 트랜잭션 내에서 실행됩니다</li>
     * <li>중간에 오류가 발생하면 모든 변경사항이 자동으로 되돌려집니다</li>
     * </ul>
     * 
     * @param request 예제 생성 요청 DTO (null이 아니어야 함)
     * @param auth 인증 정보 (null이 아니어야 함)
     * @return 생성된 예제 정보를 담은 DTO 객체
     * @throws NotFoundException 관련 엔티티가 존재하지 않는 경우
     */
    @Override
    @Transactional
    public ExampleResponseDto create(ExampleCreateRequestDto request, Authentication auth) {
        // 1) Validation
        validateRequest(request, auth);
        
        // 2) Load entities
        RelatedEntity related = relatedRepository.findById(request.getRelatedId())
                .orElseThrow(() -> new NotFoundException("Related entity not found"));
        
        // 3) Business logic
        ExampleEntity entity = processBusinessLogic(request, related, auth);
        
        // 4) Persist
        ExampleEntity saved = exampleRepository.save(entity);
        
        return ExampleResponseDto.from(saved);
    }
}
```

**Alternative: Concrete Service Class (Acceptable for Simple Services)**

For simple services or legacy code, concrete service classes without interfaces are also acceptable:

```java
// ACCEPTABLE: Concrete service class (for simple services)
@Service
@Transactional
public class ExampleService {
    private final ExampleRepository exampleRepository;
    private final RelatedRepository relatedRepository;
    
    public ExampleService(ExampleRepository exampleRepository, RelatedRepository relatedRepository) {
        this.exampleRepository = exampleRepository;
        this.relatedRepository = relatedRepository;
    }
    
    public ExampleResponseDto create(ExampleCreateRequestDto request, Authentication auth) {
        // 1) Validation
        validateRequest(request, auth);
        
        // 2) Load entities
        RelatedEntity related = relatedRepository.findById(request.getRelatedId())
                .orElseThrow(() -> new NotFoundException("Related entity not found"));
        
        // 3) Business logic
        ExampleEntity entity = processBusinessLogic(request, related, auth);
        
        // 4) Persist
        ExampleEntity saved = exampleRepository.save(entity);
        
        return ExampleResponseDto.from(saved);
    }
}
```

### DTO Constraints

```java
// GOOD: Simple validation only
public class ExampleCreateRequestDto {
    @NotBlank
    @Size(max = 100)
    private String name;
    
    @Email
    private String email;
    
    @Size(max = 500)
    private String description;
    
    // getters, setters
}
```

## Prohibited Patterns

### Absolute Prohibitions

1. **Never use reflection or dynamic attribute access**: Use static field access instead
   ```java
   // BAD
   Object value = field.get(obj);
   
   // GOOD
   String value = dto.getName();
   ```

2. **Never call repositories from DTOs**: Repositories are only accessible by Service layer
   ```java
   // BAD
   public class ExampleRequestDto {
       @CustomValidator
       public void validateEmail(String email) {
           if (exampleRepository.existsByEmail(email)) {  // BAD
               throw new ValidationException("Email exists");
           }
       }
   }
   
   // GOOD: Delegate to Validator or Service
   ```

3. **Never call services from DTOs**: DTOs only perform simple validation
   ```java
   // BAD
   public class ExampleRequestDto {
       public void validate() {
           exampleService.checkAvailability(getId());  // BAD
       }
   }
   
   // GOOD: Validation happens in Service layer
   ```

4. **Never import entities in controllers**: Controllers must use services only
   ```java
   // BAD
   import com.example.entity.Example;
   @RestController
   public class ExampleController {
       @GetMapping
       public List<Example> list() {
           return exampleRepository.findAll();  // BAD
       }
   }
   
   // GOOD
   @RestController
   public class ExampleController {
       @GetMapping
       public List<ExampleResponseDto> list() {
           return exampleService.listAll();  // GOOD
       }
   }
   ```

5. **Never put business logic in controllers**: Delegate all logic to services
   ```java
   // BAD
   @RestController
   public class ExampleController {
       @PostMapping
       public ResponseEntity<?> create(@RequestBody ExampleRequestDto request) {
           if ("active".equals(request.getStatus())) {  // BAD: business logic
               // complex logic here
           }
       }
   }
   
   // GOOD: Move to service
   ```

### Code Quality Prohibitions

6. **Avoid overly defensive code**: Don't handle every possible edge case if it makes code unnecessarily long
   ```java
   // BAD: Overly defensive
   public String processData(Map<String, Object> data) {
       if (data == null) {
           return null;
       }
       if (!(data instanceof Map)) {
           return null;
       }
       if (!data.containsKey("field")) {
           return null;
       }
       Object field = data.get("field");
       if (field == null) {
           return null;
       }
       if (!(field instanceof String)) {
           return null;
       }
       // ... 20 more checks
   }
   
   // GOOD: Focus on realistic scenarios
   public String processData(Map<String, Object> data) {
       return (String) data.get("field");
   }
   ```

7. **No verbose example data**: Don't include dummy data or meaningless test values
8. **No meaningless comments**: Code should be self-explanatory
9. **No if/for logic in controllers**: Move all conditional logic to services

## Code Quality Standards

- **Production-ready**: Code must be immediately usable in production
- **Type annotations**: All methods must have complete type signatures
- **Error handling**: Services raise domain exceptions (`ServiceException`, `NotFoundException`) with HTTP status hints
- **Transaction boundaries**: Use `@Transactional` at service method level
- **Code first, explanation last**: Show code first, then brief explanation (≤5 lines)
- **JavaDoc documentation**: All public interfaces, classes, and methods must have comprehensive Google style JavaDoc

## JavaDoc Documentation Requirements

All service interfaces, implementation classes, and public methods must follow Google style JavaDoc conventions.

### Why Write JavaDoc in English?

JavaDoc comments must be written in English for the following reasons:

1. **International Collaboration**: English is the standard language for software development, enabling collaboration with international developers and contributors
2. **Tool Support**: IDEs, documentation generators, and code analysis tools work best with English JavaDoc
3. **Industry Standard**: Following Java community conventions and best practices established by Oracle and major open-source projects
4. **Code Review**: Makes code reviews accessible to non-Korean-speaking team members and external contributors
5. **Maintainability**: English documentation is more widely understood and maintainable in long-term projects
6. **API Documentation**: Generated API documentation (e.g., via Swagger/OpenAPI) benefits from English descriptions

### Class-Level Documentation

Every service interface and implementation class must include:

1. **Summary**: One-line description of the service's purpose
2. **Effective Java Item 20 reference**: For interfaces, mention the principle
3. **Service layer role**: List key responsibilities using `<ul>` tags
4. **Usage context**: How it's used (by controllers, dependency injection)
5. **Implementation details**: For implementation classes, mention annotations and transaction behavior

**Example: Interface JavaDoc**

```java
/**
 * Service interface for handling product-related business logic.
 * 
 * <p>
 * This interface defines the contract for product business operations such as creation,
 * retrieval, update, and deletion. Following Effective Java Item 20 principle,
 * it uses interfaces to separate contract from implementation.
 * 
 * <p>
 * Service layer responsibilities:
 * <ul>
 * <li>Business rule validation (e.g., price validation, stock verification)</li>
 * <li>Transaction management (ensuring data consistency)</li>
 * <li>Data access through repositories</li>
 * <li>Conversion of domain objects to DTOs</li>
 * </ul>
 * 
 * <p>
 * This interface is used by the controller layer, and implementation classes access
 * the database through repositories. Implementation classes are automatically injected
 * via Spring's dependency injection.
 */
public interface ProductService {
    // ...
}
```

### Method-Level Documentation

Every public method must include:

1. **Summary**: One-line description
2. **Detailed description**: Use `<p>` tags for paragraphs
3. **Business rules**: List important rules using `<ul>` tags
4. **Transaction behavior**: Describe transaction boundaries and rollback behavior
5. **Parameters**: `@param` tags for all parameters with descriptions and constraints
6. **Return value**: `@return` tag describing what is returned
7. **Exceptions**: `@throws` tags for all checked and important unchecked exceptions

**Example: Method JavaDoc**

```java
/**
 * Creates a new product.
 * 
 * <p>
 * This method receives a product creation request DTO and creates a new product.
 * 
 * <p>
 * Business rules:
 * <ul>
 * <li>Product price must be greater than or equal to 0</li>
 * <li>Stock quantity must be greater than or equal to 0</li>
 * <li>User must exist</li>
 * </ul>
 * 
 * <p>
 * Transaction behavior:
 * <ul>
 * <li>This method executes within a transaction</li>
 * <li>If an error occurs, all changes are automatically rolled back</li>
 * </ul>
 * 
 * @param requestDto Product creation request DTO (must not be null)
 * @return DTO object containing the created product information
 * @throws ClientException if user does not exist or price/stock is invalid
 */
ProductDto createProduct(ProductCreateRequestDto requestDto);
```

### Test Class Documentation

All test classes must have comprehensive JavaDoc that includes:

1. **Purpose**: What is being tested
2. **Test strategy**: How tests are structured (Mock objects, Given-When-Then, etc.)
3. **Test environment**: Configuration annotations and their purpose
4. **Mock object explanation**: What Mock objects are and why they're used

**Example: Test Class JavaDoc**

```java
/**
 * Test class for validating business logic of {@link BookmarkServiceImpl}.
 * 
 * <p>
 * This test class contains unit tests for all methods of the bookmark service implementation class.
 * It tests the {@link BookmarkServiceImpl} class which implements the {@link BookmarkService} interface.
 * 
 * <p>
 * Test strategy:
 * <ul>
 * <li>Uses Mock objects to test without a real database</li>
 * <li>Structures tests using the Given-When-Then pattern</li>
 * <li>Validates both success cases and exception cases</li>
 * </ul>
 * 
 * <p>
 * Test environment:
 * <ul>
 * <li>{@code @ActiveProfiles("test")}: Uses test profile</li>
 * <li>{@code @MockBean}: Replaces repository with Mock object</li>
 * <li>{@code @Autowired}: Injects actual service implementation object</li>
 * <li>{@code @ContextConfiguration}: Registers implementation class in test context</li>
 * </ul>
 */
@ActiveProfiles("test")
@ExtendWith({ SpringExtension.class })
@ContextConfiguration(classes = { BookmarkServiceImpl.class })
public class BookmarkServiceTest {
    // ...
}
```

### Test Method Documentation

Every test method must include:

1. **Summary**: One-line description of what is being tested
2. **Test scenario**: Given-When-Then pattern explicitly documented using `<ol>` tags
3. **Verification**: List of what is being verified using `<ul>` tags

**Example: Test Method JavaDoc**

```java
/**
 * Tests the successful bookmark registration case.
 * 
 * <p>
 * Test scenario (Given-When-Then):
 * <ol>
 * <li><strong>Given</strong>: Set up a situation where the same bookmark does not exist</li>
 * <li><strong>When</strong>: Call the bookmark registration method</li>
 * <li><strong>Then</strong>: Verify that the bookmark is created and returned correctly</li>
 * </ol>
 * 
 * <p>
 * Verification:
 * <ul>
 * <li>Returned DTO is not null</li>
 * <li>Repository's find method is called once</li>
 * <li>Repository's save method is called once</li>
 * </ul>
 */
@Test
void testRegisterBookmark_Success() {
    // ...
}
```

### Controller Documentation

All controller classes and methods must have comprehensive JavaDoc that includes HTTP request/response examples.

**Controller Class JavaDoc Requirements**

Every controller class must include:

1. **Purpose**: What the controller does
2. **Controller role**: List key responsibilities
3. **Service delegation**: How it delegates to service layer
4. **Response format**: What response wrapper is used

**Controller Method JavaDoc Requirements**

Every controller method must include:

1. **Summary**: One-line description of what the endpoint does
2. **HTTP method**: What HTTP method is used
3. **Request example**: HTTP request example using `<pre>{@code ... }</pre>`
4. **Response example**: Success response example using `<pre>{@code ... }</pre>`
5. **Parameters**: `@param` tags for all parameters
6. **Return value**: `@return` tag describing the response
7. **Exceptions**: `@throws` tags for important exceptions

**Example: Controller Method JavaDoc**

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

### Field Documentation

All class fields (service, controller, test) should have JavaDoc comments:

```java
/** Repository for accessing bookmark data (automatically injected by Spring). */
private final BookmarkRepository bookmarkRepository;

/** Bookmark service interface under test (BookmarkServiceImpl implementation is injected). */
@Autowired
private BookmarkService bookmarkService;
```

**Field JavaDoc Best Practices**

- Use `/** */` format for field documentation
- Explain the purpose and role of the field
- For injected dependencies, mention that Spring automatically injects them
- Keep descriptions concise but informative

### JavaDoc Best Practices

- **Use HTML tags**: `<p>`, `<ul>`, `<li>`, `<code>`, `<pre>` for formatting
- **Reference other types**: Use `{@link ClassName}` or `{@code code}` for inline references
- **Be specific**: Include nullability, constraints, and business rules
- **Explain why**: For complex logic, explain the reasoning
- **Consistent style**: Follow the same structure across all classes and methods
- **Field documentation**: Document all important fields with `/** */` comments
- **HTTP examples**: Always include request/response examples in controller method JavaDoc using `<pre>{@code ... }</pre>`
- **Test scenarios**: Always document Given-When-Then pattern in test method JavaDoc

## Output Format

### Structure

1. **Code files** organized by layer (Controller.java, Service.java, DTOs)
2. **Type annotations** on all methods and fields
3. **Clear imports** with proper organization
4. **Brief explanation** at the end (≤5 lines) focusing on structure and intent

### Example Output Format

```java
// Controller.java
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

```java
// Service.java
@Service
@Transactional
public class ExampleService {
    private final ExampleRepository exampleRepository;
    
    public ExampleService(ExampleRepository exampleRepository) {
        this.exampleRepository = exampleRepository;
    }
    
    public ExampleResponseDto create(ExampleCreateRequestDto request, Authentication auth) {
        ExampleEntity entity = new ExampleEntity();
        entity.setName(request.getName());
        entity.setOwnerId(auth.getName());
        ExampleEntity saved = exampleRepository.save(entity);
        return ExampleResponseDto.from(saved);
    }
}
```

```java
// DTOs
public class ExampleCreateRequestDto {
    @NotBlank
    @Size(max = 100)
    private String name;
    
    @Email
    private String email;
    
    // getters, setters
}

public class ExampleResponseDto {
    private Long id;
    private String name;
    private String email;
    
    public static ExampleResponseDto from(ExampleEntity entity) {
        ExampleResponseDto dto = new ExampleResponseDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setEmail(entity.getEmail());
        return dto;
    }
    
    // getters, setters
}
```

**Explanation**: Implements layered architecture with Controller handling HTTP, Service managing business logic and transactions, and DTOs performing input validation. Repository pattern encapsulates data access.

## Prompt Variants

### Variant 1: New Feature Implementation

Use this template when implementing a new feature:

```
[Use the full prompt above with feature description filled in]

Implement the following feature following the structure and constraints above:
[Feature description]
```

### Variant 2: Refactoring Existing Code

Use this template when refactoring existing Spring Boot code:

```
[Use the full prompt above]

The following Spring Boot code is overly verbose and lacks proper modularization.
Refactor it according to the structure and constraints above.

Requirements:
- Maintain 100% functional equivalence
- Keep Spring controllers thin, move business logic to services
- Extract duplicate code into helper methods or classes
- Remove meaningless comments, unused code, excessive logging
- Rename methods/classes to clearly reveal their purpose
- File structure: Controller.java, Service.java, DTOs (if needed)

Output format:
1) Refactored code
2) Summary of structural changes and intent (≤10 lines)

[Paste existing code here]
```

### Variant 3: Code Review and Improvement

Use this template for reviewing and improving existing code:

```
[Use the full prompt above]

Review the following Spring Boot code and identify violations of the architecture rules.
Suggest specific improvements following the constraints above.

Focus on:
- Architecture violations (direct entity access in controllers, business logic in DTOs, etc.)
- Code conciseness (method length, file length)
- Prohibited patterns (reflection, overly defensive code)
- Missing type annotations
- Transaction boundaries

[Paste code to review here]
```

## Comprehensive Examples: Good vs Bad

### Example 1: User Profile Update

**BAD: Business logic in controller, direct entity access**
```java
// Controller.java - BAD
@RestController
public class ProfileController {
    @Autowired
    private UserRepository userRepository;  // BAD: Direct repository access
    
    @PutMapping("/profiles/{userId}")
    public ResponseEntity<?> update(@PathVariable Long userId, @RequestBody Map<String, Object> data) {
        User user = userRepository.findById(userId).orElse(null);  // BAD: Direct entity access
        if (user.getId() != getCurrentUserId()) {  // BAD: Business logic in controller
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        Profile profile = profileRepository.findByUser(user);  // BAD: Direct entity access
        profile.setName((String) data.get("name"));  // BAD: Business logic
        profile.setEmail((String) data.get("email"));
        if (profileRepository.existsByEmailAndIdNot(profile.getEmail(), profile.getId())) {  // BAD: Complex logic
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email exists");
        }
        profileRepository.save(profile);
        return ResponseEntity.ok(Map.of("id", profile.getId(), "name", profile.getName()));
    }
}
```

**GOOD: Thin controller, service handles business logic**
```java
// Controller.java - GOOD
@RestController
@RequestMapping("/api/v1/profiles")
public class ProfileController {
    private final ProfileService profileService;
    
    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }
    
    @PutMapping("/{userId}")
    public ResponseEntity<ProfileResponseDto> update(
            @PathVariable Long userId,
            @Valid @RequestBody ProfileUpdateRequestDto request,
            Authentication authentication) {
        try {
            ProfileResponseDto response = profileService.update(userId, request, authentication);
            return ResponseEntity.ok(response);
        } catch (ServiceException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(new ErrorResponseDto(e.getMessage()));
        }
    }
}
```

```java
// Service.java - GOOD
@Service
@Transactional
public class ProfileService {
    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    
    public ProfileService(ProfileRepository profileRepository, UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
    }
    
    public ProfileResponseDto update(Long userId, ProfileUpdateRequestDto request, Authentication auth) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        if (!targetUser.getId().equals(getCurrentUserId(auth))) {
            throw new ServiceException("Unauthorized", HttpStatus.FORBIDDEN);
        }
        
        Profile profile = profileRepository.findByUser(targetUser)
                .orElseThrow(() -> new NotFoundException("Profile not found"));
        
        if (request.getEmail() != null) {
            validateEmailUniqueness(request.getEmail(), profile.getId());
        }
        
        profile.setName(request.getName());
        profile.setEmail(request.getEmail());
        Profile updated = profileRepository.save(profile);
        
        return ProfileResponseDto.from(updated);
    }
    
    private void validateEmailUniqueness(String email, Long profileId) {
        if (profileRepository.existsByEmailAndIdNot(email, profileId)) {
            throw new ServiceException("Email already exists", HttpStatus.BAD_REQUEST);
        }
    }
}
```

### Example 2: DTO Validation

**BAD: Repository call in DTO**
```java
// DTO.java - BAD
public class UserCreateRequestDto {
    @Email
    private String email;
    
    private String username;
    
    @CustomValidator
    public void validateEmail() {
        if (userRepository.existsByEmail(email)) {  // BAD: Repository call
            throw new ValidationException("Email exists");
        }
    }
}
```

**GOOD: Simple validation only, delegate to service**
```java
// DTO.java - GOOD
public class UserCreateRequestDto {
    @NotBlank
    @Email
    private String email;
    
    @NotBlank
    @Size(max = 50)
    private String username;
    
    // getters, setters
}
```

```java
// Service.java - GOOD (email uniqueness check here)
@Service
@Transactional
public class UserService {
    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    public UserResponseDto create(UserCreateRequestDto request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ServiceException("Email already exists", HttpStatus.BAD_REQUEST);
        }
        
        UserEntity entity = new UserEntity();
        entity.setEmail(request.getEmail());
        entity.setUsername(request.getUsername());
        UserEntity saved = userRepository.save(entity);
        
        return UserResponseDto.from(saved);
    }
}
```

### Example 3: Complex Business Logic

**BAD: Long method with nested logic**
```java
// Service.java - BAD
@Service
public class OrderService {
    public Order processOrder(Long orderId, Map<String, Object> paymentData) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new RuntimeException("Invalid status");
        }
        if (!paymentData.get("amount").equals(order.getTotal())) {
            throw new RuntimeException("Amount mismatch");
        }
        if ("credit_card".equals(paymentData.get("method"))) {
            if (!validateCreditCard((String) paymentData.get("cardNumber"))) {
                throw new RuntimeException("Invalid card");
            }
            PaymentTransaction transaction = chargeCreditCard(paymentData);
            if (transaction.getStatus() != PaymentStatus.SUCCESS) {
                throw new RuntimeException("Payment failed");
            }
            order.setStatus(OrderStatus.PAID);
            order.setPaymentMethod("credit_card");
            order.setPaymentTransactionId(transaction.getId());
            orderRepository.save(order);
            sendConfirmationEmail(order);
            updateInventory(order);
            return order;
        } else if ("paypal".equals(paymentData.get("method"))) {
            // ... 30 more lines
        }
    }
}
```

**GOOD: Split into small, focused methods**
```java
// Service.java - GOOD
@Service
@Transactional
public class OrderService {
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    
    public OrderService(OrderRepository orderRepository, PaymentService paymentService, NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
    }
    
    public OrderResponseDto processOrder(Long orderId, PaymentRequestDto request) {
        Order order = loadAndValidateOrder(orderId);
        validatePaymentAmount(order, request);
        
        PaymentTransaction transaction = processPayment(order, request);
        order = updateOrderPayment(order, transaction, request);
        
        postPaymentActions(order);
        return OrderResponseDto.from(order);
    }
    
    private Order loadAndValidateOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ServiceException("Order is not pending", HttpStatus.BAD_REQUEST);
        }
        return order;
    }
    
    private void validatePaymentAmount(Order order, PaymentRequestDto request) {
        if (!request.getAmount().equals(order.getTotal())) {
            throw new ServiceException("Payment amount mismatch", HttpStatus.BAD_REQUEST);
        }
    }
    
    private PaymentTransaction processPayment(Order order, PaymentRequestDto request) {
        if ("credit_card".equals(request.getMethod())) {
            return paymentService.processCreditCard(request);
        } else if ("paypal".equals(request.getMethod())) {
            return paymentService.processPaypal(request);
        } else {
            throw new ServiceException("Invalid payment method", HttpStatus.BAD_REQUEST);
        }
    }
    
    private Order updateOrderPayment(Order order, PaymentTransaction transaction, PaymentRequestDto request) {
        order.setStatus(OrderStatus.PAID);
        order.setPaymentMethod(request.getMethod());
        order.setPaymentTransactionId(transaction.getId());
        return orderRepository.save(order);
    }
    
    private void postPaymentActions(Order order) {
        notificationService.sendConfirmationEmail(order);
        inventoryService.updateInventory(order);
    }
}
```

## Validation Checklist

Before submitting code, verify:

- [ ] All layers respect boundaries (Controller → Service → Repository → Entity)
- [ ] No prohibited patterns (reflection, repository calls from DTOs, etc.)
- [ ] Repository only used by Service layer
- [ ] DTO only performs simple validation
- [ ] File length ≤150 lines per example
- [ ] Method length ≤30 lines (prefer ≤20)
- [ ] All methods have type annotations
- [ ] Code is production-ready
- [ ] Brief explanation provided (≤5 lines)
