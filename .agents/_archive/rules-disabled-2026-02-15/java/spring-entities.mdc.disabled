---
description: Spring Entities — domain state only; access strictly via services/repositories
globs: "**/entity/**/*.java", "**/domain/**/*.java"
alwaysApply: false
---

## Spring Entities (Project Standard)

- **Pure domain**: Keep entities focused on fields, constraints, and simple invariants
- **No business orchestration**: Complex rules and workflows live in services
- **Access via services**: Controllers and DTOs never touch entities directly; only services/repositories query/modify entities
- **Validation**: Use JPA annotations and Bean Validation for intrinsic invariants; use service validation for cross-entity/business rules
- **Indexes**: Add DB indexes for frequent filters/sorts via `@Index`

### Example

```java
@Entity
@Table(name = "accounts", indexes = {
    @Index(name = "idx_account_email", columnList = "email")
})
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    // getters, setters
}
```

### JPA Annotations

- **@Entity**: Marks class as JPA entity
- **@Table**: Specifies table name and indexes
- **@Id**: Primary key
- **@GeneratedValue**: ID generation strategy
- **@Column**: Column definition (nullable, unique, length)
- **@OneToMany/@ManyToOne/@ManyToMany**: Relationship mappings
- **@CreatedDate/@LastModifiedDate**: Audit fields

```java
@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
    
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Session> sessions = new ArrayList<>();
    
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // getters, setters
}
```

### Relationships

- **Lazy loading**: Use `FetchType.LAZY` for relationships (default for `@OneToMany`, `@ManyToMany`)
- **Eager loading**: Use `FetchType.EAGER` only when necessary (default for `@ManyToOne`, `@OneToOne`)
- **Cascade**: Use `CascadeType` appropriately (ALL, PERSIST, MERGE, REMOVE)
- **Orphan removal**: Use `orphanRemoval = true` for parent-child relationships

```java
@Entity
public class Project {
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Session> sessions = new ArrayList<>();
}

@Entity
public class Session {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
}
```

### Prohibited

- Business logic inside entities that touches other aggregates
- Calling repositories/services from entities
- **Never use reflection or dynamic attribute access**: Use static field access instead
