---
description: Spring testing — Red/Green/Refactor with layered tests (service → controller → integration)
globs: "**/test/**/*.java"
alwaysApply: false
---

## Spring Test (TDD Core)

- **Red-Green-Refactor**: Always start with a failing test
- **Layered**: Prioritize service tests; add controller tests for wiring/permissions
- **Patterns**: AAA (Arrange-Act-Assert) and Given-When-Then in test names

### Service Test Example

```java
@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {
    @Mock
    private ProjectRepository projectRepository;
    
    @InjectMocks
    private ProjectService projectService;
    
    @Test
    void testCreateRejectsDuplicateName() {
        // Given - existing project with same name
        when(projectRepository.existsByName("Test Project")).thenReturn(true);
        
        // When/Then - should raise ServiceException
        ProjectCreateRequestDto request = new ProjectCreateRequestDto();
        request.setName("Test Project");
        
        assertThrows(ServiceException.class, () -> 
            projectService.create(request, mock(Authentication.class)));
    }
}
```

### Controller Test Example

```java
@WebMvcTest(ProjectController.class)
class ProjectControllerTest {
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private ProjectService projectService;
    
    @Test
    void testGetByIdRequiresAuth() throws Exception {
        // When/Then - should return 401
        mockMvc.perform(get("/api/v1/projects/1"))
                .andExpect(status().isUnauthorized());
    }
}
```

### Rules

- Tests must be deterministic and isolated
- Prefer mocks for external dependencies
- Use `@TestPropertySource` for per-test config
- Use `@Transactional` for integration tests that need rollback

### Spring Test Configuration

For service tests with Spring context, use the following configuration pattern:

**Interface-Based Service Testing Pattern**

When testing services that implement interfaces, inject the interface type (not the implementation class) and use `@ContextConfiguration` to specify the implementation class:

```java
@ActiveProfiles("test")
@ExtendWith({ SpringExtension.class })
@ContextConfiguration(classes = { BookmarkServiceImpl.class })
public class BookmarkServiceTest {
    
    /** 북마크 리포지토리의 Mock 객체 (실제 데이터베이스 대신 사용). */
    @MockBean
    private BookmarkRepository bookmarkRepository;
    
    /** 테스트 대상인 북마크 서비스 인터페이스 (구현 클래스인 BookmarkServiceImpl이 주입됨). */
    @Autowired
    private BookmarkService bookmarkService;
    
    // test methods...
}
```

**Configuration Annotations**

- `@ActiveProfiles("test")`: Use test profile for test-specific configuration
- `@ExtendWith({ SpringExtension.class })`: Enable Spring Test support
- `@ContextConfiguration(classes = { ImplementationClass.class })`: Specify which implementation class to load
- `@MockBean`: Replace Spring bean with mock (for repositories, external services)
- `@Autowired`: Inject actual service implementation (interface type preferred)

**Benefits of Interface Injection**

- Tests depend on interfaces, not implementations
- Easy to swap implementations for testing
- Clear contract testing
- Matches production dependency injection pattern

### Test JavaDoc Documentation

All test classes and test methods should have comprehensive JavaDoc following Google style conventions.

**Why Write JavaDoc in English?**

JavaDoc comments must be written in English for the following reasons:

1. **International Collaboration**: English is the standard language for software development, enabling collaboration with international developers and contributors
2. **Tool Support**: IDEs, documentation generators, and code analysis tools work best with English JavaDoc
3. **Industry Standard**: Following Java community conventions and best practices established by Oracle and major open-source projects
4. **Code Review**: Makes code reviews accessible to non-Korean-speaking team members and external contributors
5. **Maintainability**: English documentation is more widely understood and maintainable in long-term projects
6. **API Documentation**: Generated API documentation (e.g., via Swagger/OpenAPI) benefits from English descriptions

**Test Class JavaDoc Pattern**

Every test class should include:

1. **Purpose**: What is being tested
2. **Test strategy**: How tests are structured (Mock objects, Given-When-Then, etc.)
3. **Test environment**: Configuration annotations and their purpose
4. **Mock object explanation**: What Mock objects are and why they're used

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
 * <li>{@code @Autowired}: Injects actual service implementation object (dependencies are replaced with Mocks)</li>
 * <li>{@code @ContextConfiguration}: Registers {@link BookmarkServiceImpl} implementation class in test context</li>
 * </ul>
 * 
 * <p>
 * Mock objects:
 * <ul>
 * <li>Fake objects that replace real objects</li>
 * <li>Allow pre-defining desired behavior in tests</li>
 * <li>Enable fast testing without real databases or external systems</li>
 * </ul>
 */
@ActiveProfiles("test")
@ExtendWith({ SpringExtension.class })
@ContextConfiguration(classes = { BookmarkServiceImpl.class })
public class BookmarkServiceTest {
    // ...
}
```

**Test Method JavaDoc Pattern**

Every test method should include:

1. **Summary**: One-line description of what is being tested
2. **Test scenario**: Given-When-Then pattern explicitly documented
3. **Verification**: List of what is being verified

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
 * <li>Returned DTO's user ID and product ID are correct</li>
 * <li>Repository's find method is called once</li>
 * <li>Repository's save method is called once</li>
 * </ul>
 */
@Test
void testRegisterBookmark_Success() {
    // Given
    when(bookmarkRepository.findByUserIdAndProductId(userId, productId))
            .thenReturn(Optional.empty());
    when(bookmarkRepository.save(any(Bookmark.class))).thenReturn(bookmark);
    
    // When
    BookmarkDto result = bookmarkService.registerBookmark(userId, productId);
    
    // Then
    assertThat(result).isNotNull();
    assertThat(result.getUserId()).isEqualTo(userId);
    verify(bookmarkRepository, times(1)).findByUserIdAndProductId(userId, productId);
    verify(bookmarkRepository, times(1)).save(any(Bookmark.class));
}
```

**Exception Test JavaDoc Pattern**

For exception tests, document the expected exception and verification:

```java
/**
 * Tests the exception case when attempting to register a duplicate bookmark.
 * 
 * <p>
 * Test scenario (Given-When-Then):
 * <ol>
 * <li><strong>Given</strong>: Set up a situation where the same user has already bookmarked the same product</li>
 * <li><strong>When</strong>: Attempt to register the same bookmark again</li>
 * <li><strong>Then</strong>: Verify that {@link ClientException} is thrown with an appropriate message</li>
 * </ol>
 * 
 * <p>
 * Verification:
 * <ul>
 * <li>{@link ClientException} is thrown</li>
 * <li>Exception message contains "already bookmarked"</li>
 * <li>Repository's find method is called once</li>
 * <li>Repository's save method is not called (interrupted by exception)</li>
 * </ul>
 */
@Test
void testRegisterBookmark_AlreadyBookmarked() {
    // Given
    when(bookmarkRepository.findByUserIdAndProductId(userId, productId))
            .thenReturn(Optional.of(bookmark));
    
    // When/Then
    ClientException exception = assertThrows(ClientException.class,
            () -> bookmarkService.registerBookmark(userId, productId));
    
    assertThat(exception.getMessage()).contains("already bookmarked");
    verify(bookmarkRepository, times(1)).findByUserIdAndProductId(userId, productId);
    verify(bookmarkRepository, times(0)).save(any(Bookmark.class));
}
```

### Field Documentation

All test class fields should have JavaDoc comments explaining their purpose:

```java
/** Mock object for bookmark repository (used instead of real database). */
@MockBean
private BookmarkRepository bookmarkRepository;

/** Bookmark service interface under test (BookmarkServiceImpl implementation is injected). */
@Autowired
private BookmarkService bookmarkService;

/** User ID to use in tests. */
private Long userId;

/** Product ID to use in tests. */
private Long productId;
```

**Field JavaDoc Best Practices**

- Use `/** */` format for field documentation
- Explain the purpose and role of the field
- For Mock objects, explain what they replace
- For injected dependencies, explain what is being injected
- Keep descriptions concise but informative
