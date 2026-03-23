/**
 * Shared Test Helpers for Chatbox E2E Tests
 * 
 * Provides HTTP client, assertion helpers, and colored output utilities.
 * All chatbox tests call the live recommendation-service API.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:6007';

// ========== Console Colors ==========
export const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

export function log(color: string, msg: string) {
  console.log(`${color}${msg}${c.reset}`);
}

// ========== Result Types ==========
export type Verdict = 'PASS' | 'PARTIAL' | 'FAIL';

export interface CheckResult {
  label: string;
  verdict: Verdict;
  detail?: string;
}

export interface TCResult {
  id: string;
  verdict: Verdict;
  checks: CheckResult[];
  error?: string;
}

// ========== HTTP Client ==========
async function apiCall(method: 'GET' | 'POST', path: string, body?: any): Promise<any> {
  const url = `${BASE_URL}${path}`;
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15000),
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  return res.json();
}

export async function startChat(userId?: string) {
  return apiCall('POST', '/api/chat/start', userId ? { userId } : {});
}

export async function sendMessage(conversationId: string, message: string) {
  return apiCall('POST', '/api/chat/message', { conversationId, message });
}

export async function resetChat(conversationId: string) {
  return apiCall('POST', '/api/chat/reset', { conversationId });
}

// ========== Assertion Helpers ==========

/** Check that at least `min` recommendations were returned */
export function hasMinRecs(data: any, min: number): CheckResult {
  const count = data?.recommendations?.length ?? 0;
  if (count >= min) return { label: `≥${min} recommendations returned (got ${count})`, verdict: 'PASS' };
  if (count > 0) return { label: `Expected ≥${min} recs, got ${count}`, verdict: 'PARTIAL' };
  return { label: `Expected ≥${min} recs, got 0`, verdict: 'FAIL' };
}

/** Check that a recommendation contains a product whose title includes `substr` (case-insensitive) */
export function hasProduct(data: any, substr: string): CheckResult {
  const recs: any[] = data?.recommendations ?? [];
  const found = recs.some((r: any) => r.title?.toLowerCase().includes(substr.toLowerCase()));
  if (found) return { label: `Found product matching "${substr}"`, verdict: 'PASS' };
  const titles = recs.map((r: any) => r.title).join(', ');
  return { label: `Missing "${substr}". Got: ${titles.substring(0, 120)}`, verdict: 'FAIL' };
}

/** Check that a recommendation has a product whose brand matches */
export function hasBrand(data: any, brand: string): CheckResult {
  const recs: any[] = data?.recommendations ?? [];
  const found = recs.some((r: any) => r.brand?.toLowerCase() === brand.toLowerCase());
  if (found) return { label: `Found brand "${brand}"`, verdict: 'PASS' };
  const brands = [...new Set(recs.map((r: any) => r.brand))].join(', ');
  return { label: `Missing brand "${brand}". Got: ${brands}`, verdict: 'FAIL' };
}

/** Check that all recommendations belong to a category (case-insensitive substring) */
export function allInCategory(data: any, category: string): CheckResult {
  const recs: any[] = data?.recommendations ?? [];
  if (recs.length === 0) return { label: `No recs to check for category "${category}"`, verdict: 'FAIL' };
  const matching = recs.filter((r: any) =>
    r.category?.toLowerCase().includes(category.toLowerCase()) ||
    r.title?.toLowerCase().includes(category.toLowerCase())
  );
  if (matching.length === recs.length) return { label: `All ${recs.length} recs in "${category}"`, verdict: 'PASS' };
  if (matching.length >= recs.length * 0.6) return { label: `${matching.length}/${recs.length} in "${category}"`, verdict: 'PARTIAL' };
  return { label: `Only ${matching.length}/${recs.length} in "${category}"`, verdict: 'FAIL' };
}

/** Check that NO recommendation contains the given keyword in title/category */
export function noneContain(data: any, keyword: string): CheckResult {
  const recs: any[] = data?.recommendations ?? [];
  const found = recs.filter((r: any) =>
    r.title?.toLowerCase().includes(keyword.toLowerCase()) ||
    r.category?.toLowerCase().includes(keyword.toLowerCase())
  );
  if (found.length === 0) return { label: `No recs contain "${keyword}" — topic switch OK`, verdict: 'PASS' };
  return { label: `${found.length} recs still contain "${keyword}" — stale context`, verdict: 'FAIL' };
}

/** Check that comparison data is present */
export function hasComparison(data: any, minProducts?: number): CheckResult {
  const comp = data?.comparison;
  if (!comp) return { label: 'No comparison data returned', verdict: 'FAIL' };
  const count = comp.products?.length ?? 0;
  const min = minProducts ?? 2;
  if (count >= min) return { label: `Comparison with ${count} products`, verdict: 'PASS' };
  return { label: `Comparison has ${count} products, expected ≥${min}`, verdict: 'PARTIAL' };
}

/** Check that comparison has a verdict */
export function hasVerdict(data: any): CheckResult {
  const verdict = data?.comparison?.verdict;
  if (verdict && typeof verdict === 'string' && verdict.length > 10) return { label: 'Verdict present', verdict: 'PASS' };
  if (verdict) return { label: 'Verdict present but short', verdict: 'PARTIAL' };
  return { label: 'No verdict in comparison', verdict: 'FAIL' };
}

/** Check intent detected matches expected */
export function intentIs(data: any, expected: string): CheckResult {
  const actual = data?.intent;
  if (actual === expected) return { label: `Intent: ${actual}`, verdict: 'PASS' };
  return { label: `Expected intent ${expected}, got ${actual}`, verdict: 'FAIL' };
}

/** Check that the message contains certain text */
export function messageContains(data: any, substr: string): CheckResult {
  const msg: string = data?.message ?? '';
  if (msg.toLowerCase().includes(substr.toLowerCase())) return { label: `Message contains "${substr}"`, verdict: 'PASS' };
  return { label: `Message missing "${substr}": "${msg.substring(0, 100)}"`, verdict: 'FAIL' };
}

/** Check that quick replies contain a specific text */
export function hasQuickReply(data: any, text: string): CheckResult {
  const qrs: string[] = data?.quickReplies ?? [];
  const found = qrs.some((q: string) => q.toLowerCase().includes(text.toLowerCase()));
  if (found) return { label: `Quick reply "${text}" present`, verdict: 'PASS' };
  return { label: `Quick reply "${text}" missing. Got: ${qrs.join(', ')}`, verdict: 'PARTIAL' };
}

/** Check that fallback/correction is shown */
export function hasFallbackCorrection(data: any): CheckResult {
  if (data?.fallback?.correctedQuery) return { label: `Typo corrected to "${data.fallback.correctedQuery}"`, verdict: 'PASS' };
  if (data?.message?.toLowerCase().includes('showing results for')) return { label: 'Correction shown in message', verdict: 'PASS' };
  // Still might have found results via fuzzy brand detection
  if (data?.recommendations?.length > 0) return { label: 'Results found (implicit correction)', verdict: 'PARTIAL' };
  return { label: 'No typo correction detected', verdict: 'FAIL' };
}

/** Check no recs overlap with previous IDs */
export function noOverlap(data: any, previousIds: string[]): CheckResult {
  const recs: any[] = data?.recommendations ?? [];
  const overlap = recs.filter((r: any) => previousIds.includes(r.productId));
  if (overlap.length === 0) return { label: `No overlap with ${previousIds.length} previous products`, verdict: 'PASS' };
  return { label: `${overlap.length} products overlap with previous results`, verdict: 'PARTIAL' };
}

/** Check that prices are under a max */
export function pricesUnder(data: any, max: number): CheckResult {
  const recs: any[] = data?.recommendations ?? [];
  if (recs.length === 0) return { label: 'No recs to check price', verdict: 'FAIL' };
  const under = recs.filter((r: any) => r.price <= max);
  if (under.length === recs.length) return { label: `All ${recs.length} priced ≤$${max}`, verdict: 'PASS' };
  if (under.length >= recs.length * 0.6) return { label: `${under.length}/${recs.length} priced ≤$${max}`, verdict: 'PARTIAL' };
  return { label: `Only ${under.length}/${recs.length} priced ≤$${max}`, verdict: 'FAIL' };
}

/** Check clarification was returned */
export function hasClarification(data: any): CheckResult {
  if (data?.clarification?.question) return { label: `Clarification: "${data.clarification.question.substring(0, 60)}..."`, verdict: 'PASS' };
  return { label: 'No clarification returned', verdict: 'FAIL' };
}

/** Check that no crash occurred (success: true) */
export function isSuccess(res: any): CheckResult {
  if (res?.success === true) return { label: 'Response success', verdict: 'PASS' };
  return { label: `Response failed: ${res?.error || 'unknown'}`, verdict: 'FAIL' };
}

// ========== TC Result Aggregation ==========

export function aggregateVerdict(checks: CheckResult[]): Verdict {
  if (checks.every(c => c.verdict === 'PASS')) return 'PASS';
  if (checks.some(c => c.verdict === 'FAIL')) {
    const passCount = checks.filter(c => c.verdict === 'PASS').length;
    return passCount > 0 ? 'PARTIAL' : 'FAIL';
  }
  return 'PARTIAL';
}

// ========== Reporting ==========

const ICONS: Record<Verdict, string> = { PASS: '🟢', PARTIAL: '🟡', FAIL: '🔴' };
const VCOLORS: Record<Verdict, string> = { PASS: c.green, PARTIAL: c.yellow, FAIL: c.red };

export function printTC(result: TCResult) {
  const icon = ICONS[result.verdict];
  const vc = VCOLORS[result.verdict];
  log(vc, `\n${icon} ${result.id} — ${result.verdict}`);
  if (result.error) {
    log(c.red, `  ⚠ Error: ${result.error}`);
    return;
  }
  for (const ch of result.checks) {
    const ci = ch.verdict === 'PASS' ? '✅' : ch.verdict === 'PARTIAL' ? '⚠️' : '❌';
    const cc = VCOLORS[ch.verdict];
    console.log(`  ${ci} ${cc}${ch.label}${c.reset}`);
    if (ch.detail) console.log(`     ${c.dim}${ch.detail}${c.reset}`);
  }
}

export function printSummary(section: string, results: TCResult[]) {
  const pass = results.filter(r => r.verdict === 'PASS').length;
  const partial = results.filter(r => r.verdict === 'PARTIAL').length;
  const fail = results.filter(r => r.verdict === 'FAIL').length;

  log(c.cyan, `\n${'═'.repeat(60)}`);
  log(c.bold, `📊 ${section} — Summary`);
  log(c.cyan, `${'═'.repeat(60)}`);
  log(c.green,  `  🟢 PASS:    ${pass}`);
  log(c.yellow, `  🟡 PARTIAL: ${partial}`);
  log(c.red,    `  🔴 FAIL:    ${fail}`);
  log(c.bold,   `  Total:      ${results.length}`);
  log(c.cyan, `${'─'.repeat(60)}\n`);
}

export function printFinalSummary(allResults: TCResult[]) {
  const pass = allResults.filter(r => r.verdict === 'PASS').length;
  const partial = allResults.filter(r => r.verdict === 'PARTIAL').length;
  const fail = allResults.filter(r => r.verdict === 'FAIL').length;
  const total = allResults.length;
  const rate = ((pass / total) * 100).toFixed(1);

  log(c.cyan, `\n${'═'.repeat(60)}`);
  log(c.bold, `🏁 FINAL RESULTS — ALL TEST CASES`);
  log(c.cyan, `${'═'.repeat(60)}`);
  log(c.green,  `  🟢 PASS:    ${pass} / ${total}`);
  log(c.yellow, `  🟡 PARTIAL: ${partial} / ${total}`);
  log(c.red,    `  🔴 FAIL:    ${fail} / ${total}`);
  log(c.bold,   `  Pass Rate:  ${rate}%`);
  log(c.cyan, `${'═'.repeat(60)}\n`);
}

/** Small delay to avoid rate limiting (5 msg / 10s per conv) */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
