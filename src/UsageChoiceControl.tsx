import { useLayoutEffect, useRef } from 'react';
import { privacyNotice } from '../shared/contracts/privacyNotice';
import { useUsageChoice } from './useUsageChoice';

export function UsageChoiceControl() {
  const state = useUsageChoice(); const status = useRef<HTMLParagraphElement>(null); const trigger = useRef<HTMLButtonElement | null>(null);
  useLayoutEffect(() => { const button = trigger.current; trigger.current = null;
    if (button && !button.isConnected && document.activeElement === document.body) status.current?.focus({ preventScroll: true }); }, [state.choice?.decision]);
  const choose = (decision: 'ACCEPTED' | 'REJECTED', button: HTMLButtonElement) => { trigger.current = button; void state.decide(decision); };
  const accepted = state.choice?.decision === 'ACCEPTED';
  return <aside className="usage-choice" aria-label="Analítica y privacidad">
    <a href="/privacidad" target="_blank" rel="noopener noreferrer">Analítica y privacidad</a>
    {(state.choice?.available || accepted) && <>
      <h2>Estadísticas opcionales</h2>
      <p>{privacyNotice.firstLayer}</p><p>{privacyNotice.minorCaution}</p>
      <p>Responsable: {privacyNotice.responsible}. Contacto: <a href={`mailto:${privacyNotice.contact}`}>{privacyNotice.contact}</a>.</p>
      <p ref={status} tabIndex={-1} role="status">{accepted ? 'Permiso aceptado para esta sesión.' : state.choice?.decision === 'REJECTED' ? 'Analítica rechazada. Puedes jugar igual.' : 'Sin elección: no se recoge tu uso. Puedes jugar igual.'}</p>
      {!state.choice?.available && <p>La recogida no está disponible en este momento.</p>}
      <div className="usage-choice-actions" aria-busy={state.busy}>
        {accepted ? <button className="secondary" disabled={state.busy} onClick={event => choose('REJECTED', event.currentTarget)}>Retirar permiso</button>
          : <><button className="secondary" disabled={state.busy} onClick={event => choose('REJECTED', event.currentTarget)}>Rechazar analítica</button>
            <button className="secondary" disabled={state.busy || !state.choice?.available} onClick={event => choose('ACCEPTED', event.currentTarget)}>Aceptar analítica</button></>}
      </div>
    </>}
    {state.error && <p role="alert">{state.error}</p>}
    {state.error && <button className="text-button" disabled={state.busy} onClick={() => void state.refresh()}>Consultar elección</button>}
  </aside>;
}
