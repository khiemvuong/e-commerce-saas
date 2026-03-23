/**
 * PHẦN A: SINGLE-TURN TEST (TC-01 → TC-15) — v2.0 Data-verified
 * 
 * Verified against 140 active products from Prisma extraction (23/03/2026).
 * Run: npx ts-node --transpile-only src/__tests__/test-tc-a-single-turn.ts
 */

import {
  startChat, sendMessage, delay,
  hasMinRecs, hasProduct, hasBrand, allInCategory, hasFallbackCorrection,
  pricesUnder, intentIs, isSuccess, hasQuickReply,
  aggregateVerdict, printTC, printSummary,
  TCResult, CheckResult, c, log,
} from './test-helpers';

// ── Helper ──
async function singleTurn(
  id: string, input: string, assertions: (data: any) => CheckResult[],
): Promise<TCResult> {
  try {
    const start = await startChat();
    if (!start?.success) return { id, verdict: 'FAIL', checks: [], error: 'Failed to start chat' };
    const convId = start.data.conversationId;
    const res = await sendMessage(convId, input);
    if (!res?.success) return { id, verdict: 'FAIL', checks: [], error: `API error: ${res?.error}` };
    const checks = [isSuccess(res), ...assertions(res.data)];
    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
async function runSectionA() {
  log(c.cyan, '\n' + '═'.repeat(60));
  log(c.bold, '📋 PHẦN A: SINGLE-TURN TEST (TC-01 → TC-15)');
  log(c.cyan, '═'.repeat(60));

  const results: TCResult[] = [];

  // ── A1. Tìm kiếm cơ bản theo danh mục ──

  // TC-01: find me a watch → expect Casio F-91W ($18), Casio A168WA ($28), G-Shock ($99), etc.
  results.push(await singleTurn('TC-01', 'find me a watch', (d) => [
    hasMinRecs(d, 3),
    intentIs(d, 'SEARCH_PRODUCT'),
    hasProduct(d, 'casio'),
    hasProduct(d, 'f-91w'),
    // Verify at least one watch with correct price
    (() => {
      const recs: any[] = d.recommendations ?? [];
      const casio = recs.find((r: any) => r.title?.toLowerCase().includes('f-91w'));
      if (casio && casio.price === 18) return { label: 'Casio F-91W price correct ($18)', verdict: 'PASS' as const };
      if (casio) return { label: `Casio F-91W price: $${casio.price} (expected $18)`, verdict: 'PARTIAL' as const };
      return { label: 'Casio F-91W not found for price check', verdict: 'PARTIAL' as const };
    })(),
  ]));
  await delay(500);

  // TC-02: budget laptops → expect Acer Chromebook ($199), HP Pavilion ($549)
  results.push(await singleTurn('TC-02', 'show me budget laptops', (d) => {
    const recs: any[] = d.recommendations ?? [];
    const hasLaptop = recs.some((r: any) => r.category?.toLowerCase() === 'electronics' && (r.subCategory?.toLowerCase().includes('laptop') || r.title?.toLowerCase().includes('laptop')));
    const cheapFirst = recs.length > 0 && recs[0]?.price <= 700;
    return [
      hasMinRecs(d, 2),
      intentIs(d, 'SEARCH_PRODUCT'),
      { label: hasLaptop ? 'Contains laptops' : 'No laptops in results', verdict: hasLaptop ? 'PASS' : 'FAIL' },
      { label: cheapFirst ? `Budget prioritized (first: $${recs[0]?.price})` : `First product not budget: $${recs[0]?.price}`, verdict: cheapFirst ? 'PASS' : 'PARTIAL' },
    ];
  }));
  await delay(500);

  // TC-03: women's dress → expect Uniqlo Wrap ($40), Zara Satin Midi ($89), Zara Sequin ($120)
  results.push(await singleTurn('TC-03', "women's dress", (d) => {
    const recs: any[] = d.recommendations ?? [];
    const hasDress = recs.some((r: any) => r.title?.toLowerCase().includes('dress') || r.subCategory?.toLowerCase().includes('dress'));
    const hasWomen = recs.some((r: any) => r.gender === 'women');
    return [
      hasMinRecs(d, 2),
      intentIs(d, 'SEARCH_PRODUCT'),
      { label: hasDress ? 'Contains dresses' : 'No dresses in results', verdict: hasDress ? 'PASS' : 'FAIL' },
      { label: hasWomen ? 'Women\'s products present' : 'No women\'s products', verdict: hasWomen ? 'PASS' : 'PARTIAL' },
    ];
  }));
  await delay(500);

  // TC-04: something for gym → cross-category (clothing + shoes + bags + accessories)
  results.push(await singleTurn('TC-04', 'something for gym', (d) => {
    const recs: any[] = d.recommendations ?? [];
    const categories = new Set(recs.map((r: any) => r.category?.toLowerCase()));
    const gymRelated = recs.filter((r: any) => {
      const tags = (r.tags || []).join(' ').toLowerCase();
      const title = (r.title || '').toLowerCase();
      return tags.includes('gym') || tags.includes('sport') || tags.includes('workout') ||
        tags.includes('running') || tags.includes('training') || tags.includes('athletic') ||
        title.includes('dri-fit') || title.includes('jogger') || title.includes('backpack');
    });
    return [
      hasMinRecs(d, 3),
      intentIs(d, 'SEARCH_PRODUCT'),
      { label: `${gymRelated.length}/${recs.length} gym-related items`, verdict: gymRelated.length >= 2 ? 'PASS' : 'PARTIAL' },
      { label: categories.size >= 2 ? `Cross-category (${[...categories].join(', ')})` : 'Single category', verdict: categories.size >= 2 ? 'PASS' : 'PARTIAL' },
    ];
  }));
  await delay(500);

  // TC-05: headphones → expect Sony WH-1000XM5 ($349), JBL Tune ($49), Samsung Buds2 Pro ($199)
  results.push(await singleTurn('TC-05', 'show me headphones', (d) => [
    hasMinRecs(d, 3),
    intentIs(d, 'SEARCH_PRODUCT'),
    hasProduct(d, 'sony'),
    // Expect at least JBL or Sony or Samsung headphones
    (() => {
      const recs: any[] = d.recommendations ?? [];
      const knownBrands = recs.filter((r: any) => ['sony', 'jbl', 'samsung', 'bose', 'apple', 'sennheiser', 'hyperx'].includes(r.brand?.toLowerCase()));
      return { label: `${knownBrands.length} headphone brands found`, verdict: knownBrands.length >= 2 ? 'PASS' : 'PARTIAL' };
    })(),
  ]));
  await delay(500);

  // ── A2. Tìm kiếm theo brand ──

  // TC-06: nike shoes → ALL Nike, ALL shoes (not clothing)
  results.push(await singleTurn('TC-06', 'nike shoes', (d) => {
    const recs: any[] = d.recommendations ?? [];
    const allNike = recs.every((r: any) => r.brand?.toLowerCase() === 'nike' || r.title?.toLowerCase().includes('nike'));
    const allShoes = recs.every((r: any) => r.category?.toLowerCase() === 'shoes' || r.title?.toLowerCase().includes('shoe') || r.title?.toLowerCase().includes('running'));
    const hasAirMax = recs.some((r: any) => r.title?.toLowerCase().includes('air max'));
    return [
      hasMinRecs(d, 2),
      hasBrand(d, 'nike'),
      { label: allNike ? 'All results are Nike' : 'Some non-Nike results', verdict: allNike ? 'PASS' : 'PARTIAL' },
      { label: allShoes ? 'All results are shoes' : 'Includes non-shoe items', verdict: allShoes ? 'PASS' : 'PARTIAL' },
      { label: hasAirMax ? 'Air Max 90 found ($130)' : 'Air Max 90 not found', verdict: hasAirMax ? 'PASS' : 'PARTIAL' },
    ];
  }));
  await delay(500);

  // TC-07: casio → expect F-91W ($18), A168WA ($28), G-Shock ($99)
  results.push(await singleTurn('TC-07', 'casio', (d) => [
    hasMinRecs(d, 2),
    hasBrand(d, 'casio'),
    hasProduct(d, 'f-91w'),
    intentIs(d, 'SEARCH_PRODUCT'),
    (() => {
      const recs: any[] = d.recommendations ?? [];
      const allCasio = recs.every((r: any) => r.brand?.toLowerCase() === 'casio');
      return { label: allCasio ? 'All results are Casio' : 'Mixed brands', verdict: allCasio ? 'PASS' : 'PARTIAL' };
    })(),
  ]));
  await delay(500);

  // TC-08: coach → expect Willow ($295), Tabby ($250), Belt ($128), Gloves ($128)
  results.push(await singleTurn('TC-08', 'coach', (d) => {
    const recs: any[] = d.recommendations ?? [];
    const subCategories = new Set(recs.map((r: any) => r.subCategory?.toLowerCase()));
    return [
      hasMinRecs(d, 2),
      hasBrand(d, 'coach'),
      intentIs(d, 'SEARCH_PRODUCT'),
      { label: subCategories.size >= 2 ? `Cross-subcategory: ${[...subCategories].join(', ')}` : 'Single subcategory', verdict: subCategories.size >= 2 ? 'PASS' : 'PARTIAL' },
    ];
  }));
  await delay(500);

  // ── A3. Fuzzy match / Typo correction ──

  // TC-09: addidas shoes (typo) → should correct to "adidas"
  results.push(await singleTurn('TC-09', 'addidas shoes', (d) => [
    hasMinRecs(d, 2),
    hasBrand(d, 'adidas'),
    hasFallbackCorrection(d),
    hasProduct(d, 'stan smith'),
  ]));
  await delay(500);

  // TC-10: samsng phone (typo) → should correct to "samsung"
  results.push(await singleTurn('TC-10', 'samsng phone', (d) => [
    hasMinRecs(d, 1),
    hasBrand(d, 'samsung'),
    hasFallbackCorrection(d),
    (() => {
      const recs: any[] = d.recommendations ?? [];
      const hasPhone = recs.some((r: any) => r.subCategory?.toLowerCase().includes('smartphone') || r.title?.toLowerCase().includes('galaxy'));
      return { label: hasPhone ? 'Samsung phone found' : 'No Samsung phones', verdict: hasPhone ? 'PASS' : 'PARTIAL' };
    })(),
  ]));
  await delay(500);

  // ── A4. Tìm kiếm theo giá ──

  // TC-11: cheap headphones → JBL Tune $49, HyperX $99, Galaxy Buds FE $99
  results.push(await singleTurn('TC-11', 'cheap headphones', (d) => {
    const recs: any[] = d.recommendations ?? [];
    const avgPrice = recs.length > 0 ? recs.reduce((s: number, r: any) => s + (r.price || 0), 0) / recs.length : 0;
    const hasBudget = recs.some((r: any) => r.price <= 100);
    return [
      hasMinRecs(d, 2),
      intentIs(d, 'SEARCH_PRODUCT'),
      { label: hasBudget ? `Budget headphones present (≤$100)` : 'No budget headphones', verdict: hasBudget ? 'PASS' : 'PARTIAL' },
      { label: `Average price: $${avgPrice.toFixed(0)}`, verdict: avgPrice <= 250 ? 'PASS' : 'PARTIAL' },
    ];
  }));
  await delay(500);

  // TC-12: premium laptop → expect MacBook Pro $1999, ThinkPad $1799, ASUS ROG $1799
  results.push(await singleTurn('TC-12', 'premium laptop', (d) => {
    const recs: any[] = d.recommendations ?? [];
    const hasExpensive = recs.some((r: any) => r.price >= 1000);
    const hasMacBook = recs.some((r: any) => r.title?.toLowerCase().includes('macbook'));
    return [
      hasMinRecs(d, 2),
      { label: hasExpensive ? 'Premium laptop found (≥$1000)' : 'No premium laptops', verdict: hasExpensive ? 'PASS' : 'PARTIAL' },
      { label: hasMacBook ? 'MacBook Pro present' : 'MacBook Pro not found', verdict: hasMacBook ? 'PASS' : 'PARTIAL' },
    ];
  }));
  await delay(500);

  // TC-13: luxury bags → Coach Willow $295, Coach Tabby $250, MK Jet Set $228
  results.push(await singleTurn('TC-13', 'luxury bags', (d) => {
    const recs: any[] = d.recommendations ?? [];
    const luxuryBrands = recs.filter((r: any) => ['coach', 'michael kors', 'samsonite'].includes(r.brand?.toLowerCase()));
    return [
      hasMinRecs(d, 2),
      { label: luxuryBrands.length >= 1 ? `${luxuryBrands.length} luxury brands found` : 'No luxury bag brands', verdict: luxuryBrands.length >= 1 ? 'PASS' : 'PARTIAL' },
      allInCategory(d, 'bag'),
    ];
  }));
  await delay(500);

  // ── A5. Cross-category intelligence ──

  // TC-14: gift for her → mix ≥2 categories (accessories + clothing + shoes)
  results.push(await singleTurn('TC-14', 'gift for her', (d) => {
    const recs: any[] = d.recommendations ?? [];
    const categories = new Set(recs.map((r: any) => r.category?.toLowerCase()));
    const hasWomen = recs.some((r: any) => r.gender === 'women');
    return [
      hasMinRecs(d, 3),
      { label: categories.size >= 2 ? `Multi-category (${[...categories].join(', ')})` : 'Single category', verdict: categories.size >= 2 ? 'PASS' : 'PARTIAL' },
      { label: hasWomen ? 'Women\'s items present' : 'No women-specific items', verdict: hasWomen ? 'PASS' : 'PARTIAL' },
    ];
  }));
  await delay(500);

  // TC-15: office outfit → cross-category work items
  results.push(await singleTurn('TC-15', 'office outfit', (d) => {
    const recs: any[] = d.recommendations ?? [];
    const officeRelated = recs.filter((r: any) => {
      const tags = (r.tags || []).join(' ').toLowerCase();
      const title = (r.title || '').toLowerCase();
      return tags.includes('office') || tags.includes('formal') || tags.includes('work') ||
        title.includes('oxford') || title.includes('chino') || title.includes('shirt') || title.includes('tie') || title.includes('blouse');
    });
    return [
      hasMinRecs(d, 3),
      intentIs(d, 'SEARCH_PRODUCT'),
      { label: `${officeRelated.length}/${recs.length} office-related items`, verdict: officeRelated.length >= 2 ? 'PASS' : 'PARTIAL' },
    ];
  }));

  // ── Print results ──
  for (const r of results) printTC(r);
  printSummary('PHẦN A: SINGLE-TURN (TC-01 → TC-15)', results);
  return results;
}

// ── Entry Point ──
(async () => {
  try {
    const results = await runSectionA();
    process.exit(results.some(r => r.verdict === 'FAIL') ? 1 : 0);
  } catch (err) {
    log(c.red, `\n⚠ Fatal error: ${err}`);
    process.exit(1);
  }
})();
