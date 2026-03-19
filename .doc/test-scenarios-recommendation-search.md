# 🧪 AI Recommendation & Search — Test Scenarios

> Tài liệu test toàn diện cho hệ thống recommendation, search, comparison.
> Dựa trên **160+ sản phẩm** seeded qua 5 scripts.

---

## 📦 Inventory Overview

| Script                                  | Category               | Products | Shop                   |
| --------------------------------------- | ---------------------- | -------- | ---------------------- |
| `seed-products-chatbox.js`              | Clothing (base)        | 20       | Fashion (vuongkhiem56) |
| `seed-products-electronics.js`          | Electronics (base)     | 20       | Electronics (khiemyy)  |
| `seed-products-clothing-extended.js`    | Clothing (extended)    | 30       | Fashion (vuongkhiem56) |
| `seed-products-electronics-extended.js` | Electronics (extended) | 30       | Electronics (khiemyy)  |
| `seed-products-bags-shoes.js`           | Bags & Shoes           | 30       | Fashion (vuongkhiem56) |
| `seed-products-accessories.js`          | Accessories            | 30       | Accessories Hub (new)  |
| **Total**                               |                        | **160**  | **3 shops**            |

---

## 🔍 1. Command Palette Search Scenarios

### 1.1 Exact Keyword Match

| #   | Query      | Expected Top Results                       | Verify                        |
| --- | ---------- | ------------------------------------------ | ----------------------------- |
| 1   | `shirt`    | Nike Dri-FIT, Adidas Polo, Zara Striped... | Clothing > Shirts prioritized |
| 2   | `laptop`   | MacBook Pro, Dell XPS, ASUS ROG...         | Electronics > Laptops         |
| 3   | `watch`    | Casio F-91W, G-Shock, Apple Watch...       | Accessories > Watches         |
| 4   | `backpack` | Nike Brasilia, Samsonite, TNF Borealis     | Bags > Backpacks              |

### 1.2 Brand Search

| #   | Query     | Expected                            | Verify                      |
| --- | --------- | ----------------------------------- | --------------------------- |
| 5   | `nike`    | All Nike products across categories | Cross-category results      |
| 6   | `casio`   | F-91W, G-Shock, A168WA              | Same brand, different tiers |
| 7   | `ray-ban` | Aviator, Wayfarer                   | Only sunglasses             |
| 8   | `coach`   | Shoulder Bag, Clutch, Belt, Gloves  | Cross-subcategory           |

### 1.3 Did-You-Mean (Typo Correction)

| #   | Query     | Expected `didYouMean` | Verify                             |
| --- | --------- | --------------------- | ---------------------------------- |
| 9   | `nikee`   | `nike`                | Inline banner appears while typing |
| 10  | `adiddas` | `adidas`              | Click corrects search query        |
| 11  | `iphon`   | `iphone`              | Works for electronics              |
| 12  | `shrt`    | `shirt`               | Handles vowel omission             |
| 13  | `samsng`  | `samsung`             | Partial match                      |

### 1.4 Category-Specific Search (Disambiguation)

| #   | Query     | Should Prioritize                    | NOT Prioritize               |
| --- | --------- | ------------------------------------ | ---------------------------- |
| 14  | `phone`   | Smartphones (iPhone, Galaxy S24...)  | Headphones (Sony WH-1000XM5) |
| 15  | `running` | Running Shoes (Vaporfly, Ultraboost) | Running jacket (secondary)   |
| 16  | `black`   | Too many — should show diverse mix   | Not just one category        |
| 17  | `pro`     | MacBook Pro, iPhone Pro, iPad Pro... | Mixed electronics            |

### 1.5 Price Display

| #   | Query   | Verify                                       |
| --- | ------- | -------------------------------------------- |
| 18  | `casio` | F-91W shows **$18**, G-Shock shows **$99**   |
| 19  | `h&m`   | Basic Tee shows **$12**, Belt shows **$12**  |
| 20  | `coach` | Clutch shows **$250**, Gloves shows **$128** |

---

## 🤖 2. AI Chatbox Recommendation Scenarios

### 2.1 Basic Product Discovery

| #   | Prompt                   | Expected Behavior                                  |
| --- | ------------------------ | -------------------------------------------------- |
| 21  | "find me a watch"        | Show diverse watches: Casio → Seiko range          |
| 22  | "show me budget laptops" | Acer Chromebook ($199), HP Pavilion ($549)         |
| 23  | "women's dress"          | Zara Satin Midi, Uniqlo Wrap, Zara Sequin          |
| 24  | "something for gym"      | Nike Pro Tee, Sports Bra, Joggers, Training Shorts |

### 2.2 Price-Segment Recommendations

| #   | Prompt               | Expected                                      |
| --- | -------------------- | --------------------------------------------- |
| 25  | "cheap headphones"   | JBL Tune 520BT ($49), Galaxy Buds FE ($99)    |
| 26  | "premium headphones" | Bose QC Ultra ($429), Sony WH-1000XM5 ($349)  |
| 27  | "luxury bags"        | Coach Willow ($295), Michael Kors Tote ($228) |
| 28  | "affordable shoes"   | Converse Chuck ($55), Puma Suede ($70)        |

### 2.3 Cross-Category Intelligence

| #   | Prompt              | Expected                                         |
| --- | ------------------- | ------------------------------------------------ |
| 29  | "gift for her"      | Pandora Bracelet, Swarovski Necklace, Zara Dress |
| 30  | "travel essentials" | Samsonite Luggage, TNF Backpack, Nike Slides     |
| 31  | "office outfit"     | Uniqlo Oxford, Clarks Oxford, Tommy Tie          |

---

## ⚖️ 3. Product Comparison Scenarios

### 3.1 Same Brand, Different Tier

| #   | Compare                                                      | Key Differences                 |
| --- | ------------------------------------------------------------ | ------------------------------- |
| 32  | Casio F-91W ($18) vs G-Shock ($99) vs Seiko Presage ($425)   | Budget → mid → premium watch    |
| 33  | H&M Basic Tee ($12) vs Uniqlo Supima ($25) vs Nike Pro ($45) | 3-tier t-shirt comparison       |
| 34  | JBL Tune 520BT ($49) vs Bose QC Ultra ($429)                 | 9x price gap, 1500 vs 280 sales |
| 35  | Xiaomi Mi Band ($35) vs Garmin Forerunner ($449)             | Fitness tracker budget vs pro   |

### 3.2 Same Category, Different Brand

| #   | Compare                                                                | Key Insight                  |
| --- | ---------------------------------------------------------------------- | ---------------------------- |
| 36  | Nike Air Max ($130) vs Adidas Stan Smith ($95) vs Converse Chuck ($55) | Sneaker tier comparison      |
| 37  | iPhone SE ($429) vs Pixel 7a ($449) vs Redmi Note 13 Pro ($299)        | Budget smartphone shootout   |
| 38  | MacBook Pro ($1999) vs Dell XPS ($1499) vs ThinkPad X1 ($1799)         | Laptop specs head-to-head    |
| 39  | Ray-Ban Aviator ($161) vs Oakley Radar ($188) vs H&M Cat-Eye ($12)     | Sunglasses budget to premium |

### 3.3 Cross-Category "compare them"

| #   | Prompt Flow                       | Expected                          |
| --- | --------------------------------- | --------------------------------- |
| 40  | Search "nike" → "compare them"    | Compare all shown Nike products   |
| 41  | Search "running" → "compare them" | Vaporfly vs Ultraboost vs NB 1080 |
| 42  | Search "casio" → "compare them"   | All 3 Casio watches side by side  |

### 3.4 High Volume vs High Rating

| #   | Products            | Sales | Rating | Test                   |
| --- | ------------------- | ----- | ------ | ---------------------- |
| 43  | H&M Card Holder     | 1100  | 3.7★   | High sales, low rating |
| 44  | Coach Tabby Clutch  | 28    | 4.9★   | Low sales, top rating  |
| 45  | Uniqlo Puffer       | 820   | 4.7★   | Both high              |
| 46  | Zara Leather Jacket | 35    | 4.9★   | Niche premium          |
| 47  | Echo Dot            | 3200  | 4.3★   | Mass market champion   |
| 48  | Sonos Era 300       | 55    | 4.7★   | Premium niche          |

> **Verify:** Recommendation engine should balance recency-weighted sales + rating, not just one metric.

---

## 🔄 4. Sequential Search Behavior (Search Intent Tracking)

### 4.1 User Journey Simulation

Test that search-intent tracking influences future recommendations:

| Step | Action                        | Expected Effect                                           |
| ---- | ----------------------------- | --------------------------------------------------------- |
| 1    | Search "running shoes"        | Intent tracked: running, shoes                            |
| 2    | Search "marathon"             | Intent tracked: marathon                                  |
| 3    | Open AI Chatbox → "recommend" | Should prioritize running products (Vaporfly, Ultraboost) |
| 4    | Search "headphones"           | New intent tracked                                        |
| 5    | Open AI Chatbox → "recommend" | Mix of running + headphones                               |

### 4.2 Continuous Search (Debounce Test)

| Step | Type in Command Palette                             | Expected                                                 |
| ---- | --------------------------------------------------- | -------------------------------------------------------- |
| 6    | `s` → `sh` → `shi` → `shir` → `shirt`               | Only fires API at debounce intervals, final shows shirts |
| 7    | `n-i-k-e` quickly                                   | Single API call after 300ms pause                        |
| 8    | `iphon` → pause → shows didYouMean → click "iphone" | Corrected search auto-fires                              |

### 4.3 Empty State → AI Recommendations

| Step | Action                             | Expected                                     |
| ---- | ---------------------------------- | -------------------------------------------- |
| 9    | Open Command Palette (empty query) | AI recommendations based on browsing history |
| 10   | After searching "watch" + "casio"  | Future empty state should show watch-related |

---

## 🏪 5. Multi-Shop Scenarios

| #   | Scenario                                                          | Verify                           |
| --- | ----------------------------------------------------------------- | -------------------------------- |
| 49  | Search "black"                                                    | Products from all 3 shops appear |
| 50  | Compare Nike Tee (Fashion shop) vs Apple Watch (Electronics shop) | Cross-shop comparison works      |
| 51  | Browse Accessories Hub products                                   | New shop appears in storefront   |

---

## 📊 6. Recommendation Scoring Verification

### 6.1 Popularity vs Quality Matrix

```
             High Sales
                │
    ┌───────────┼───────────┐
    │ Echo Dot  │ Uniqlo    │
    │ $49       │ Puffer    │
    │ 3200 sales│ $60       │
    │ 4.3★      │ 820 sales │
    │           │ 4.7★      │
Low ├───────────┼───────────┤ High
Rating│ H&M Card│ Seiko     │ Rating
    │ Holder   │ Presage   │
    │ $12      │ $425      │
    │ 1100 sale│ 75 sales  │
    │ 3.7★     │ 4.9★      │
    └───────────┼───────────┘
                │
            Low Sales
```

### 6.2 Expected Ranking Behavior

| Query             | Should Rank Higher            | Because                                             |
| ----------------- | ----------------------------- | --------------------------------------------------- |
| "budget watch"    | Casio F-91W > Timex Weekender | More sales (2500 vs 410), similar price             |
| "best headphones" | Sony WH-1000XM5 > JBL Tune    | Higher rating (4.8 vs 4.0), despite fewer sales     |
| "premium laptop"  | MacBook Pro > ThinkPad X1     | Higher rating (4.9 vs 4.7), more sales (320 vs 155) |
| "kids shoes"      | Nike Revolution 6             | Only kids running shoe                              |

---

## 🐛 7. Edge Cases & Error Handling

| #   | Scenario                            | Expected                       |
| --- | ----------------------------------- | ------------------------------ |
| 52  | Search empty string                 | Show AI recommendations        |
| 53  | Search special chars `@#$%`         | No crash, empty results        |
| 54  | Search very long query (100+ chars) | Graceful truncation            |
| 55  | Search single letter `a`            | Debounce prevents API spam     |
| 56  | Rapid Ctrl+K open/close             | No memory leak, clean state    |
| 57  | Search product that was deleted     | Not shown (isDeleted filter)   |
| 58  | Compare 1 product only              | Meaningful single-product view |
| 59  | "compare them" with 0 results       | Friendly error message         |

---

## ✅ Quick Smoke Test Checklist

```
Pre-requisites:
[ ] All 5 seed scripts executed successfully
[ ] npm run dev running (all services)
[ ] npm run user-ui running

Command Palette:
[ ] Ctrl+K opens palette
[ ] Type "shirt" → products with prices appear
[ ] Type "nikee" → "Did you mean: nike?" appears inline
[ ] Click didYouMean → search corrects
[ ] Click product → navigates to product page
[ ] ESC closes palette

AI Chatbox:
[ ] "find me shoes" → shows shoes
[ ] "compare nike and adidas" → comparison table
[ ] "cheap watches" → budget watches first
[ ] "compare them" after search → compares all shown

Product Detail Page:
[ ] Page loads in <1s (single API call via React cache)
[ ] SEO title correct (no "|| 'Ilan E-commerce'" in tab)
[ ] "You may also like" loads lazily
```
