/**
 * PHẦN B: COMPARISON TEST (TC-16 → TC-25) — v2.0 Data-verified
 * 
 * Verified product data: iPhone 15 Pro Max ($1199,★4.9,sold:500), Galaxy S24 Ultra ($1199,★4.8,sold:380),
 * MacBook Pro M3 ($1999,★4.9,sold:321), Dell XPS 15 ($1499,★4.6,sold:211), ThinkPad X1 ($1799,★4.7,sold:156)
 * 
 * Run: npx ts-node --transpile-only src/__tests__/test-tc-b-comparison.ts
 */

import {
  startChat, sendMessage, delay,
  hasMinRecs, hasProduct, hasBrand, hasComparison, hasVerdict,
  intentIs, isSuccess, hasQuickReply,
  aggregateVerdict, printTC, printSummary,
  TCResult, CheckResult, c, log,
} from './test-helpers';

/** Check specific product in comparison by name substring */
function compHasProduct(data: any, nameSubstr: string): CheckResult {
  const prods = data?.comparison?.products ?? [];
  const found = prods.some((p: any) => p.title?.toLowerCase().includes(nameSubstr.toLowerCase()));
  if (found) return { label: `"${nameSubstr}" found in comparison`, verdict: 'PASS' };
  const names = prods.map((p: any) => p.title).join(', ');
  return { label: `"${nameSubstr}" missing. Got: ${names.substring(0, 120)}`, verdict: 'FAIL' };
}

/** Verify comparison product has correct price (±5% tolerance) */
function compProductPrice(data: any, nameSubstr: string, expectedPrice: number): CheckResult {
  const prods = data?.comparison?.products ?? [];
  const p = prods.find((p: any) => p.title?.toLowerCase().includes(nameSubstr.toLowerCase()));
  if (!p) return { label: `"${nameSubstr}" not found for price check`, verdict: 'FAIL' };
  const tolerance = expectedPrice * 0.05;
  if (Math.abs(p.price - expectedPrice) <= tolerance) {
    return { label: `"${nameSubstr}" price $${p.price} ≈ expected $${expectedPrice}`, verdict: 'PASS' };
  }
  return { label: `"${nameSubstr}" price $${p.price} ≠ expected $${expectedPrice}`, verdict: 'PARTIAL' };
}

// ── B1. So sánh trực tiếp 2-3 sản phẩm ──
async function tcB1(): Promise<TCResult[]> {
  const results: TCResult[] = [];

  // TC-16: iPhone 15 Pro Max vs Samsung Galaxy S24 Ultra
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, 'iPhone 15 Pro Max vs Samsung Galaxy S24 Ultra');
    const checks: CheckResult[] = [
      isSuccess(res),
      intentIs(res.data, 'COMPARE'),
      hasComparison(res.data, 2),
      hasVerdict(res.data),
      compHasProduct(res.data, 'iphone'),
      compHasProduct(res.data, 'samsung'),
      compProductPrice(res.data, 'iphone', 1199),
      compProductPrice(res.data, 'samsung', 1199),
    ];
    results.push({ id: 'TC-16', verdict: aggregateVerdict(checks), checks });
  } catch (err: any) {
    results.push({ id: 'TC-16', verdict: 'FAIL', checks: [], error: err.message });
  }
  await delay(600);

  // TC-17: MacBook Pro vs Dell XPS vs ThinkPad (3-way)
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, 'MacBook Pro vs Dell XPS vs ThinkPad');
    const prods = res.data?.comparison?.products ?? [];
    const checks: CheckResult[] = [
      isSuccess(res),
      intentIs(res.data, 'COMPARE'),
      hasComparison(res.data, 3),
      hasVerdict(res.data),
      compHasProduct(res.data, 'macbook'),
      compHasProduct(res.data, 'dell'),
      compHasProduct(res.data, 'thinkpad'),
      { label: prods.length >= 3 ? `3-way comparison (${prods.length})` : `Only ${prods.length} products`, verdict: prods.length >= 3 ? 'PASS' : 'PARTIAL' },
    ];
    results.push({ id: 'TC-17', verdict: aggregateVerdict(checks), checks });
  } catch (err: any) {
    results.push({ id: 'TC-17', verdict: 'FAIL', checks: [], error: err.message });
  }
  await delay(600);

  return results;
}

// ── B2. So sánh 3+ sản phẩm với giá trong query ──
async function tcB2(): Promise<TCResult[]> {
  const results: TCResult[] = [];

  // TC-18: H&M Basic Tee ($12) vs Uniqlo Supima ($25) vs Nike Pro ($45)
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, 'H&M Basic Tee ($12) vs Uniqlo Supima ($25) vs Nike Pro ($45)');
    const prods = res.data?.comparison?.products ?? [];
    const checks: CheckResult[] = [
      isSuccess(res),
      hasComparison(res.data, 2),
      hasVerdict(res.data),
      { label: prods.length >= 3 ? `Found all 3 t-shirts` : `Found ${prods.length} (expected 3)`, verdict: prods.length >= 3 ? 'PASS' : prods.length >= 2 ? 'PARTIAL' : 'FAIL' },
      // Verify price stripping worked — products found despite ($xx) in query
      compHasProduct(res.data, 'h&m'),
    ];
    results.push({ id: 'TC-18', verdict: aggregateVerdict(checks), checks });
  } catch (err: any) {
    results.push({ id: 'TC-18', verdict: 'FAIL', checks: [], error: err.message });
  }
  await delay(600);

  // TC-19: Nike Air Max ($130) vs Adidas Stan Smith ($95) vs Converse Chuck ($55)
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, 'Nike Air Max ($130) vs Adidas Stan Smith ($95) vs Converse Chuck ($55)');
    const checks: CheckResult[] = [
      isSuccess(res),
      hasComparison(res.data, 3),
      hasVerdict(res.data),
      compHasProduct(res.data, 'air max'),
      compHasProduct(res.data, 'stan smith'),
      compHasProduct(res.data, 'converse'),
      compProductPrice(res.data, 'air max', 130),
      compProductPrice(res.data, 'stan smith', 95),
      compProductPrice(res.data, 'converse', 55),
    ];
    results.push({ id: 'TC-19', verdict: aggregateVerdict(checks), checks });
  } catch (err: any) {
    results.push({ id: 'TC-19', verdict: 'FAIL', checks: [], error: err.message });
  }
  await delay(600);

  // TC-20: Casio F-91W vs G-Shock vs Seiko Presage
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, 'Casio F-91W vs G-Shock vs Seiko Presage');
    const checks: CheckResult[] = [
      isSuccess(res),
      hasComparison(res.data, 3),
      hasVerdict(res.data),
      compHasProduct(res.data, 'f-91w'),
      compHasProduct(res.data, 'g-shock'),
      compHasProduct(res.data, 'seiko'),
      compProductPrice(res.data, 'f-91w', 18),
      compProductPrice(res.data, 'g-shock', 99),
      compProductPrice(res.data, 'seiko', 425),
    ];
    results.push({ id: 'TC-20', verdict: aggregateVerdict(checks), checks });
  } catch (err: any) {
    results.push({ id: 'TC-20', verdict: 'FAIL', checks: [], error: err.message });
  }
  await delay(600);

  return results;
}

// ── B3. "compare them" after search ──
async function tcB3(): Promise<TCResult[]> {
  const results: TCResult[] = [];

  // TC-21: show me casio watches → compare them
  try {
    const { data: { conversationId } } = await startChat();
    const step1 = await sendMessage(conversationId, 'show me casio watches');
    await delay(2200);
    const step2 = await sendMessage(conversationId, 'compare them');

    const step1Recs = step1.data?.recommendations ?? [];
    const step1Products = step1Recs.map((r: any) => r.title).join(', ');
    const checks: CheckResult[] = [
      isSuccess(step1),
      { label: step1Recs.length >= 2 ? `Step 1: ${step1Recs.length} Casio watches` : `Step 1: Only ${step1Recs.length}`, verdict: step1Recs.length >= 2 ? 'PASS' : 'PARTIAL', detail: step1Products },
      hasBrand(step1.data, 'casio'),
      isSuccess(step2),
      hasComparison(step2.data, 2),
      hasVerdict(step2.data),
    ];
    results.push({ id: 'TC-21', verdict: aggregateVerdict(checks), checks });
  } catch (err: any) {
    results.push({ id: 'TC-21', verdict: 'FAIL', checks: [], error: err.message });
  }
  await delay(600);

  // TC-22: nike shoes → compare them
  try {
    const { data: { conversationId } } = await startChat();
    const step1 = await sendMessage(conversationId, 'nike shoes');
    await delay(2200);
    const step2 = await sendMessage(conversationId, 'compare them');

    const step1Recs = step1.data?.recommendations ?? [];
    const checks: CheckResult[] = [
      isSuccess(step1),
      hasBrand(step1.data, 'nike'),
      { label: step1Recs.length >= 2 ? `Step 1: ${step1Recs.length} Nike shoes` : `Only ${step1Recs.length}`, verdict: step1Recs.length >= 2 ? 'PASS' : 'PARTIAL' },
      isSuccess(step2),
      hasComparison(step2.data, 2),
      // Verify comparison products are shoes, not clothing
      (() => {
        const compProds = step2.data?.comparison?.products ?? [];
        const allShoes = compProds.every((p: any) => p.category?.toLowerCase() === 'shoes' || p.title?.toLowerCase().includes('shoe') || p.title?.toLowerCase().includes('air max'));
        return { label: allShoes ? 'Comparison has shoes only' : 'Comparison includes non-shoes', verdict: allShoes ? 'PASS' : 'PARTIAL' };
      })(),
    ];
    results.push({ id: 'TC-22', verdict: aggregateVerdict(checks), checks });
  } catch (err: any) {
    results.push({ id: 'TC-22', verdict: 'FAIL', checks: [], error: err.message });
  }
  await delay(600);

  return results;
}

// ── B4. Alternative comparison patterns ──
async function tcB4(): Promise<TCResult[]> {
  const results: TCResult[] = [];

  // TC-23: Sony WH-1000XM5 or AirPods Max?
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, 'Sony WH-1000XM5 or AirPods Max?');
    const checks: CheckResult[] = [
      isSuccess(res),
      intentIs(res.data, 'COMPARE'),
      hasComparison(res.data, 2),
      hasVerdict(res.data),
      compHasProduct(res.data, 'sony'),
      compHasProduct(res.data, 'airpods'),
      compProductPrice(res.data, 'sony', 349),
      compProductPrice(res.data, 'airpods', 549),
    ];
    results.push({ id: 'TC-23', verdict: aggregateVerdict(checks), checks });
  } catch (err: any) {
    results.push({ id: 'TC-23', verdict: 'FAIL', checks: [], error: err.message });
  }
  await delay(600);

  // TC-24: difference between iPad Pro and Galaxy Tab S9
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, 'difference between iPad Pro and Galaxy Tab S9');
    const checks: CheckResult[] = [
      isSuccess(res),
      intentIs(res.data, 'COMPARE'),
      hasComparison(res.data, 2),
      hasVerdict(res.data),
      compHasProduct(res.data, 'ipad'),
      compHasProduct(res.data, 'galaxy tab'),
      compProductPrice(res.data, 'ipad', 799),
      compProductPrice(res.data, 'galaxy tab', 799),
    ];
    results.push({ id: 'TC-24', verdict: aggregateVerdict(checks), checks });
  } catch (err: any) {
    results.push({ id: 'TC-24', verdict: 'FAIL', checks: [], error: err.message });
  }
  await delay(600);

  // TC-25: compare Nike Brasilia and North Face Borealis and Samsonite
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, 'compare Nike Brasilia and North Face Borealis and Samsonite');
    const prods = res.data?.comparison?.products ?? [];
    const checks: CheckResult[] = [
      isSuccess(res),
      hasComparison(res.data, 2),
      hasVerdict(res.data),
      compHasProduct(res.data, 'brasilia'),
      compHasProduct(res.data, 'borealis'),
      { label: prods.length >= 3 ? '3-way backpack comparison' : `${prods.length} products found`, verdict: prods.length >= 3 ? 'PASS' : 'PARTIAL' },
    ];
    results.push({ id: 'TC-25', verdict: aggregateVerdict(checks), checks });
  } catch (err: any) {
    results.push({ id: 'TC-25', verdict: 'FAIL', checks: [], error: err.message });
  }

  return results;
}

// ── Main ──
(async () => {
  try {
    log(c.cyan, '\n' + '═'.repeat(60));
    log(c.bold, '📋 PHẦN B: COMPARISON TEST (TC-16 → TC-25)');
    log(c.cyan, '═'.repeat(60));

    const all: TCResult[] = [
      ...await tcB1(),
      ...await tcB2(),
      ...await tcB3(),
      ...await tcB4(),
    ];

    for (const r of all) printTC(r);
    printSummary('PHẦN B: COMPARISON (TC-16 → TC-25)', all);
    process.exit(all.some(r => r.verdict === 'FAIL') ? 1 : 0);
  } catch (err) {
    log(c.red, `\n⚠ Fatal error: ${err}`);
    process.exit(1);
  }
})();
