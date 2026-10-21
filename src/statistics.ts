import { STATISTICS_NOTICE_VERSION, type AppearancePermissionRequest, type AppearancePermissionView, type AppearanceSnapshot, type ExclusionRequest, type ExclusionView, type StatisticsStateEvent } from '../shared/contracts/statistics';

type State = { available: boolean; exclusion: ExclusionView | null; appearance: AppearancePermissionView | null; busy: boolean; error: string; persistence: string };
let state: State = { available: false, exclusion: null, appearance: null, busy: false, error: '', persistence: '' };
let generation = 0; let sequence = 0; let lastSignal = 0; let localCut = false; let appearanceCut = false;
let active = false; let initializing: Promise<void> | undefined;
let refreshing: { generation: number; promise: Promise<void> } | undefined; let preferencesGeneration = -1;
let pendingExclusion: ExclusionRequest | undefined; let pendingAppearance: AppearancePermissionRequest | undefined; let remoteCutPending = false;
let homeVisible = false; let homeSent = false;
const listeners = new Set<() => void>(); const invalidated = new Set<() => void>(); const retries = new Set<number>();
let channel: BroadcastChannel | undefined;
const publish = (change: Partial<State>) => { state = { ...state, ...change }; for (const listener of listeners) listener(); };
export const statisticsState = () => state;
export function subscribeStatistics(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function onStatisticsInvalidated(listener: () => void) { invalidated.add(listener); return () => { invalidated.delete(listener); }; }
function clearCaptures() { for (const timer of retries) window.clearTimeout(timer); retries.clear(); for (const listener of invalidated) listener(); }
export function statisticsTicket() { return { generation, sequence: ++sequence }; }
export function collectionSignal(value: string | null, ticket: ReturnType<typeof statisticsTicket>) {
  if (ticket.generation !== generation || ticket.sequence < lastSignal) return; lastSignal = ticket.sequence;
  const available = value === 'aggregate' || value === 'synthetic';
  if (!available) clearCaptures(); publish({ available });
}
export function suspendStatistics() {
  generation++; clearCaptures(); publish({ appearance: null, available: false });
}
export function canCaptureAppearance() {
  return active && preferencesGeneration === generation && !localCut && !appearanceCut && state.available && state.exclusion?.eligibility === 'DEFAULT_ALLOWED'
    && state.appearance?.state === 'GRANTED' && state.appearance.noticeVersion === STATISTICS_NOTICE_VERSION
    && state.appearance.validUntil !== null && Date.now() < state.appearance.validUntil;
}
async function request<T>(path: string, input?: object): Promise<T> {
  const ticket = statisticsTicket();
  const response = await fetch(`/api/statistics/${path}`, { credentials: 'same-origin', ...(input ? { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) } : {}), signal: AbortSignal.timeout(5000) });
  collectionSignal(response.headers.get('X-Karta3-Statistics-Collection'), ticket);
  const body = await response.json(); if (!response.ok) throw new Error(body?.error?.code === 'CHOICE_CONFLICT' ? 'CHOICE_CONFLICT' : 'No se pudo confirmar en el servidor.');
  return body as T;
}
function accept(exclusion: ExclusionView, appearance: AppearancePermissionView) {
  if (state.exclusion && exclusion.revision < state.exclusion.revision) return;
  if (state.appearance && appearance.revision < state.appearance.revision && appearance.state === 'GRANTED') return;
  if (exclusion.eligibility !== 'DEFAULT_ALLOWED') {
    localCut = true; if (exclusion.excluded) { pendingExclusion = undefined; remoteCutPending = false; }
  } else if (!pendingExclusion?.excluded && !remoteCutPending) localCut = false;
  if (appearance.state !== 'GRANTED') { appearanceCut = true; if (pendingAppearance?.decision !== 'GRANT') pendingAppearance = undefined; }
  else if (!pendingAppearance || pendingAppearance.decision === 'GRANT') { appearanceCut = false; pendingAppearance = undefined; }
  if (exclusion.eligibility !== 'DEFAULT_ALLOWED' || appearance.state !== 'GRANTED') clearCaptures();
  preferencesGeneration = generation; publish({ exclusion, appearance }); tryHome();
}
async function performRefresh() {
  const own = ++sequence; const gen = generation;
  let exclusionConfirmed = false;
  try {
    const exclusion = await request<ExclusionView>('exclusion');
    if (!active || gen !== generation || own < lastRefresh) return;
    if (!state.exclusion || exclusion.revision >= state.exclusion.revision) {
      if (exclusion.eligibility !== 'DEFAULT_ALLOWED') { localCut = true; if (exclusion.excluded) remoteCutPending = false; }
      else if (!pendingExclusion?.excluded && !remoteCutPending) localCut = false;
      preferencesGeneration = generation; publish({ exclusion, appearance: null }); tryHome();
      exclusionConfirmed = true;
    }
    const appearance = await request<AppearancePermissionView>('appearance-permission');
    if (!active || gen !== generation || own < lastRefresh) return; lastRefresh = own;
    accept(exclusion, appearance); publish({ error: '' });
  } catch { if (active && gen === generation) { if (!exclusionConfirmed) preferencesGeneration = -1; clearCaptures();
    publish({ error: exclusionConfirmed ? 'No se pudo consultar el permiso de apariencia.' : 'No se pudieron consultar las preferencias estadísticas.', appearance: null }); } }
}
let lastRefresh = 0;
export function refreshStatistics() {
  if (refreshing?.generation === generation) return refreshing.promise;
  const gen = generation; const promise = performRefresh().finally(() => { if (refreshing?.promise === promise) refreshing = undefined; });
  refreshing = { generation: gen, promise }; return promise;
}
export function startStatistics() {
  active = true;
  if (!channel && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('karta3.statistics.functional');
    channel.onmessage = event => {
      if (event.data === true) {
        if (state.exclusion?.eligibility === 'EXCLUDED' && preferencesGeneration === generation) return;
        localCut = true; remoteCutPending = true; suspendStatistics();
        publish({ error: 'Exclusión aplicada aquí; pendiente de confirmar en el servidor' }); return;
      } else if (event.data === false) {
        remoteCutPending = false;
        // Una confirmación propia del servidor ya recibida satisface esta reconciliación.
        if (state.exclusion?.eligibility === 'DEFAULT_ALLOWED' && preferencesGeneration === generation) return;
      } else return;
      void refreshStatistics(); // Una señal de inclusión solo relee; no concede por sí misma.
    };
  }
  if (!initializing) initializing = refreshStatistics().finally(() => { initializing = undefined; });
}
export function statisticsConnected() {
  const reconcile = !active || preferencesGeneration !== generation || !state.exclusion;
  active = true; if (reconcile) void refreshStatistics();
}
export function statisticsDisconnected() { active = false; suspendStatistics(); publish({ exclusion: null }); }
export function statisticsChanged(view: StatisticsStateEvent) {
  if (!active) return;
  if (preferencesGeneration !== generation && !state.exclusion) { void refreshStatistics(); return; }
  if (state.exclusion && view.exclusion.revision < state.exclusion.revision) return;
  if (view.exclusion.eligibility !== 'DEFAULT_ALLOWED') { localCut = true; clearCaptures(); }
  if (view.appearance.state !== 'GRANTED') { appearanceCut = true; clearCaptures(); }
  accept(view.exclusion, view.appearance);
  publish({ available: view.available });
  if (!pendingExclusion && !pendingAppearance && !remoteCutPending) publish({ error: '' });
}
export async function chooseExclusion(excluded: boolean) {
  const previous = state.exclusion; if (!previous || state.busy) return;
  if (excluded) { localCut = true; suspendStatistics(); channel?.postMessage(true); }
  const gen = generation;
  const input: ExclusionRequest = pendingExclusion?.excluded === excluded ? pendingExclusion : { excluded, expectedRevision: previous.revision, requestId: crypto.randomUUID() };
  pendingExclusion = input;
  publish({ busy: true, error: '' });
  try {
    const result = await request<ExclusionView>('exclusion', input); if (gen !== generation) return;
    if (excluded && !result.excluded) throw new Error('CHOICE_CONFLICT');
    localCut = excluded; pendingExclusion = undefined; publish({ exclusion: result });
    const cookie = document.cookie.split(';').map(x => x.trim()).some(x => x === `karta3_statistics_exclusion=1%3A${excluded ? 1 : 0}` || x === `karta3_statistics_exclusion=1:${excluded ? 1 : 0}`);
    publish({ persistence: cookie ? 'Preferencia recordada en este navegador durante doce meses desde esta elección.' : 'Preferencia confirmada en la sesión; el navegador no ha confirmado la cookie. Su alcance puede ser temporal.' });
    channel?.postMessage(excluded);
    if (state.appearance) accept(result, { ...state.appearance, revision: result.revision });
  } catch (error) { if (error instanceof Error && error.message === 'CHOICE_CONFLICT') { pendingExclusion = undefined; void refreshStatistics(); }
    publish({ error: excluded ? 'Exclusión aplicada aquí; pendiente de confirmar en el servidor' : 'Inclusión sin confirmar. Consulta el estado antes de reintentar.' }); }
  finally { publish({ busy: false }); }
}
export async function chooseAppearance(decision: AppearancePermissionRequest['decision']) {
  const previous = state.appearance; if (!previous || state.busy) return;
  if (decision !== 'GRANT') { appearanceCut = true; clearCaptures(); }
  const gen = generation;
  const input: AppearancePermissionRequest = pendingAppearance?.decision === decision ? pendingAppearance : { decision, noticeVersion: STATISTICS_NOTICE_VERSION,
    expectedRevision: Math.max(previous.revision, state.exclusion?.revision ?? 0), requestId: crypto.randomUUID() };
  pendingAppearance = input;
  publish({ busy: true, error: '' });
  try {
    const result = await request<AppearancePermissionView>('appearance-permission', input);
    if (gen !== generation) return;
    if (decision === 'GRANT' && result.state !== 'GRANTED') throw new Error('CHOICE_CONFLICT');
    appearanceCut = decision !== 'GRANT'; pendingAppearance = undefined;
    if (state.exclusion) accept({ ...state.exclusion, revision: result.revision }, result);
  } catch (error) { if (error instanceof Error && error.message === 'CHOICE_CONFLICT') { pendingAppearance = undefined; void refreshStatistics(); }
    publish({ error: decision === 'GRANT' ? 'Permiso sin confirmar. Consulta el estado antes de reintentar.' : 'Permiso retirado aquí; pendiente de confirmar en el servidor.' }); }
  finally { publish({ busy: false }); }
}
export function statisticsHome(visible: boolean) {
  if (!visible) { homeVisible = false; homeSent = false; return; }
  homeVisible = true; tryHome();
}
function tryHome() {
  if (!active || preferencesGeneration !== generation || !homeVisible || homeSent || !state.available || localCut || state.exclusion?.eligibility !== 'DEFAULT_ALLOWED') return;
  if (document.visibilityState === 'hidden') return;
  homeSent = true;
  void fetch('/api/statistics/home-view', { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: '{"version":1}' }).catch(() => {});
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', tryHome);
export function recordAppearance(data: Omit<AppearanceSnapshot, 'version'>, valid: () => boolean) {
  const gen = generation; const born = performance.now();
  const post = async (retry: boolean) => {
    if (gen !== generation || !canCaptureAppearance() || !valid() || performance.now() - born >= 10_000) return;
    let failed: boolean;
    try { const response = await fetch('/api/statistics/appearance', { method: 'POST', credentials: 'same-origin', keepalive: true,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: 1, ...data }) }); failed = response.status >= 500; }
    catch { failed = true; }
    if (failed && retry && gen === generation && canCaptureAppearance() && valid()) {
      const timer = window.setTimeout(() => { retries.delete(timer); void post(false); }, 500); retries.add(timer);
    }
  }; void post(true);
}
