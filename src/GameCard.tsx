import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { CardView, InitialGameView } from '../shared/contracts/game';
import type { RoomSettings } from '../shared/contracts/room';
import type { DeckInformationView, DeckSummary } from '../shared/contracts/deck';
import { DeckInformation } from './DeckInformation';
import { useCardTitle } from './useCardTitle';

export const cardDisplayValue = (value: CardView['values'][string]) => value.displayValue + (value.unit === '' ? '' : ` ${value.unit}`);

export function CardImage({ card, control }: { card: CardView; control?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  return <div className={`game-card-image${card.imageUrl && !failed ? '' : ' placeholder-card-image'}`}>
    {card.imageUrl && !failed ? <img src={card.imageUrl} alt={card.imageAlt} onError={() => setFailed(true)} />
      : <svg viewBox="0 0 80 70" aria-hidden="true"><rect x="17" y="5" width="46" height="60" rx="7" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M40 18 52 35 40 52 28 35Z" fill="currentColor" /></svg>}
    {failed && <p role="status">No se pudo cargar la imagen</p>}
    {control}
  </div>;
}

function CardHeading({ name, ownName, ownIndex, compact }: { name: string; ownName: string; ownIndex: number; compact: boolean }) {
  const heading = useCardTitle(name, compact);
  return <div ref={heading} className="card-heading"><h3>{name}</h3><span className="card-round-attribute" role="img" aria-label={`Atributo indicador: ${ownName}`}>{['●', '▲', '■'][ownIndex]}</span></div>;
}

export function CardInformation({ card, attributes, activeAttributeId, details = false, valueMode = 'PLAY_VALUE', compact = false, detailsControl }: {
  card: CardView; attributes: InitialGameView['attributes']; activeAttributeId: string; details?: boolean; valueMode?: RoomSettings['attributeValueMode']; compact?: boolean; detailsControl?: ReactNode;
}) {
  if (!details) {
    const ownAttribute = attributes.find((attribute) => attribute.id === card.roundAttribute)!;
    return <>
      <CardHeading name={card.name} ownName={ownAttribute.name} ownIndex={attributes.indexOf(ownAttribute)} compact={compact} />
      <CardImage key={`${card.id}:${card.imageUrl}`} card={card} control={detailsControl} />
      <table className="card-values" aria-label={valueMode === 'PLAY_VALUE' ? 'Valores 1-58' : 'Datos informativos'}><thead><tr><th scope="col">Atributo</th><th scope="col">{valueMode === 'PLAY_VALUE' ? '1-58' : 'Dato'}</th></tr></thead>
        <tbody>{attributes.map((attribute, index) => <tr key={attribute.id} className={attribute.id === activeAttributeId ? 'active-attribute' : undefined}>
          <th scope="row" aria-label={attribute.id === activeAttributeId ? `${attribute.name}, atributo activo` : attribute.name}><span aria-hidden="true">{!compact && index === 0 ? <svg className="attribute-circle" viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" /></svg> : ['●', '▲', '■'][index]} </span>{attribute.name}{compact && attribute.id === activeAttributeId && <span className="active-mark" aria-hidden="true">◆</span>}</th>
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

export function GameCard({ card, attributes, activeAttributeId, onDetails, onChoose, selected = false, disabled = false, valueMode = 'PLAY_VALUE', compact = false }: {
  card: CardView; attributes: InitialGameView['attributes']; activeAttributeId: string; onDetails: (card: CardView, button: HTMLButtonElement) => void;
  onChoose?: (id: string) => void; selected?: boolean; disabled?: boolean; valueMode?: RoomSettings['attributeValueMode']; compact?: boolean;
}) {
  const pointer = useRef({ x: 0, y: 0, dragged: false });
  const detailsFocus = useRef<{ button: HTMLButtonElement | null; cardId?: string; restore: boolean }>({ button: null, restore: false });
  const attachDetails = useCallback((button: HTMLButtonElement | null) => {
    const focus = detailsFocus.current;
    // React retira el ref antes de quitar el botón: conservar foco solo si era suyo.
    if (!button) focus.restore = focus.button === document.activeElement;
    focus.button = button;
    if (button) {
      const cardId = button.closest<HTMLElement>('[data-card-id]')?.dataset.cardId;
      if (focus.restore && cardId === focus.cardId) button.focus();
      focus.cardId = cardId; focus.restore = false;
    }
  }, []);
  const face = useRef<HTMLDivElement>(null);
  const [tightRows, setTightRows] = useState(false);
  useLayoutEffect(() => {
    if (compact || !face.current) return;
    const content = face.current;
    const cardElement = content.parentElement!;
    const heading = content.querySelector<HTMLElement>('.card-heading')!;
    const picture = content.querySelector<HTMLElement>('.game-card-image')!;
    const table = content.querySelector<HTMLTableElement>('table')!;
    const observer = new ResizeObserver(() => {
      const padding = Number.parseFloat(getComputedStyle(table.querySelector('tbody th')!).paddingTop);
      // Medir siempre las filas con su relleno original de 6 px evita oscilar al ajustar.
      const originalRows = table.getBoundingClientRect().height + 6 * (6 - padding);
      const needed = heading.getBoundingClientRect().height + Number.parseFloat(getComputedStyle(heading).marginBottom)
        + picture.getBoundingClientRect().height + originalRows;
      setTightRows(Math.abs(cardElement.getBoundingClientRect().height - 321) < 0.5 && padding <= 6
        && needed > content.getBoundingClientRect().height + 0.05);
    });
    for (const element of [cardElement, heading, picture, table]) observer.observe(element);
    return () => observer.disconnect();
  }, [compact, card.id]);
  const detailsButton = <button ref={attachDetails} className={`secondary card-details-button${compact ? '' : ' card-details-overlay'}`} aria-label={`Detalles de ${card.name}`} title={compact ? undefined : 'Detalles'}
    onPointerDown={compact ? undefined : event => { event.stopPropagation(); pointer.current = { x: event.clientX, y: event.clientY, dragged: false }; }}
    onPointerMove={compact ? undefined : event => { event.stopPropagation(); if (Math.hypot(event.clientX - pointer.current.x, event.clientY - pointer.current.y) > 6) pointer.current.dragged = true; }}
    onPointerCancel={compact ? undefined : event => { event.stopPropagation(); pointer.current.dragged = true; }}
    onClick={event => { event.stopPropagation(); if (compact || event.detail === 0 || !pointer.current.dragged) onDetails(card, event.currentTarget); }}>
    {compact ? 'Detalles' : <span aria-hidden="true">D</span>}
  </button>;
  return <div className="game-card-slot" data-card-id={card.id}>
    <article className={`game-card ${compact ? 'compact-card' : 'full-card'}${!compact && tightRows ? ' tight-card-rows' : ''}${selected ? ' selected-card' : ''}`}>
    <div ref={face} className={onChoose ? 'card-play-surface' : 'card-face'}
      onPointerDown={(event) => { pointer.current = { x: event.clientX, y: event.clientY, dragged: false }; }}
      onPointerMove={(event) => { if (Math.hypot(event.clientX - pointer.current.x, event.clientY - pointer.current.y) > 6) pointer.current.dragged = true; }}
      onPointerCancel={() => { pointer.current.dragged = true; }}
      onClick={() => { if (!disabled && !pointer.current.dragged) onChoose?.(card.id); }}>
      <CardInformation card={card} attributes={attributes} activeAttributeId={activeAttributeId} valueMode={valueMode} compact={compact} detailsControl={compact ? undefined : detailsButton} />
    </div>
    {compact && detailsButton}
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
