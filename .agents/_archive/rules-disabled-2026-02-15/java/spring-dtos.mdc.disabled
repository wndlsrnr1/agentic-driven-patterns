---
description: Spring DTOs — request/response data transfer, Bean Validation, no business logic
globs: "**/dto/**/*.java", "**/request/**/*.java", "**/response/**/*.java"
alwaysApply: false
---

## Spring DTOs (Project Standard)

This project uses **two-layer DTO pattern** to separate HTTP concerns from service layer:

1. **Controller DTOs** (HTTP layer): Located in `controller/*/model/` directory
   - `{Entity}CreateRequest`, `{Entity}UpdateRequest` - HTTP request models
   - `{Entity}Response` - HTTP response models
   - Handles HTTP serialization/deserialization
   - Bean Validation for input format checks

2. **Service DTOs** (Service layer): Located in `service/*/model/` directory
   - `{Entity}CreateRequestDto`, `{Entity}UpdateRequestDto` - Service request DTOs
   - `{Entity}Dto` - Service response DTOs
   - Used for service-to-service data transfer
   - Contains business domain data structures

- **No business logic**: DTOs only handle data transformation and simple validation
- **No DB access**: DTOs never execute queries or call repositories/services
- **Type safety**: All fields must have explicit types

### Controller DTO Pattern (HTTP Layer)

**Request DTO** - Located in `controller/*/model/`:

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
```

**Response DTO** - Located in `controller/*/model/`:

```java
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

### Service DTO Pattern (Service Layer)

**Request DTO** - Located in `service/*/model/`:

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
```

**Response DTO** - Located in `service/*/model/`:

```java
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

### Bean Validation

- **@NotNull**: Field must not be null
- **@NotBlank**: String must not be blank (null, empty, or whitespace)
- **@Size**: String/collection size constraints
- **@Email**: Email format validation
- **@Min/@Max**: Numeric range validation
- **@Pattern**: Regex pattern validation

```java
public class UserCreateRequestDto {
    @NotBlank
    @Email
    private String email;
    
    @NotBlank
    @Size(min = 3, max = 50)
    private String username;
    
    @NotBlank
    @Size(min = 8, max = 100)
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$", message = "Password must contain uppercase, lowercase, and digit")
    private String password;
    
    // getters, setters
}
```

### DTO Organization

**Controller DTOs** (HTTP layer):
- **Location**: `controller/{domain}/model/` directory
- **Naming**: `{Entity}CreateRequest`, `{Entity}UpdateRequest`, `{Entity}Response`
- **Purpose**: HTTP request/response serialization

**Service DTOs** (Service layer):
- **Location**: `service/{domain}/model/` directory
- **Naming**: `{Entity}CreateRequestDto`, `{Entity}UpdateRequestDto`, `{Entity}Dto`
- **Purpose**: Service-to-service data transfer

**Example Structure**:
```
controller/
  product/
    model/
      ProductCreateRequest.java
      ProductResponse.java
service/
  product/
    model/
      ProductCreateRequestDto.java
      ProductDto.java
```

### Prohibited Patterns

- **Repository calls**: Never call repositories from DTOs
- **Service calls**: Never call services from DTOs
- **Business logic**: Never implement business rules in DTOs
- **Entity references**: Avoid exposing entities directly in DTOs

```java
// BAD: Repository call in DTO
public class UserCreateRequest {
    @Autowired
    private UserRepository userRepository;  // BAD
    
    @CustomValidator
    public void validateEmail() {
        if (userRepository.existsByEmail(email)) {  // BAD
            throw new ValidationException("Email exists");
        }
    }
}

// GOOD: Controller DTO - Simple validation only
// controller/user/model/UserCreateRequest.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateRequest {
    @NotBlank
    @Email
    private String email;
    
    @NotBlank
    @Size(min = 3, max = 50)
    private String username;
    
    // Convert to Service DTO
    public UserCreateRequestDto toDto() {
        return UserCreateRequestDto.builder()
                .email(email)
                .username(username)
                .build();
    }
}

// GOOD: Service DTO - No validation, just data transfer
// service/user/model/UserCreateRequestDto.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateRequestDto {
    private String email;
    private String username;
}
```
