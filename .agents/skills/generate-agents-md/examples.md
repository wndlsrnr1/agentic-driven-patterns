# AGENTS.md Generation Examples

## Example 1: Simple React Project

### Project Structure

```
my-react-app/
├── .opencode/
│   ├── skills/
│   │   ├── git-master/
│   │   ├── react-best-practices/
│   │   └── frontend-ui-ux/
│   └── rules/
│       ├── general/
│       │   ├── cursor_rules.mdc
│       │   └── code-principles.mdc
│       └── typescript/
│           ├── always.mdc
│           └── react-common.mdc
├── src/
│   ├── components/
│   ├── pages/
│   └── utils/
├── package.json
└── README.md
```

### Generated AGENTS.md

```markdown
# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-10
**Type:** React 19 SPA

## OVERVIEW

React 19 single-page application with modern tooling (Vite, TypeScript, React Query).

## STRUCTURE

```
my-react-app/
├── src/
│   ├── components/   # Reusable UI components
│   ├── pages/        # Route-level page components
│   └── utils/        # Helper functions
├── .opencode/        # AI skills and rules
└── package.json      # Dependencies and scripts
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Components | `src/components/` | Reusable UI elements |
| Pages | `src/pages/` | Route-level components |
| Utilities | `src/utils/` | Helper functions |
| Styling | `src/styles/` | Global styles, themes |

## COMMANDS

```bash
# Development
npm run dev

# Build
npm run build

# Test
npm test
npm run test:unit

# Lint
npm run lint
npm run lint:fix
```

## CONVENTIONS

- **Components**: PascalCase, functional with hooks
- **Files**: camelCase for utils, PascalCase for components
- **Styling**: CSS Modules or Tailwind
- **State**: React Query for server state, Context for global UI state

## ANTI-PATTERNS

- **DO NOT** use class components (legacy)
- **DO NOT** fetch data directly in components (use React Query)
- **NEVER** use `any` type without explicit reason
- **AVOID** prop drilling (use Context or state management)

## SKILLS & RULES REFERENCE

### Core Development Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `react-best-practices` | React 19 guidelines | All React development |
| `frontend-ui-ux` | UI/UX design | Component styling, layout |
| `git-master` | Git operations | All git commands |

### Code Quality Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `test-driven-development` | TDD workflows | Before implementation |
| `verification-before-completion` | Quality checks | Before completing tasks |

### General Rules
| Rule | Purpose |
|------|---------|
| `cursor_rules.mdc` | Entry point - ALWAYS load first |
| `code-principles.mdc` | Code standards & principles |

### TypeScript Rules
| Rule | Purpose |
|------|---------|
| `always.mdc` | TypeScript entry point |
| `react-common.mdc` | React patterns and conventions |

## BEST PRACTICES

### Skill Application
1. **Always load context**: `skill("loading-project-context")` first
2. **Use react-best-practices**: For all React work
3. **Include frontend-ui-ux**: For styling and design tasks
4. **Load TDD skill**: Before writing implementation code

### Rule Application
1. **Load general rules first**: cursor_rules.mdc, code-principles.mdc
2. **Load TypeScript rules**: always.mdc, react-common.mdc
3. **Cross-reference**: Use `[filename](mdc:path)` format

## DO's and DON'Ts

### React
✅ DO:
- Use functional components with hooks
- Use React Query for server state
- Keep components small and focused
- Use TypeScript strict mode

❌ DON'T:
- Use class components
- Use useEffect for data fetching
- Write business logic in components
- Use `any` type

### TypeScript
✅ DO:
- Use explicit types everywhere
- Prefer interfaces for objects
- Use type aliases for unions
- Enable strict mode

❌ DON'T:
- Use `any` without justification
- Use `@ts-ignore` or `@ts-expect-error`
- Skip type annotations on functions
```

---

## Example 2: Complex Monorepo

### Project Structure

```
meeting-minutes/
├── .opencode/
│   ├── skills/
│   │   ├── spring-code-generation-prompt/
│   │   ├── react-best-practices/
│   │   ├── korean-docstring-context-java/
│   │   ├── korean-docstring-context-typescript/
│   │   ├── git-master/
│   │   ├── test-driven-development/
│   │   └── database-design-and-migration/
│   └── rules/
│       ├── general/
│       │   ├── cursor_rules.mdc
│       │   ├── code-principles.mdc
│       │   └── continuous-improvement.mdc
│       ├── java/
│       │   ├── spring-architecture.mdc
│       │   ├── spring-controllers.mdc
│       │   ├── spring-services.mdc
│       │   └── spring-repositories.mdc
│       └── typescript/
│           ├── always.mdc
│           └── react-common.mdc
├── backend/              # (Score: 18)
│   └── src/
├── frontend/             # (Score: 15)
│   └── src/
├── shared/               # (Score: 8 - skip)
└── docker-compose.yml
```

### Generated Files

#### Root AGENTS.md

```markdown
# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-10
**Type:** Multi-service Monorepo (Meeting Minutes System)

## OVERVIEW

AI-powered meeting transcription system with speaker diarization and summary generation. Polyglot stack: Java backend (Spring Boot), React frontend (React 19), Python AI service.

## STRUCTURE

```
meeting-minutes/
├── backend/          # Spring Boot API (Java 17)
├── frontend/         # React 19 SPA
├── shared/           # Shared utilities
├── .opencode/        # AI configuration
└── docker-compose.yml
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Backend API | `backend/src/main/java/` | Domain-first packages |
| Frontend UI | `frontend/src/` | React 19 + Vite |
| Database | `backend/src/resources/db/` | Flyway migrations |
| Docker | `docker-compose.yml` | Multi-mode services |

## COMMANDS

```bash
# Full stack
docker compose up -d

# Backend only
cd backend && ./gradlew bootRun

# Frontend only
cd frontend && npm run dev

# Run migrations
docker compose run --rm migrate
```

## CONVENTIONS

- **API Keys**: `.env` files per service, never commit secrets
- **Bilingual**: API docs use "한글 / English" format
- **Mobile-first**: Frontend designed for mobile web

## ANTI-PATTERNS

- **DO NOT** mix frontend/backend code
- **DO NOT** bypass nginx for API calls
- **Controllers** MUST NOT import repositories directly
- **Reflection**: Prohibited in backend

## SKILLS & RULES REFERENCE

### Domain-Specific Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `spring-code-generation-prompt` | Spring Boot code generation | Backend API development |
| `react-best-practices` | React 19 guidelines | Frontend development |
| `korean-docstring-context-java` | Korean Java documentation | Java code comments |
| `korean-docstring-context-typescript` | Korean TS documentation | TypeScript comments |
| `database-design-and-migration` | Database work | Schema changes |

### Core Development Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `test-driven-development` | TDD workflows | Before implementation |
| `git-master` | Git operations | All git commands |

### Backend Rules
| Rule | Purpose |
|------|---------|
| `spring-architecture.mdc` | Multi-layer architecture |
| `spring-controllers.mdc` | REST controller patterns |
| `spring-services.mdc` | Service layer patterns |
| `spring-repositories.mdc` | Data access patterns |

### Frontend Rules
| Rule | Purpose |
|------|---------|
| `react-common.mdc` | React patterns |
| `always.mdc` | TypeScript guidelines |

## SUBPROJECT DOCUMENTATION

- See `backend/AGENTS.md` for backend-specific patterns
- See `frontend/AGENTS.md` for frontend-specific patterns
```

#### backend/AGENTS.md

```markdown
# Backend Knowledge Base

**Path:** `backend/`
**Type:** Spring Boot API

## OVERVIEW

Spring Boot 3.x API with domain-driven design, layered architecture, and comprehensive testing.

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Controllers | `src/main/java/meetings/controller/` | REST endpoints |
| Services | `src/main/java/meetings/service/` | Business logic |
| Repositories | `src/main/java/meetings/repository/` | Data access |
| Entities | `src/main/java/meetings/entity/` | JPA entities |
| DTOs | `src/main/java/meetings/dto/` | Request/Response |
| Tests | `src/test/java/` | Unit & integration tests |
| Migrations | `src/main/resources/db/migration/` | Flyway V*.sql |

## COMMANDS

```bash
# Run application
./gradlew bootRun

# Run tests
./gradlew test

# Build
./gradlew build

# Database migration
./gradlew flywayMigrate
```

## CONVENTIONS

- **Architecture**: Layered (Controller → Service → Repository)
- **Dependency Injection**: Constructor injection with `final` fields
- **Transactions**: Service layer with `@Transactional`
- **DTOs**: Two-layer (Controller DTO → Service DTO)
- **Documentation**: Korean/English bilingual Javadoc

## ANTI-PATTERNS

- **DO NOT** access repositories from controllers
- **DO NOT** put business logic in controllers or DTOs
- **NEVER** use field injection (`@Autowired` on fields)
- **AVOID** `@Query` for complex queries (use QueryDSL)
- **NO** reflection or dynamic access

## LAYER ACCESS MATRIX

| From \ To | Utils | DTO | Validator | Repository | Entity | Service | Controller |
|-----------|-------|-----|-----------|------------|--------|---------|------------|
| **Utils** | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| **DTO** | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| **Validator** | ✅ | 🚫 | ✅ | ✅ | ✅ | 🚫 | 🚫 |
| **Repository** | ✅ | 🚫 | 🚫 | ✅ | ✅ | 🚫 | 🚫 |
| **Service** | ✅ | 🚫 | ✅ | ✅ | ✅ | ✅ | 🚫 |
| **Controller** | ✅ | ✅ | ✅ | 🚫 | 🚫 | ✅ | ✅ |
```

#### frontend/AGENTS.md

```markdown
# Frontend Knowledge Base

**Path:** `frontend/`
**Type:** React 19 SPA

## OVERVIEW

React 19 frontend with Vite 7, TypeScript 5.7, React Query v5, and modern state management.

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Pages | `src/pages/` | Route components |
| Components | `src/components/` | Reusable UI |
| Hooks | `src/hooks/` | Custom React hooks |
| API | `src/api/` | HTTP client, endpoints |
| State | `src/store/` | Global state |
| Styles | `src/styles/` | CSS, themes |
| Utils | `src/utils/` | Helpers |

## COMMANDS

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Test
npm test

# Lint
npm run lint
```

## CONVENTIONS

- **Components**: Functional with hooks, PascalCase
- **State**: React Query for server state, Zustand for client state
- **Styling**: Tailwind CSS + CSS Modules
- **API**: Axios with interceptors, centralized in `api/` directory
- **Types**: Strict TypeScript, explicit types everywhere

## ANTI-PATTERNS

- **DO NOT** use useEffect for data fetching (use React Query)
- **DO NOT** call API functions directly from components
- **NEVER** use `any` type
- **AVOID** prop drilling
- **NO** business logic in components

## LAYER ACCESS MATRIX

| From \ To | Utils | Component | Hook | API |
|-----------|-------|-----------|------|-----|
| **Utils** | ✅ | 🚫 | 🚫 | 🚫 |
| **Component** | ✅ | ✅ | ✅ | 🚫 |
| **Hook** | ✅ | 🚫 | ✅ | ✅ |
| **API** | ✅ | 🚫 | 🚫 | ✅ |
```

---

## Example 3: Python Project

### Project Structure

```
data-pipeline/
├── .opencode/
│   ├── skills/
│   │   ├── korean-docstring-context-python/
│   │   └── test-driven-development/
│   └── rules/
│       ├── general/
│       └── python/
│           └── python-best-practices.mdc
├── src/
│   ├── extractors/
│   ├── transformers/
│   └── loaders/
├── tests/
├── requirements.txt
└── README.md
```

### Generated AGENTS.md (Key Sections)

```markdown
## SKILLS & RULES REFERENCE

### Domain-Specific Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `korean-docstring-context-python` | Korean Python docs | Writing docstrings |

### Python Rules
| Rule | Purpose |
|------|---------|
| `python-best-practices.mdc` | Python coding standards |

## CONVENTIONS

- **Style**: PEP 8 with Black formatter
- **Types**: Type hints mandatory (Python 3.11+)
- **Docstrings**: Google style, Korean/English bilingual
- **Testing**: pytest with 80%+ coverage
- **Structure**: src/ layout with pyproject.toml
```

---

## Tips for Different Project Types

### Small Projects (< 100 files)
- Create only root AGENTS.md
- Keep under 200 lines
- Focus on essential conventions

### Medium Projects (100-500 files)
- Root AGENTS.md + 1-2 subdirectory files
- Separate by domain (frontend/backend)
- Include layer access matrices

### Large Projects (500+ files)
- Hierarchical structure: Root → Domains → Modules
- Use scoring to determine AGENTS.md locations
- Create cross-reference links

### Monorepos
- Root: Overview, shared conventions, cross-cutting concerns
- Per-package: Package-specific patterns
- Common patterns: backend/, frontend/, shared/, packages/
