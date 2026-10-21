import { appearanceThemes, type AppearanceTheme, type AppearanceValue } from '../shared/contracts/appearance';

export const appearanceKey = 'karta3.appearance.v1';
type State = AppearanceValue & { saveFailed: boolean };
let state: State = { theme: 'LIGHT', origin: 'DEFAULT', saveFailed: false };
const listeners = new Set<() => void>();
export function readAppearance(text: string | null): AppearanceValue {
  try {
    const v = JSON.parse(text ?? 'null');
    if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 2 && v.version === 1
      && appearanceThemes.includes(v.theme)) return { theme: v.theme, origin: 'EXPLICIT' };
  } catch { /* Una preferencia inválida nunca impide entrar. */ }
  return { theme: 'LIGHT', origin: 'DEFAULT' };
}
function apply(next: State) {
  document.documentElement.dataset.appearance = next.theme;
  document.documentElement.style.colorScheme = next.theme === 'DARK' || next.theme === 'HIGH_CONTRAST' ? 'dark' : 'light';
  if (state.theme === next.theme && state.origin === next.origin && state.saveFailed === next.saveFailed) return;
  state = next; for (const listener of listeners) listener();
}
export function initializeAppearance() {
  try { apply({ ...readAppearance(localStorage.getItem(appearanceKey)), saveFailed: false }); }
  catch { apply({ theme: 'LIGHT', origin: 'DEFAULT', saveFailed: false }); }
}
export function chooseAppearance(theme: AppearanceTheme) {
  if (!appearanceThemes.includes(theme)) return;
  let saveFailed = false;
  try { localStorage.setItem(appearanceKey, JSON.stringify({ version: 1, theme })); } catch { saveFailed = true; }
  apply({ theme, origin: 'EXPLICIT', saveFailed });
}
export function appearanceStorageChanged(event: Pick<StorageEvent, 'key'>) {
  if (event.key !== null && event.key !== appearanceKey) return;
  // Releer la escritura vigente: event.newValue puede pertenecer a una escritura anterior.
  try { apply({ ...readAppearance(localStorage.getItem(appearanceKey)), saveFailed: false }); } catch { /* Conservar memoria local. */ }
}
export const currentAppearance = () => state;
export const subscribeAppearance = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
