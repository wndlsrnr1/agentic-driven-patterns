---
description: JPA usage — entity relationships, query optimization, transaction management
globs: "**/repository/**/*.java", "**/entity/**/*.java"
alwaysApply: false
---

## JPA Usage (Project Standard)

- **Entity relationships**: Use `@OneToMany`, `@ManyToOne`, `@ManyToMany` appropriately
- **Lazy loading**: Default for collections, use `FetchType.LAZY`
- **Eager loading**: Use `FetchType.EAGER` only when necessary
- **Query optimization**: Use `@EntityGraph` and `JOIN FETCH` to prevent N+1 queries
- **Transaction management**: Use `@Transactional` at service level

### Entity Relationships

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

### Query Optimization

```java
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    @EntityGraph(attributePaths = {"sessions", "owner"})
    Optional<Project> findWithRelationsById(Long id);
    
    @Query("SELECT p FROM Project p JOIN FETCH p.sessions WHERE p.id = :id")
    Optional<Project> findByIdWithSessions(@Param("id") Long id);
}
```

### Prohibited Patterns

- **N+1 queries**: Avoid lazy loading in loops
- **Eager loading everywhere**: Don't use `FetchType.EAGER` for all relationships
- **Cartesian products**: Avoid multiple `JOIN FETCH` on different collections
- **JOIN FETCH with pagination**: Don't use `JOIN FETCH` with `Pageable` - causes incorrect count queries. Use `@EntityGraph` or separate queries instead
