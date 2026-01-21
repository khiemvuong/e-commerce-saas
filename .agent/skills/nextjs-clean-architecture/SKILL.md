---
name: Next.js Clean Architecture
description: Hướng dẫn xây dựng ứng dụng Next.js theo Clean Architecture với TypeScript, MVP pattern, và dependency injection
---

# Next.js Clean Architecture Skill

## Tổng quan

Skill này hướng dẫn cách xây dựng ứng dụng Next.js theo Clean Architecture với TypeScript, áp dụng MVP (Model-View-Presenter) pattern, và dependency injection.

## Kiến trúc tổng thể

### Các layer chính

1. **app** - Next.js app folder (Next.js 14)
2. **core** - Application Core (loggers, event tracking)
3. **data** - Data sources definitions
4. **dataStore** - State management (Redux, Zustand, etc.)
5. **domain** - Models, repositories, use cases
6. **ioc** - Dependency injection (Container và modules)
7. **presentation** - Presenters (MVP) và presenter models
8. **ui** - User-facing markup (React components, styles)

## Data Flow - Luồng dữ liệu chính

```
UI -> PRESENTATION (Presenter) -> DOMAIN (UseCase) -> DATA (Repository) -> External API/DB
                    ↓
              DATA STORE
```

### Quy trình xử lý

1. **UI Layer** gọi methods từ **Presenter**
2. **Presenter** gọi **Use Cases** từ **Domain Layer**
3. **Use Cases** tương tác với **Repository Interfaces**
4. **Repository Implementations** (trong Data Layer) fetch data từ API/DB
5. **Mappers** chuyển đổi data từ Data Models → Domain Models → Presentation Models
6. **Presenter** cập nhật **Data Store** và UI được re-render

## Quy tắc truy cập giữa các layer

### ✅ Cho phép

- **DEPENDENCY INJECTION** → Truy cập tất cả layers
- **UI** → Truy cập **PRESENTATION** và **DATA STORE**
- **PRESENTATION** → Truy cập **DATA STORE** và **DOMAIN**
- **DATA STORE** → Không truy cập layer nào (độc lập)
- **DOMAIN** → Không truy cập layer nào (core logic, độc lập hoàn toàn)

### ❌ Không cho phép

- UI không được truy cập trực tiếp DOMAIN hoặc DATA
- Product features không được truy cập trực tiếp lẫn nhau
  - Dùng `shared` product feature cho cross-product functionality
- Presentation không được truy cập DATA trực tiếp
- Domain không được import bất kỳ layer nào khác

## Cấu trúc thư mục chi tiết

### 1. Domain Layer (Lớp cốt lõi)

```
domain/
├── models/           # Domain entities
├── repositories/     # Repository interfaces
├── usecases/        # Business logic
├── mappers/         # Data → Domain mappers
└── index.ts         # Public exports
```

**Ví dụ Domain Model:**

```typescript
// domain/models/Product.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}
```

**Ví dụ Repository Interface:**

```typescript
// domain/repositories/IProductRepository.ts
import { Product } from "../models/Product";

export interface IProductRepository {
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  create(product: Omit<Product, "id">): Promise<Product>;
  update(id: string, product: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
}
```

**Ví dụ Use Case:**

```typescript
// domain/usecases/GetProductsUseCase.ts
import { IProductRepository } from "../repositories/IProductRepository";
import { Product } from "../models/Product";

export class GetProductsUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(): Promise<Product[]> {
    return await this.productRepository.getAll();
  }
}
```

### 2. Data Layer

```
data/
├── models/          # API response models
├── repositories/    # Repository implementations
├── mappers/        # API → Domain mappers
└── api/            # API clients
```

**Ví dụ Data Model:**

```typescript
// data/models/ProductDTO.ts
export interface ProductDTO {
  product_id: string;
  product_name: string;
  price_amount: number;
  product_desc: string;
}
```

**Ví dụ Mapper:**

```typescript
// data/mappers/ProductMapper.ts
import { ProductDTO } from "../models/ProductDTO";
import { Product } from "../../domain/models/Product";

export class ProductMapper {
  static toDomain(dto: ProductDTO): Product {
    return {
      id: dto.product_id,
      name: dto.product_name,
      price: dto.price_amount,
      description: dto.product_desc,
    };
  }
}
```

**Ví dụ Repository Implementation:**

```typescript
// data/repositories/ProductRepository.ts
import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { Product } from "../../domain/models/Product";
import { ProductMapper } from "../mappers/ProductMapper";
import { apiClient } from "../api/apiClient";

export class ProductRepository implements IProductRepository {
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get("/products");
    return response.data.map(ProductMapper.toDomain);
  }

  async getById(id: string): Promise<Product | null> {
    const response = await apiClient.get(`/products/${id}`);
    return response.data ? ProductMapper.toDomain(response.data) : null;
  }

  async create(product: Omit<Product, "id">): Promise<Product> {
    const response = await apiClient.post("/products", product);
    return ProductMapper.toDomain(response.data);
  }

  async update(id: string, product: Partial<Product>): Promise<Product> {
    const response = await apiClient.put(`/products/${id}`, product);
    return ProductMapper.toDomain(response.data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  }
}
```

### 3. DataStore Layer

```
dataStore/
├── products/
│   ├── productsStore.ts
│   └── productsSelectors.ts
└── index.ts
```

**Ví dụ Store (Zustand):**

```typescript
// dataStore/products/productsStore.ts
import { create } from "zustand";
import { Product } from "../../domain/models/Product";

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  setProducts: (products: Product[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProductsStore = create<ProductsState>((set) => ({
  products: [],
  isLoading: false,
  error: null,
  setProducts: (products) => set({ products }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
```

### 4. Presentation Layer (MVP Pattern)

```
presentation/
├── products/
│   ├── ProductsPresenter.ts
│   ├── ProductsViewModel.ts
│   └── mappers/
│       └── ProductViewModelMapper.ts
└── index.ts
```

**Ví dụ View Model:**

```typescript
// presentation/products/ProductsViewModel.ts
export interface ProductViewModel {
  id: string;
  displayName: string;
  formattedPrice: string;
  shortDescription: string;
}
```

**Ví dụ Mapper (Domain → Presentation):**

```typescript
// presentation/products/mappers/ProductViewModelMapper.ts
import { Product } from "../../../domain/models/Product";
import { ProductViewModel } from "../ProductsViewModel";

export class ProductViewModelMapper {
  static toViewModel(product: Product): ProductViewModel {
    return {
      id: product.id,
      displayName: product.name.toUpperCase(),
      formattedPrice: `$${product.price.toFixed(2)}`,
      shortDescription: product.description.substring(0, 100) + "...",
    };
  }
}
```

**Ví dụ Presenter:**

```typescript
// presentation/products/ProductsPresenter.ts
import { GetProductsUseCase } from "../../domain/usecases/GetProductsUseCase";
import { useProductsStore } from "../../dataStore/products/productsStore";
import { ProductViewModelMapper } from "./mappers/ProductViewModelMapper";
import { ProductViewModel } from "./ProductsViewModel";

export class ProductsPresenter {
  constructor(private getProductsUseCase: GetProductsUseCase) {}

  async loadProducts(): Promise<void> {
    const { setLoading, setProducts, setError } = useProductsStore.getState();

    try {
      setLoading(true);
      setError(null);

      const products = await this.getProductsUseCase.execute();
      const viewModels = products.map(ProductViewModelMapper.toViewModel);

      setProducts(viewModels);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }
}
```

### 5. IOC Layer (Dependency Injection)

```
ioc/
├── Container.ts
├── modules/
│   ├── DataModule.ts
│   ├── DomainModule.ts
│   └── PresentationModule.ts
└── index.ts
```

**Ví dụ Container:**

```typescript
// ioc/Container.ts
export class Container {
  private services = new Map<string, any>();

  register<T>(key: string, instance: T): void {
    this.services.set(key, instance);
  }

  resolve<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found`);
    }
    return service;
  }
}

export const container = new Container();
```

**Ví dụ Module:**

```typescript
// ioc/modules/DataModule.ts
import { Container } from "../Container";
import { ProductRepository } from "../../data/repositories/ProductRepository";

export function registerDataModule(container: Container): void {
  container.register("ProductRepository", new ProductRepository());
}

// ioc/modules/DomainModule.ts
import { Container } from "../Container";
import { GetProductsUseCase } from "../../domain/usecases/GetProductsUseCase";

export function registerDomainModule(container: Container): void {
  const productRepository = container.resolve("ProductRepository");
  container.register("GetProductsUseCase", new GetProductsUseCase(productRepository));
}

// ioc/modules/PresentationModule.ts
import { Container } from "../Container";
import { ProductsPresenter } from "../../presentation/products/ProductsPresenter";

export function registerPresentationModule(container: Container): void {
  const getProductsUseCase = container.resolve("GetProductsUseCase");
  container.register("ProductsPresenter", new ProductsPresenter(getProductsUseCase));
}
```

**Bootstrap:**

```typescript
// ioc/index.ts
import { container } from "./Container";
import { registerDataModule } from "./modules/DataModule";
import { registerDomainModule } from "./modules/DomainModule";
import { registerPresentationModule } from "./modules/PresentationModule";

export function bootstrapContainer(): void {
  registerDataModule(container);
  registerDomainModule(container);
  registerPresentationModule(container);
}

export { container };
```

### 6. UI Layer (React Components)

```
ui/
├── products/
│   ├── ProductsList.tsx
│   ├── ProductCard.tsx
│   └── styles.module.css
└── shared/
    └── components/
```

**Ví dụ Component:**

```typescript
// ui/products/ProductsList.tsx
'use client';

import { useEffect } from 'react';
import { useProductsStore } from '../../dataStore/products/productsStore';
import { container } from '../../ioc';
import { ProductsPresenter } from '../../presentation/products/ProductsPresenter';

export function ProductsList() {
  const { products, isLoading, error } = useProductsStore();

  useEffect(() => {
    const presenter = container.resolve<ProductsPresenter>('ProductsPresenter');
    presenter.loadProducts();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>
          <h3>{product.displayName}</h3>
          <p>{product.formattedPrice}</p>
          <p>{product.shortDescription}</p>
        </div>
      ))}
    </div>
  );
}
```

### 7. App Layer (Next.js)

```
app/
├── products/
│   └── page.tsx
├── layout.tsx
└── providers.tsx
```

**Ví dụ Page:**

```typescript
// app/products/page.tsx
import { ProductsList } from '@/ui/products/ProductsList';

export default function ProductsPage() {
  return (
    <main>
      <h1>Products</h1>
      <ProductsList />
    </main>
  );
}
```

**Setup Providers:**

```typescript
// app/providers.tsx
'use client';

import { useEffect } from 'react';
import { bootstrapContainer } from '@/ioc';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    bootstrapContainer();
  }, []);

  return <>{children}</>;
}
```

## Bounded Context Pattern

Để tổ chức code theo business domains, sử dụng **Bounded Context**:

```
ui/
├── products/          # Product context
│   ├── list/
│   ├── detail/
│   └── create/
├── orders/           # Order context
│   ├── list/
│   ├── detail/
│   └── checkout/
└── shared/           # Cross-context utilities
    ├── components/
    └── utils/
```

## Testing Strategy

### 1. Unit Tests (Domain & UseCases)

```typescript
// domain/usecases/__tests__/GetProductsUseCase.test.ts
import { GetProductsUseCase } from "../GetProductsUseCase";
import { IProductRepository } from "../../repositories/IProductRepository";

describe("GetProductsUseCase", () => {
  it("should return products from repository", async () => {
    const mockRepo: IProductRepository = {
      getAll: jest.fn().mockResolvedValue([{ id: "1", name: "Product 1", price: 100, description: "Test" }]),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const useCase = new GetProductsUseCase(mockRepo);
    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(mockRepo.getAll).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Integration Tests (Repositories)

```typescript
// data/repositories/__tests__/ProductRepository.integration.test.ts
import { ProductRepository } from "../ProductRepository";

describe("ProductRepository Integration", () => {
  it("should fetch products from API", async () => {
    const repo = new ProductRepository();
    const products = await repo.getAll();

    expect(Array.isArray(products)).toBe(true);
  });
});
```

### 3. E2E Tests (Playwright)

```typescript
// e2e/products.spec.ts
import { test, expect } from "@playwright/test";

test("should display products list", async ({ page }) => {
  await page.goto("/products");
  await expect(page.locator("h1")).toContainText("Products");

  const products = page.locator('[data-testid="product-card"]');
  await expect(products).toHaveCount(3);
});
```

## Best Practices

### 1. **Tuân thủ Dependency Rule**

- Inner layers không được phụ thuộc vào outer layers
- Dependencies luôn point inward

### 2. **Single Responsibility**

- Mỗi class/function chỉ làm một việc
- Use Cases nên nhỏ và focused

### 3. **Interface Segregation**

- Tạo interfaces nhỏ và specific
- Không tạo "fat interfaces"

### 4. **Dependency Injection**

- Luôn inject dependencies qua constructor
- Không hard-code dependencies

### 5. **Mappers**

- Tách biệt data models và domain models
- Tách biệt domain models và view models

### 6. **Error Handling**

- Handle errors ở Presenter layer
- Update store với error states
- Display errors ở UI layer

### 7. **TypeScript Strict Mode**

- Bật strict mode trong tsconfig.json
- Avoid `any` type

## ESLint Configuration

Thiết lập ESLint để enforce layer restrictions:

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    "import/no-restricted-paths": [
      "error",
      {
        zones: [
          // Domain không import bất kỳ layer nào
          {
            target: "./domain",
            from: ["./data", "./dataStore", "./presentation", "./ui", "./app"],
          },
          // DataStore không import bất kỳ layer nào
          {
            target: "./dataStore",
            from: ["./data", "./domain", "./presentation", "./ui", "./app"],
          },
          // UI chỉ import từ presentation và dataStore
          {
            target: "./ui",
            from: ["./data", "./domain"],
          },
          // Presentation không import từ data
          {
            target: "./presentation",
            from: ["./data", "./ui", "./app"],
          },
        ],
      },
    ],
  },
};
```

## Quy trình phát triển feature mới

1. **Định nghĩa Domain Model** trong `domain/models/`
2. **Tạo Repository Interface** trong `domain/repositories/`
3. **Implement Use Case** trong `domain/usecases/`
4. **Tạo Data Model (DTO)** trong `data/models/`
5. **Implement Mapper** trong `data/mappers/`
6. **Implement Repository** trong `data/repositories/`
7. **Tạo Store** trong `dataStore/`
8. **Tạo View Model** trong `presentation/`
9. **Tạo Presenter** trong `presentation/`
10. **Register Dependencies** trong `ioc/modules/`
11. **Tạo UI Components** trong `ui/`
12. **Tạo Next.js Page** trong `app/`

## Ví dụ hoàn chỉnh: Product Feature

Xem các ví dụ code phía trên để hiểu cách implement một feature hoàn chỉnh theo Clean Architecture.

## Lưu ý quan trọng

- **Không skip layers**: UI → Presenter → UseCase → Repository
- **Không mix concerns**: Mỗi layer có trách nhiệm riêng
- **Test isolate**: Mock dependencies khi test
- **Keep it simple**: Đừng over-engineer, áp dụng đúng mức
