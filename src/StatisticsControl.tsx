import { useEffect, useSyncExternalStore } from 'react';
import { privacyNotice } from '../shared/contracts/privacyNotice';
import { socket } from './socket';
import { chooseAppearance, chooseExclusion, refreshStatistics, startStatistics, statisticsChanged, statisticsConnected, statisticsDisconnected, statisticsState, subscribeStatistics } from './statistics';

export function StatisticsControl() {
  const state = useSyncExternalStore(subscribeStatistics, statisticsState);
  useEffect(() => {
    startStatistics(); socket.on('statistics:state', statisticsChanged); socket.on('connect', statisticsConnected); socket.on('disconnect', statisticsDisconnected);
    return () => { socket.off('statistics:state', statisticsChanged); socket.off('connect', statisticsConnected); socket.off('disconnect', statisticsDisconnected); };
  }, []);
  const pending = state.exclusion?.eligibility === 'PENDING_LEGACY_CHOICE';
  const excluded = state.exclusion?.excluded;
  return <aside className="usage-choice" aria-label="Analítica y privacidad">
    <a href="/privacidad" target="_blank" rel="noopener noreferrer">Analítica y privacidad</a>
    <p>{privacyNotice.firstLayer}</p><p>{privacyNotice.minorCaution}</p>
    <p aria-live="polite">{pending ? 'Confirma si quieres incluir tu actividad en las nuevas estadísticas o excluirla. Puedes seguir jugando sin decidir.' : excluded ? 'Actividad excluida de las estadísticas. Puedes jugar igual.' : 'Las estadísticas generales no requieren permiso de apariencia.'}</p>
    <div className="usage-choice-actions" aria-busy={state.busy}>
      {(!excluded || pending) && <button className="secondary" disabled={state.busy || !state.exclusion} onClick={() => void chooseExclusion(true)}>Excluir mi actividad de las estadísticas</button>}
      {(excluded || pending) && <button className="secondary" disabled={state.busy || !state.exclusion} onClick={() => void chooseExclusion(false)}>Volver a incluir mi actividad</button>}
    </div>
    <h2>Estadísticas de apariencia</h2>
    <p>Con tu permiso, medimos qué apariencia utilizas al entrar en una partida y al recibir su final, y comparamos esos dos momentos. No registramos cada cambio. Puedes jugar y cambiar de apariencia sin permitirlo.</p>
    <p aria-live="polite">{state.appearance?.state === 'GRANTED' ? 'Permiso de apariencia confirmado para esta sesión, como máximo doce horas.' : 'Sin permiso de apariencia: no se consulta ni transmite el tema para estadísticas.'}</p>
    <div className="usage-choice-actions" aria-busy={state.busy}>
      {state.appearance?.state === 'GRANTED' ? <button className="secondary" disabled={state.busy} onClick={() => void chooseAppearance('WITHDRAW')}>Retirar permiso</button>
        : <><button className="secondary" disabled={state.busy || !state.appearance} onClick={() => void chooseAppearance('DECLINE')}>No permitir</button>
          <button className="secondary" disabled={state.busy || !state.available || state.exclusion?.eligibility !== 'DEFAULT_ALLOWED' || !state.appearance} onClick={() => void chooseAppearance('GRANT')}>Permitir</button></>}
    </div>
    {!state.available && <p>La recogida no está disponible en este momento.</p>}
    {state.persistence && <p>{state.persistence}</p>}{state.error && <p aria-live="polite">{state.error}</p>}
    <button className="text-button" disabled={state.busy} onClick={() => void refreshStatistics()}>Consultar preferencias estadísticas</button>
  </aside>;
}
