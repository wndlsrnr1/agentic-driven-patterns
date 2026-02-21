---
description: Spring Services — business orchestration, transactions, repository coordination
globs: "**/service/**/*.java", "**/*Service.java"
alwaysApply: false
---

## Spring Services (Project Standard)

### Core Principles

- **Business orchestration**: Services coordinate multiple repositories and handle complex workflows
- **Transaction boundaries**: Use `@Transactional` for use-case level transactions
- **JPA access**: Services use repositories for all data access; maintain clear transaction boundaries and error mapping
- **Domain error mapping**: Raise `ServiceException`/`NotFoundException` with HTTP status hints
- **Testability**: Clear dependency injection for easy mocking
- **Interface-based design**: Follow Effective Java Item 20 principle - prefer interfaces to separate contract from implementation

### Interface-Based Service Pattern (Preferred)

Following Effective Java Item 20 principle, services should be defined as interfaces with separate implementation classes. This pattern provides:
- **Separation of concerns**: Contract (interface) vs implementation (class)
- **Testability**: Easy to mock interfaces in unit tests
- **Flexibility**: Multiple implementations can exist for the same interface
- **Documentation**: Interface serves as clear API contract

**Interface Definition Pattern**

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
 * 
 * <p>
 * Implementation classes use {@code @Service} and {@code @Transactional} annotations
 * to perform transaction management.
 */
public interface ProductService {
    
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
     * <li>On success, the product is saved to the database</li>
     * </ul>
     * 
     * @param requestDto Product creation request DTO (must not be null)
     * @return DTO object containing the created product information
     * @throws ClientException if user does not exist or price/stock is invalid
     */
    ProductDto createProduct(ProductCreateRequestDto requestDto);
    
    /**
     * Retrieves a product by product ID.
     * 
     * <p>
     * This method receives a product ID and retrieves the corresponding product.
     * 
     * <p>
     * Retrieval behavior:
     * <ul>
     * <li>Executes in a read-only transaction ({@code readOnly = true})</li>
     * <li>Throws an exception if the product does not exist</li>
     * <li>Converts entity to DTO and returns it</li>
     * </ul>
     * 
     * @param productId ID of the product to retrieve (must not be null)
     * @return DTO object containing product information
     * @throws NotFoundException if the product does not exist
     */
    ProductDto getProduct(Long productId);
}
```

**Implementation Class Pattern**

```java
/**
 * 상품 관련 비즈니스 로직을 처리하는 서비스 구현 클래스입니다.
 * 
 * <p>
 * 이 클래스는 {@link ProductService} 인터페이스의 구현체로,
 * 상품의 생성, 조회, 수정, 삭제 등의 비즈니스 로직을 실제로 구현합니다.
 * 
 * <p>
 * 서비스 계층의 역할:
 * <ul>
 * <li>비즈니스 규칙 검증 (예: 상품 가격 검증, 재고 확인)</li>
 * <li>트랜잭션 관리 (데이터 일관성 보장)</li>
 * <li>리포지토리를 통한 데이터 접근</li>
 * <li>도메인 객체를 DTO로 변환</li>
 * </ul>
 * 
 * <p>
 * {@code @Service} 어노테이션은 이 클래스가 Spring의 서비스 빈으로 등록되도록 합니다.
 * {@code @Transactional} 어노테이션은 이 클래스의 모든 메서드가
 * 트랜잭션 내에서 실행되도록 합니다. 트랜잭션은 여러 데이터베이스 작업을
 * 하나의 작업 단위로 묶어서, 중간에 오류가 발생하면 모든 변경사항을 되돌립니다.
 * 
 * <p>
 * 이 서비스는 컨트롤러에서 호출되며, 리포지토리를 통해 데이터베이스에 접근합니다.
 * Spring의 의존성 주입을 통해 {@link ProductRepository}와 {@link UserValidator}가 자동으로 주입됩니다.
 */
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    
    /** 상품 데이터에 접근하기 위한 리포지토리 (Spring이 자동으로 주입). */
    private final ProductRepository productRepository;
    
    /** 사용자 검증을 위한 Validator 컴포넌트 (Spring이 자동으로 주입). */
    private final UserValidator userValidator;
    
    /**
     * 새로운 상품을 생성합니다.
     * 
     * <p>
     * 이 메서드는 상품 생성 요청 DTO를 받아 새로운 상품을 생성합니다.
     * 
     * <p>
     * 비즈니스 규칙:
     * <ul>
     * <li>상품 가격은 0 이상이어야 함</li>
     * <li>재고 수량은 0 이상이어야 함</li>
     * <li>사용자가 존재해야 함</li>
     * </ul>
     * 
     * <p>
     * 트랜잭션 동작:
     * <ul>
     * <li>이 메서드는 트랜잭션 내에서 실행됩니다</li>
     * <li>중간에 오류가 발생하면 모든 변경사항이 자동으로 되돌려집니다</li>
     * <li>성공 시 데이터베이스에 상품이 저장됩니다</li>
     * </ul>
     * 
     * @param requestDto 상품 생성 요청 DTO (null이 아니어야 함)
     * @return 생성된 상품 정보를 담은 DTO 객체
     * @throws ClientException 사용자가 존재하지 않거나, 가격/재고가 유효하지 않은 경우
     */
    @Override
    @Transactional
    public ProductDto createProduct(ProductCreateRequestDto requestDto) {
        // 1) Validation using validator component
        userValidator.validateUserExists(requestDto.getUserId());
        
        // 2) Business logic
        Product product = Product.builder()
                .userId(requestDto.getUserId())
                .name(requestDto.getName())
                .price(requestDto.getPrice())
                .quantity(requestDto.getQuantity())
                .status(ProductStatus.AVAILABLE)
                .build();
        
        // 3) Persist
        Product savedProduct = productRepository.save(product);
        
        // 4) Return Service DTO
        return ProductDto.of(savedProduct);
    }
    
    /**
     * 상품 ID로 상품을 조회합니다.
     * 
     * <p>
     * 이 메서드는 상품 ID를 받아 해당 상품을 조회합니다.
     * 
     * <p>
     * 조회 동작:
     * <ul>
     * <li>읽기 전용 트랜잭션으로 실행됩니다 ({@code readOnly = true})</li>
     * <li>상품이 존재하지 않으면 예외를 발생시킵니다</li>
     * <li>엔티티를 DTO로 변환하여 반환합니다</li>
     * </ul>
     * 
     * @param productId 조회할 상품의 ID (null이 아니어야 함)
     * @return 상품 정보를 담은 DTO 객체
     * @throws NotFoundException 상품이 존재하지 않는 경우
     */
    @Override
    @Transactional(readOnly = true)
    public ProductDto getProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found: " + productId));
        return ProductDto.of(product);
    }
}
```

**Benefits of Interface-Based Design**

- **Testability**: Controllers and other services depend on interfaces, making unit testing easier with mocks
- **Flexibility**: Multiple implementations can exist (e.g., `ProductServiceImpl`, `CachedProductServiceImpl`)
- **Clear contracts**: Interface methods clearly define the service API
- **Documentation**: Interface JavaDoc serves as primary API documentation

**Note**: While interface-based design is preferred, concrete service classes (without interfaces) are also acceptable for simple services or legacy code. The choice depends on project requirements and complexity.

### Service Architecture Pattern

**With Validator Component Injection**

```java
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {
    private final ProductRepository productRepository;
    private final UserValidator userValidator;  // Inject validator component
    
    public ProductDto createProduct(ProductCreateRequestDto requestDto) {
        // 1) Validation using validator component
        userValidator.validateUserExists(requestDto.getUserId());
        
        // 2) Business logic
        Product product = Product.builder()
                .userId(requestDto.getUserId())
                .name(requestDto.getName())
                .price(requestDto.getPrice())
                .quantity(requestDto.getQuantity())
                .status(ProductStatus.AVAILABLE)
                .build();
        
        // 3) Persist
        Product savedProduct = productRepository.save(product);
        
        // 4) Return Service DTO
        return ProductDto.of(savedProduct);
    }
}
```

**Alternative: Inline Validation Methods**

```java
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Transactional
public class ExampleService {
    private static final Logger logger = LoggerFactory.getLogger(ExampleService.class);
    
    private final ExampleRepository exampleRepository;
    private final RelatedRepository relatedRepository;
    
    public ExampleService(ExampleRepository exampleRepository, RelatedRepository relatedRepository) {
        this.exampleRepository = exampleRepository;
        this.relatedRepository = relatedRepository;
    }
    
    public ExampleResponseDto processWorkflow(ExampleRequestDto request, Authentication auth) {
        /*
         * Pipeline: validate → load → process → persist → return
         */
        // 1) Validation
        validateRequest(request, auth);
        
        // 2) Load entities via repositories
        List<RelatedEntity> entities = loadRequiredEntities(request);
        
        // 3) Business logic processing
        ExampleEntity result = executeBusinessLogic(entities, request);
        
        // 4) Persist changes via repositories
        ExampleEntity saved = persistChanges(result);
        
        // 5) Return DTOs
        return ExampleResponseDto.from(saved);
    }
}
```

### Pipeline Method Design

**Structure all service methods as clear pipelines:**

1. **Validation**: Use Validator components or inline validation methods to check existence and business rules
2. **Loading**: Fetch required entities via repositories
3. **Processing**: Execute core business logic
4. **Persistence**: Save changes via repositories  
5. **Response**: Return Service DTOs (not Controller DTOs)

**Validation Pattern: Validator Component (Preferred)**

```java
@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {
    private final ProductRepository productRepository;
    private final UserValidator userValidator;  // Validator component
    
    public ProductDto createProduct(ProductCreateRequestDto requestDto) {
        // 1) Validation using validator component
        userValidator.validateUserExists(requestDto.getUserId());
        
        // 2) Business logic
        Product product = Product.builder()
                .userId(requestDto.getUserId())
                .name(requestDto.getName())
                .price(requestDto.getPrice())
                .quantity(requestDto.getQuantity())
                .status(ProductStatus.AVAILABLE)
                .build();
        
        // 3) Persist
        Product savedProduct = productRepository.save(product);
        
        // 4) Return Service DTO
        return ProductDto.of(savedProduct);
    }
}
```

#### Pipeline with Repository Usage

```java
@Service
@Transactional
public class TranslationService {
    private final EpisodeRepository episodeRepository;
    private final BubbleRepository bubbleRepository;
    private final LanguageRepository languageRepository;
    private final EpisodeLocaleRepository episodeLocaleRepository;
    private final BubbleLocaleRepository bubbleLocaleRepository;
    
    public TranslationService(
            EpisodeRepository episodeRepository,
            BubbleRepository bubbleRepository,
            LanguageRepository languageRepository,
            EpisodeLocaleRepository episodeLocaleRepository,
            BubbleLocaleRepository bubbleLocaleRepository) {
        this.episodeRepository = episodeRepository;
        this.bubbleRepository = bubbleRepository;
        this.languageRepository = languageRepository;
        this.episodeLocaleRepository = episodeLocaleRepository;
        this.bubbleLocaleRepository = bubbleLocaleRepository;
    }
    
    public TranslationResponseDto translateEpisode(Long episodeId, String languageCode) {
        // 1) Validation - Multiple repositories for existence checks
        Episode episode = validateTranslationRequest(episodeId, languageCode);
        
        // 2) Loading - Repository queries with optimizations
        List<Bubble> bubbles = bubbleRepository.findByEpisodeId(episodeId);
        if (bubbles.isEmpty()) {
            throw new ServiceException("No bubbles found for translation", HttpStatus.NOT_FOUND);
        }
        
        // 3) Processing - Business logic with loaded entities
        List<String> textList = bubbles.stream()
                .map(bubble -> bubble.getOriginalText() != null ? bubble.getOriginalText() : "")
                .collect(Collectors.toList());
        TranslationResult translationResult = externalTranslationService.translate(textList, languageCode);
        
        // 4) Persistence - Multiple repositories for atomic saves
        Language targetLanguage = languageRepository.findByCode(languageCode)
                .orElseThrow(() -> new NotFoundException("Language not found"));
        EpisodeLocale episodeLocale = episodeLocaleRepository.findOrCreateForEpisode(episode, targetLanguage);
        
        List<BubbleLocale> bubbleLocales = new ArrayList<>();
        for (int i = 0; i < bubbles.size(); i++) {
            BubbleLocale bubbleLocale = bubbleLocaleRepository.updateOrCreateTranslation(
                    bubbles.get(i), episodeLocale, translationResult.getTranslations().get(i));
            bubbleLocales.add(bubbleLocale);
        }
        
        // 5) Response - DTO
        return new TranslationResponseDto(bubbleLocales, episodeLocale);
    }
    
    private Episode validateTranslationRequest(Long episodeId, String languageCode) {
        Episode episode = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new NotFoundException("Episode not found"));
        
        languageRepository.findByCode(languageCode)
                .orElseThrow(() -> new NotFoundException("Target language not found"));
        
        return episode;
    }
}
```

### Error Handling

```java
public class ServiceException extends RuntimeException {
    private final HttpStatus statusCode;
    
    public ServiceException(String message, HttpStatus statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
    
    public HttpStatus getStatusCode() {
        return statusCode;
    }
}

public class NotFoundException extends ServiceException {
    public NotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}

// Usage in services
public ExampleEntity getEntity(Long entityId) {
    return exampleRepository.findById(entityId)
            .orElseThrow(() -> new NotFoundException("Entity " + entityId + " not found"));
}
```

### Transaction Management

- **Use-case level**: One `@Transactional` per service method
- **Nested calls**: Inner service calls should not have their own transactions (use `@Transactional(propagation = Propagation.REQUIRED)`)
- **Rollback safety**: All repository operations within transaction will rollback on exception

```java
@Service
@Transactional
public class ComplexWorkflowService {
    private final Entity1Repository entity1Repository;
    private final Entity2Repository entity2Repository;
    
    public ComplexWorkflowService(Entity1Repository entity1Repository, Entity2Repository entity2Repository) {
        this.entity1Repository = entity1Repository;
        this.entity2Repository = entity2Repository;
    }
    
    public WorkflowResponseDto complexWorkflow(WorkflowRequestDto request) {
        // All repository operations are atomic
        Entity1 entity1 = entity1Repository.save(new Entity1(request.getPart1()));
        Entity2 entity2 = entity2Repository.save(new Entity2(entity1.getId(), request.getPart2()));
        // If any step fails, all changes rollback
        return new WorkflowResponseDto(entity1, entity2);
    }
}
```

### Repository Coordination

- **Single responsibility**: Each repository handles one entity
- **Coordination in services**: Services orchestrate multiple repositories
- **No repository-to-repository calls**: All coordination through services
- **Direct repository injection**: Services directly inject and use repositories via constructor
- **Validator injection**: Services inject Validator components for domain rule validation

#### Direct Repository Usage Pattern with Validator

```java
@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {
    private final ProductRepository productRepository;
    private final UserValidator userValidator;  // Validator component injection
    
    public ProductDto createProduct(ProductCreateRequestDto requestDto) {
        // Use validator component for domain validation
        userValidator.validateUserExists(requestDto.getUserId());
        
        // Use repository directly for business orchestration
        Product product = Product.builder()
                .userId(requestDto.getUserId())
                .name(requestDto.getName())
                .price(requestDto.getPrice())
                .quantity(requestDto.getQuantity())
                .status(ProductStatus.AVAILABLE)
                .build();
        
        Product savedProduct = productRepository.save(product);
        return ProductDto.of(savedProduct);
    }
}
```

**Multi-Repository Pattern with Validator**

```java
@Service
@RequiredArgsConstructor
@Transactional
public class EpisodeTranslateService {
    private final EpisodeRepository episodeRepository;
    private final BubbleRepository bubbleRepository;
    private final LanguageRepository languageRepository;
    private final EpisodeLocaleRepository episodeLocaleRepository;
    private final BubbleLocaleRepository bubbleLocaleRepository;
    private final EpisodeValidator episodeValidator;  // Validator component
    
    public TranslationResponseDto translateEpisode(Long episodeId, String languageCode) {
        // Use validator for domain validation
        episodeValidator.validateEpisodeExists(episodeId);
        episodeValidator.validateLanguageExists(languageCode);
        
        // Use repositories directly for business orchestration
        Episode episode = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new NotFoundException("Episode not found"));
        Language targetLanguage = languageRepository.findByCode(languageCode)
                .orElseThrow(() -> new NotFoundException("Language not found"));
        List<Bubble> bubbles = bubbleRepository.findByEpisodeId(episodeId);
        
        // Process business logic...
        
        // Coordinate multiple repositories for complex persistence
        EpisodeLocale episodeLocale = episodeLocaleRepository.findOrCreateForEpisode(episode, targetLanguage);
        
        List<BubbleLocale> bubbleLocales = new ArrayList<>();
        for (Bubble bubble : bubbles) {
            BubbleLocale bubbleLocale = bubbleLocaleRepository.updateOrCreateTranslation(
                    bubble, episodeLocale, targetLanguage, translatedText);
            bubbleLocales.add(bubbleLocale);
        }
        
        return new TranslationResponseDto(bubbleLocales, episodeLocale);
    }
}
```

#### Multi-Repository Orchestration Benefits

- **Clear dependencies**: All required repositories visible in constructor
- **Atomic transactions**: Multiple repository operations under single transaction
- **Domain modeling**: Each repository represents a specific domain aggregate
- **Testability**: Easy to mock individual repositories for unit testing

### Input/Output Patterns

**Input**: Accept Service DTOs (not Controller DTOs) from controllers. All parameters must have type annotations.
**Output**: Return Service DTOs (not Controller DTOs). Controllers convert Service DTOs to Controller DTOs. All return types must be explicitly annotated.

```java
// Good: Accept Service DTOs with type annotations
public ProductDto createProduct(ProductCreateRequestDto requestDto) {
    // requestDto is Service DTO, not Controller DTO
    // ...
}

// Good: Return Service DTOs with type annotations
public ProductDto getProduct(Long id) {
    Product product = productRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Product not found"));
    return ProductDto.of(product);  // Return Service DTO
}

// Service DTO pattern
public class ProductDto {
    private Long id;
    private Long userId;
    private String name;
    private Long price;
    private Long quantity;
    private ProductStatus status;
    
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

### DTO Usage Guidelines

**When to use DTOs**:
- Service-to-Service data transfer with complex structures
- External API integration (STT, ChatGPT, etc.)
- Complex query results from multiple repositories
- Business logic data structures requiring clear contracts

**DTO Location**: Define DTO classes inside `dto/` directory (e.g., `dto/request/`, `dto/response/`)

**DTO Best Practices**:
- Use Java type system (avoid raw types, use generics)
- Prefer `record` (Java 14+) or immutable classes for clear structure
- All DTO fields must have explicit types
- Add JavaDoc for complex DTOs

```java
// dto/SummaryGenerationDto.java
/**
 * DTO for summary generation request.
 */
public class SummaryGenerationDto {
    private Long sttDataId;
    private String userPrompt;
    private String adminPrompt;
    private String model = "gpt-4";
    private Integer maxTokens = 2000;
    
    // constructors, getters, setters
}

// Usage in service
public SummaryResponseDto generateSummary(SummaryGenerationDto dto) {
    SttData sttData = sttDataRepository.findById(dto.getSttDataId())
            .orElseThrow(() -> new NotFoundException("STT data not found"));
    // ...
}
```

### Logging Strategy

- **Info level**: Pipeline checkpoints, completion status
- **Error level**: Exception details with correlation IDs
- **No PII**: Never log sensitive user data or content

```java
@Service
@Transactional
public class TranslationService {
    private static final Logger logger = LoggerFactory.getLogger(TranslationService.class);
    
    public TranslationResponseDto processTranslation(Long episodeId, String languageCode) {
        logger.info("Starting translation for episode {} to {}", episodeId, languageCode);
        
        try {
            TranslationResponseDto result = executeTranslation(episodeId, languageCode);
            logger.info("Translation completed for episode {}, {} bubbles", episodeId, result.getBubbleLocales().size());
            return result;
        } catch (Exception e) {
            logger.error("Translation failed for episode {}: {}", episodeId, e.getMessage(), e);
            throw new ServiceException("Translation processing failed", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
```

### Performance Considerations

- **Repository optimization**: Let repositories handle `@EntityGraph`/`JOIN FETCH`
- **Batch operations**: For bulk operations, use repository batch methods
- **Early optimization**: Avoid premature optimization; clarity first, performance second

```java
// Good: Repository handles optimization
List<Bubble> bubbles = bubbleRepository.findByEpisodeIdWithRelations(episodeId);

// Good: Use batch methods for bulk operations  
bubbleLocaleRepository.saveAll(bubbleLocales);
```

### Testing Guidelines

- **Mock repositories**: Service tests should mock repository dependencies
- **Test pipelines**: Verify each pipeline step and error conditions
- **Transaction testing**: Ensure rollback behavior on exceptions
- **Multi-repository mocking**: Mock all repositories used in service workflows

```java
@ExtendWith(MockitoExtension.class)
class EpisodeTranslateServiceTest {
    @Mock
    private EpisodeRepository episodeRepository;
    @Mock
    private BubbleRepository bubbleRepository;
    @Mock
    private LanguageRepository languageRepository;
    @Mock
    private EpisodeLocaleRepository episodeLocaleRepository;
    @Mock
    private BubbleLocaleRepository bubbleLocaleRepository;
    
    @InjectMocks
    private EpisodeTranslateService service;
    
    @Test
    void testTranslateEpisodeSuccess() {
        // Given - Mock repository returns
        Episode episode = new Episode();
        Language language = new Language();
        Bubble bubble = new Bubble();
        bubble.setOriginalText("Hello");
        
        when(episodeRepository.findById(1L)).thenReturn(Optional.of(episode));
        when(languageRepository.findByCode("ko")).thenReturn(Optional.of(language));
        when(bubbleRepository.findByEpisodeId(1L)).thenReturn(List.of(bubble));
        when(episodeLocaleRepository.findOrCreateForEpisode(episode, language)).thenReturn(new EpisodeLocale());
        when(bubbleLocaleRepository.updateOrCreateTranslation(any(), any(), any(), any())).thenReturn(new BubbleLocale());
        
        // When
        TranslationResponseDto result = service.translateEpisode(1L, "ko");
        
        // Then - Verify repository interaction sequence
        verify(episodeRepository).findById(1L);
        verify(languageRepository).findByCode("ko");
        verify(bubbleRepository).findByEpisodeId(1L);
        assertNotNull(result.getBubbleLocales());
        assertNotNull(result.getEpisodeLocale());
    }
    
    @Test
    void testEpisodeNotFoundRaisesError() {
        // Given
        when(episodeRepository.findById(999L)).thenReturn(Optional.empty());
        
        // When/Then
        assertThrows(NotFoundException.class, () -> service.translateEpisode(999L, "ko"));
    }
}
```

### Prohibited Patterns

- **Direct entity access**: Never import or call entities directly (use repositories)
- **DTO coupling**: Don't call DTOs from services for business logic
- **Controller logic**: No HTTP-specific logic in services
- **Nested transactions**: Don't use `@Transactional` on helper methods unnecessarily
- **Repository business logic**: Keep repositories as data access only
- **Unnecessary helper layers**: Avoid creating helper classes when direct repository usage is clearer
- **Repository bypassing**: Don't use raw JPA queries when repository methods exist
- **Synchronous external API calls in controllers**: External API calls (STT, ChatGPT) must be async or in background tasks
- **Hardcoded API keys**: Never hardcode API keys; use configuration properties
- **Never use reflection or dynamic attribute access**: Use static field access instead
- **Avoid overly defensive code**: Do not write code that handles every possible edge case if it makes the code unnecessarily long. Focus on realistic scenarios.

#### Anti-Patterns to Avoid

```java
// BAD: Unnecessary helper layer
public class EpisodeHelper {
    private final EpisodeRepository episodeRepository;
    private final BubbleRepository bubbleRepository;
    
    public EpisodeHelper(EpisodeRepository episodeRepository, BubbleRepository bubbleRepository) {
        this.episodeRepository = episodeRepository;
        this.bubbleRepository = bubbleRepository;
    }
    
    public Pair<Episode, List<Bubble>> getEpisodeWithBubbles(Long episodeId) {
        Episode episode = episodeRepository.findById(episodeId).orElse(null);
        List<Bubble> bubbles = bubbleRepository.findByEpisodeId(episodeId);
        return Pair.of(episode, bubbles);
    }
}

@Service
public class EpisodeService {
    private final EpisodeHelper helper;  // BAD
    
    public EpisodeService(EpisodeHelper helper) {
        this.helper = helper;
    }
}

// GOOD: Direct repository usage
@Service
@Transactional
public class EpisodeService {
    private final EpisodeRepository episodeRepository;
    private final BubbleRepository bubbleRepository;
    
    public EpisodeService(EpisodeRepository episodeRepository, BubbleRepository bubbleRepository) {
        this.episodeRepository = episodeRepository;
        this.bubbleRepository = bubbleRepository;
    }
    
    public void processEpisode(Long episodeId) {
        Episode episode = episodeRepository.findById(episodeId)  // Direct and clear
                .orElseThrow(() -> new NotFoundException("Episode not found"));
        List<Bubble> bubbles = bubbleRepository.findByEpisodeId(episodeId);
    }
}

// BAD: Repository bypassing
@Service
public class EpisodeService {
    @PersistenceContext
    private EntityManager entityManager;  // BAD: Bypasses repository
    
    public Episode getEpisode(Long episodeId) {
        return entityManager.find(Episode.class, episodeId);  // BAD
    }
}

// GOOD: Repository usage
@Service
@Transactional
public class EpisodeService {
    private final EpisodeRepository episodeRepository;
    
    public EpisodeService(EpisodeRepository episodeRepository) {
        this.episodeRepository = episodeRepository;
    }
    
    public Episode getEpisode(Long episodeId) {
        return episodeRepository.findById(episodeId)  // GOOD: Uses repository
                .orElseThrow(() -> new NotFoundException("Episode not found"));
    }
}
```

### JavaDoc Documentation Guidelines

All service interfaces and implementation classes should follow Google style JavaDoc conventions for clear documentation.

**Why Write JavaDoc in English?**

JavaDoc comments must be written in English for the following reasons:

1. **International Collaboration**: English is the standard language for software development, enabling collaboration with international developers and contributors
2. **Tool Support**: IDEs, documentation generators, and code analysis tools work best with English JavaDoc
3. **Industry Standard**: Following Java community conventions and best practices established by Oracle and major open-source projects
4. **Code Review**: Makes code reviews accessible to non-Korean-speaking team members and external contributors
5. **Maintainability**: English documentation is more widely understood and maintainable in long-term projects
6. **API Documentation**: Generated API documentation (e.g., via Swagger/OpenAPI) benefits from English descriptions

**Class-Level Documentation**

Every service interface and implementation class should have comprehensive JavaDoc that includes:

1. **Purpose**: What the service does
2. **Effective Java Item 20 reference**: For interfaces, mention the principle
3. **Service layer role**: List key responsibilities (business rules, transactions, repository coordination, DTO conversion)
4. **Usage context**: How it's used (by controllers, dependency injection)
5. **Implementation details**: For implementation classes, mention annotations and transaction behavior

**Example: Interface JavaDoc**

```java
/**
 * Service interface for handling bookmark-related business logic.
 * 
 * <p>
 * This interface defines the contract for bookmark business operations such as creation,
 * retrieval, and deletion. Following Effective Java Item 20 principle,
 * it uses interfaces to separate contract from implementation.
 * 
 * <p>
 * Service layer responsibilities:
 * <ul>
 * <li>Business rule validation (e.g., preventing duplicate bookmarks)</li>
 * <li>Transaction management (ensuring data consistency)</li>
 * <li>Data access through repositories</li>
 * <li>Conversion of domain objects to DTOs</li>
 * </ul>
 * 
 * <p>
 * This interface is used by the controller layer, and implementation classes access
 * the database through repositories. Implementation classes are automatically injected
 * via Spring's dependency injection.
 * 
 * <p>
 * Implementation classes use {@code @Service} and {@code @Transactional} annotations
 * to perform transaction management.
 */
public interface BookmarkService {
    // ...
}
```

**Example: Implementation Class JavaDoc**

```java
/**
 * Service implementation class for handling bookmark-related business logic.
 * 
 * <p>
 * This class is an implementation of the {@link BookmarkService} interface,
 * providing actual implementation for bookmark business operations such as creation,
 * retrieval, and deletion.
 * 
 * <p>
 * Service layer responsibilities:
 * <ul>
 * <li>Business rule validation (e.g., preventing duplicate bookmarks)</li>
 * <li>Transaction management (ensuring data consistency)</li>
 * <li>Data access through repositories</li>
 * <li>Conversion of domain objects to DTOs</li>
 * </ul>
 * 
 * <p>
 * The {@code @Service} annotation registers this class as a Spring service bean.
 * The {@code @Transactional} annotation ensures that all methods in this class
 * execute within a transaction. Transactions bundle multiple database operations
 * into a single unit of work, rolling back all changes if an error occurs.
 * 
 * <p>
 * This service is called by controllers and accesses the database through repositories.
 * {@link BookmarkRepository} is automatically injected via Spring's dependency injection.
 */
@Service
@RequiredArgsConstructor
public class BookmarkServiceImpl implements BookmarkService {
    // ...
}
```

**Method-Level Documentation**

Every public method in service interfaces and implementations should have JavaDoc that includes:

1. **Summary**: One-line description of what the method does
2. **Detailed description**: Use `<p>` tags for paragraphs, `<ul>` for lists
3. **Business rules**: List important business rules and constraints
4. **Transaction behavior**: Describe transaction boundaries and rollback behavior
5. **Parameters**: `@param` tags for all parameters with descriptions and constraints
6. **Return value**: `@return` tag describing what is returned
7. **Exceptions**: `@throws` tags for all checked and important unchecked exceptions

**Example: Method JavaDoc**

```java
/**
 * Registers a new bookmark.
 * 
 * <p>
 * This method receives a user ID and product ID and creates a new bookmark.
 * 
 * <p>
 * Business rules:
 * <ul>
 * <li>The same user cannot bookmark the same product twice</li>
 * <li>Throws {@link ClientException} if duplicate bookmark is attempted</li>
 * </ul>
 * 
 * <p>
 * Transaction behavior:
 * <ul>
 * <li>This method executes within a transaction</li>
 * <li>If an error occurs, all changes are automatically rolled back</li>
 * <li>On success, the bookmark is saved to the database</li>
 * </ul>
 * 
 * @param userId    ID of the user registering the bookmark (must not be null)
 * @param productId ID of the product to bookmark (must not be null)
 * @return DTO object containing the created bookmark information
 * @throws ClientException if the same user has already bookmarked the same product
 */
BookmarkDto registerBookmark(Long userId, Long productId);
```

**JavaDoc Best Practices**

- **Use HTML tags**: `<p>`, `<ul>`, `<li>`, `<code>` for formatting
- **Reference other types**: Use `{@link ClassName}` or `{@code code}` for inline references
- **Be specific**: Include nullability, constraints, and business rules
- **Explain why**: For complex logic, explain the reasoning (e.g., "조회 후 삭제하는 방식을 사용하는 이유는...")
- **Consistent style**: Follow the same structure across all service methods
- **Field documentation**: Document important fields with `/** */` comments

### Field Documentation

All service implementation class fields should have JavaDoc comments explaining their purpose:

```java
/** Repository for accessing bookmark data (automatically injected by Spring). */
private final BookmarkRepository bookmarkRepository;

/** Validator component for user validation (automatically injected by Spring). */
private final UserValidator userValidator;
```

**Field JavaDoc Best Practices**

- **Use `/** */` format**: Standard JavaDoc format for fields
- **Explain purpose**: Describe what the field is used for
- **Mention injection**: For Spring-injected dependencies, mention that Spring automatically injects them
- **Be concise**: Keep descriptions brief but informative
- **Document all dependencies**: Repository, Validator, and other injected dependencies should be documented
