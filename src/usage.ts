import type { BrowserUsageEvent, UsageContext } from '../shared/contracts/usage';

let enabled = false;
let visit: { id: string; born: number; last: number } | undefined;
let homeVisible = false;
let shown = false;
let leftInitialRoute = false;
export function configureBrowserUsage(value: string | null) { enabled = value === 'synthetic'; }
function visitId() {
  const now = Date.now();
  if (!visit || now - visit.last >= 30 * 60_000 || now - visit.born >= 12 * 60 * 60_000) visit = { id: crypto.randomUUID(), born: now, last: now };
  visit.last = now; return visit.id;
}
function record(event: BrowserUsageEvent) {
  const born = Date.now();
  const post = async (retry: boolean) => {
    if (!enabled || Date.now() - born > 10_000) return;
    let retryable: boolean;
    try { const result = await fetch('/api/usage/events', { method: 'POST', credentials: 'omit', keepalive: true,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) }); retryable = result.status >= 500; }
    catch { retryable = true; }
    if (retry && retryable) window.setTimeout(() => void post(false), 500);
  };
  void post(true);
}
export function usageHome(visible: boolean) {
  if (!visible) { homeVisible = false; leftInitialRoute = true; return; }
  if (homeVisible) return; homeVisible = true;
  if (!enabled) return;
  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const navigation = shown || leftInitialRoute ? 'SPA_RETURN' : entry?.type === 'reload' ? 'DOCUMENT_RELOAD' : 'DOCUMENT_INITIAL';
  shown = true;
  record({ eventId: crypto.randomUUID(), version: 1, visitId: visitId(), name: 'home_viewed', data: { viewId: crypto.randomUUID(), navigation } });
}
export function beginUsageIntent(kind: 'create' | 'join'): UsageContext | undefined {
  if (!enabled) return;
  const context = { visitId: visitId(), intentId: crypto.randomUUID() };
  record({ eventId: crypto.randomUUID(), version: 1, visitId: context.visitId,
    name: kind === 'create' ? 'room_create_intended' : 'room_join_attempted', data: { intentId: context.intentId } });
  return context;
}
