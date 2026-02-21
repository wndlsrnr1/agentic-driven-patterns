---
description: Spring Repositories — JPA data access layer, query encapsulation, used only by Service layer
globs: "**/repository/**/*.java", "**/*Repository.java"
alwaysApply: false
---

## Spring Repositories (Project Standard)

- **JPA Repository**: Extend `JpaRepository` or `CrudRepository` for data access
- **Query encapsulation**: All JPA queries encapsulated in repository methods
- **No business logic**: Repositories only handle data access, no business rules
- **Access restriction**: Can only be used by Service layer
- **Type safety**: All methods must have explicit return types (`Optional<T>`, `List<T>`, `Page<T>`)

### Basic Repository Pattern

```java
@Repository
public interface ExampleRepository extends JpaRepository<ExampleEntity, Long> {
    Optional<ExampleEntity> findById(Long id);
    
    List<ExampleEntity> findAll();
    
    boolean existsById(Long id);
    
    void deleteById(Long id);
}
```

### Query Methods

- **Naming conventions**: Use Spring Data JPA query method naming for simple queries
- **Return types**: Use `Optional<T>` for single results, `List<T>` for collections
- **Complex queries**: Use Custom Repository with QueryDSL (see Custom Repository Pattern section)

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long>, CustomUserRepository {
    Optional<User> findByEmail(String email);
    
    List<User> findByStatus(UserStatus status);
    
    boolean existsByEmail(String email);
}

// Custom Repository Interface
public interface CustomUserRepository {
    List<User> findActiveUsersAfter(UserStatus status, LocalDateTime date);
    void updateStatus(Long id, UserStatus status);
}

// Custom Repository Implementation (QueryDSL)
@Repository
public class CustomUserRepositoryImpl extends QuerydslRepositorySupport implements CustomUserRepository {
    private final QUser user = QUser.user;
    
    public CustomUserRepositoryImpl() {
        super(User.class);
    }
    
    @Override
    public List<User> findActiveUsersAfter(UserStatus status, LocalDateTime date) {
        return from(user)
                .where(user.status.eq(status)
                        .and(user.createdAt.after(date)))
                .fetch();
    }
    
    @Override
    @Transactional
    public void updateStatus(Long id, UserStatus status) {
        update(user)
                .set(user.status, status)
                .where(user.id.eq(id))
                .execute();
    }
}
```

### Performance Optimizations

- **EntityGraph**: Use `@EntityGraph` for eager loading relationships
- **JOIN FETCH**: Use QueryDSL with `join().fetchJoin()` for N+1 prevention in custom repositories
- **Batch operations**: Use `saveAll()` for bulk inserts

```java
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long>, CustomProjectRepository {
    @EntityGraph(attributePaths = {"sessions", "owner"})
    Optional<Project> findWithRelationsById(Long id);
}

// Custom Repository Interface
public interface CustomProjectRepository {
    Optional<Project> findByIdWithSessions(Long id);
    void deleteByStatus(ProjectStatus status);
}

// Custom Repository Implementation (QueryDSL)
public class CustomProjectRepositoryImpl extends QuerydslRepositorySupport implements CustomProjectRepository {
    private final QProject project = QProject.project;
    private final QSession session = QSession.session;
    
    public CustomProjectRepositoryImpl() {
        super(Project.class);
    }
    
    @Override
    public Optional<Project> findByIdWithSessions(Long id) {
        Project result = from(project)
                .join(project.sessions, session).fetchJoin()
                .where(project.id.eq(id))
                .fetchOne();
        return Optional.ofNullable(result);
    }
    
    @Override
    @Transactional
    public void deleteByStatus(ProjectStatus status) {
        delete(project)
                .where(project.status.eq(status))
                .execute();
    }
}
```

### Locking

- **Pessimistic locking**: Use `@Lock` for concurrent access control
- **Optimistic locking**: Use `@Version` in entities

```java
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Order> findByIdForUpdate(Long id);
    
    @Lock(LockModeType.PESSIMISTIC_READ)
    Optional<Order> findByIdForRead(Long id);
}
```

### Pagination

- **Pageable**: Use `Pageable` for paginated queries, return `Page<Entity>`
- **Custom Repository**: For complex pagination queries, see `spring-pagination` rule

```java
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Page<Project> findByStatus(ProjectStatus status, Pageable pageable);
}
```

For detailed pagination patterns, see `spring-pagination` rule.

### Custom Repository Pattern

For complex queries that cannot be expressed with Spring Data JPA method naming, use Custom Repository pattern with **QueryDSL**:

1. **Define Custom Repository Interface**: Create interface with custom method signatures
2. **Implement Custom Repository**: Create implementation class extending `QuerydslRepositorySupport` (QueryDSL is preferred over JPQL for type safety)
3. **Extend Main Repository**: Main repository interface extends both `JpaRepository` and custom repository interface

**Why QueryDSL?**
- Type-safe queries (compile-time checking)
- Better IDE support (autocomplete, refactoring)
- Dynamic query building is easier
- Avoids string-based JPQL errors

```java
// Custom Repository Interface
public interface CustomProductRepository {
    PageResult<Product> search(ProductSearchCriteria criteria);
}

// Main Repository Interface
@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, CustomProductRepository {
    // Standard JPA methods
    Optional<Product> findById(Long id);
    List<Product> findAll();
}

// Custom Repository Implementation (QueryDSL example)
public class CustomProductRepositoryImpl extends QuerydslRepositorySupport 
        implements CustomProductRepository {
    
    private final QProduct product = QProduct.product;
    
    public CustomProductRepositoryImpl() {
        super(Product.class);
    }
    
    @Override
    public PageResult<Product> search(ProductSearchCriteria criteria) {
        List<Product> products = from(product)
                .where(searchWhereCondition(criteria))
                .limit(criteria.getSize())
                .orderBy(order(criteria.getSort()))
                .fetch();
        
        String nextSearchAfter = getNextSearchAfter(criteria, products);
        
        return PageResult.<Product>builder()
                .totalCount(criteria.isWithTotalCount() ? count(criteria) : null)
                .nextSearchAfter(nextSearchAfter)
                .items(products)
                .build();
    }
    
    private BooleanExpression searchWhereCondition(ProductSearchCriteria criteria) {
        return statusEqual(criteria.getProductStatus())
                .and(userIdEqual(criteria.getUserId()))
                .and(nextProduct(criteria));
    }
    
    private BooleanExpression statusEqual(ProductStatus status) {
        return status == null ? null : product.status.eq(status);
    }
    
    private BooleanExpression userIdEqual(Long userId) {
        return userId == null ? null : product.userId.eq(userId);
    }
    
    private BooleanExpression nextProduct(ProductSearchCriteria criteria) {
        if (criteria.getSearchAfter() == null) {
            return null;
        }
        // Complex pagination logic...
        return null;
    }
    
    private OrderSpecifier<?>[] order(ProductSortType sortType) {
        return switch (sortType) {
            case RECENT -> new OrderSpecifier<?>[] {product.id.desc()};
            case PRICE -> new OrderSpecifier<?>[] {
                    new OrderSpecifier<>(Order.DESC, product.price),
                    new OrderSpecifier<>(Order.DESC, product.id)
            };
            default -> throw new ClientException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Invalid sort type. sortType=" + sortType);
        };
    }
    
    private String getNextSearchAfter(ProductSearchCriteria criteria, List<Product> products) {
        // Implementation for cursor-based pagination
        return null;
    }
    
    private Long count(ProductSearchCriteria criteria) {
        return from(product).where(searchWhereCondition(criteria)).fetchCount();
    }
}
```

**Custom Repository Guidelines**:

- **Naming convention**: Custom interface name is `Custom{Entity}Repository`, implementation is `Custom{Entity}RepositoryImpl`
- **Spring Data JPA convention**: Implementation class name must end with `Impl` and be in the same package
- **QueryDSL required**: Always use `QuerydslRepositorySupport` for custom repository implementations (avoid JPQL `@Query` annotations)
- **Complex queries**: Use for queries that require dynamic conditions, complex joins, or custom pagination
- **No business logic**: Custom repositories still only handle data access, no business rules

### Prohibited Patterns

- **Business logic**: Never implement business rules in repositories
- **Service calls**: Never call services from repositories
- **Direct entity manipulation**: Never modify entities outside of save operations
- **JPQL @Query for complex queries**: Use QueryDSL Custom Repository instead of `@Query` for complex queries

```java
// BAD: Business logic in repository
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    default void cancelOrder(Long id) {  // BAD: Business logic
        Order order = findById(id).orElse(null);
        if (order != null && order.getStatus() == OrderStatus.PENDING) {
            order.setStatus(OrderStatus.CANCELLED);
            save(order);
        }
    }
}

// GOOD: Repository only handles data access
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findById(Long id);
    // Business logic goes to Service layer
}
```
