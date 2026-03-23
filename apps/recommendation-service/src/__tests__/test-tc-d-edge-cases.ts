/**
 * PHẦN D: EDGE CASES & ERROR HANDLING (TC-36 → TC-45)
 * 
 * Kiểm tra input bất thường, comparison edge cases, và conversation persistence.
 * Run: npx ts-node --transpile-only src/__tests__/test-tc-d-edge-cases.ts
 */

import {
  startChat, sendMessage, resetChat, delay,
  hasMinRecs, hasComparison, hasVerdict,
  intentIs, isSuccess, messageContains, hasQuickReply,
  aggregateVerdict, printTC, printSummary,
  TCResult, CheckResult, c, log,
} from './test-helpers';

// ────────────────────────────────────────────────────────────
// D1. Input bất thường
// ────────────────────────────────────────────────────────────

// TC-36: Special characters input
async function tc36(): Promise<TCResult> {
  const id = 'TC-36';
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, '@#$%^&*');
    const checks: CheckResult[] = [
      isSuccess(res),
      { label: 'No crash on special characters', verdict: res?.success ? 'PASS' : 'FAIL' },
      // Should get a helpful message, not empty
      { label: (res.data?.message?.length ?? 0) > 10 ? 'Helpful response message' : 'Empty/short message', verdict: (res.data?.message?.length ?? 0) > 10 ? 'PASS' : 'PARTIAL' },
    ];
    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// TC-37: Greeting "hi"
async function tc37(): Promise<TCResult> {
  const id = 'TC-37';
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, 'hi');
    const checks: CheckResult[] = [
      isSuccess(res),
      intentIs(res.data, 'GREETING'),
      // Should NOT return product recommendations
      {
        label: (res.data?.recommendations?.length ?? 0) === 0 ? 'No products for greeting' : 'Products returned for greeting',
        verdict: (res.data?.recommendations?.length ?? 0) === 0 ? 'PASS' : 'PARTIAL',
      },
      hasQuickReply(res.data, 'Search products'),
    ];
    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// TC-38: "compare" with no subject
async function tc38(): Promise<TCResult> {
  const id = 'TC-38';
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, 'compare');
    const checks: CheckResult[] = [
      isSuccess(res),
      // Should get guidance, not crash
      { label: (res.data?.message?.length ?? 0) > 20 ? 'Guidance message returned' : 'Short/empty message', verdict: (res.data?.message?.length ?? 0) > 20 ? 'PASS' : 'PARTIAL' },
    ];
    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// TC-39: "compare them" with no prior search
async function tc39(): Promise<TCResult> {
  const id = 'TC-39';
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, 'compare them');
    const checks: CheckResult[] = [
      isSuccess(res),
      // Should inform user there's nothing to compare
      {
        label: res.data?.message?.toLowerCase().includes('compare') || res.data?.message?.toLowerCase().includes('search') || res.data?.message?.toLowerCase().includes('product')
          ? 'Helpful guidance when no prior search' : 'No helpful guidance',
        verdict: (res.data?.message?.length ?? 0) > 15 ? 'PASS' : 'PARTIAL',
      },
    ];
    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// TC-40: "show me unicorn laptops" (nonsense + real category)
async function tc40(): Promise<TCResult> {
  const id = 'TC-40';
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, 'show me unicorn laptops');
    const checks: CheckResult[] = [
      isSuccess(res),
      // Should still return some results (laptops) or a fallback
      {
        label: (res.data?.recommendations?.length ?? 0) > 0 ? 'Fallback products shown' : 'No fallback – empty results',
        verdict: (res.data?.recommendations?.length ?? 0) > 0 ? 'PASS' : 'PARTIAL',
      },
    ];
    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// D2. Comparison edge cases
// ────────────────────────────────────────────────────────────

// TC-41: "compare Nike vs" (incomplete)
async function tc41(): Promise<TCResult> {
  const id = 'TC-41';
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, 'compare Nike vs');
    const checks: CheckResult[] = [
      isSuccess(res),
      // Should handle gracefully — either ask for second subject or show Nike info
      { label: 'No crash on incomplete comparison', verdict: res?.success ? 'PASS' : 'FAIL' },
      { label: (res.data?.message?.length ?? 0) > 10 ? 'Response message present' : 'Empty message', verdict: (res.data?.message?.length ?? 0) > 10 ? 'PASS' : 'PARTIAL' },
    ];
    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// TC-42: 6 comparison subjects (should cap at 5)
async function tc42(): Promise<TCResult> {
  const id = 'TC-42';
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, 'compare A vs B vs C vs D vs E vs F');
    const checks: CheckResult[] = [
      isSuccess(res),
      { label: 'No crash on 6 subjects', verdict: res?.success ? 'PASS' : 'FAIL' },
    ];
    // If comparison returned, check max 5 products
    if (res.data?.comparison?.products) {
      const count = res.data.comparison.products.length;
      checks.push({ label: count <= 5 ? `Capped at ${count} products (max 5)` : `${count} products (over max!)`, verdict: count <= 5 ? 'PASS' : 'FAIL' });
    }
    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// TC-43: "compare Nike Air Max ($130) vs FakeProduct XYZ"
async function tc43(): Promise<TCResult> {
  const id = 'TC-43';
  try {
    const { data: { conversationId } } = await startChat();
    const res = await sendMessage(conversationId, 'compare Nike Air Max ($130) vs FakeProduct XYZ');
    const checks: CheckResult[] = [
      isSuccess(res),
      { label: 'No crash on partial match', verdict: res?.success ? 'PASS' : 'FAIL' },
      // Should mention the product it found or that one wasn't found
      { label: (res.data?.message?.length ?? 0) > 10 ? 'Informative message about partial match' : 'No message', verdict: (res.data?.message?.length ?? 0) > 10 ? 'PASS' : 'PARTIAL' },
    ];
    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// D3. Conversation persistence
// ────────────────────────────────────────────────────────────

// TC-44: Search → close/reopen → compare them (context from server-side store)
async function tc44(): Promise<TCResult> {
  const id = 'TC-44';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    // Step 1: search watches
    const s1 = await sendMessage(conversationId, 'show me watches');
    checks.push(isSuccess(s1), hasMinRecs(s1.data, 3));

    // Step 2: simulate "reopen" by sending another message to same conversationId
    await delay(3000);
    const s2 = await sendMessage(conversationId, 'compare them');
    checks.push(isSuccess(s2));
    // Context should be maintained — comparison should work
    const hasComp = !!s2.data?.comparison;
    checks.push({ label: hasComp ? 'Context preserved — comparison works after pause' : 'Context lost', verdict: hasComp ? 'PASS' : 'PARTIAL' });

    return { id, verdict: aggregateVerdict(checks), checks };
  } catch (err: any) {
    return { id, verdict: 'FAIL', checks: [], error: err.message };
  }
}

// TC-45: Reset → compare them (should fail gracefully after reset)
async function tc45(): Promise<TCResult> {
  const id = 'TC-45';
  try {
    const { data: { conversationId } } = await startChat();
    const checks: CheckResult[] = [];

    // Step 1: Reset the conversation
    const resetRes = await resetChat(conversationId);
    checks.push(isSuccess(resetRes));
    const newConvId = resetRes.data?.conversationId ?? conversationId;

    // Step 2: compare them on fresh conversation
    await delay(2200);
    const s2 = await sendMessage(newConvId, 'compare them');
    checks.push(isSuccess(s2));
    // Should NOT have any comparison (no prior products)
    const hasComp = !!s2.data?.comparison;
    checks.push({
      label: !hasComp ? 'No comparison after reset — correct' : 'Comparison returned after reset — stale context',
      verdict: !hasComp ? 'PASS' : 'PARTIAL',
    });

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
    log(c.bold, '📋 PHẦN D: EDGE CASES & ERROR HANDLING (TC-36 → TC-45)');
    log(c.cyan, '═'.repeat(60));

    const all: TCResult[] = [];

    for (const fn of [tc36, tc37, tc38, tc39, tc40, tc41, tc42, tc43, tc44, tc45]) {
      all.push(await fn());
      await delay(500);
    }

    for (const r of all) printTC(r);
    printSummary('PHẦN D: EDGE CASES (TC-36 → TC-45)', all);
    process.exit(all.some(r => r.verdict === 'FAIL') ? 1 : 0);
  } catch (err) {
    log(c.red, `\n⚠ Fatal error: ${err}`);
    process.exit(1);
  }
})();
