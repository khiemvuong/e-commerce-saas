# 🧪 AI Chatbox — Bảng Test Cases (50 Scenarios) — v2.0

> **Mục đích:** Kiểm thử toàn diện hệ thống AI Chatbox recommendation, comparison, và khả năng đổi chủ đề liên tục.  
> **Môi trường:** 140 sản phẩm active (electronics:50, accessories:30, clothing:30, bags:15, shoes:15), 3 shops.  
> **Người kiểm thử:** ________________________  
> **Ngày kiểm thử:** ________________________  
> **Phiên bản:** v2.0 — Data-verified (23/03/2026)

---

## 📦 Tổng Quan Dữ Liệu Test

| Danh mục | Số SP | Shops |
|----------|-------|-------|
| Electronics (smartphones, laptops, tablets, headphones, speakers, cameras, monitors, smartwatches, earbuds) | 50 | Electronics (khiemyy) |
| Accessories (watches, sunglasses, belts, hats, necklaces, bracelets, scarves, gloves, rings, ties, socks, earrings, hair accessories) | 30 | Accessories Hub |
| Clothing (t-shirts, shirts, jeans, jackets, dresses, activewear, pants, hoodies, shorts, skirts, coats) | 30 | Fashion (vuongkhiem56) |
| Bags (backpacks, tote bags, wallets, duffel bags, crossbody, clutches, laptop bags, sports bags, travel bags, shoulder bags) | 15 | Fashion (vuongkhiem56) |
| Shoes (sneakers, running shoes, sandals, boots, formal shoes, loafers, heels) | 15 | Fashion (vuongkhiem56) |
| **Tổng** | **140** | **3 shops** |

### Top brands (số SP)

| Brand | SP | Brand | SP | Brand | SP |
|-------|-----|-------|-----|-------|-----|
| H&M | 15 | Nike | 14 | Zara | 12 |
| Adidas | 10 | Samsung | 10 | Apple | 10 |
| Uniqlo | 6 | Coach | 4 | Sony | 4 |
| Casio | 3 | Ray-Ban | 2 | Pandora | 2 |

---

## 🏷️ Quy Ước

| Ký hiệu | Ý nghĩa |
|----------|---------|
| 🟢 | PASS — Kết quả đúng như dự đoán |
| 🔴 | FAIL — Kết quả sai hoặc lỗi |
| 🟡 | PARTIAL — Kết quả đúng một phần |
| ➡️ | Bước tiếp theo trong flow (cùng conversation, KHÔNG reset) |
| 🔄 | Quick Reply — Nhấn nút gợi ý thay vì gõ |

---

## 📋 PHẦN A: SINGLE-TURN TEST (TC-01 → TC-15)

### A1. Tìm kiếm cơ bản theo danh mục

| TC | Input | Kết quả dự đoán | Quick Replies dự kiến | Kết quả | Ghi chú |
|----|-------|------------------|----------------------|---------|---------|
| TC-01 | `find me a watch` | ≥3 watches từ bảng accessories, ưu tiên totalSales: Casio F-91W ($18, sold:2500), Casio A168WA ($28, sold:1400), Casio G-Shock ($99, sold:680), Timex Weekender ($65, sold:410), DW Classic ($149, sold:320), Seiko Presage ($425, sold:75). Intent: SEARCH_PRODUCT | `Show me more`, `Compare them`, `Filter by price` | | |
| TC-02 | `show me budget laptops` | ≥2 laptops electronics, ưu tiên giá thấp: Acer Chromebook ($199), HP Pavilion ($549), ASUS Vivobook ($649), Microsoft Surface Go ($799). Intent: SEARCH_PRODUCT | `Show me more`, `Compare them`, `Premium laptops` | | |
| TC-03 | `women's dress` | ≥3 dresses từ clothing, gender=women: Uniqlo Rayon Wrap Dress ($40, sold:210), Zara Black Satin Midi ($89, sold:95), Zara Sequin Bodycon ($120, sold:42). Intent: SEARCH_PRODUCT | `Show me more`, `Filter by price`, `Compare them` | | |
| TC-04 | `something for gym` | ≥3 cross-category gym items: Nike Dri-FIT T-Shirt ($35→clothing), Nike One Leggings ($60→activewear), Nike Black Joggers ($55→pants), Nike Sports Backpack ($65→bags), Nike Swoosh Headband ($12→accessories), Adidas Running Shorts ($28). Intent: SEARCH_PRODUCT | `Show me more`, `Compare them` | | |
| TC-05 | `show me headphones` | ≥3 headphones electronics: JBL Tune 520BT ($49, sold:1500), Sony WH-1000XM5 ($349, sold:450), Samsung Galaxy Buds2 Pro ($199, sold:340), Bose QC Ultra ($429, sold:280), Apple AirPods Max ($549, sold:190), Sennheiser HD 600 ($329, sold:95), HyperX Cloud III ($99, sold:550). Intent: SEARCH_PRODUCT | `Compare them`, `Budget headphones`, `Show me more` | | |

### A2. Tìm kiếm theo brand

| TC | Input | Kết quả dự đoán | Quick Replies dự kiến | Kết quả | Ghi chú |
|----|-------|------------------|----------------------|---------|---------|
| TC-06 | `nike shoes` | ≥2 Nike shoes only (KHÔNG clothing): Nike Air Max 90 ($130, sold:340), Nike Revolution 6 Kids ($45, sold:380), Nike ZoomX Vaporfly ($260, sold:65), Nike White Running Shoes ($125, sold:138). Tất cả brand=Nike, category=shoes | `Show me more`, `Compare them`, `Nike clothing` | | |
| TC-07 | `casio` | ≥2 Casio watches: F-91W ($18, ★4.4, sold:2500), A168WA ($28, ★4.3, sold:1400), G-Shock ($99, ★4.7, sold:680). Đúng brand Casio. Intent: SEARCH_PRODUCT | `Compare them`, `Show me more` | | |
| TC-08 | `coach` | ≥2 Coach products cross-subcategory: Coach Willow Shoulder Bag ($295), Coach Tabby Clutch ($250), Coach Signature Belt ($128), Coach Leather Gloves ($128) | `Compare them`, `Show me more` | | |

### A3. Fuzzy match / Typo correction

| TC | Input | Kết quả dự đoán | Quick Replies dự kiến | Kết quả | Ghi chú |
|----|-------|------------------|----------------------|---------|---------|
| TC-09 | `addidas shoes` | Hệ thống sửa "addidas" → "adidas", hiển thị: Adidas Slides ($35), Adidas Stan Smith ($95), Adidas Ultraboost ($190). Correction banner hoặc implicit | `Compare them`, `Show me more` | | |
| TC-10 | `samsng phone` | Sửa "samsng" → "samsung", hiển thị Samsung smartphones: Galaxy S24 Ultra ($1199), Galaxy S24 ($799), Galaxy Z Flip5 ($999), Galaxy Book3 Pro ($1349) | `Compare them`, `Samsung tablets` | | |

### A4. Tìm kiếm theo giá

| TC | Input | Kết quả dự đoán | Quick Replies dự kiến | Kết quả | Ghi chú |
|----|-------|------------------|----------------------|---------|---------|
| TC-11 | `cheap headphones` | Headphones giá thấp trước: JBL Tune 520BT ($49), HyperX Cloud III ($99), Samsung Galaxy Buds FE ($99), Samsung Galaxy Buds2 Pro ($199). ≥2 recs, giá dưới $200 ưu tiên | `Show me more`, `Compare them`, `Premium headphones` | | |
| TC-12 | `premium laptop` | Laptops giá cao + rating cao: Apple MacBook Pro M3 ($1999, ★4.9), ASUS ROG Strix ($1799, ★4.7), Lenovo ThinkPad X1 ($1799, ★4.7), HP Spectre x360 ($1599, ★4.8), Dell XPS 15 ($1499, ★4.6). ≥1 laptop ≥$1000 | `Compare them`, `Budget laptops` | | |
| TC-13 | `luxury bags` | Bags giá cao: Coach Willow ($295, ★4.8), Coach Tabby ($250, ★4.9), Michael Kors Jet Set ($228, ★4.6), Samsonite Freeform ($189, ★4.7). ≥2 recs thuộc bags | `Compare them`, `Show me more` | | |

### A5. Cross-category intelligence

| TC | Input | Kết quả dự đoán | Quick Replies dự kiến | Kết quả | Ghi chú |
|----|-------|------------------|----------------------|---------|---------|
| TC-14 | `gift for her` | ≥3 recs, multi-category (≥2 categories): Pandora Bracelet ($65), Swarovski Necklace ($149), Zara Dress, H&M Earrings ($8), Zara Stiletto Heels ($75). Mix accessories + clothing + shoes | `Show me more`, `Filter by price` | | |
| TC-15 | `office outfit` | ≥3 recs cross-category: Uniqlo Oxford Shirt ($40), Clarks Oxford Shoes ($85), Uniqlo Chinos ($58→clothing base data), Tommy Tie ($55), Zara Satin Blouse ($55). Intent: SEARCH_PRODUCT | `Show me more`, `Compare them` | | |

---

## 📋 PHẦN B: COMPARISON TEST (TC-16 → TC-25)

### B1. So sánh trực tiếp 2 sản phẩm

| TC | Input | Kết quả dự đoán | Quick Replies dự kiến | Kết quả | Ghi chú |
|----|-------|------------------|----------------------|---------|---------|
| TC-16 | `iPhone 15 Pro Max vs Samsung Galaxy S24 Ultra` | Intent: COMPARE. Comparison 2 products: iPhone 15 Pro Max ($1199, ★4.9, sold:500) vs Galaxy S24 Ultra ($1199, ★4.8, sold:380). Verdict phân tích rating, sales. iPhone thắng rating + sales | `View Apple iPhone 15 Pr…`, `View Samsung Galaxy S24…`, `Search products` | | |
| TC-17 | `MacBook Pro vs Dell XPS vs ThinkPad` | Intent: COMPARE. Comparison ≥3 products: MacBook Pro M3 ($1999, ★4.9, sold:321), Dell XPS 15 ($1499, ★4.6, sold:211), ThinkPad X1 ($1799, ★4.7, sold:156). Verdict: MacBook thắng rating, Dell rẻ nhất | `View Apple MacBook Pro…`, `View Dell XPS 15…`, `View Lenovo ThinkPad…`, `Search products` | | |

### B2. So sánh 3+ sản phẩm với giá trong query

| TC | Input | Kết quả dự đoán | Quick Replies dự kiến | Kết quả | Ghi chú |
|----|-------|------------------|----------------------|---------|---------|
| TC-18 | `H&M Basic Tee ($12) vs Uniqlo Supima ($25) vs Nike Pro ($45)` | Comparison ≥2 products: H&M Basic White T-Shirt ($12, sold:520), Uniqlo Supima Cotton T-Shirt ($25, sold:680), Nike Pro Compression T-Shirt ($45, sold:310). Price hints stripped. Verdict: H&M rẻ nhất, Uniqlo bán chạy nhất | `View H&M Basic White…`, `View Uniqlo Supima…`, `View Nike Pro Compres…`, `Search products` | | |
| TC-19 | `Nike Air Max ($130) vs Adidas Stan Smith ($95) vs Converse Chuck ($55)` | Comparison 3 sneakers: Nike Air Max 90 ($130, ★4.7, sold:340), Adidas Stan Smith ($95, ★4.6, sold:520), Converse Chuck Taylor ($55, ★4.5, sold:890). Verdict: Converse rẻ nhất + bán chạy nhất (890), Nike đắt nhất | `View Nike Air Max 90…`, `View Adidas Stan Smith…`, `View Converse Chuck…`, `Search products` | | |
| TC-20 | `Casio F-91W vs G-Shock vs Seiko Presage` | Comparison 3 watches: F-91W ($18, ★4.4, sold:2500), G-Shock ($99, ★4.7, sold:680), Seiko Presage ($425, ★4.9, sold:75). Verdict: Casio F-91W rẻ nhất + bán chạy nhất, Seiko rating cao nhất | `View Casio F-91W…`, `View Casio G-Shock…`, `View Seiko Presage…`, `Search products` | | |

### B3. So sánh bằng "compare them" sau search

| TC | Input (multi-turn) | Kết quả dự đoán | Kết quả | Ghi chú |
|----|---------------------|------------------|---------|---------|
| TC-21 | **Step 1:** `show me casio watches` ➡️ **Step 2:** `compare them` | Step 1: ≥2 Casio watches (F-91W, A168WA, G-Shock). Step 2: Comparison ≥2 products, verdict present | | |
| TC-22 | **Step 1:** `nike shoes` ➡️ **Step 2:** `compare them` | Step 1: ≥2 Nike shoes, brand=Nike. Step 2: Comparison ≥2 products from step 1 | | |

### B4. So sánh bằng pattern khác

| TC | Input | Kết quả dự đoán | Kết quả | Ghi chú |
|----|-------|------------------|---------|---------|
| TC-23 | `Sony WH-1000XM5 or AirPods Max?` | Intent: COMPARE. Comparison 2: Sony WH-1000XM5 ($349, ★4.8, sold:450) vs AirPods Max ($549, ★4.6, sold:190). Verdict: Sony rẻ hơn + bán chạy hơn + rating cao hơn | | |
| TC-24 | `difference between iPad Pro and Galaxy Tab S9` | Intent: COMPARE. Comparison 2: iPad Pro M2 ($799, ★4.8, sold:350) vs Galaxy Tab S9 ($799, ★4.6, sold:195). Cùng giá $799, iPad thắng rating + sales | | |
| TC-25 | `compare Nike Brasilia and North Face Borealis and Samsonite` | Comparison ≥2 backpacks: Nike Brasilia ($40, ★4.4, sold:620), TNF Borealis ($99, ★4.6, sold:290), Samsonite Urban-Eye ($89, ★4.7, sold:250). Verdict: Nike rẻ nhất, Samsonite rating cao nhất | | |

---

## 📋 PHẦN C: MULTI-TURN FLOW — KHÔNG RESET (TC-26 → TC-35)

> ⚠️ **Quan trọng:** Tất cả các bước trong mỗi TC chạy trong **cùng một conversation**, KHÔNG nhấn Reset.

### C1. Flow: Tìm kiếm → So sánh → Đổi chủ đề

| TC | Bước | Input | Kết quả dự đoán | Kết quả | Ghi chú |
|----|------|-------|------------------|---------|---------|
| TC-26 | 1 | `show me laptops` | ≥3 laptops: MacBook Pro ($1999), MacBook Air ($1299), ASUS ROG ($1799), ThinkPad X1 ($1799), Dell XPS ($1499) | | |
| | 2 | 🔄 `Compare them` | Comparison ≥3 laptops vừa shown. Verdict phân tích giá, rating | | |
| | 3 | `show me cheaper ones` | Laptops giá thấp hơn: Acer Chromebook ($199), HP Pavilion ($549), ASUS Vivobook ($649) | | |
| | 4 | `what about phones?` | **Đổi chủ đề** → Phones: iPhone 15 Pro Max, Galaxy S24 Ultra, etc. KHÔNG dính "laptop" | | |
| | 5 | `compare the first two` | Context nhận diện → so sánh 2 phones đầu tiên hoặc fallback | | |

### C2. Flow: Budget → Premium → Reset

| TC | Bước | Input | Kết quả dự đoán | Kết quả | Ghi chú |
|----|------|-------|------------------|---------|---------|
| TC-27 | 1 | `cheap watches` | Casio F-91W ($18), Casio A168WA ($28), Timex Weekender ($65) — budget | | |
| | 2 | `show me premium watches` | Seiko Presage ($425), DW Classic ($149), G-Shock ($99) — tier cao | | |
| | 3 | `compare Casio F-91W vs Seiko Presage` | Comparison: F-91W ($18, sold:2500) vs Seiko ($425, sold:75) | | |
| | 4 | 🔄 `Search products` | Context reset, gợi ý search mới | | |

### C3. Flow: Cross-category exploration

| TC | Bước | Input | Kết quả dự đoán | Kết quả | Ghi chú |
|----|------|-------|------------------|---------|---------|
| TC-28 | 1 | `nike products` | Mix Nike toàn bộ: shoes + clothing + bags + accessories (14 SP Nike) | | |
| | 2 | `only shoes` | Filter → Nike shoes: Air Max 90 ($130), Revolution 6 Kids ($45), Vaporfly ($260), White Running ($125) | | |
| | 3 | `compare them` | Comparison ≥2 Nike shoes | | |
| | 4 | `now show me adidas shoes` | **Đổi brand**: Adidas Slides ($35), Stan Smith ($95), Ultraboost ($190). KHÔNG dính Nike | | |
| | 5 | `which is better Nike Air Max or Adidas Stan Smith?` | Comparison: Air Max ($130, ★4.7, sold:340) vs Stan Smith ($95, ★4.6, sold:520). Stan Smith popular hơn + rẻ hơn | | |

### C4. Flow: Liên tục hỏi cùng chủ đề (pagination)

| TC | Bước | Input | Kết quả dự đoán | Kết quả | Ghi chú |
|----|------|-------|------------------|---------|---------|
| TC-29 | 1 | `show me bags` | ≥3 bags: H&M Card Holder ($12), H&M Canvas Tote ($15), Nike Brasilia ($40), Adidas Duffel ($45), Zara Crossbody ($45) | | |
| | 2 | `show me more bags` | Page 2 bags KHÔNG trùng: Fossil Wallet ($48), Herschel Backpack ($80), TNF Borealis ($99) | | |
| | 3 | `cheaper bags` | Bags giá thấp: H&M Card Holder ($12), H&M Canvas Tote ($15), Zara Satin Clutch ($35) | | |
| | 4 | `luxury bags only` | Coach Willow ($295), Coach Tabby ($250), Michael Kors Jet Set ($228), Samsonite Freeform ($189) | | |
| | 5 | `compare Coach vs Michael Kors` | Comparison: Coach Willow ($295, ★4.8) vs MK Jet Set ($228, ★4.6) | | |

### C5. Flow: Đổi chủ đề liên tục 5 lần

| TC | Bước | Input | Kết quả dự đoán | Kết quả | Ghi chú |
|----|------|-------|------------------|---------|---------|
| TC-30 | 1 | `show me shirts` | ≥3 shirts/t-shirts clothing: Uniqlo Oxford ($40), H&M Linen ($28), H&M Denim ($32), Zara Satin Blouse ($55) | | |
| | 2 | `now headphones` | **Đổi 1.** Headphones: JBL Tune ($49), Sony WH-1000XM5 ($349), Samsung Buds2 Pro ($199). NO shirts | | |
| | 3 | `show me watches` | **Đổi 2.** Watches: Casio F-91W ($18), G-Shock ($99), Timex ($65). NO headphones | | |
| | 4 | `sunglasses please` | **Đổi 3.** Sunglasses: H&M Cat-Eye ($12), Ray-Ban Wayfarer ($171), Ray-Ban Aviator ($161), Oakley ($188). NO watches | | |
| | 5 | `give me running shoes` | **Đổi 4.** Running shoes: Nike Revolution 6 ($45), Nike Vaporfly ($260), Adidas Ultraboost ($190), NB Fresh Foam 1080 ($165). NO sunglasses | | |
| | 6 | `compare them` | Comparison running shoes step 5 ONLY. KHÔNG lẫn sản phẩm từ step 1-4 | | |

### C6. Flow: Clarification → Selection → Deeper

| TC | Bước | Input | Kết quả dự đoán | Kết quả | Ghi chú |
|----|------|-------|------------------|---------|---------|
| TC-31 | 1 | `nike` | Clarification hoặc mixed Nike products (14 SP cross-category) | | |
| | 2 | 🔄 Click `Shoes` hoặc type `shoes` | Nike shoes only: Air Max 90, Vaporfly, White Running, Revolution 6 Kids | | |
| | 3 | `something cheaper` | Nike shoes giá thấp: Revolution 6 Kids ($45), White Running ($125) | | |
| | 4 | `compare Nike Revolution vs Adidas Ultraboost` | Comparison: Revolution Kids ($45, ★4.5, sold:380) vs Ultraboost ($190, ★4.7, sold:290). Khác segment | | |

### C7. Flow: Electronics deep dive

| TC | Bước | Input | Kết quả dự đoán | Kết quả | Ghi chú |
|----|------|-------|------------------|---------|---------|
| TC-32 | 1 | `show me tablets` | ≥3 tablets: iPad Pro M2 ($799, ★4.8), iPad Air M1 ($599, ★4.7), Galaxy Tab S9 ($799, ★4.6), Galaxy Tab S9 FE ($449, ★4.3), Lenovo Tab P12 ($599, ★4.2) | | |
| | 2 | `compare them` | Comparison ≥3 tablets. Verdict: iPad Pro best rating, Tab S9 FE cheapest | | |
| | 3 | `which one is cheapest?` | Trả lời: Samsung Galaxy Tab S9 FE ($449). Context maintained | | |
| | 4 | `cheaper tablets` | Galaxy Tab S9 FE ($449), Lenovo Tab P12 ($599), iPad Air ($599) — exclude expensive | | |

### C8. Flow: Price negotiation

| TC | Bước | Input | Kết quả dự đoán | Kết quả | Ghi chú |
|----|------|-------|------------------|---------|---------|
| TC-33 | 1 | `show me sneakers` | ≥3 sneakers: Converse Chuck ($55, sold:890), Adidas Stan Smith ($95, sold:520), Nike Air Max 90 ($130, sold:340), Puma Suede ($70, sold:210), NB 574 ($85, sold:280) | | |
| | 2 | `something under $80` | Converse Chuck ($55), Puma Suede ($70), NB 574 ($85 — borderline). Prices ≤$80~85 | | |
| | 3 | `even cheaper` | Converse Chuck ($55), Adidas Slides ($35). Tier rẻ hơn | | |
| | 4 | `compare Converse vs Puma` | Comparison: Converse ($55, ★4.5, sold:890) vs Puma ($70, ★4.3, sold:210). Converse thắng cả sales + giá | | |

### C9. Flow: Gender-specific

| TC | Bước | Input | Kết quả dự đoán | Kết quả | Ghi chú |
|----|------|-------|------------------|---------|---------|
| TC-34 | 1 | `women's shoes` | ≥2 women's shoes: Adidas Ultraboost Women ($190), NB 574 Women ($85), Zara Stiletto ($75) | | |
| | 2 | `show me men's shoes too` | Men's shoes: Puma Suede ($70), Clarks Oxford ($85), H&M Loafers ($40), Nike Air Max 90 ($130) | | |
| | 3 | `compare them` | Comparison men's shoes vừa shown | | |

### C10. Flow: Quick reply chain

| TC | Bước | Input | Kết quả dự đoán | Kết quả | Ghi chú |
|----|------|-------|------------------|---------|---------|
| TC-35 | 1 | `show me backpacks` | Nike Brasilia ($40), Herschel ($80), TNF Borealis ($99), Samsonite Urban-Eye ($89), Nike Hoops ($70) | | |
| | 2 | 🔄 `Compare them` | Comparison ≥3 backpacks | | |
| | 3 | 🔄 `Show me more` | Thêm bags khác. Pagination hoạt động | | |
| | 4 | 🔄 `Filter by price` | Hệ thống hỏi range hoặc show options | | |

---

## 📋 PHẦN D: EDGE CASES & ERROR HANDLING (TC-36 → TC-45)

### D1. Input bất thường

| TC | Input | Kết quả dự đoán | Kết quả | Ghi chú |
|----|-------|------------------|---------|---------|
| TC-36 | `@#$%^&*` | Không crash. Message hướng dẫn, success=true | | |
| TC-37 | `hi` | Greeting response. KHÔNG search sản phẩm. Intent: GREETING hoặc GENERAL | | |
| TC-38 | `compare` (không subject) | Message hướng dẫn: gợi ý ví dụ comparison | | |
| TC-39 | `compare them` (chưa search gì) | Thất bại đúng: "I don't have any products to compare yet" | | |
| TC-40 | `show me unicorn laptops` | Fallback: hiển thị laptops hoặc "I couldn't find unicorn..." | | |

### D2. Comparison edge cases

| TC | Input | Kết quả dự đoán | Kết quả | Ghi chú |
|----|-------|------------------|---------|---------|
| TC-41 | `compare Nike vs` (bỏ dở) | Extract 1 subject "Nike". Hệ thống hỏi thêm hoặc hiển thị Nike products | | |
| TC-42 | `A vs B vs C vs D vs E vs F` (6 fake) | Max 5 subjects. Subject 6 bị bỏ qua. Không crash, success=true | | |
| TC-43 | `compare Nike Air Max ($130) vs FakeProduct XYZ` | Tìm Air Max OK nhưng không tìm "FakeProduct XYZ". Partial result hoặc fallback | | |

### D3. Conversation persistence

| TC | Bước | Input | Kết quả dự đoán | Kết quả | Ghi chú |
|----|------|-------|------------------|---------|---------|
| TC-44 | 1 | `show me watches` | ≥3 watches hiển thị | | |
| | 2 | *Đóng chatbox → Mở lại* | Lịch sử vẫn còn (localStorage) | | |
| | 3 | `compare them` | Comparison watches từ step 1 OK (context restored) | | |
| TC-45 | 1 | *Nhấn nút Reset (🔄)* | Welcome message fresh. Không còn context cũ | | |
| | 2 | `compare them` | Thất bại đúng: "no products to compare" | | |

---

## 📋 PHẦN E: MULTI-TURN STRESS TEST (TC-46 → TC-50)

> ⚠️ Mỗi TC gồm **8-10 bước** trong cùng 1 conversation.

### E1. Full journey: Browse → Compare → Change topic

| TC | Bước | Input | Kết quả dự đoán | Kết quả |
|----|------|-------|------------------|---------|
| TC-46 | 1 | `show me phones` | ≥3 phones: iPhone 15 Pro Max ($1199), Galaxy S24 Ultra ($1199), iPhone 15 ($799), Galaxy S24 ($799), Sony Xperia 1 V ($1099) | |
| | 2 | `compare them` | Comparison ≥3 phones | |
| | 3 | `show me shoes` | **Đổi chủ đề.** Shoes. KHÔNG dính phones | |
| | 4 | `compare them` | Comparison shoes. KHÔNG dính phones | |
| | 5 | `cheaper shoes` | Adidas Slides ($35), H&M Loafers ($40), Nike Revolution Kids ($45), Converse ($55) | |
| | 6 | `Nike Air Max vs Adidas Stan Smith vs Converse Chuck` | Comparison 3 sneakers cụ thể | |
| | 7 | `back to phones, show me Samsung only` | Galaxy S24 Ultra ($1199), Galaxy S24 ($799), Galaxy Z Flip5 ($999) | |
| | 8 | `compare Samsung Galaxy S24 Ultra vs iPhone 15 Pro Max` | Head-to-head 2 flagship phones | |

### E2. Rapid topic switching — 10 topics

| TC | Bước | Input | Kết quả dự đoán | Kết quả |
|----|------|-------|------------------|---------|
| TC-47 | 1 | `laptops` | ≥3 laptops | |
| | 2 | `watches` | ≥3 watches — NO laptops | |
| | 3 | `bags` | ≥3 bags — NO watches | |
| | 4 | `headphones` | ≥3 headphones — NO bags | |
| | 5 | `sunglasses` | Sunglasses: Ray-Ban, Oakley, H&M — NO headphones | |
| | 6 | `sneakers` | Sneakers: Air Max, Stan Smith, Converse — NO sunglasses | |
| | 7 | `jewelry` | Pandora Bracelet, Swarovski Necklace, Pandora Pendant — NO sneakers | |
| | 8 | `belts` | H&M Belt ($12), Tommy Belt ($48), Coach Belt ($128) — NO jewelry | |
| | 9 | `compare them` | Comparison belts step 8 ONLY | |
| | 10 | `tablets` | Tablets: iPad Pro, iPad Air, Galaxy Tab — NO belts | |

### E3. Deep comparison chain

| TC | Bước | Input | Kết quả dự đoán | Kết quả |
|----|------|-------|------------------|---------|
| TC-48 | 1 | `Sony WH-1000XM5 vs AirPods Max` | Comparison 2 premium headphones | |
| | 2 | `what about Galaxy Buds?` | Samsung Galaxy Buds2 Pro ($199) — info hoặc so sánh | |
| | 3 | `compare all three: Sony vs AirPods vs Samsung Buds` | Comparison 3 headphones | |
| | 4 | `which has the best rating?` | Sony WH-1000XM5 (★4.8) > Apple AirPods Max (★4.6) = Samsung Buds2 Pro (★4.4) | |
| | 5 | `show me cheaper alternatives` | JBL Tune 520BT ($49), HyperX Cloud III ($99), Samsung Galaxy Buds FE ($99) | |

### E4. Mixed comparison + search

| TC | Bước | Input | Kết quả dự đoán | Kết quả |
|----|------|-------|------------------|---------|
| TC-49 | 1 | `Casio F-91W vs G-Shock vs Seiko Presage vs Timex Weekender` | Comparison **4 watches** | |
| | 2 | `show me more watches` | Watches khác: DW Classic ($149), Casio A168WA ($28) — KHÔNG trùng | |
| | 3 | `compare DW vs Seiko` | Comparison: DW Classic ($149, ★4.5, sold:320) vs Seiko Presage ($425, ★4.9, sold:75) | |

### E5. Brand loyalty flow

| TC | Bước | Input | Kết quả dự đoán | Kết quả |
|----|------|-------|------------------|---------|
| TC-50 | 1 | `show me all Nike products` | Mix Nike: shoes + clothing + bags + accessories (14 SP) | |
| | 2 | `compare the shoes` | Comparison Nike shoes: Air Max, Vaporfly, Revolution 6, White Running | |
| | 3 | `now show me Adidas` | Adidas products: Stan Smith, Ultraboost, Slides, Track Pants, Polo, etc. (10 SP) | |
| | 4 | `compare Nike Air Max vs Adidas Stan Smith` | Head-to-head: Air Max ($130, ★4.7, sold:340) vs Stan Smith ($95, ★4.6, sold:520) | |
| | 5 | `which brand has more products?` | Nike: 14 products, Adidas: 10 products. Trả lời dựa context | |

---

## ✅ Tổng Kết

| Phần | Số TC | Focus |
|------|-------|-------|
| A. Single-turn | 15 | Tìm kiếm cơ bản, brand, giá, fuzzy match, cross-category |
| B. Comparison | 10 | So sánh 2/3/4 SP, compare them, patterns: vs/or/difference |
| C. Multi-turn Flow | 10 | Đổi chủ đề liên tục, pagination, context management |
| D. Edge Cases | 10 | Input bất thường, comparison edge, persistence |
| E. Stress Test | 5 | 8-10 bước/conversation, rapid switching, deep chains |
| **Tổng** | **50** | |

---

## 📝 Kết Luận Kiểm Thử (Cập nhật - Delay 4s)

| Chỉ số | Giá trị |
|--------|---------|
| Tổng TC | 50 |
| 🟢 PASS | 40 / 50 |
| 🟡 PARTIAL | 9 / 50 |
| 🔴 FAIL | 1 / 50 |
| Tỷ lệ pass | 80.0% |

> ⚠️ **Chú ý:** Lỗi `fetch failed` đã giảm thiểu gần hết sau khi tăng delay. Trường hợp FAIL duy nhất (TC-49) vẫn là do Rate Limit/Timeout của API cung cấp LLM. Các lỗi PARTIAL chủ yếu do AI filter quá khắt khe, dẫn đến việc không có sản phẩm nào khớp hoàn toàn với một số yêu cầu như "Cheaper alternatives" trong khi ngữ cảnh đã thay đổi rẽ nhánh quá hẹp.

### 📋 Chi tiết kết quả từng testcase

**Phần A: Single-turn (13 PASS, 2 PARTIAL, 0 FAIL)**
- `PASS`: TC-01 đến TC-08, TC-10 đến TC-13, TC-15 (Nhận diện đúng danh mục, thương hiệu, giá, tìm kiếm chéo).
- `PARTIAL`: **TC-09** (Nhận diện typo "addidas" -> "adidas" nhưng chỉ trả 1 kết quả), **TC-14** (Hỏi "gift for her" mong đợi trả đa dạng categories nhưng AI chỉ trả về một category duy nhất).

**Phần B: Comparison (10 PASS, 0 PARTIAL, 0 FAIL)**
- `PASS` tuyệt đối: TC-16 đến TC-25 (So sánh 2-4 sản phẩm cực kì xuất sắc, tính năng Verdict hoạt động tốt, không có sai sót logic).

**Phần C: Multi-turn Flow (6 PASS, 4 PARTIAL, 0 FAIL)**
- `PASS`: TC-26, TC-28, TC-29, TC-30, TC-34, TC-35 (Nhớ cực kì tốt ngữ cảnh dài ở bước sau mà không trộn lẫn nhầm lẫn với chủ đề laptop/shirt/jewelry của câu hỏi trước).
- `PARTIAL`: **TC-27** (Bước hỏi đồng hồ mong 2 kết quả, nhưng chỉ nhận 1), **TC-31** (Hỏi "something cheaper" sau luồng headphone đắt -> Không tìm ra kết quả thỏa mãn), **TC-32** (Hỏi "cheaper tablets" -> Không ra kết quả), **TC-33** (Đang tìm giày, về sau đổi chủ đề Converse vs Puma -> 0 kết quả).

**Phần D: Edge Cases (10 PASS, 0 PARTIAL, 0 FAIL)**
- `PASS` tuyệt đối: TC-36 đến TC-45 (Xử lý mượt các chuỗi rác, lời chào không có sản phẩm, comparison thiếu chủ ngữ, max output của compare...).

**Phần E: Stress Test (1 PASS, 3 PARTIAL, 1 FAIL)**
- `PASS`: TC-50.
- `PARTIAL`: **TC-46**, **TC-47** (Fail ở việc trả 0 kết quả khi nhảy liên tục 5-8 chủ đề khác nhau, đặc biệt cạn kiệt data khi filter kính râm), **TC-48** (Hỏi "cheaper alternatives" ở cuối chuỗi -> không có kết quả phù hợp).
- `FAIL`: **TC-49** (Lỗi `fetch failed` rớt kết nối LLM API do server từ chối sau thời gian thực thi dài).
**Người kiểm thử:** Antigravity AI  
**Ngày hoàn thành:** 23/03/2026  
**Chữ ký:** *[Auto-generated via Test Runner]*
