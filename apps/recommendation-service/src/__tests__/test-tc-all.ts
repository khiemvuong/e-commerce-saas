/**
 * 🧪 Master Test Runner — All 50 Chatbox Test Cases
 * 
 * Runs all 5 sections (A→E) sequentially and prints final summary.
 * Requires recommendation-service running on port 6007.
 * 
 * Run: npx ts-node --transpile-only src/__tests__/test-tc-all.ts
 * 
 * Or run individual sections:
 *   npx ts-node --transpile-only src/__tests__/test-tc-a-single-turn.ts
 *   npx ts-node --transpile-only src/__tests__/test-tc-b-comparison.ts
 *   npx ts-node --transpile-only src/__tests__/test-tc-c-multi-turn.ts
 *   npx ts-node --transpile-only src/__tests__/test-tc-d-edge-cases.ts
 *   npx ts-node --transpile-only src/__tests__/test-tc-e-stress.ts
 */

import {
  startChat, sendMessage, resetChat, delay,
  hasMinRecs, hasProduct, hasBrand, allInCategory, noneContain,
  hasComparison, hasVerdict, hasFallbackCorrection, noOverlap,
  pricesUnder, intentIs, isSuccess, messageContains, hasQuickReply,
  hasClarification,
  aggregateVerdict, printTC, printSummary, printFinalSummary,
  TCResult, CheckResult, c, log,
} from './test-helpers';

// ── Utility ──
async function step(convId: string, msg: string, ms = 3500) {
  await delay(ms);
  return sendMessage(convId, msg);
}

async function single(id: string, input: string, fns: (d: any) => CheckResult[]): Promise<TCResult> {
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, input);
    if (!res?.success) return { id, verdict: 'FAIL', checks: [], error: `API error: ${res?.error}` };
    const checks = [isSuccess(res), ...fns(res.data)];
    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ═════════════════════════════════════════════════════════════
// SECTION A — SINGLE-TURN (TC-01 → TC-15)
// ═════════════════════════════════════════════════════════════
async function sectionA(): Promise<TCResult[]> {
  log(c.bold, '\n📋 PHẦN A: SINGLE-TURN (TC-01 → TC-15)');
  const r: TCResult[] = [];

  r.push(await single('TC-01', 'find me a watch', d => [hasMinRecs(d, 3), intentIs(d, 'SEARCH_PRODUCT')]));
  await delay(4000);
  r.push(await single('TC-02', 'show me budget laptops', d => [hasMinRecs(d, 2), allInCategory(d, 'electronics')]));
  await delay(4000);
  r.push(await single('TC-03', "women's dress", d => [hasMinRecs(d, 3), allInCategory(d, 'clothing')]));
  await delay(4000);
  r.push(await single('TC-04', 'something for gym', d => [hasMinRecs(d, 3)]));
  await delay(4000);
  r.push(await single('TC-05', 'show me headphones', d => [hasMinRecs(d, 3), hasProduct(d, 'sony')]));
  await delay(4000);
  r.push(await single('TC-06', 'nike shoes', d => [hasMinRecs(d, 2), hasBrand(d, 'nike')]));
  await delay(4000);
  r.push(await single('TC-07', 'casio', d => [hasMinRecs(d, 2), hasBrand(d, 'casio')]));
  await delay(4000);
  r.push(await single('TC-08', 'coach', d => [hasMinRecs(d, 2), hasBrand(d, 'coach')]));
  await delay(4000);
  r.push(await single('TC-09', 'addidas shoes', d => [hasMinRecs(d, 2), hasFallbackCorrection(d)]));
  await delay(4000);
  r.push(await single('TC-10', 'samsng phone', d => [hasMinRecs(d, 1), hasFallbackCorrection(d)]));
  await delay(4000);
  r.push(await single('TC-11', 'cheap headphones', d => [hasMinRecs(d, 2)]));
  await delay(4000);
  r.push(await single('TC-12', 'premium laptop', d => {
    const hasExp = (d.recommendations ?? []).some((r: any) => r.price >= 1000);
    return [hasMinRecs(d, 2), { label: hasExp ? 'Premium laptop found' : 'No premium', verdict: hasExp ? 'PASS' : 'PARTIAL' }];
  }));
  await delay(4000);
  r.push(await single('TC-13', 'luxury bags', d => [hasMinRecs(d, 2)]));
  await delay(4000);
  r.push(await single('TC-14', 'gift for her', d => {
    const cats = new Set((d.recommendations ?? []).map((r: any) => r.category?.toLowerCase()));
    return [hasMinRecs(d, 3), { label: cats.size >= 2 ? 'Multi-category' : 'Single category', verdict: cats.size >= 2 ? 'PASS' : 'PARTIAL' }];
  }));
  await delay(4000);
  r.push(await single('TC-15', 'office outfit', d => [hasMinRecs(d, 3)]));

  return r;
}

// ═════════════════════════════════════════════════════════════
// SECTION B — COMPARISON (TC-16 → TC-25)
// ═════════════════════════════════════════════════════════════
async function sectionB(): Promise<TCResult[]> {
  log(c.bold, '\n📋 PHẦN B: COMPARISON (TC-16 → TC-25)');
  const r: TCResult[] = [];

  r.push(await single('TC-16', 'iPhone 15 Pro Max vs Samsung Galaxy S24 Ultra', d => [intentIs(d, 'COMPARE'), hasComparison(d, 2), hasVerdict(d)]));
  await delay(4000);
  r.push(await single('TC-17', 'MacBook Pro vs Dell XPS vs ThinkPad', d => [hasComparison(d, 3), hasVerdict(d)]));
  await delay(4000);
  r.push(await single('TC-18', 'H&M Basic Tee ($12) vs Uniqlo Supima ($25) vs Nike Pro ($45)', d => [hasComparison(d, 2), hasVerdict(d)]));
  await delay(4000);
  r.push(await single('TC-19', 'Nike Air Max ($130) vs Adidas Stan Smith ($95) vs Converse Chuck ($55)', d => [hasComparison(d, 3), hasVerdict(d)]));
  await delay(4000);
  r.push(await single('TC-20', 'Casio F-91W vs G-Shock vs Seiko Presage', d => [hasComparison(d, 3), hasVerdict(d)]));
  await delay(4000);

  // TC-21: multi-turn compare them
  try {
    const { data: { conversationId } } = await startChat();
    const s1 = await sendMessage(conversationId, 'show me casio watches');
    const s2 = await step(conversationId, 'compare them');
    const checks: CheckResult[] = [isSuccess(s1), hasMinRecs(s1.data, 2), isSuccess(s2), hasComparison(s2.data, 2)];
    r.push({ id: 'TC-21', verdict: aggregateVerdict(checks), checks });
  } catch (e: any) { r.push({ id: 'TC-21', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  // TC-22: nike shoes → compare them
  try {
    const { data: { conversationId } } = await startChat();
    const s1 = await sendMessage(conversationId, 'nike shoes');
    const s2 = await step(conversationId, 'compare them');
    const checks: CheckResult[] = [isSuccess(s1), hasBrand(s1.data, 'nike'), isSuccess(s2), hasComparison(s2.data, 2)];
    r.push({ id: 'TC-22', verdict: aggregateVerdict(checks), checks });
  } catch (e: any) { r.push({ id: 'TC-22', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  r.push(await single('TC-23', 'Sony WH-1000XM5 or AirPods Max?', d => [intentIs(d, 'COMPARE'), hasComparison(d, 2), hasVerdict(d)]));
  await delay(4000);
  r.push(await single('TC-24', 'difference between iPad Pro and Galaxy Tab S9', d => [intentIs(d, 'COMPARE'), hasComparison(d, 2)]));
  await delay(4000);
  r.push(await single('TC-25', 'compare Nike Brasilia and North Face Borealis and Samsonite', d => [hasComparison(d, 2)]));

  return r;
}

// ═════════════════════════════════════════════════════════════
// SECTION C — MULTI-TURN (TC-26 → TC-35)
// ═════════════════════════════════════════════════════════════
async function sectionC(): Promise<TCResult[]> {
  log(c.bold, '\n📋 PHẦN C: MULTI-TURN (TC-26 → TC-35)');
  const r: TCResult[] = [];

  // TC-26
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    const s1 = await sendMessage(cid, 'show me laptops'); ch.push(isSuccess(s1), hasMinRecs(s1.data, 3));
    const s2 = await step(cid, 'compare them'); ch.push(isSuccess(s2), hasComparison(s2.data, 2));
    const s3 = await step(cid, 'show me cheaper ones'); ch.push(isSuccess(s3), hasMinRecs(s3.data, 1));
    const s4 = await step(cid, 'what about phones?'); ch.push(isSuccess(s4), hasMinRecs(s4.data, 2), noneContain(s4.data, 'laptop'));
    r.push({ id: 'TC-26', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-26', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  // TC-27
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    const s1 = await sendMessage(cid, 'cheap watches'); ch.push(isSuccess(s1), hasMinRecs(s1.data, 2));
    const s2 = await step(cid, 'show me premium watches'); ch.push(isSuccess(s2), hasMinRecs(s2.data, 2));
    const s3 = await step(cid, 'compare Casio F-91W vs Seiko Presage'); ch.push(isSuccess(s3), hasComparison(s3.data, 2));
    r.push({ id: 'TC-27', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-27', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  // TC-28
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    const s1 = await sendMessage(cid, 'nike products'); ch.push(isSuccess(s1), hasBrand(s1.data, 'nike'));
    const s2 = await step(cid, 'only shoes'); ch.push(isSuccess(s2), hasMinRecs(s2.data, 2));
    const s3 = await step(cid, 'compare them'); ch.push(isSuccess(s3), hasComparison(s3.data, 2));
    const s4 = await step(cid, 'now show me adidas shoes'); ch.push(isSuccess(s4), hasBrand(s4.data, 'adidas'));
    r.push({ id: 'TC-28', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-28', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  // TC-29
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    const s1 = await sendMessage(cid, 'show me bags'); ch.push(isSuccess(s1), hasMinRecs(s1.data, 3));
    const ids1 = (s1.data?.recommendations ?? []).map((r: any) => r.productId);
    const s2 = await step(cid, 'show me more bags'); ch.push(isSuccess(s2), hasMinRecs(s2.data, 2), noOverlap(s2.data, ids1));
    const s3 = await step(cid, 'cheaper bags'); ch.push(isSuccess(s3), hasMinRecs(s3.data, 2));
    const s4 = await step(cid, 'luxury bags only'); ch.push(isSuccess(s4), hasMinRecs(s4.data, 2));
    r.push({ id: 'TC-29', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-29', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  // TC-30
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    const s1 = await sendMessage(cid, 'show me shirts'); ch.push(isSuccess(s1), hasMinRecs(s1.data, 3));
    const s2 = await step(cid, 'now headphones'); ch.push(isSuccess(s2), hasMinRecs(s2.data, 2), noneContain(s2.data, 'shirt'));
    const s3 = await step(cid, 'show me watches'); ch.push(isSuccess(s3), hasMinRecs(s3.data, 2));
    const s4 = await step(cid, 'sunglasses please'); ch.push(isSuccess(s4), hasMinRecs(s4.data, 2));
    const s5 = await step(cid, 'give me running shoes'); ch.push(isSuccess(s5), hasMinRecs(s5.data, 2));
    const s6 = await step(cid, 'compare them'); ch.push(isSuccess(s6), hasComparison(s6.data, 2));
    r.push({ id: 'TC-30', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-30', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  // TC-31
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    const s1 = await sendMessage(cid, 'nike'); ch.push(isSuccess(s1));
    const s2 = await step(cid, 'shoes'); ch.push(isSuccess(s2), hasMinRecs(s2.data, 2));
    const s3 = await step(cid, 'something cheaper'); ch.push(isSuccess(s3), hasMinRecs(s3.data, 1));
    r.push({ id: 'TC-31', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-31', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  // TC-32
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    const s1 = await sendMessage(cid, 'show me tablets'); ch.push(isSuccess(s1), hasMinRecs(s1.data, 3));
    const s2 = await step(cid, 'compare them'); ch.push(isSuccess(s2), hasComparison(s2.data, 2));
    const s3 = await step(cid, 'cheaper tablets'); ch.push(isSuccess(s3), hasMinRecs(s3.data, 1));
    r.push({ id: 'TC-32', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-32', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  // TC-33
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    const s1 = await sendMessage(cid, 'show me sneakers'); ch.push(isSuccess(s1), hasMinRecs(s1.data, 3));
    const s2 = await step(cid, 'something under $80'); ch.push(isSuccess(s2), hasMinRecs(s2.data, 1));
    const s3 = await step(cid, 'even cheaper'); ch.push(isSuccess(s3), hasMinRecs(s3.data, 1));
    const s4 = await step(cid, 'compare Converse vs Puma'); ch.push(isSuccess(s4), hasComparison(s4.data, 2));
    r.push({ id: 'TC-33', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-33', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  // TC-34
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    const s1 = await sendMessage(cid, "women's shoes"); ch.push(isSuccess(s1), hasMinRecs(s1.data, 2));
    const s2 = await step(cid, "show me men's shoes too"); ch.push(isSuccess(s2), hasMinRecs(s2.data, 2));
    const s3 = await step(cid, 'compare them'); ch.push(isSuccess(s3), hasComparison(s3.data, 2));
    r.push({ id: 'TC-34', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-34', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  // TC-35
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    const s1 = await sendMessage(cid, 'show me backpacks'); ch.push(isSuccess(s1), hasMinRecs(s1.data, 3));
    const s2 = await step(cid, 'Compare them'); ch.push(isSuccess(s2), hasComparison(s2.data, 2));
    const s3 = await step(cid, 'Show me more'); ch.push(isSuccess(s3));
    r.push({ id: 'TC-35', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-35', verdict: 'FAIL', checks: [], error: e.message }); }

  return r;
}

// ═════════════════════════════════════════════════════════════
// SECTION D — EDGE CASES (TC-36 → TC-45)
// ═════════════════════════════════════════════════════════════
async function sectionD(): Promise<TCResult[]> {
  log(c.bold, '\n📋 PHẦN D: EDGE CASES (TC-36 → TC-45)');
  const r: TCResult[] = [];

  r.push(await single('TC-36', '@#$%^&*', d => [{ label: 'No crash', verdict: 'PASS' }, { label: (d.message?.length ?? 0) > 10 ? 'Helpful message' : 'Short msg', verdict: (d.message?.length ?? 0) > 10 ? 'PASS' : 'PARTIAL' }]));
  await delay(4000);
  r.push(await single('TC-37', 'hi', d => [intentIs(d, 'GREETING'), { label: (d.recommendations?.length ?? 0) === 0 ? 'No products' : 'Products shown', verdict: (d.recommendations?.length ?? 0) === 0 ? 'PASS' : 'PARTIAL' }]));
  await delay(4000);
  r.push(await single('TC-38', 'compare', d => [{ label: (d.message?.length ?? 0) > 20 ? 'Guidance shown' : 'Short msg', verdict: (d.message?.length ?? 0) > 20 ? 'PASS' : 'PARTIAL' }]));
  await delay(4000);
  r.push(await single('TC-39', 'compare them', d => [{ label: (d.message?.length ?? 0) > 15 ? 'Guidance for no-context compare' : 'Short msg', verdict: (d.message?.length ?? 0) > 15 ? 'PASS' : 'PARTIAL' }]));
  await delay(4000);
  r.push(await single('TC-40', 'show me unicorn laptops', d => [{ label: (d.recommendations?.length ?? 0) > 0 ? 'Fallback products' : 'No fallback', verdict: (d.recommendations?.length ?? 0) > 0 ? 'PASS' : 'PARTIAL' }]));
  await delay(4000);
  r.push(await single('TC-41', 'compare Nike vs', d => [{ label: 'No crash', verdict: 'PASS' }, { label: (d.message?.length ?? 0) > 10 ? 'Handled gracefully' : 'Short msg', verdict: (d.message?.length ?? 0) > 10 ? 'PASS' : 'PARTIAL' }]));
  await delay(4000);
  r.push(await single('TC-42', 'compare A vs B vs C vs D vs E vs F', d => {
    const count = d.comparison?.products?.length ?? 0;
    return [{ label: 'No crash on 6 subjects', verdict: 'PASS' }, { label: count <= 5 ? `Capped at ${count}` : 'Not capped', verdict: count <= 5 ? 'PASS' : 'FAIL' }];
  }));
  await delay(4000);
  r.push(await single('TC-43', 'compare Nike Air Max ($130) vs FakeProduct XYZ', d => [{ label: 'No crash', verdict: 'PASS' }, { label: (d.message?.length ?? 0) > 10 ? 'Partial match handled' : 'Short msg', verdict: (d.message?.length ?? 0) > 10 ? 'PASS' : 'PARTIAL' }]));
  await delay(4000);

  // TC-44: persistence
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    const s1 = await sendMessage(cid, 'show me watches'); ch.push(isSuccess(s1), hasMinRecs(s1.data, 3));
    await delay(3000);
    const s2 = await sendMessage(cid, 'compare them'); ch.push(isSuccess(s2));
    ch.push({ label: s2.data?.comparison ? 'Context preserved' : 'Context lost', verdict: s2.data?.comparison ? 'PASS' : 'PARTIAL' });
    r.push({ id: 'TC-44', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-44', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  // TC-45: reset then compare
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    const rst = await resetChat(cid); ch.push(isSuccess(rst));
    const newId = rst.data?.conversationId ?? cid;
    await delay(2200);
    const s2 = await sendMessage(newId, 'compare them'); ch.push(isSuccess(s2));
    ch.push({ label: !s2.data?.comparison ? 'No comparison after reset ✓' : 'Stale context', verdict: !s2.data?.comparison ? 'PASS' : 'PARTIAL' });
    r.push({ id: 'TC-45', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-45', verdict: 'FAIL', checks: [], error: e.message }); }

  return r;
}

// ═════════════════════════════════════════════════════════════
// SECTION E — STRESS TEST (TC-46 → TC-50)
// ═════════════════════════════════════════════════════════════
async function sectionE(): Promise<TCResult[]> {
  log(c.bold, '\n📋 PHẦN E: STRESS TEST (TC-46 → TC-50)');
  const r: TCResult[] = [];

  // TC-46
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    let s: any;
    s = await sendMessage(cid, 'show me phones'); ch.push(isSuccess(s), hasMinRecs(s.data, 3));
    s = await step(cid, 'compare them'); ch.push(isSuccess(s), hasComparison(s.data, 2));
    s = await step(cid, 'show me shoes'); ch.push(isSuccess(s), noneContain(s.data, 'phone'));
    s = await step(cid, 'compare them'); ch.push(isSuccess(s), hasComparison(s.data, 2));
    s = await step(cid, 'cheaper shoes'); ch.push(isSuccess(s), hasMinRecs(s.data, 1));
    s = await step(cid, 'Nike Air Max vs Adidas Stan Smith vs Converse Chuck'); ch.push(isSuccess(s), hasComparison(s.data, 2));
    s = await step(cid, 'back to phones, show me Samsung only'); ch.push(isSuccess(s), hasMinRecs(s.data, 1));
    s = await step(cid, 'compare Samsung Galaxy S24 Ultra vs iPhone 15 Pro Max'); ch.push(isSuccess(s), hasComparison(s.data, 2));
    r.push({ id: 'TC-46', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-46', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  // TC-47
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    const topics = ['laptops', 'watches', 'bags', 'headphones', 'sunglasses', 'sneakers', 'jewelry', 'belts'];
    const noContains = [null, 'laptop', 'watch', 'bag', 'headphone', 'sunglass', 'sneaker', 'jewelry'];
    let s: any;
    for (let i = 0; i < topics.length; i++) {
      s = i === 0 ? await sendMessage(cid, topics[i]) : await step(cid, topics[i]);
      ch.push(isSuccess(s), hasMinRecs(s.data, 1));
      if (noContains[i]) ch.push(noneContain(s.data, noContains[i]!));
    }
    s = await step(cid, 'compare them'); ch.push(isSuccess(s), hasComparison(s.data, 2));
    s = await step(cid, 'tablets'); ch.push(isSuccess(s), hasMinRecs(s.data, 1), noneContain(s.data, 'belt'));
    r.push({ id: 'TC-47', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-47', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  // TC-48
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    let s: any;
    s = await sendMessage(cid, 'Sony WH-1000XM5 vs AirPods Max'); ch.push(isSuccess(s), hasComparison(s.data, 2));
    s = await step(cid, 'what about Galaxy Buds?'); ch.push(isSuccess(s));
    s = await step(cid, 'compare all three: Sony vs AirPods vs Samsung Buds'); ch.push(isSuccess(s), hasComparison(s.data, 2));
    s = await step(cid, 'show me cheaper alternatives'); ch.push(isSuccess(s), hasMinRecs(s.data, 1));
    r.push({ id: 'TC-48', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-48', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  // TC-49
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    let s: any;
    s = await sendMessage(cid, 'Casio F-91W vs G-Shock vs Seiko Presage vs Timex Weekender'); ch.push(isSuccess(s), hasComparison(s.data, 3));
    s = await step(cid, 'show me more watches'); ch.push(isSuccess(s), hasMinRecs(s.data, 1));
    s = await step(cid, 'compare DW vs Seiko'); ch.push(isSuccess(s), hasComparison(s.data, 2));
    r.push({ id: 'TC-49', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-49', verdict: 'FAIL', checks: [], error: e.message }); }
  await delay(4000);

  // TC-50
  try {
    const { data: { conversationId: cid } } = await startChat();
    const ch: CheckResult[] = [];
    let s: any;
    s = await sendMessage(cid, 'show me all Nike products'); ch.push(isSuccess(s), hasBrand(s.data, 'nike'));
    s = await step(cid, 'compare the shoes'); ch.push(isSuccess(s));
    s = await step(cid, 'now show me Adidas'); ch.push(isSuccess(s), hasBrand(s.data, 'adidas'));
    s = await step(cid, 'compare Nike Air Max vs Adidas Stan Smith'); ch.push(isSuccess(s), hasComparison(s.data, 2));
    r.push({ id: 'TC-50', verdict: aggregateVerdict(ch), checks: ch });
  } catch (e: any) { r.push({ id: 'TC-50', verdict: 'FAIL', checks: [], error: e.message }); }

  return r;
}

// ═════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════
(async () => {
  try {
    const args = process.argv.slice(2).map(a => a.toUpperCase());
    const runAll = args.length === 0 || args.includes('ALL');
    const sectionsToRun = {
      A: runAll || args.includes('A'),
      B: runAll || args.includes('B'),
      C: runAll || args.includes('C'),
      D: runAll || args.includes('D'),
      E: runAll || args.includes('E'),
    };

    log(c.cyan, '\n' + '═'.repeat(60));
    log(c.bold, '🧪 AI CHATBOX — SELECTIVE TEST SUITE');
    log(c.cyan, '═'.repeat(60));
    log(c.gray, `Target: http://localhost:6007 | Sections: ${Object.keys(sectionsToRun).filter(k => (sectionsToRun as any)[k]).join(', ')}\n`);

    // Health check
    try {
      const health = await fetch('http://localhost:6007/api/health', { signal: AbortSignal.timeout(5000) });
      if (!health.ok) throw new Error('Health check failed');
      log(c.green, '✅ Service is running\n');
    } catch {
      log(c.red, '❌ recommendation-service is not running on port 6007');
      log(c.yellow, '   Start it with: npx nx serve recommendation-service');
      process.exit(1);
    }

    const allResults: TCResult[] = [];

    if (sectionsToRun.A) {
      const a = await sectionA();
      for (const r of a) printTC(r);
      printSummary('PHẦN A: SINGLE-TURN', a);
      allResults.push(...a);
    }

    if (sectionsToRun.B) {
      const b = await sectionB();
      for (const r of b) printTC(r);
      printSummary('PHẦN B: COMPARISON', b);
      allResults.push(...b);
    }

    if (sectionsToRun.C) {
      const cc = await sectionC();
      for (const r of cc) printTC(r);
      printSummary('PHẦN C: MULTI-TURN', cc);
      allResults.push(...cc);
    }

    if (sectionsToRun.D) {
      const d = await sectionD();
      for (const r of d) printTC(r);
      printSummary('PHẦN D: EDGE CASES', d);
      allResults.push(...d);
    }

    if (sectionsToRun.E) {
      const e = await sectionE();
      for (const r of e) printTC(r);
      printSummary('PHẦN E: STRESS TEST', e);
      allResults.push(...e);
    }

    printFinalSummary(allResults);
    process.exit(allResults.filter(r => r.verdict === 'FAIL').length > 0 ? 1 : 0);
  } catch (err) {
    log(c.red, `\n⚠ Fatal error: ${err}`);
    process.exit(1);
  }
})();
