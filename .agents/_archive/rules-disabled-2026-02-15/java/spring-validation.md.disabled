---
description: Validation — Bean Validation for DTOs, custom validators for domain rules
globs: "**/dto/**/*.java", "**/service/**/*.java"
alwaysApply: false
---

## Spring Validation (Project Standard)

- **DTO validation**: Use Bean Validation (`@Valid`, `@NotNull`, `@Size`, etc.) for request DTOs
- **Domain validation**: Use Validator components (`@Component`) for complex business rules that require repository access
- **Validation order**: DTO validation first, then domain validation via Validator components in services

### Bean Validation

```java
public class ProjectCreateRequestDto {
    @NotBlank
    @Size(max = 100)
    private String name;
    
    @Size(max = 500)
    private String description;
    
    @NotNull
    @Min(1)
    private Long ownerId;
}
```

### Custom Validators

```java
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = UniqueEmailValidator.class)
public @interface UniqueEmail {
    String message() default "Email already exists";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
```

### Validator Component Pattern

Use `@Component` to create reusable validator components that can inject repositories for domain rule validation:

```java
@Component
@RequiredArgsConstructor
public class ProductValidator {
    private final ProductRepository productRepository;
    
    public void validateProductExists(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ClientException(ErrorCode.BAD_REQUEST, 
                "product not found. productId=%s".formatted(productId));
        }
    }
}

@Component
@RequiredArgsConstructor
public class UserValidator {
    private final UserRepository userRepository;
    
    public void validateUserExists(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ClientException(ErrorCode.BAD_REQUEST, 
                "user not found. userId=%s".formatted(userId));
        }
    }
}
```

### Service Validation with Validator Components

Services inject Validator components via constructor and call validation methods:

```java
@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {
    private final ProductRepository productRepository;
    private final UserValidator userValidator;  // Inject validator component
    
    public ProductDto createProduct(ProductCreateRequestDto request) {
        // Use validator component for domain validation
        userValidator.validateUserExists(request.getUserId());
        
        // Business logic...
        Product product = Product.builder()
                .userId(request.getUserId())
                .name(request.getName())
                .price(request.getPrice())
                .quantity(request.getQuantity())
                .status(ProductStatus.AVAILABLE)
                .build();
        
        Product savedProduct = productRepository.save(product);
        return ProductDto.of(savedProduct);
    }
}
```

### Service Validation (Alternative: Inline Methods)

For simple validations that don't require repository access, you can use inline validation methods in services:

```java
@Service
@Transactional
public class ProjectService {
    private final ProjectRepository projectRepository;
    
    public ProjectResponseDto create(ProjectCreateRequestDto request, Authentication auth) {
        // Inline domain validation (no repository needed)
        validateProjectNameUniqueness(request.getName());
        
        // Business logic...
    }
    
    private void validateProjectNameUniqueness(String name) {
        if (projectRepository.existsByName(name)) {
            throw new ServiceException("Project name already exists", HttpStatus.BAD_REQUEST);
        }
    }
}
```

### Validator Component Guidelines

- **Component annotation**: Always use `@Component` for validator classes
- **Repository injection**: Validators can inject repositories via constructor for existence checks and cross-entity validations
- **No side effects**: Validators only evaluate and throw exceptions; they never perform writes or state changes
- **Reusability**: Create separate validator components for each domain aggregate (e.g., `ProductValidator`, `UserValidator`)
- **Service usage**: Services inject validators and call validation methods before business logic

### Prohibited Patterns

- **Repository calls in DTO validators**: Never call repositories from Bean Validation custom validators (`@Constraint` validators)
- **Business logic in DTOs**: Complex domain rules must go to Validator components or Service layer
- **State changes in Validators**: Validators must not perform writes, updates, or any side effects
- **Service calls in Validators**: Validators should not call services; use repositories directly if needed
