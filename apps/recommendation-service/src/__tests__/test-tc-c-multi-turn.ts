/**
 * PHẦN C: MULTI-TURN FLOW — KHÔNG RESET (TC-26 → TC-35) — v2.0 Data-verified
 * 
 * Verified products: MacBook Pro ($1999), Dell XPS ($1499), ThinkPad ($1799),
 * Casio F-91W ($18), Seiko Presage ($425), Air Max 90 ($130), Stan Smith ($95)
 * Run: npx ts-node --transpile-only src/__tests__/test-tc-c-multi-turn.ts
 */

import {
  startChat, sendMessage, delay,
  hasMinRecs, hasProduct, hasBrand, allInCategory, noneContain,
  hasComparison, hasVerdict, noOverlap, pricesUnder,
  intentIs, isSuccess, hasClarification,
  aggregateVerdict, printTC, printSummary,
  TCResult, CheckResult, c, log,
} from './test-helpers';

/** Rate-limit safe multi-message sender */
async function multiStep(
  convId: string,
  message: string,
  delayMs = 2200,
): Promise<any> {
  await delay(delayMs);
  return sendMessage(convId, message);
}

// ────────────────────────────────────────────────────────────
// TC-26: Tìm kiếm → So sánh → Rẻ hơn → Đổi chủ đề
// ────────────────────────────────────────────────────────────
async function tc26(): Promise<TCResult> {
  const id = 'TC-26';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    // Step 1: show me laptops → expect MacBook, Dell XPS, ThinkPad, etc.
    const s1 = await sendMessage(conversationId, 'show me laptops');
    checks.push(isSuccess(s1), hasMinRecs(s1.data, 3));
    const recs1 = s1.data?.recommendations ?? [];
    const hasLaptop = recs1.some((r: any) => r.title?.toLowerCase().includes('macbook') || r.title?.toLowerCase().includes('xps') || r.title?.toLowerCase().includes('thinkpad'));
    checks.push({ label: hasLaptop ? 'Known laptops found' : 'No known laptops', verdict: hasLaptop ? 'PASS' : 'PARTIAL' });

    // Step 2: Compare them → comparison of ≥2 laptops
    const s2 = await multiStep(conversationId, 'compare them');
    checks.push(isSuccess(s2), hasComparison(s2.data, 2));

    // Step 3: show me cheaper ones → expect Acer ($199), HP Pavilion ($549), ASUS ($649)
    const s3 = await multiStep(conversationId, 'show me cheaper ones');
    checks.push(isSuccess(s3), hasMinRecs(s3.data, 1));
    const recs3 = s3.data?.recommendations ?? [];
    const avgPrice3 = recs3.length > 0 ? recs3.reduce((s: number, r: any) => s + (r.price || 0), 0) / recs3.length : 0;
    checks.push({ label: `Cheaper tier avg: $${avgPrice3.toFixed(0)}`, verdict: avgPrice3 < 1200 ? 'PASS' : 'PARTIAL' });

    // Step 4: what about phones? → topic switch: expect iPhones, Galaxy, NO laptops
    const s4 = await multiStep(conversationId, 'what about phones?');
    checks.push(
      isSuccess(s4),
      hasMinRecs(s4.data, 2),
      noneContain(s4.data, 'laptop'),
    );
    const recs4 = s4.data?.recommendations ?? [];
    const hasPhone = recs4.some((r: any) => r.title?.toLowerCase().includes('iphone') || r.title?.toLowerCase().includes('galaxy') || r.title?.toLowerCase().includes('pixel'));
    checks.push({ label: hasPhone ? 'Phone brands found after switch' : 'No phone brands', verdict: hasPhone ? 'PASS' : 'PARTIAL' });

    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// TC-27: Budget → Premium → Compare cross-tier
// ────────────────────────────────────────────────────────────
async function tc27(): Promise<TCResult> {
  const id = 'TC-27';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    // Step 1: cheap watches → expect Casio F-91W ($18), A168WA ($28), Timex ($65)
    const s1 = await sendMessage(conversationId, 'cheap watches');
    checks.push(isSuccess(s1), hasMinRecs(s1.data, 2));
    const recs1 = s1.data?.recommendations ?? [];
    const hasBudgetWatch = recs1.some((r: any) => r.price <= 70);
    checks.push({ label: hasBudgetWatch ? `Budget watches present (≤$70)` : 'No budget watches', verdict: hasBudgetWatch ? 'PASS' : 'PARTIAL' });

    // Step 2: premium watches → expect Seiko ($425), DW ($149), G-Shock ($99)
    const s2 = await multiStep(conversationId, 'show me premium watches');
    checks.push(isSuccess(s2), hasMinRecs(s2.data, 2));
    const recs2 = s2.data?.recommendations ?? [];
    const hasPremiumWatch = recs2.some((r: any) => r.price >= 90);
    checks.push({ label: hasPremiumWatch ? 'Premium watches present (≥$90)' : 'No premium watches', verdict: hasPremiumWatch ? 'PASS' : 'PARTIAL' });

    // Step 3: compare Casio F-91W ($18) vs Seiko Presage ($425)
    const s3 = await multiStep(conversationId, 'compare Casio F-91W vs Seiko Presage');
    checks.push(isSuccess(s3), hasComparison(s3.data, 2), hasVerdict(s3.data));
    const compProds = s3.data?.comparison?.products ?? [];
    const hasCasio = compProds.some((p: any) => p.title?.toLowerCase().includes('casio') || p.title?.toLowerCase().includes('f-91'));
    const hasSeiko = compProds.some((p: any) => p.title?.toLowerCase().includes('seiko'));
    checks.push({ label: hasCasio && hasSeiko ? 'Both Casio & Seiko in comparison' : `Missing: ${!hasCasio ? 'Casio' : ''} ${!hasSeiko ? 'Seiko' : ''}`, verdict: hasCasio && hasSeiko ? 'PASS' : 'PARTIAL' });

    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// TC-28: Cross-category → Filter → Compare → Brand switch
// ────────────────────────────────────────────────────────────
async function tc28(): Promise<TCResult> {
  const id = 'TC-28';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    const s1 = await sendMessage(conversationId, 'nike products');
    checks.push(isSuccess(s1), hasBrand(s1.data, 'nike'));

    const s2 = await multiStep(conversationId, 'only shoes');
    checks.push(isSuccess(s2), hasMinRecs(s2.data, 2));

    const s3 = await multiStep(conversationId, 'compare them');
    checks.push(isSuccess(s3), hasComparison(s3.data, 2));

    // Step 4: Adidas shoes → Slides ($35), Stan Smith ($95), Ultraboost ($190). NO Nike
    const s4 = await multiStep(conversationId, 'now show me adidas shoes');
    checks.push(isSuccess(s4), hasBrand(s4.data, 'adidas'));
    const recs4 = s4.data?.recommendations ?? [];
    const noNike = !recs4.some((r: any) => r.brand?.toLowerCase() === 'nike');
    checks.push({ label: noNike ? 'No Nike in Adidas results — brand switch OK' : 'Nike leaked into Adidas results', verdict: noNike ? 'PASS' : 'PARTIAL' });
    const hasAdidaShoe = recs4.some((r: any) => r.title?.toLowerCase().includes('stan smith') || r.title?.toLowerCase().includes('ultraboost') || r.title?.toLowerCase().includes('slides'));
    checks.push({ label: hasAdidaShoe ? 'Specific Adidas shoes found' : 'No specific Adidas shoe names', verdict: hasAdidaShoe ? 'PASS' : 'PARTIAL' });

    // Step 5: cross-brand comparison
    const s5 = await multiStep(conversationId, 'which is better Nike Air Max or Adidas Stan Smith?');
    checks.push(isSuccess(s5), hasComparison(s5.data, 2));

    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// TC-29: Liên tục hỏi về cùng chủ đề (pagination + price narrowing)
// ────────────────────────────────────────────────────────────
async function tc29(): Promise<TCResult> {
  const id = 'TC-29';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    const s1 = await sendMessage(conversationId, 'show me bags');
    checks.push(isSuccess(s1), hasMinRecs(s1.data, 3));
    const page1Ids = (s1.data?.recommendations ?? []).map((r: any) => r.productId);

    const s2 = await multiStep(conversationId, 'show me more bags');
    checks.push(isSuccess(s2), hasMinRecs(s2.data, 2));
    checks.push(noOverlap(s2.data, page1Ids));

    const s3 = await multiStep(conversationId, 'cheaper bags');
    checks.push(isSuccess(s3), hasMinRecs(s3.data, 2));

    const s4 = await multiStep(conversationId, 'luxury bags only');
    checks.push(isSuccess(s4), hasMinRecs(s4.data, 2));

    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// TC-30: Đổi chủ đề liên tục 5 lần
// ────────────────────────────────────────────────────────────
async function tc30(): Promise<TCResult> {
  const id = 'TC-30';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    // Step 1: shirts
    const s1 = await sendMessage(conversationId, 'show me shirts');
    checks.push(isSuccess(s1), hasMinRecs(s1.data, 3));

    // Step 2: headphones (topic switch 1)
    const s2 = await multiStep(conversationId, 'now headphones');
    checks.push(isSuccess(s2), hasMinRecs(s2.data, 2), noneContain(s2.data, 'shirt'));

    // Step 3: watches (topic switch 2)
    const s3 = await multiStep(conversationId, 'show me watches');
    checks.push(isSuccess(s3), hasMinRecs(s3.data, 2), noneContain(s3.data, 'headphone'));

    // Step 4: sunglasses (topic switch 3)
    const s4 = await multiStep(conversationId, 'sunglasses please');
    checks.push(isSuccess(s4), hasMinRecs(s4.data, 2), noneContain(s4.data, 'watch'));

    // Step 5: running shoes (topic switch 4)
    const s5 = await multiStep(conversationId, 'give me running shoes');
    checks.push(isSuccess(s5), hasMinRecs(s5.data, 2), noneContain(s5.data, 'sunglass'));

    // Step 6: compare them (should compare running shoes ONLY)
    const s6 = await multiStep(conversationId, 'compare them');
    checks.push(isSuccess(s6), hasComparison(s6.data, 2));

    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// TC-31: Clarification → Selection → Deeper
// ────────────────────────────────────────────────────────────
async function tc31(): Promise<TCResult> {
  const id = 'TC-31';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    // Step 1: "nike" — should trigger clarification or show mixed products
    const s1 = await sendMessage(conversationId, 'nike');
    checks.push(isSuccess(s1));
    // May get clarification OR mixed Nike products — both are acceptable
    const hasClar = !!s1.data?.clarification?.question;
    const hasRecs = (s1.data?.recommendations?.length ?? 0) >= 2;
    checks.push({ label: hasClar ? 'Clarification shown' : (hasRecs ? 'Mixed Nike products shown' : 'Neither clarification nor recs'), verdict: (hasClar || hasRecs) ? 'PASS' : 'FAIL' });

    // Step 2: shoes (answer or new query)
    const s2 = await multiStep(conversationId, 'shoes');
    checks.push(isSuccess(s2), hasMinRecs(s2.data, 2));

    // Step 3: something cheaper
    const s3 = await multiStep(conversationId, 'something cheaper');
    checks.push(isSuccess(s3), hasMinRecs(s3.data, 1));

    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// TC-32: Electronics deep dive → specs comparison
// ────────────────────────────────────────────────────────────
async function tc32(): Promise<TCResult> {
  const id = 'TC-32';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    const s1 = await sendMessage(conversationId, 'show me tablets');
    checks.push(isSuccess(s1), hasMinRecs(s1.data, 3));

    const s2 = await multiStep(conversationId, 'compare them');
    checks.push(isSuccess(s2), hasComparison(s2.data, 2), hasVerdict(s2.data));

    // Check comparison table has specs
    const table = s2.data?.comparison?.comparisonTable ?? [];
    const hasSpecs = table.some((row: any) => row.label?.toLowerCase().includes('ram') || row.label?.toLowerCase().includes('storage'));
    checks.push({ label: hasSpecs ? 'Spec rows in comparison table' : 'No spec rows (basic table)', verdict: hasSpecs ? 'PASS' : 'PARTIAL' });

    const s3 = await multiStep(conversationId, 'cheaper tablets');
    checks.push(isSuccess(s3), hasMinRecs(s3.data, 1));

    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// TC-33: Price negotiation continuous
// ────────────────────────────────────────────────────────────
async function tc33(): Promise<TCResult> {
  const id = 'TC-33';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    const s1 = await sendMessage(conversationId, 'show me sneakers');
    checks.push(isSuccess(s1), hasMinRecs(s1.data, 3));

    const s2 = await multiStep(conversationId, 'something under $80');
    checks.push(isSuccess(s2), hasMinRecs(s2.data, 1));
    const recs2 = s2.data?.recommendations ?? [];
    const allUnder80 = recs2.every((r: any) => r.price <= 90); // allow slight margin
    checks.push({ label: allUnder80 ? 'All sneakers ≤$80-90' : 'Some sneakers over $80', verdict: allUnder80 ? 'PASS' : 'PARTIAL' });

    const s3 = await multiStep(conversationId, 'even cheaper');
    checks.push(isSuccess(s3), hasMinRecs(s3.data, 1));

    const s4 = await multiStep(conversationId, 'compare Converse vs Puma');
    checks.push(isSuccess(s4), hasComparison(s4.data, 2));

    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// TC-34: Gender-specific → broadening
// ────────────────────────────────────────────────────────────
async function tc34(): Promise<TCResult> {
  const id = 'TC-34';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    const s1 = await sendMessage(conversationId, "women's shoes");
    checks.push(isSuccess(s1), hasMinRecs(s1.data, 2));

    const s2 = await multiStep(conversationId, "show me men's shoes too");
    checks.push(isSuccess(s2), hasMinRecs(s2.data, 2));

    const s3 = await multiStep(conversationId, 'compare them');
    checks.push(isSuccess(s3), hasComparison(s3.data, 2));

    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// TC-35: Quick reply chain
// ────────────────────────────────────────────────────────────
async function tc35(): Promise<TCResult> {
  const id = 'TC-35';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    const s1 = await sendMessage(conversationId, 'show me backpacks');
    checks.push(isSuccess(s1), hasMinRecs(s1.data, 3));

    const s2 = await multiStep(conversationId, 'Compare them');
    checks.push(isSuccess(s2), hasComparison(s2.data, 2));

    const s3 = await multiStep(conversationId, 'Show me more');
    checks.push(isSuccess(s3));
    // Should either return more products or comparison with more info
    const hasData = (s3.data?.recommendations?.length ?? 0) > 0 || s3.data?.comparison;
    checks.push({ label: hasData ? 'More data returned' : 'No additional data', verdict: hasData ? 'PASS' : 'PARTIAL' });

    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────
(async () => {
  try {
    log(c.cyan, '\n' + '═'.repeat(60));
    log(c.bold, '📋 PHẦN C: MULTI-TURN FLOW (TC-26 → TC-35)');
    log(c.cyan, '═'.repeat(60));

    const all: TCResult[] = [
      await tc26(), await tc27(), await tc28(),
      await tc29(), await tc30(), await tc31(),
      await tc32(), await tc33(), await tc34(), await tc35(),
    ];

    for (const r of all) printTC(r);
    printSummary('PHẦN C: MULTI-TURN FLOW (TC-26 → TC-35)', all);
    process.exit(all.some(r => r.verdict === 'FAIL') ? 1 : 0);
  } catch (err) {
    log(c.red, `\n⚠ Fatal error: ${err}`);
    process.exit(1);
  }
})();
