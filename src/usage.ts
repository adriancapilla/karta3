import type { BrowserUsageEvent, UsageContext } from '../shared/contracts/usage';

let enabled = false;
let mode: 'synthetic' | 'human' | undefined;
let locallyBlocked = false;
let generation = 0;
let sequence = 0;
let lastSignal = 0;
let contexts = new WeakSet<UsageContext>();
const retries = new Set<number>();
const invalidated = new Set<() => void>();
let visit: { id: string; born: number; last: number } | undefined;
let homeVisible = false;
let shown = false;
let leftInitialRoute = false;
let observedHome = false;
export function usageSignalTicket() { return { generation, sequence: ++sequence }; }
export function invalidateBrowserUsage(ticket?: ReturnType<typeof usageSignalTicket>) {
  if (ticket && ticket.generation !== generation) return;
  enabled = false; mode = undefined; generation++; visit = undefined; contexts = new WeakSet();
  for (const timer of retries) window.clearTimeout(timer); retries.clear();
  for (const listener of invalidated) listener();
}
export function onUsageInvalidated(listener: () => void) { invalidated.add(listener); return () => { invalidated.delete(listener); }; }
export function suspendBrowserUsage() { locallyBlocked = true; invalidateBrowserUsage(); }
export function releaseUsageSuppression() { locallyBlocked = false; }
export function browserUsageMode() { return mode; }
export function configureBrowserUsage(value: string | null, ticket = usageSignalTicket()) {
  if (ticket.generation !== generation || ticket.sequence < lastSignal) return;
  lastSignal = ticket.sequence;
  if (value !== 'synthetic' && value !== 'human') { invalidateBrowserUsage(ticket); return; }
  if (locallyBlocked) return;
  if (mode && mode !== value) invalidateBrowserUsage();
  enabled = true; mode = value;
}
export function currentUsageContext(context?: UsageContext) { return enabled && context && contexts.has(context) ? context : undefined; }
function visitId() {
  const now = Date.now();
  if (!visit || now - visit.last >= 30 * 60_000 || now - visit.born >= 12 * 60 * 60_000) visit = { id: crypto.randomUUID(), born: now, last: now };
  visit.last = now; return visit.id;
}
function record(event: BrowserUsageEvent, valid: () => boolean = () => true) {
  const born = Date.now();
  const eventGeneration = generation;
  const post = async (retry: boolean) => {
    if (!enabled || generation !== eventGeneration || Date.now() - born > 10_000 || !valid()) return;
    const ticket = usageSignalTicket();
    let retryable: boolean;
    try { const result = await fetch('/api/usage/events', { method: 'POST', credentials: mode === 'human' || event.name === 'appearance_snapshot' ? 'same-origin' : 'omit', keepalive: true,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
      configureBrowserUsage(result.headers.get('X-Karta3-Usage-Collection'), ticket); retryable = result.status >= 500; }
    catch { retryable = true; }
    if (retry && retryable && enabled && generation === eventGeneration) {
      const timer = window.setTimeout(() => { retries.delete(timer); void post(false); }, 500); retries.add(timer);
    }
  };
  void post(true);
}
export function recordAppearance(data: Extract<BrowserUsageEvent, { name: 'appearance_snapshot' }>['data'], valid: () => boolean) {
  if (!enabled || !valid()) return;
  record({ eventId: crypto.randomUUID(), version: 1, visitId: visitId(), name: 'appearance_snapshot', data }, valid);
}
export function usageHome(visible: boolean) {
  if (!visible) { homeVisible = false; observedHome = false; leftInitialRoute = true; return; }
  if (homeVisible) return; homeVisible = true;
  if (!enabled) return;
  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const navigation = shown || leftInitialRoute ? 'SPA_RETURN' : entry?.type === 'reload' ? 'DOCUMENT_RELOAD' : 'DOCUMENT_INITIAL';
  shown = true;
  observedHome = true;
  record({ eventId: crypto.randomUUID(), version: 1, visitId: visitId(), name: 'home_viewed', data: { viewId: crypto.randomUUID(), navigation } });
}
/** Acto confirmado, solo la portada que continúa visible; no reconstruye la llegada. */
export function usageAccepted() {
  if (!enabled || !homeVisible || observedHome) return;
  homeVisible = false; usageHome(true);
}
export function beginUsageIntent(kind: 'create' | 'join'): UsageContext | undefined {
  if (!enabled) return;
  const context = { visitId: visitId(), intentId: crypto.randomUUID() };
  contexts.add(context);
  record({ eventId: crypto.randomUUID(), version: 1, visitId: context.visitId,
    name: kind === 'create' ? 'room_create_intended' : 'room_join_attempted', data: { intentId: context.intentId } });
  return context;
}
