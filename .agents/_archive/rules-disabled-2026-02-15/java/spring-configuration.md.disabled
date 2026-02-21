---
description: Spring Configuration — @Configuration classes, @Bean definitions, property binding
globs: "**/config/**/*.java"
alwaysApply: false
---

## Spring Configuration (Project Standard)

- **@Configuration**: Use for configuration classes
- **@Bean**: Define beans explicitly
- **@ConfigurationProperties**: Bind application properties to objects
- **Profile-based**: Use `@Profile` for environment-specific configurations

### Configuration Class Pattern

```java
@Configuration
public class JpaConfig {
    @Bean
    public JpaTransactionManager transactionManager(EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}
```

### Property Binding

```java
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {
    private String host;
    private int port;
    private String username;
    private String password;
    
    // getters, setters
}
```

### Profile-based Configuration

```java
@Configuration
@Profile("docker")
public class DockerConfig {
    @Bean
    public DataSource dataSource() {
        // Docker-specific configuration
    }
}
```

### Prohibited Patterns

- **Hardcoded values**: Never hardcode configuration values
- **Multiple configuration sources**: Use consistent configuration approach
