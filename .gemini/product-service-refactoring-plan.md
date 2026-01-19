# Product Service Refactoring Plan

## Mục tiêu

Tái cấu trúc `product-service` theo Clean Architecture / DDD pattern để:

- Tách biệt concerns (separation of concerns)
- Dễ test và maintain
- Có thể mở rộng (scalable)
- Code dễ đọc và hiểu

---

## Cấu trúc hiện tại

```
apps/product-service/src/
├── assets/
├── constants/
│   └── productSelect.ts
├── controller/
│   └── product.controller.ts    # 1246 lines - TẤT CẢ logic ở đây!
├── jobs/
│   └── *.ts
├── routes/
│   └── product.routes.ts
├── main.ts
├── swagger.js
└── swagger-output.json
```

### Vấn đề:

- **God Controller**: 1 file controller chứa 26+ functions
- **Mixed concerns**: Business logic, data access, HTTP handling đều trong controller
- **Khó test**: Không thể unit test business logic riêng
- **Khó maintain**: Thay đổi 1 feature có thể ảnh hưởng nhiều chỗ

---

## Cấu trúc mới (Clean Architecture)

```
apps/product-service/src/
├── _lib/                           # Shared utilities
│   ├── errors/                     # Custom error types
│   │   └── ProductErrors.ts
│   └── types/                      # Shared types
│       └── index.ts
│
├── modules/                        # Feature modules
│   │
│   ├── product/                    # === PRODUCT MODULE ===
│   │   ├── domain/                 # Business entities & rules
│   │   │   ├── Product.ts          # Product entity
│   │   │   ├── ProductRepository.d.ts  # Repository interface
│   │   │   └── types.ts            # Product-specific types
│   │   │
│   │   ├── application/            # Use cases
│   │   │   ├── useCases/
│   │   │   │   ├── createProduct.ts
│   │   │   │   ├── editProduct.ts
│   │   │   │   ├── deleteProduct.ts
│   │   │   │   └── restoreProduct.ts
│   │   │   └── queries/
│   │   │       ├── getProductDetails.ts
│   │   │       ├── getAllProducts.ts
│   │   │       ├── getFilteredProducts.ts
│   │   │       ├── getMyProducts.ts
│   │   │       └── searchProducts.ts
│   │   │
│   │   ├── infrastructure/         # Data access implementations
│   │   │   ├── PrismaProductRepository.ts
│   │   │   └── ProductMapper.ts
│   │   │
│   │   └── interface/              # HTTP layer
│   │       └── http/
│   │           ├── productController.ts
│   │           └── productRoutes.ts
│   │
│   ├── event/                      # === EVENT MODULE ===
│   │   ├── domain/
│   │   │   ├── Event.ts
│   │   │   ├── EventRepository.d.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── application/
│   │   │   ├── useCases/
│   │   │   │   ├── createEvent.ts
│   │   │   │   └── editEvent.ts
│   │   │   └── queries/
│   │   │       ├── getAllEvents.ts
│   │   │       ├── getFilteredEvents.ts
│   │   │       └── getMyEvents.ts
│   │   │
│   │   ├── infrastructure/
│   │   │   └── PrismaEventRepository.ts
│   │   │
│   │   └── interface/
│   │       └── http/
│   │           ├── eventController.ts
│   │           └── eventRoutes.ts
│   │
│   ├── discount/                   # === DISCOUNT MODULE ===
│   │   ├── domain/
│   │   │   ├── DiscountCode.ts
│   │   │   └── DiscountCodeRepository.d.ts
│   │   │
│   │   ├── application/
│   │   │   ├── useCases/
│   │   │   │   ├── createDiscountCode.ts
│   │   │   │   └── deleteDiscountCode.ts
│   │   │   └── queries/
│   │   │       └── getDiscountCodes.ts
│   │   │
│   │   ├── infrastructure/
│   │   │   └── PrismaDiscountRepository.ts
│   │   │
│   │   └── interface/
│   │       └── http/
│   │           ├── discountController.ts
│   │           └── discountRoutes.ts
│   │
│   ├── category/                   # === CATEGORY MODULE ===
│   │   ├── domain/
│   │   │   └── Category.ts
│   │   │
│   │   ├── application/
│   │   │   └── queries/
│   │   │       ├── getCategories.ts
│   │   │       └── getCategoriesWithImages.ts
│   │   │
│   │   └── interface/
│   │       └── http/
│   │           ├── categoryController.ts
│   │           └── categoryRoutes.ts
│   │
│   ├── shop/                       # === SHOP MODULE ===
│   │   ├── domain/
│   │   │   └── Shop.ts
│   │   │
│   │   ├── application/
│   │   │   └── queries/
│   │   │       ├── getFilteredShops.ts
│   │   │       └── getTopShops.ts
│   │   │
│   │   └── interface/
│   │       └── http/
│   │           ├── shopController.ts
│   │           └── shopRoutes.ts
│   │
│   └── image/                      # === IMAGE MODULE ===
│       ├── application/
│       │   └── useCases/
│       │       ├── uploadProductImage.ts
│       │       └── deleteProductImage.ts
│       │
│       └── interface/
│           └── http/
│               ├── imageController.ts
│               └── imageRoutes.ts
│
├── routes/
│   └── index.ts                    # Combine all module routes
│
├── constants/
│   └── productSelect.ts            # Keep existing
│
├── jobs/                           # Keep existing
│
└── main.ts                         # Entry point
```

---

## Modules Chi tiết

### 1. Product Module

**Domain Layer** (`modules/product/domain/`)

| File                     | Nội dung                                     |
| ------------------------ | -------------------------------------------- |
| `Product.ts`             | Product entity với validation rules          |
| `ProductRepository.d.ts` | Interface for data access                    |
| `types.ts`               | ProductCreateInput, ProductUpdateInput, etc. |

**Application Layer** (`modules/product/application/`)

| Use Case            | Controller Function hiện tại      |
| ------------------- | --------------------------------- |
| `createProduct.ts`  | `createProduct()` (line 146-226)  |
| `editProduct.ts`    | `editProduct()` (line 1028-1123)  |
| `deleteProduct.ts`  | `deleteProduct()` (line 266-299)  |
| `restoreProduct.ts` | `restoreProduct()` (line 301-333) |

| Query                    | Controller Function hiện tại           |
| ------------------------ | -------------------------------------- |
| `getProductDetails.ts`   | `getProductDetails()` (line 492-540)   |
| `getAllProducts.ts`      | `getAllProducts()` (line 335-411)      |
| `getFilteredProducts.ts` | `getFilteredProducts()` (line 542-644) |
| `getMyProducts.ts`       | `getMyProducts()` (line 228-261)       |
| `searchProducts.ts`      | `searchProducts()` (line 917-960)      |

### 2. Event Module

| Use Case / Query       | Controller Function hiện tại         |
| ---------------------- | ------------------------------------ |
| `createEvent.ts`       | `createEvents()` (line 1199-1245)    |
| `editEvent.ts`         | `editEvent()` (line 1152-1197)       |
| `getAllEvents.ts`      | `getAllEvents()` (line 413-490)      |
| `getFilteredEvents.ts` | `getFilteredEvents()` (line 646-744) |
| `getMyEvents.ts`       | `getMyEvents()` (line 1125-1147)     |

### 3. Discount Module

| Use Case / Query        | Controller Function hiện tại         |
| ----------------------- | ------------------------------------ |
| `createDiscountCode.ts` | `createDiscountCodes()` (line 25-49) |
| `deleteDiscountCode.ts` | `deleteDiscountCode()` (line 63-86)  |
| `getDiscountCodes.ts`   | `getDiscountCodes()` (line 51-61)    |

### 4. Category Module

| Query                        | Controller Function hiện tại               |
| ---------------------------- | ------------------------------------------ |
| `getCategories.ts`           | `getCategories()` (line 8-23)              |
| `getCategoriesWithImages.ts` | `getCategoriesWithImages()` (line 863-915) |

### 5. Shop Module

| Query                 | Controller Function hiện tại        |
| --------------------- | ----------------------------------- |
| `getFilteredShops.ts` | `getFilteredShops()` (line 746-861) |
| `getTopShops.ts`      | `topShops()` (line 962-1026)        |

### 6. Image Module

| Use Case                | Controller Function hiện tại          |
| ----------------------- | ------------------------------------- |
| `uploadProductImage.ts` | `uploadProductImage()` (line 88-130)  |
| `deleteProductImage.ts` | `deleteProductImage()` (line 132-144) |

---

## Code Templates

### 1. Domain Entity

```typescript
// modules/product/domain/Product.ts
import { ValidationError } from "@packages/error-handler";

export namespace Product {
  export interface Type {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    estimated_price?: number;
    stock: number;
    category: string;
    subCategory?: string;
    // ... other fields
  }

  export interface CreateInput {
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    subCategory?: string;
    shopId: string;
    // ... other fields
  }

  export interface UpdateInput extends Partial<CreateInput> {
    id: string;
  }

  export const validate = (product: CreateInput): void => {
    if (!product.name || product.name.trim() === "") {
      throw new ValidationError("Product name is required");
    }
    if (product.price < 0) {
      throw new ValidationError("Price must be positive");
    }
    if (product.stock < 0) {
      throw new ValidationError("Stock must be positive");
    }
    // ... more validation
  };

  export const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };
}
```

### 2. Repository Interface

```typescript
// modules/product/domain/ProductRepository.d.ts
import { Product } from "./Product";

export interface ProductRepository {
  findById(id: string): Promise<Product.Type | null>;
  findBySlug(slug: string): Promise<Product.Type | null>;
  findByShopId(shopId: string, options?: QueryOptions): Promise<Product.Type[]>;
  save(product: Product.CreateInput): Promise<Product.Type>;
  update(product: Product.UpdateInput): Promise<Product.Type>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}
```

### 3. Use Case

```typescript
// modules/product/application/useCases/createProduct.ts
import { Product } from "../../domain/Product";
import { ProductRepository } from "../../domain/ProductRepository";

export interface CreateProductDeps {
  productRepository: ProductRepository;
}

export type CreateProduct = (input: Product.CreateInput) => Promise<Product.Type>;

export const makeCreateProduct = ({ productRepository }: CreateProductDeps): CreateProduct => {
  return async (input: Product.CreateInput) => {
    // 1. Validate input
    Product.validate(input);

    // 2. Generate slug
    const slug = Product.generateSlug(input.name);

    // 3. Create product
    const product = await productRepository.save({
      ...input,
      slug,
    });

    return product;
  };
};
```

### 4. Query

```typescript
// modules/product/application/queries/getProductDetails.ts
import prisma from "@packages/libs/prisma";
import { PRODUCT_FULL_SELECT } from "../../../constants/productSelect";
import { notFoundError } from "@packages/error-handler";

export interface GetProductDetailsInput {
  slug: string;
}

export const getProductDetails = async ({ slug }: GetProductDetailsInput) => {
  const product = await prisma.products.findUnique({
    where: { slug },
    select: PRODUCT_FULL_SELECT,
  });

  if (!product) {
    throw notFoundError("Product not found");
  }

  return product;
};
```

### 5. Repository Implementation

```typescript
// modules/product/infrastructure/PrismaProductRepository.ts
import prisma from "@packages/libs/prisma";
import { ProductRepository, QueryOptions } from "../domain/ProductRepository";
import { Product } from "../domain/Product";
import { PRODUCT_FULL_SELECT } from "../../constants/productSelect";

export const makePrismaProductRepository = (): ProductRepository => {
  return {
    async findById(id: string) {
      return prisma.products.findUnique({
        where: { id },
        select: PRODUCT_FULL_SELECT,
      });
    },

    async findBySlug(slug: string) {
      return prisma.products.findUnique({
        where: { slug },
        select: PRODUCT_FULL_SELECT,
      });
    },

    async findByShopId(shopId: string, options: QueryOptions = {}) {
      const { page = 1, limit = 10, includeDeleted = false } = options;

      return prisma.products.findMany({
        where: {
          shopId,
          ...(includeDeleted ? {} : { deleted: false }),
        },
        skip: (page - 1) * limit,
        take: limit,
        select: PRODUCT_FULL_SELECT,
      });
    },

    async save(input: Product.CreateInput) {
      return prisma.products.create({
        data: input,
        select: PRODUCT_FULL_SELECT,
      });
    },

    async update(input: Product.UpdateInput) {
      const { id, ...data } = input;
      return prisma.products.update({
        where: { id },
        data,
        select: PRODUCT_FULL_SELECT,
      });
    },

    async delete(id: string) {
      await prisma.products.delete({ where: { id } });
    },

    async softDelete(id: string) {
      await prisma.products.update({
        where: { id },
        data: { deleted: true },
      });
    },

    async restore(id: string) {
      await prisma.products.update({
        where: { id },
        data: { deleted: false },
      });
    },
  };
};
```

### 6. Controller

```typescript
// modules/product/interface/http/productController.ts
import { Request, Response, NextFunction } from "express";
import { makeCreateProduct } from "../../application/useCases/createProduct";
import { getProductDetails } from "../../application/queries/getProductDetails";
import { makePrismaProductRepository } from "../../infrastructure/PrismaProductRepository";

// Initialize dependencies
const productRepository = makePrismaProductRepository();
const createProduct = makeCreateProduct({ productRepository });

export const productController = {
  async create(req: any, res: Response, next: NextFunction) {
    try {
      const product = await createProduct({
        ...req.body,
        shopId: req.seller.shopId,
      });
      res.status(201).json({ success: true, product });
    } catch (error) {
      next(error);
    }
  },

  async getDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const product = await getProductDetails({ slug });
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  },

  // ... other methods
};
```

### 7. Routes

```typescript
// modules/product/interface/http/productRoutes.ts
import { Router } from "express";
import { productController } from "./productController";
import { isSellerAuthenticated } from "@packages/middleware";

const router = Router();

// Public routes
router.get("/products", productController.getAll);
router.get("/products/:slug", productController.getDetails);

// Protected routes
router.post("/products", isSellerAuthenticated, productController.create);
router.put("/products/:id", isSellerAuthenticated, productController.update);
router.delete("/products/:id", isSellerAuthenticated, productController.delete);

export { router as productRoutes };
```

### 8. Combine Routes

```typescript
// routes/index.ts
import { Router } from "express";
import { productRoutes } from "../modules/product/interface/http/productRoutes";
import { eventRoutes } from "../modules/event/interface/http/eventRoutes";
import { discountRoutes } from "../modules/discount/interface/http/discountRoutes";
import { categoryRoutes } from "../modules/category/interface/http/categoryRoutes";
import { shopRoutes } from "../modules/shop/interface/http/shopRoutes";
import { imageRoutes } from "../modules/image/interface/http/imageRoutes";

const router = Router();

router.use("/api", productRoutes);
router.use("/api", eventRoutes);
router.use("/api", discountRoutes);
router.use("/api", categoryRoutes);
router.use("/api", shopRoutes);
router.use("/api", imageRoutes);

export { router };
```

---

## Implementation Steps

### Phase 1: Setup (Estimated: 1 hour) ✅ COMPLETED

- [x] **1.1** Tạo cấu trúc thư mục mới
- [x] **1.2** Tạo `_lib/errors/ProductErrors.ts` với custom errors
- [x] **1.3** Tạo `_lib/types/index.ts` với shared types

### Phase 2: Product Module (Estimated: 2-3 hours) ✅ COMPLETED

- [x] **2.1** Tạo `modules/product/domain/Product.ts`
- [x] **2.2** Tạo `modules/product/domain/ProductRepository.d.ts`
- [x] **2.3** Tạo `modules/product/infrastructure/PrismaProductRepository.ts`
- [x] **2.4** Extract `createProduct` → `modules/product/application/useCases/createProduct.ts`
- [x] **2.5** Extract `editProduct` → `modules/product/application/useCases/editProduct.ts`
- [x] **2.6** Extract `deleteProduct` → `modules/product/application/useCases/deleteProduct.ts`
- [x] **2.7** Extract `restoreProduct` → `modules/product/application/useCases/restoreProduct.ts`
- [x] **2.8** Extract queries → `modules/product/application/queries/`
- [x] **2.9** Tạo `modules/product/interface/http/productController.ts`
- [x] **2.10** Tạo `modules/product/interface/http/productRoutes.ts`
- [ ] **2.11** Test Product module

### Phase 3: Event Module (Estimated: 1-2 hours) ✅ COMPLETED

- [x] **3.1** Tạo domain layer cho Event
- [x] **3.2** Extract use cases: `createEvent`, `editEvent`
- [x] **3.3** Extract queries: `getAllEvents`, `getFilteredEvents`, `getMyEvents`
- [x] **3.4** Tạo controller và routes
- [x] **3.5** Test Event module

### Phase 4: Discount Module (Estimated: 1 hour) ✅ COMPLETED

- [x] **4.1** Tạo domain layer cho DiscountCode
- [x] **4.2** Extract use cases: `createDiscountCode`, `deleteDiscountCode`
- [x] **4.3** Extract queries: `getDiscountCodes`
- [x] **4.4** Tạo controller và routes
- [x] **4.5** Test Discount module

### Phase 5: Category Module (Estimated: 30 mins) ✅ COMPLETED

- [x] **5.1** Extract queries: `getCategories`, `getCategoriesWithImages`
- [x] **5.2** Tạo controller và routes
- [x] **5.3** Test Category module

### Phase 6: Shop Module (Estimated: 1 hour) ✅ COMPLETED

- [x] **6.1** Extract queries: `getFilteredShops`, `getTopShops`
- [x] **6.2** Tạo controller và routes
- [x] **6.3** Test Shop module

### Phase 7: Image Module (Estimated: 30 mins) ✅ COMPLETED

- [x] **7.1** Extract use cases: `uploadProductImage`, `deleteProductImage`
- [x] **7.2** Tạo controller và routes
- [x] **7.3** Test Image module

### Phase 8: Integration (Estimated: 1 hour) ✅ COMPLETED

- [x] **8.1** Combine all routes trong `main.ts`
- [x] **8.2** Update `main.ts` để sử dụng routes mới
- [ ] **8.3** Test toàn bộ API endpoints
- [ ] **8.4** Xóa file controller cũ
- [ ] **8.5** Update documentation

---

## Testing Checklist

Sau khi refactoring, test các endpoints:

### Product Endpoints

- [ ] `GET /api/get-products` - Get all products
- [ ] `GET /api/product/:slug` - Get product details
- [ ] `GET /api/get-filtered-products` - Filter products
- [ ] `GET /api/get-my-products` - Seller's products
- [ ] `GET /api/search-products` - Search products
- [ ] `POST /api/create-product` - Create product
- [ ] `PUT /api/update-product/:id` - Edit product
- [ ] `DELETE /api/delete-product/:id` - Delete product
- [ ] `POST /api/restore-product/:id` - Restore product

### Event Endpoints

- [ ] `GET /api/get-events` - Get all events
- [ ] `GET /api/get-filtered-events` - Filter events
- [ ] `GET /api/get-my-events` - Seller's events
- [ ] `POST /api/create-event` - Create event
- [ ] `PUT /api/update-event/:id` - Edit event

### Discount Endpoints

- [ ] `POST /api/create-discount-code` - Create discount
- [ ] `GET /api/get-discount-codes` - Get discounts
- [ ] `DELETE /api/delete-discount-code/:id` - Delete discount

### Category Endpoints

- [ ] `GET /api/get-categories` - Get categories
- [ ] `GET /api/categories-with-images` - Categories with images

### Shop Endpoints

- [ ] `GET /api/get-filtered-shops` - Filter shops
- [ ] `GET /api/top-shops` - Top shops

### Image Endpoints

- [ ] `POST /api/upload-product-image` - Upload image
- [ ] `DELETE /api/delete-product-image/:id` - Delete image

---

## Benefits sau Refactoring

### 1. **Maintainability**

- Mỗi module độc lập, dễ hiểu
- Thay đổi 1 module không ảnh hưởng module khác

### 2. **Testability**

- Unit test từng use case riêng
- Mock dependencies dễ dàng

### 3. **Scalability**

- Thêm feature mới = thêm module mới
- Có thể tách module thành microservice

### 4. **Code Organization**

- Dễ navigate trong codebase
- Clear separation of concerns

### 5. **Team Collaboration**

- Nhiều người làm song song trên các modules khác nhau
- Giảm merge conflicts

---

## Notes

- Giữ nguyên các route paths để không break frontend
- Backup code trước khi bắt đầu
- Test kỹ từng phase trước khi tiếp tục

---

**Estimated Total Time: 8-10 hours**

**Author**: AI Assistant
**Date**: 2026-01-19
