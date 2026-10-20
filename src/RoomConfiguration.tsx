import { useEffect, useState } from 'react';
import type { ConfigurationChange, RoomView, WaitingRoomView } from '../shared/contracts/room';
import type { DeckSummary } from '../shared/contracts/deck';
import { api } from './api';
import { useRoomConfiguration } from './useRoomConfiguration';
import type { ConfigurationField } from './configurationState';
import { DeckInformation } from './DeckInformation';
import { AppearanceControl } from './AppearanceControl';

type Catalog = { status: 'LOADING' | 'READY' | 'ERROR'; decks: readonly DeckSummary[]; showReload: boolean };
function useDeckCatalog(host: boolean) {
  const [catalog, setCatalog] = useState<Catalog>({ status: 'LOADING', decks: [], showReload: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!host) return;
    let active = true;
    void api.decks().then((result) => { if (active) setCatalog((previous) => ({ status: 'READY', decks: result.decks, showReload: previous.showReload })); })
      .catch(() => { if (active) setCatalog({ status: 'ERROR', decks: [], showReload: true }); });
    return () => { active = false; };
  }, [host, attempt]);
  return { catalog, retry: () => { setCatalog((previous) => ({ ...previous, status: 'LOADING', decks: [] })); setAttempt((value) => value + 1); } };
}

function NeutralCard() {
  return <svg className="neutral-card" viewBox="0 0 80 100" aria-hidden="true"><rect x="9" y="5" width="62" height="90" rx="9" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M40 32 54 50 40 68 26 50Z" fill="currentColor" /></svg>;
}
function DeckCard({ deck }: { deck: DeckSummary }) {
  const [failed, setFailed] = useState(false);
  return <div className="deck-card">
    {deck.imageUrl && !failed ? <img className="deck-cover" src={deck.imageUrl} alt={deck.imageAlt} onError={() => setFailed(true)} /> : <NeutralCard />}
    <div><h3>{deck.name} · v{deck.contentVersion}</h3><p>{deck.subtitle}</p><p>{deck.description}</p>
      {failed && <p role="status">No se pudo cargar la portada</p>}
    </div>
  </div>;
}
const deckValue = (value: { id: string; contentVersion: number } | null) => value ? JSON.stringify({ id: value.id, contentVersion: value.contentVersion }) : '';

export function RoomConfiguration({ room, connected, onRoom, onPendingChange }: { room: WaitingRoomView; connected: boolean; onRoom: (room: RoomView) => boolean; onPendingChange: (pending: boolean) => void }) {
  const host = room.participant.role === 'HOST';
  const { catalog, retry } = useDeckCatalog(host);
  const { attempts, change } = useRoomConfiguration(room, onRoom);
  const pending = Object.values(attempts).some((attempt) => attempt?.status === 'PENDING');
  useEffect(() => { onPendingChange(pending); }, [pending, onPendingChange]);
  const acceptedDeck = room.selectedDeck;
  const pendingDeck = attempts.deck?.status === 'PENDING' && attempts.deck.change.field === 'deck' ? attempts.deck.change.value : undefined;
  const options = [...catalog.decks];
  // La opción vigente permanece durante carga/error, sin habilitar selecciones nuevas de una respuesta fallida.
  if (acceptedDeck && !options.some((deck) => deck.id === acceptedDeck.id && deck.contentVersion === acceptedDeck.contentVersion)) options.unshift(acceptedDeck);
  const info = (field: ConfigurationField) => {
    const attempt = attempts[field];
    return <p id={`config-${field}-state`} className={attempt?.status === 'ERROR' ? 'field-error' : 'control-state'}
      role={attempt?.status === 'ERROR' ? 'alert' : 'status'}>{attempt?.message ?? ''}</p>;
  };
  const attrs = (field: ConfigurationField) => ({ id: `config-${field}`, 'aria-describedby': `config-${field}-state`, 'aria-invalid': attempts[field]?.status === 'ERROR' });
  const shown = (field: Exclude<ConfigurationField, 'deck'>) => attempts[field]?.status === 'PENDING' ? attempts[field]!.change.value : room.settings[field];
  const submit = (value: ConfigurationChange) => void change(value);
  return <section className="configuration" aria-labelledby="configuration-heading">
    <h2 id="configuration-heading" tabIndex={-1}>Configuración</h2>
    {host ? <>
      <p className="configuration-hint">Cada cambio se aplica al confirmarlo el servidor.</p>
      <div className="config-control">
        <label htmlFor="config-deck">Baraja</label>
        <select {...attrs('deck')} value={deckValue(pendingDeck !== undefined ? pendingDeck : acceptedDeck)}
          onChange={(event) => submit({ field: 'deck', value: event.target.value ? JSON.parse(event.target.value) as { id: string; contentVersion: number } : null })}>
          <option value="">Sin baraja seleccionada</option>
          {options.map((deck) => <option key={deckValue(deck)} value={deckValue(deck)}>{deck.name} · v{deck.contentVersion}</option>)}
        </select>
        {catalog.status === 'LOADING' && <p role="status">Cargando barajas…</p>}
        {catalog.status === 'READY' && !catalog.decks.length && <p role="status">No hay barajas disponibles. Puedes configurar las demás opciones.</p>}
        {catalog.status === 'ERROR' && <p role="alert">No se pudieron cargar las barajas</p>}
        {catalog.showReload && <button id="catalog-reload" className="secondary" onClick={retry}>{catalog.status === 'READY' ? 'Actualizar catálogo' : 'Reintentar'}</button>}
        {info('deck')}
        {attempts.deck?.status === 'ERROR' && <button className="text-button" onClick={retry}>Volver a consultar el catálogo</button>}
      </div>
    </> : <p className="configuration-hint">Valores aceptados por el anfitrión.</p>}
    {acceptedDeck ? <DeckCard key={deckValue(acceptedDeck)} deck={acceptedDeck} /> : <p className="no-deck">Sin baraja seleccionada</p>}
    <DeckInformation deck={acceptedDeck} information={room.deckInformation} context={room.id} />
    {host ? <div className="configuration-controls">
      <div className="config-control"><label htmlFor="config-attributeValueMode">Valor del Atributo</label><select {...attrs('attributeValueMode')} value={String(shown('attributeValueMode'))}
        onChange={(event) => submit({ field: 'attributeValueMode', value: event.target.value as 'PLAY_VALUE' | 'DISPLAY_VALUE' })}>
        <option value="PLAY_VALUE">1-58</option><option value="DISPLAY_VALUE">Dato</option>
      </select>{info('attributeValueMode')}</div>
      <div className="config-control"><label className="check-label" htmlFor="config-optimizeForMobile"><input {...attrs('optimizeForMobile')} type="checkbox" checked={shown('optimizeForMobile') === true}
        onChange={(event) => submit({ field: 'optimizeForMobile', value: event.target.checked })} />Optimizar para móvil</label>{info('optimizeForMobile')}</div>
      <div className="config-control"><label className="check-label" htmlFor="config-hostPlays"><input {...attrs('hostPlays')} type="checkbox" checked={shown('hostPlays') === true}
        onChange={(event) => submit({ field: 'hostPlays', value: event.target.checked })} />El anfitrión juega</label>{info('hostPlays')}</div>
      <div className="config-control"><label htmlFor="config-turnSeconds">Tiempo por turno</label><select {...attrs('turnSeconds')} value={String(shown('turnSeconds'))}
        onChange={(event) => submit({ field: 'turnSeconds', value: Number(event.target.value) as 15 | 30 | 60 })}>
        {[15, 30, 60].map((value) => <option key={value} value={value}>{value} s</option>)}
      </select>{info('turnSeconds')}</div>
      <div className="config-control"><label className="check-label" htmlFor="config-forceTieBreak"><input {...attrs('forceTieBreak')} type="checkbox" checked={shown('forceTieBreak') === true}
        onChange={(event) => submit({ field: 'forceTieBreak', value: event.target.checked })} />Forzar desempate</label>{info('forceTieBreak')}</div>
      <div className="config-control"><label htmlFor="config-reviewSeconds">Revisión de ronda</label><select {...attrs('reviewSeconds')} value={String(shown('reviewSeconds'))}
        onChange={(event) => submit({ field: 'reviewSeconds', value: Number(event.target.value) as 0 | 2 | 5 | 10 | 15 | 30 })}>
        {[0, 2, 5, 10, 15, 30].map((value) => <option key={value} value={value}>{value === 0 ? 'Sin pausa (0 s)' : `${value} s`}</option>)}
      </select>{info('reviewSeconds')}</div>
      {!connected && <p className="connection-notice">Sin conexión. Los cambios no se enviarán hasta un nuevo gesto con conexión.</p>}
    </div> : <dl className="configuration-summary">
      <dt>Valor del Atributo</dt><dd>{room.settings.attributeValueMode === 'PLAY_VALUE' ? '1-58' : 'Dato'}</dd>
      <dt>Optimizar para móvil</dt><dd>{room.settings.optimizeForMobile ? 'Sí' : 'No'}</dd>
      <dt>El anfitrión juega</dt><dd>{room.settings.hostPlays ? 'Sí' : 'No (observador)'}</dd>
      <dt>Tiempo por turno</dt><dd>{room.settings.turnSeconds} s</dd>
      <dt>Forzar desempate</dt><dd>{room.settings.forceTieBreak ? 'Sí' : 'No'}</dd>
      <dt>Revisión de ronda</dt><dd>{room.settings.reviewSeconds === 0 ? 'Sin pausa (0 s)' : `${room.settings.reviewSeconds} s`}</dd>
    </dl>}
    <div className="personal-preference"><p>Preferencia personal</p><AppearanceControl labelled /></div>
  </section>;
}
