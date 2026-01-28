# Seed Events MongoDB Script

Script để tạo 50 event products trực tiếp vào MongoDB.

## Thông tin Events

- **Số lượng**: 50 products
- **Starting Date**: Hôm qua (00:00:00)
- **Ending Date**: Năm sau (23:59:59)
- **Images**: Random từ 3 ảnh được cung cấp
- **Categories**: Fashion, Electronic, HouseHold, Food
- **Sub-categories**: Women, Phone, Washing machine, Chicken

## Cách chạy

### Method 1: Trong MongoDB Shell (mongosh)

```bash
mongosh "your-mongodb-connection-string"
```

Sau đó trong shell:

```javascript
load("scripts/seed-events-mongodb.js");
```

### Method 2: Chạy trực tiếp từ terminal

```bash
mongosh "your-mongodb-connection-string" < scripts/seed-events-mongodb.js
```

### Method 3: Với file .env

Nếu bạn có connection string trong `.env`:

```bash
# Windows PowerShell
$env:MONGODB_URI = "your-connection-string"
mongosh $env:MONGODB_URI < scripts/seed-events-mongodb.js

# Linux/Mac
mongosh "$MONGODB_URI" < scripts/seed-events-mongodb.js
```

## Lưu ý

1. **Database name**: Mặc định script dùng `ecommerce`. Sửa dòng này trong file nếu cần:

   ```javascript
   use("ecommerce"); // Change to your database name
   ```

2. **Shop requirement**: Script cần ít nhất 1 shop có sẵn trong database. Nếu không có, tạo shop trước.

3. **Collections sử dụng**:
   - `products` - Tạo 50 event products
   - `images` - Tạo 1-3 images cho mỗi product
   - `shops` - Đọc để gán shopId

## Output mẫu

```
=================================================
🚀 Starting Event Products Seed Script
=================================================
📅 Starting Date: 2026-01-27T00:00:00.000Z
📅 Ending Date: 2027-01-28T23:59:59.999Z
=================================================

🏪 Found 5 shop(s). Using random shops.

✅ [1/50] Prepared: Flash Sale - Fashion Women Event 1
   Shop: My Fashion Store | Price: $234.56 → $140.74 (40% off) | Images: 2
✅ [2/50] Prepared: Mega Discount - Electronic Phone Event 2
   Shop: Tech Hub | Price: $456.78 → $228.39 (50% off) | Images: 3
...

📦 Inserting products into database...
✅ Inserted 50 products
🖼️  Inserting images into database...
✅ Inserted 120 images

=================================================
✨ SEED COMPLETED SUCCESSFULLY!
=================================================

📊 Summary by Category:
   Fashion: 13 products
   Electronic: 12 products
   HouseHold: 14 products
   Food: 11 products

🎉 Done! You can now view the events in your application.
=================================================
```

## Kiểm tra kết quả

Trong MongoDB shell:

```javascript
// Xem tất cả events
db.products
  .find({
    "custom_properties.isEvent": true,
  })
  .count();

// Xem events theo category
db.products
  .find({
    "custom_properties.isEvent": true,
    category: "Fashion",
  })
  .pretty();

// Xem events còn hiệu lực
db.products
  .find({
    "custom_properties.isEvent": true,
    ending_date: { $gt: new Date() },
  })
  .count();
```

## Troubleshooting

### Error: "No shops found"

Tạo shop trước khi chạy script:

```javascript
db.shops.insertOne({
  name: "Test Shop",
  category: "General",
  // ... other required fields
});
```

### Error: "Authentication failed"

Kiểm tra connection string có đúng username/password không.

### Error: "Database not found"

Sửa tên database trong script cho đúng với database của bạn.
