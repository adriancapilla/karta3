import { useEffect, useRef, useState } from 'react';
import type { CardView, InitialGameView } from '../shared/contracts/game';
import type { RoomSettings } from '../shared/contracts/room';
import type { DeckInformationView, DeckSummary } from '../shared/contracts/deck';
import { DeckInformation } from './DeckInformation';

export const cardDisplayValue = (value: CardView['values'][string]) => value.displayValue + (value.unit === '' ? '' : ` ${value.unit}`);

export function CardImage({ card }: { card: CardView }) {
  const [failed, setFailed] = useState(false);
  return <div className="game-card-image">
    {card.imageUrl && !failed ? <img src={card.imageUrl} alt={card.imageAlt} onError={() => setFailed(true)} />
      : <svg viewBox="0 0 80 70" aria-hidden="true"><rect x="17" y="5" width="46" height="60" rx="7" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M40 18 52 35 40 52 28 35Z" fill="currentColor" /></svg>}
    {failed && <p role="status">No se pudo cargar la imagen</p>}
  </div>;
}

export function CardInformation({ card, attributes, activeAttributeId, details = false, valueMode = 'PLAY_VALUE' }: {
  card: CardView; attributes: InitialGameView['attributes']; activeAttributeId: string; details?: boolean; valueMode?: RoomSettings['attributeValueMode'];
}) {
  if (!details) {
    const ownAttribute = attributes.find((attribute) => attribute.id === card.roundAttribute)!;
    return <>
      <div className="card-heading"><h3>{card.name}</h3><span className="card-round-attribute" role="img" aria-label={`Atributo indicador: ${ownAttribute.name}`}>{['●', '▲', '■'][attributes.indexOf(ownAttribute)]}</span></div>
      <CardImage key={`${card.id}:${card.imageUrl}`} card={card} />
      <table className="card-values"><thead><tr><th scope="col">Atributo</th><th scope="col">{valueMode === 'PLAY_VALUE' ? '1-58' : 'Dato'}</th></tr></thead>
        <tbody>{attributes.map((attribute, index) => <tr key={attribute.id} className={attribute.id === activeAttributeId ? 'active-attribute' : undefined}>
          <th scope="row" aria-label={attribute.id === activeAttributeId ? `${attribute.name}, atributo activo` : attribute.name}><span aria-hidden="true">{['●', '▲', '■'][index]} </span>{attribute.name}{attribute.id === activeAttributeId && <span className="active-mark" aria-hidden="true">◆</span>}</th>
          <td>{valueMode === 'PLAY_VALUE' ? card.values[attribute.id].playValue : cardDisplayValue(card.values[attribute.id])}</td>
        </tr>)}</tbody>
      </table>
    </>;
  }
  return <>
    <CardImage key={`${card.id}:${card.imageUrl}`} card={card} />
    {details && card.characteristic.trim() && <p className="card-characteristic">{card.characteristic}</p>}
    <table className="card-values"><thead><tr><th scope="col">Atributo</th><th scope="col">Dato</th></tr></thead>
      <tbody>{attributes.map((attribute, index) => <tr key={attribute.id} className={attribute.id === activeAttributeId ? 'active-attribute' : undefined}>
        <th scope="row"><span aria-hidden="true">{['●', '▲', '■'][index]} </span>{attribute.name}{attribute.id === activeAttributeId && <span className="active-label">Activo</span>}</th>
        <td>{cardDisplayValue(card.values[attribute.id])}</td>
      </tr>)}</tbody>
    </table>
    {details && card.note.trim() && <p className="card-note">{card.note}</p>}
  </>;
}

export function GameCard({ card, attributes, activeAttributeId, onDetails, onChoose, selected = false, disabled = false, valueMode = 'PLAY_VALUE' }: {
  card: CardView; attributes: InitialGameView['attributes']; activeAttributeId: string; onDetails: (card: CardView, button: HTMLButtonElement) => void;
  onChoose?: (id: string) => void; selected?: boolean; disabled?: boolean; valueMode?: RoomSettings['attributeValueMode'];
}) {
  const pointer = useRef({ x: 0, y: 0, dragged: false });
  return <div className="game-card-slot" data-card-id={card.id}>
    <article className={`game-card${selected ? ' selected-card' : ''}`}>
    <div className={onChoose ? 'card-play-surface' : undefined}
      onPointerDown={(event) => { pointer.current = { x: event.clientX, y: event.clientY, dragged: false }; }}
      onPointerMove={(event) => { if (Math.hypot(event.clientX - pointer.current.x, event.clientY - pointer.current.y) > 6) pointer.current.dragged = true; }}
      onPointerCancel={() => { pointer.current.dragged = true; }}
      onClick={() => { if (!disabled && !pointer.current.dragged) onChoose?.(card.id); }}>
      <CardInformation card={card} attributes={attributes} activeAttributeId={activeAttributeId} valueMode={valueMode} />
    </div>
    <button className="secondary card-details-button" aria-label={`Detalles de ${card.name}`} onClick={(event) => onDetails(card, event.currentTarget)}>Detalles</button>
    </article>
    {onChoose && <button className="primary card-play-button" aria-label={`Jugar ${card.name}`} aria-pressed={selected} disabled={disabled} onClick={() => onChoose(card.id)}>{selected ? 'Carta seleccionada' : 'Jugar carta'}</button>}
  </div>;
}

export function CardDetails({ card, attributes, activeAttributeId, onClose, deck, information, context }: {
  card: CardView; attributes: InitialGameView['attributes']; activeAttributeId: string; onClose: () => void;
  deck?: DeckSummary; information?: DeckInformationView; context?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (dialog.current && !dialog.current.open) dialog.current.showModal(); closeButton.current?.focus(); }, []);
  return <dialog ref={dialog} className="card-details-dialog" aria-labelledby="card-details-title" onClose={event => { event.stopPropagation(); onClose(); }}>
    <h2 id="card-details-title">Detalles de {card.name}</h2>
    <CardInformation card={card} attributes={attributes} activeAttributeId={activeAttributeId} details />
    {deck && information && <DeckInformation deck={deck} information={information} context={context ?? ''} />}
    <button ref={closeButton} className="secondary" autoFocus onClick={() => dialog.current?.close()}>Cerrar detalles</button>
  </dialog>;
}
