import { useId, useSyncExternalStore } from 'react';
import { appearanceThemes, type AppearanceTheme } from '../shared/contracts/appearance';
import { chooseAppearance, currentAppearance, subscribeAppearance } from './appearance';

const labels = { LIGHT: 'Claro', DARK: 'Oscuro', CREAM: 'Crema', HIGH_CONTRAST: 'Alto contraste' };
export function AppearanceControl({ labelled = false }: { labelled?: boolean }) {
  const state = useSyncExternalStore(subscribeAppearance, currentAppearance);
  const id = useId();
  return <div className="appearance-control">
    <label htmlFor={id} className={labelled ? undefined : 'visually-hidden'}>Apariencia</label>
    <select id={id} aria-describedby={`${id}-help`} value={state.origin === 'DEFAULT' ? '' : state.theme}
      onChange={event => chooseAppearance(event.target.value as AppearanceTheme)}>
      <option value="" disabled hidden>Predefinida</option>
      {appearanceThemes.map(theme => <option key={theme} value={theme}>{labels[theme]}</option>)}
    </select>
    <span id={`${id}-help`} className="visually-hidden">{state.origin === 'DEFAULT' ? 'Claro aplicado por defecto. ' : ''}Preferencia personal de este navegador.</span>
    {state.saveFailed && <small role="status">No se pudo guardar. Se mantiene mientras esta página esté abierta.</small>}
  </div>;
}
