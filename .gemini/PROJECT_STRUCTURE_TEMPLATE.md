# [TÊN DỰ ÁN]

## Tổng quan

<!-- Mô tả ngắn gọn về dự án -->

Dự án này là một API backend được xây dựng với Node.js và TypeScript, tuân theo các nguyên tắc của Clean Architecture, Domain-Driven Design (DDD) và Layered Architecture.

---

## Thông tin dự án

- **Tên dự án**: [Tên dự án]
- **Phiên bản**: [x.x.x]
- **Mô tả**: [Mô tả chi tiết về mục đích và chức năng của dự án]
- **Tech Stack**:
  - Runtime: Node.js (>= 12.0.0)
  - Language: TypeScript
  - Framework: Express.js
  - Database: MongoDB / [Database khác]
  - DI Container: Awilix
  - Logger: Pino
  - Testing: Jest
  - Documentation: Swagger

---

## Cấu trúc thư mục

```
project-root/
├── bin/                          # Các script CLI và tiện ích
├── dbin/                         # Docker wrapper scripts
├── docker/                       # Docker configuration files
├── src/                          # Source code chính
│   ├── _boot/                    # Boot process và lifecycle management
│   │   ├── index.ts             # Main bootstrap file
│   │   ├── appModules.ts        # App modules registration
│   │   ├── database.ts          # Database module setup
│   │   ├── server.ts            # Server module setup
│   │   ├── pubSub.ts            # Pub/Sub module setup
│   │   ├── repl.ts              # REPL module setup
│   │   └── swagger.ts           # Swagger documentation setup
│   │
│   ├── _lib/                     # Shared libraries (có thể extract thành npm packages)
│   │   ├── di/                  # Dependency Injection utilities
│   │   ├── errors/              # Error handling abstractions
│   │   ├── events/              # Event system abstractions
│   │   ├── http/                # HTTP utilities và middleware
│   │   ├── logger/              # Logger configuration
│   │   ├── pubSub/              # Pub/Sub implementation
│   │   ├── repl/                # REPL utilities
│   │   └── MongoProvider.ts     # Database provider abstraction
│   │
│   ├── _sharedKernel/           # Shared domain logic across modules
│   │   ├── domain/              # Shared domain entities và value objects
│   │   ├── infrastructure/      # Shared infrastructure code
│   │   └── interface/           # Shared interface definitions
│   │
│   ├── [feature-module]/        # Feature modules (VD: article, comment, user...)
│   │   ├── __tests__/           # Module-specific tests
│   │   ├── application/         # Application layer (Use Cases, Queries, Events)
│   │   │   ├── useCases/       # Use cases (business operations)
│   │   │   ├── query/          # Query operations (read-only)
│   │   │   └── events/         # Domain events
│   │   ├── domain/              # Domain layer (Entities, Value Objects, Repositories)
│   │   │   ├── [Entity].ts     # Domain entities
│   │   │   └── [Repository].d.ts # Repository interfaces
│   │   ├── infrastructure/      # Infrastructure layer (DB, External services)
│   │   │   ├── [Entity]Collection.ts    # Database collection setup
│   │   │   ├── [Entity]Mapper.ts        # Data mapping
│   │   │   ├── Mongo[Repository].ts     # Repository implementation
│   │   │   └── MongoFind[Entity].ts     # Query implementation
│   │   ├── interface/           # Interface layer (HTTP, Email, CLI...)
│   │   │   ├── http/           # HTTP controllers và routes
│   │   │   ├── email/          # Email listeners/handlers
│   │   │   └── cli/            # CLI commands (nếu có)
│   │   └── index.ts            # Module registration và exports
│   │
│   ├── __tests__/               # Global test setup
│   ├── config.ts                # Configuration management
│   ├── container.ts             # DI Container setup
│   ├── context.ts               # Application context
│   └── index.ts                 # Application entry point
│
├── .env.test                     # Test environment variables
├── .eslintrc.json               # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── .gitignore                   # Git ignore rules
├── docker-compose.yml           # Docker Compose configuration
├── tsconfig.json                # TypeScript configuration
├── tsconfig.prod.json           # Production TypeScript config
├── package.json                 # NPM dependencies và scripts
├── README.md                    # Project documentation
└── LICENSE.md                   # License information
```

---

## Kiến trúc dự án

### 1. **Layered Architecture**

Dự án được tổ chức theo mô hình 4 layers:

#### **Domain Layer** (`domain/`)

- **Trách nhiệm**: Chứa business logic thuần túy, không phụ thuộc vào infrastructure
- **Bao gồm**:
  - Entities: Domain objects với identity
  - Value Objects: Immutable objects không có identity
  - Aggregates: Nhóm của entities với một root entity
  - Repository Interfaces: Contracts cho data access
  - Domain Events: Events phát sinh từ domain operations

#### **Application Layer** (`application/`)

- **Trách nhiệm**: Orchestrate business logic, không chứa business rules
- **Bao gồm**:
  - Use Cases: Application-specific operations
  - Queries: Read-only operations (CQRS pattern)
  - Event Handlers: React to domain events
  - DTOs: Data Transfer Objects

#### **Infrastructure Layer** (`infrastructure/`)

- **Trách nhiệm**: Implementations của technical concerns
- **Bao gồm**:
  - Repository Implementations: Concrete data access
  - Database Collections: Schema và indexing
  - Mappers: Convert between domain và database models
  - External Service Adapters: Third-party integrations

#### **Interface Layer** (`interface/`)

- **Trách nhiệm**: Entry points for external interactions
- **Bao gồm**:
  - HTTP Controllers: REST API endpoints
  - Route Definitions: API routing
  - Request/Response DTOs: API contracts
  - Email Listeners: Email-based interactions
  - CLI Commands: Command-line interfaces

---

### 2. **Module System**

Mỗi feature được đóng gói thành một **module** độc lập:

```typescript
// [module]/index.ts
const [module]Module = makeModule('[module-name]', async ({ container, initialize }) => {
  // 1. Initialize database collections
  const [collections] = await initialize(
    withMongoProvider({
      [entity]Collection: init[Entity]Collection,
    })
  );

  // 2. Register dependencies
  register({
    ...toContainerValues(collections),
    [entity]Repository: asFunction(makeMongo[Entity]Repository),
    [useCase]: asFunction(make[UseCase]),
  });

  // 3. Initialize controllers and listeners
  await initialize(make[Entity]Controller, make[Event]Listener);
});

// Export module và registry types
export { [module]Module };
export type { [Module]Registry };
```

---

### 3. **Dependency Injection**

Sử dụng **Awilix** cho IoC (Inversion of Control):

- Container được khởi tạo trong `src/container.ts`
- Mỗi module register dependencies của chính nó
- Dependencies có thể inject qua constructor hoặc function parameters
- Type-safe với TypeScript generics

**Ví dụ**:

```typescript
type Dependencies = {
  logger: Logger;
  articleRepository: ArticleRepository;
  // ...
};

const makeCreateArticle = ({ logger, articleRepository }: Dependencies) => {
  return async (data: CreateArticleData) => {
    // Use case implementation
  };
};
```

---

### 4. **Lifecycle Events**

Application lifecycle được quản lý qua events:

#### **Boot Process**:

1. **Booting** → Modules được invoke
2. **Booted** → Tất cả modules đã register dependencies
3. **Ready** → Có thể start server, consumers...
4. **Running** → Application đang chạy

#### **Shutdown Process**:

1. **Disposing** → Cleanup functions được gọi (reverse order)
2. **Disposed** → Tất cả resources đã được giải phóng
3. **Terminated** → Process kết thúc

**Hook vào lifecycle**:

```typescript
app.onBooted(() => {
  // Register error handlers
});

app.onReady(() => {
  // Start server
});
```

---

## Domain-Driven Design Patterns

### 1. **Entities và Aggregates**

```typescript
// domain/[Entity].ts
import { withInvariants } from '@/_lib/domain/withInvariants';

namespace [Entity] {
  export type Type = {
    id: MUUID;
    // ... properties
  };

  export const create = withInvariants<Type>(
    (props) => {
      // Validate invariants
      return props;
    }
  );
}

export { [Entity] };
```

### 2. **Value Objects**

```typescript
namespace [ValueObject] {
  export type Type = {
    // ... immutable properties
  };

  export const create = (props): Type => {
    // Validation
    return Object.freeze(props);
  };
}
```

### 3. **Repository Pattern**

```typescript
// domain/[Entity]Repository.d.ts
export type [Entity]Repository = {
  findById(id: MUUID): Promise<[Entity].Type | null>;
  save(entity: [Entity].Type): Promise<void>;
  delete(id: MUUID): Promise<void>;
};
```

### 4. **Use Cases**

```typescript
// application/useCases/[UseCase].ts
type Dependencies = {
  logger: Logger;
  [entity]Repository: [Entity]Repository;
  eventEmitter: EventEmitter;
};

export type [UseCase] = (data: [Data]) => Promise<[Result]>;

export const make[UseCase] = ({ logger, [entity]Repository, eventEmitter }: Dependencies): [UseCase] => {
  return async (data) => {
    // 1. Validate input
    // 2. Load domain objects
    // 3. Execute business logic
    // 4. Persist changes
    // 5. Emit events
    // 6. Return result
  };
};
```

---

## Naming Conventions

### Folders:

- Lowercase cho folders: `domain/`, `application/`, `infrastructure/`, `interface/`
- PascalCase cho feature modules: `Article/`, `Comment/`, `User/`

### Files:

- PascalCase cho classes/types: `Article.ts`, `ArticleRepository.ts`
- camelCase cho functions: `articleController.ts`, `makeCreateArticle.ts`
- Prefix `make` cho factory functions: `makeArticleController`
- Prefix `init` cho initialization functions: `initArticleCollection`

### Code:

- PascalCase cho Types/Namespaces: `Article.Type`, `CreateArticle`
- camelCase cho variables/functions: `articleRepository`, `createArticle`
- UPPER_CASE cho constants: `MAX_RETRY_COUNT`

---

## Environment Variables

```bash
# Server
PORT=3000
HOST=localhost

# Database
MONGO_URI=mongodb://localhost:27017/[database-name]
MONGO_DB_NAME=[database-name]

# Environment
NODE_ENV=development|production|test

# REPL (Remote console)
REPL_PORT=5001

# Logging
LOG_LEVEL=info|debug|error
```

---

## Scripts

### Development:

```bash
# Run dev server với hot reload
yarn dev

# Run với debugger
yarn debug

# Run REPL console
yarn cli

# Connect to remote REPL
yarn remote [server-address] [repl-port]
```

### Testing:

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run with coverage
yarn test --coverage
```

### Production:

```bash
# Build for production
yarn build

# Start production server
yarn start
```

### Docker:

```bash
# Run any command in Docker
dbin/yarn dev
dbin/yarn test

# Open shell in container
dbin/shell

# Rebuild Docker image
dbin/build
```

---

## Testing Strategy

### Test Organization:

- Tests nằm trong folder `__tests__/` của mỗi module
- Naming: `[feature].spec.ts` hoặc `[feature].test.ts`
- Setup file: `src/__tests__/setup.ts`

### Test Layers:

1. **Unit Tests**: Test isolated functions, use cases
2. **Integration Tests**: Test với database, external services
3. **E2E Tests**: Test HTTP endpoints với supertest

### Example:

```typescript
// article/__tests__/CreateArticle.spec.ts
describe("CreateArticle", () => {
  it("should create an article successfully", async () => {
    // Arrange
    const mockRepository = createMockRepository();
    const createArticle = makeCreateArticle({
      articleRepository: mockRepository,
    });

    // Act
    const result = await createArticle({ title: "Test" });

    // Assert
    expect(result).toBeDefined();
  });
});
```

---

## API Documentation

### Swagger/OpenAPI:

- Endpoint: `/api/docs`
- Tự động generate từ JSDoc comments
- Configuration trong `src/_boot/swagger.ts`

### Example JSDoc:

```typescript
/**
 * @swagger
 * /articles:
 *   post:
 *     summary: Create a new article
 *     tags: [Articles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: Article created successfully
 */
```

---

## Best Practices

### 1. **Dependency Direction**

- Domain không phụ thuộc vào bất kỳ layer nào
- Application chỉ phụ thuộc vào Domain
- Infrastructure và Interface phụ thuộc vào Domain và Application

### 2. **Immutability**

- Prefer immutable objects và pure functions
- Use Object.freeze() cho value objects
- Avoid mutation trong domain logic

### 3. **Explicit Dependencies**

- Always declare dependencies in function signatures
- Use dependency injection
- Avoid global state

### 4. **Error Handling**

- Use custom error types trong `_lib/errors/`
- Handle errors ở boundary (controllers)
- Log errors với proper context

### 5. **Testing**

- Test business logic trong isolation
- Mock external dependencies
- Maintain high code coverage

### 6. **TypeScript**

- Enable strict mode
- Define explicit types
- Avoid `any` type
- Use namespaces cho domain exports

---

## Module Checklist

Khi tạo một module mới, đảm bảo:

- [ ] Tạo cấu trúc folder: `domain/`, `application/`, `infrastructure/`, `interface/`
- [ ] Define domain entities và value objects
- [ ] Create repository interface trong `domain/`
- [ ] Implement repository trong `infrastructure/`
- [ ] Create use cases trong `application/useCases/`
- [ ] Setup database collection trong `infrastructure/`
- [ ] Create HTTP controller trong `interface/http/`
- [ ] Register module trong `index.ts`
- [ ] Export module registry types
- [ ] Add module to `_boot/appModules.ts`
- [ ] Write unit tests trong `__tests__/`
- [ ] Document API endpoints với Swagger
- [ ] Update this README with module info

---

## Dependencies

### Core:

- `express`: Web framework
- `awilix`: Dependency injection
- `pino`: High-performance logger
- `joi`: Schema validation
- `mongodb`: Database driver
- `uuid-mongodb`: UUID support for MongoDB

### Development:

- `typescript`: Type system
- `ts-node-dev`: Development server
- `jest`: Testing framework
- `eslint`: Linting
- `prettier`: Code formatting
- `supertest`: API testing

---

## Contributing

### Branch Strategy:

```
main (production)
├── develop (staging)
    ├── feature/[feature-name]
    ├── bugfix/[bug-name]
    └── hotfix/[fix-name]
```

### Commit Convention:

```
type(scope): subject

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## Troubleshooting

### Common Issues:

**Issue**: Module not found errors

- **Solution**: Check `tsconfig.json` paths configuration
- **Solution**: Run `yarn install` to ensure dependencies

**Issue**: Database connection fails

- **Solution**: Verify `MONGO_URI` in `.env`
- **Solution**: Ensure MongoDB is running

**Issue**: Tests failing

- **Solution**: Check `.env.test` configuration
- **Solution**: Clear test database

---

## Resources

### Documentation:

- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design Reference](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf)
- [Awilix Documentation](https://github.com/jeffijoe/awilix)
- [Pino Logger](https://getpino.io/)

### Related Projects:

- [node-api-boilerplate](https://github.com/talyssonoc/node-api-boilerplate)

---

## License

[Chọn license phù hợp: MIT, Apache 2.0, GPL, etc.]

---

## Contact & Support

- **Team**: [Tên team]
- **Email**: [email@example.com]
- **Slack**: [#channel-name]
- **Documentation**: [Link to wiki/docs]

---

## Changelog

### [Version] - YYYY-MM-DD

#### Added

- [New features]

#### Changed

- [Changes in existing functionality]

#### Fixed

- [Bug fixes]

#### Removed

- [Removed features]

---

**Last Updated**: [Date]
**Maintained by**: [Your Name/Team]
