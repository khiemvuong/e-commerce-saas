/**
 * PHẦN E: MULTI-TURN STRESS TEST (TC-46 → TC-50)
 * 
 * Mỗi TC 8-10 bước trong cùng 1 conversation.
 * Đảm bảo context KHÔNG bị rối sau nhiều lượt liên tục.
 * Run: npx ts-node --transpile-only src/__tests__/test-tc-e-stress.ts
 */

import {
  startChat, sendMessage, delay,
  hasMinRecs, hasBrand, noneContain,
  hasComparison, hasVerdict, noOverlap,
  isSuccess,
  aggregateVerdict, printTC, printSummary,
  TCResult, CheckResult, c, log,
} from './test-helpers';

async function step(convId: string, msg: string, ms = 2200) {
  await delay(ms);
  return sendMessage(convId, msg);
}

// ────────────────────────────────────────────────────────────
// TC-46: Full journey — phones → compare → shoes → compare → cheaper → specific compare → back to phones
// ────────────────────────────────────────────────────────────
async function tc46(): Promise<TCResult> {
  const id = 'TC-46';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    // 1. show me phones
    const s1 = await sendMessage(conversationId, 'show me phones');
    checks.push(isSuccess(s1), hasMinRecs(s1.data, 3));

    // 2. compare them
    const s2 = await step(conversationId, 'compare them');
    checks.push(isSuccess(s2), hasComparison(s2.data, 2));

    // 3. show me shoes (topic switch)
    const s3 = await step(conversationId, 'show me shoes');
    checks.push(isSuccess(s3), hasMinRecs(s3.data, 3), noneContain(s3.data, 'phone'));

    // 4. compare them (shoes, NOT phones)
    const s4 = await step(conversationId, 'compare them');
    checks.push(isSuccess(s4), hasComparison(s4.data, 2));
    // Verify no phones in comparison
    const prods4 = s4.data?.comparison?.products ?? [];
    const noPhones = !prods4.some((p: any) => p.title?.toLowerCase().includes('phone') || p.title?.toLowerCase().includes('galaxy') || p.title?.toLowerCase().includes('iphone'));
    checks.push({ label: noPhones ? 'Comparison has shoes only (no phones)' : 'Phone leaked into shoes comparison', verdict: noPhones ? 'PASS' : 'FAIL' });

    // 5. cheaper shoes
    const s5 = await step(conversationId, 'cheaper shoes');
    checks.push(isSuccess(s5), hasMinRecs(s5.data, 1));

    // 6. Nike Air Max vs Adidas Stan Smith vs Converse Chuck
    const s6 = await step(conversationId, 'Nike Air Max vs Adidas Stan Smith vs Converse Chuck');
    checks.push(isSuccess(s6), hasComparison(s6.data, 2));

    // 7. back to phones, show me Samsung only
    const s7 = await step(conversationId, 'back to phones, show me Samsung only');
    checks.push(isSuccess(s7), hasMinRecs(s7.data, 1));
    // Should have Samsung brand
    const recs7 = s7.data?.recommendations ?? [];
    const hasSamsung = recs7.some((r: any) => r.brand?.toLowerCase() === 'samsung' || r.title?.toLowerCase().includes('samsung') || r.title?.toLowerCase().includes('galaxy'));
    checks.push({ label: hasSamsung ? 'Samsung products found' : 'No Samsung products', verdict: hasSamsung ? 'PASS' : 'PARTIAL' });

    // 8. compare Samsung Galaxy S24 Ultra vs iPhone 15 Pro Max
    const s8 = await step(conversationId, 'compare Samsung Galaxy S24 Ultra vs iPhone 15 Pro Max');
    checks.push(isSuccess(s8), hasComparison(s8.data, 2), hasVerdict(s8.data));

    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// TC-47: Rapid topic switching — 10 topics without reset
// ────────────────────────────────────────────────────────────
async function tc47(): Promise<TCResult> {
  const id = 'TC-47';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    const topics = [
      { msg: 'laptops', noContain: null },
      { msg: 'watches', noContain: 'laptop' },
      { msg: 'bags', noContain: 'watch' },
      { msg: 'headphones', noContain: 'bag' },
      { msg: 'sunglasses', noContain: 'headphone' },
      { msg: 'sneakers', noContain: 'sunglass' },
      { msg: 'jewelry', noContain: 'sneaker' },
      { msg: 'belts', noContain: 'jewelry' },
    ];

    let first = true;
    for (const topic of topics) {
      const res = first
        ? await sendMessage(conversationId, topic.msg)
        : await step(conversationId, topic.msg);
      first = false;

      checks.push(isSuccess(res), hasMinRecs(res.data, 1));
      if (topic.noContain) {
        checks.push(noneContain(res.data, topic.noContain));
      }
    }

    // Step 9: compare them (should compare belts only)
    const s9 = await step(conversationId, 'compare them');
    checks.push(isSuccess(s9), hasComparison(s9.data, 2));

    // Step 10: tablets (final switch)
    const s10 = await step(conversationId, 'tablets');
    checks.push(isSuccess(s10), hasMinRecs(s10.data, 1), noneContain(s10.data, 'belt'));

    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// TC-48: Deep comparison chain
// ────────────────────────────────────────────────────────────
async function tc48(): Promise<TCResult> {
  const id = 'TC-48';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    // 1. Sony WH-1000XM5 vs AirPods Max
    const s1 = await sendMessage(conversationId, 'Sony WH-1000XM5 vs AirPods Max');
    checks.push(isSuccess(s1), hasComparison(s1.data, 2));

    // 2. what about Galaxy Buds?
    const s2 = await step(conversationId, 'what about Galaxy Buds?');
    checks.push(isSuccess(s2));
    // Should return something about Galaxy Buds
    const hasBuds = s2.data?.recommendations?.some((r: any) => r.title?.toLowerCase().includes('galaxy') || r.title?.toLowerCase().includes('buds')) || s2.data?.comparison;
    checks.push({ label: hasBuds ? 'Galaxy Buds info returned' : 'No Galaxy Buds data', verdict: hasBuds ? 'PASS' : 'PARTIAL' });

    // 3. compare all three
    const s3 = await step(conversationId, 'compare all three: Sony vs AirPods vs Samsung Buds');
    checks.push(isSuccess(s3), hasComparison(s3.data, 2));

    // 4. show me cheaper alternatives
    const s4 = await step(conversationId, 'show me cheaper alternatives');
    checks.push(isSuccess(s4), hasMinRecs(s4.data, 1));

    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// TC-49: Mixed comparison + search flow
// ────────────────────────────────────────────────────────────
async function tc49(): Promise<TCResult> {
  const id = 'TC-49';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    // 1. 4-way comparison
    const s1 = await sendMessage(conversationId, 'Casio F-91W vs G-Shock vs Seiko Presage vs Timex Weekender');
    checks.push(isSuccess(s1), hasComparison(s1.data, 3));
    const compIds = (s1.data?.comparison?.products ?? []).map((p: any) => p.id);

    // 2. show me more watches (should NOT repeat compared ones)
    const s2 = await step(conversationId, 'show me more watches');
    checks.push(isSuccess(s2), hasMinRecs(s2.data, 1));

    // 3. compare DW vs Seiko
    const s3 = await step(conversationId, 'compare DW vs Seiko');
    checks.push(isSuccess(s3), hasComparison(s3.data, 2));

    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// TC-50: Brand loyalty flow
// ────────────────────────────────────────────────────────────
async function tc50(): Promise<TCResult> {
  const id = 'TC-50';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    // 1. show me all Nike products
    const s1 = await sendMessage(conversationId, 'show me all Nike products');
    checks.push(isSuccess(s1), hasBrand(s1.data, 'nike'), hasMinRecs(s1.data, 3));

    // 2. compare the shoes (context filter to shoes)
    const s2 = await step(conversationId, 'compare the shoes');
    checks.push(isSuccess(s2));
    // Should either get comparison or shoes-only list
    const hasComp = !!s2.data?.comparison;
    const hasRecs = (s2.data?.recommendations?.length ?? 0) > 0;
    checks.push({ label: (hasComp || hasRecs) ? 'Shoes data returned' : 'No shoes data', verdict: (hasComp || hasRecs) ? 'PASS' : 'PARTIAL' });

    // 3. now show me Adidas (brand switch)
    const s3 = await step(conversationId, 'now show me Adidas');
    checks.push(isSuccess(s3), hasBrand(s3.data, 'adidas'));
    // Should NOT have Nike
    const recs3 = s3.data?.recommendations ?? [];
    const noNike = !recs3.some((r: any) => r.brand?.toLowerCase() === 'nike');
    checks.push({ label: noNike ? 'No Nike in Adidas results' : 'Nike leaked', verdict: noNike ? 'PASS' : 'PARTIAL' });

    // 4. compare Nike Air Max vs Adidas Stan Smith
    const s4 = await step(conversationId, 'compare Nike Air Max vs Adidas Stan Smith');
    checks.push(isSuccess(s4), hasComparison(s4.data, 2), hasVerdict(s4.data));

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
    log(c.bold, '📋 PHẦN E: MULTI-TURN STRESS TEST (TC-46 → TC-50)');
    log(c.cyan, '═'.repeat(60));

    const all: TCResult[] = [];

    for (const fn of [tc46, tc47, tc48, tc49, tc50]) {
      all.push(await fn());
      await delay(800);
    }

    for (const r of all) printTC(r);
    printSummary('PHẦN E: STRESS TEST (TC-46 → TC-50)', all);
    process.exit(all.some(r => r.verdict === 'FAIL') ? 1 : 0);
  } catch (err) {
    log(c.red, `\n⚠ Fatal error: ${err}`);
    process.exit(1);
  }
})();
