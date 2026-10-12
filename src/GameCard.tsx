import { useEffect, useRef, useState } from 'react';
import type { CardView, InitialGameView } from '../shared/contracts/game';

export function CardImage({ card }: { card: CardView }) {
  const [failed, setFailed] = useState(false);
  return <div className="game-card-image">
    {card.imageUrl && !failed ? <img src={card.imageUrl} alt={card.imageAlt} onError={() => setFailed(true)} />
      : <svg viewBox="0 0 80 70" aria-hidden="true"><rect x="17" y="5" width="46" height="60" rx="7" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M40 18 52 35 40 52 28 35Z" fill="currentColor" /></svg>}
    {failed && <p role="status">No se pudo cargar la imagen</p>}
  </div>;
}

export function CardInformation({ card, attributes, activeAttributeId, details = false }: {
  card: CardView; attributes: InitialGameView['attributes']; activeAttributeId: string; details?: boolean;
}) {
  const longInteger = (value: string) => /^\d{9,}$/.test(value);
  const tableClass = `card-values${Object.values(card.values).some((value) => longInteger(value.displayValue)) ? ' long-numbers' : ''}`;
  if (!details) {
    const ownAttribute = attributes.find((attribute) => attribute.id === card.roundAttribute)!;
    return <>
      <div className="card-heading"><h3>{card.name}</h3><span className="card-round-attribute" role="img" aria-label={`Atributo indicador: ${ownAttribute.name}`}>{['●', '▲', '■'][attributes.indexOf(ownAttribute)]}</span></div>
      <CardImage key={`${card.id}:${card.imageUrl}`} card={card} />
      <table className={tableClass}><thead><tr><th scope="col">Atributo</th><th scope="col">Dato</th><th scope="col" aria-label="J: valor jugable">J</th></tr></thead>
        <tbody>{attributes.map((attribute, index) => <tr key={attribute.id} className={attribute.id === activeAttributeId ? 'active-attribute' : undefined}>
          <th scope="row" aria-label={attribute.id === activeAttributeId ? `${attribute.name}, atributo activo` : attribute.name}><span aria-hidden="true">{['●', '▲', '■'][index]} </span>{attribute.name}{attribute.id === activeAttributeId && <span className="active-mark" aria-hidden="true">◆</span>}</th>
          <td><span className={longInteger(card.values[attribute.id].displayValue) ? 'unbroken-number' : undefined}>{card.values[attribute.id].displayValue}</span>{card.values[attribute.id].unit && ` ${card.values[attribute.id].unit}`}</td><td>{card.values[attribute.id].playValue}</td>
        </tr>)}</tbody>
      </table>
    </>;
  }
  return <>
    <h3>{card.name}</h3>
    <CardImage key={`${card.id}:${card.imageUrl}`} card={card} />
    {details && card.characteristic.trim() && <p className="card-characteristic">{card.characteristic}</p>}
    <table className={tableClass}><thead><tr><th scope="col">Atributo</th><th scope="col">Jugable</th><th scope="col">Dato</th></tr></thead>
      <tbody>{attributes.map((attribute, index) => <tr key={attribute.id} className={attribute.id === activeAttributeId ? 'active-attribute' : undefined}>
        <th scope="row"><span aria-hidden="true">{['●', '▲', '■'][index]} </span>{attribute.name}{attribute.id === activeAttributeId && <span className="active-label">Activo</span>}</th>
        <td>{card.values[attribute.id].playValue}</td><td><span className={longInteger(card.values[attribute.id].displayValue) ? 'unbroken-number' : undefined}>{card.values[attribute.id].displayValue}</span>{card.values[attribute.id].unit && ` ${card.values[attribute.id].unit}`}</td>
      </tr>)}</tbody>
    </table>
    {details && card.note.trim() && <p className="card-note">{card.note}</p>}
  </>;
}

export function GameCard({ card, attributes, activeAttributeId, onDetails, onChoose, selected = false, disabled = false }: {
  card: CardView; attributes: InitialGameView['attributes']; activeAttributeId: string; onDetails: (card: CardView, button: HTMLButtonElement) => void;
  onChoose?: (id: string) => void; selected?: boolean; disabled?: boolean;
}) {
  const pointer = useRef({ x: 0, y: 0, dragged: false });
  return <div className="game-card-slot" data-card-id={card.id}>
    <article className={`game-card${selected ? ' selected-card' : ''}`}>
    <div className={onChoose ? 'card-play-surface' : undefined}
      onPointerDown={(event) => { pointer.current = { x: event.clientX, y: event.clientY, dragged: false }; }}
      onPointerMove={(event) => { if (Math.hypot(event.clientX - pointer.current.x, event.clientY - pointer.current.y) > 6) pointer.current.dragged = true; }}
      onPointerCancel={() => { pointer.current.dragged = true; }}
      onClick={() => { if (!disabled && !pointer.current.dragged) onChoose?.(card.id); }}>
      <CardInformation card={card} attributes={attributes} activeAttributeId={activeAttributeId} />
    </div>
    <button className="secondary card-details-button" aria-label={`Detalles de ${card.name}`} onClick={(event) => onDetails(card, event.currentTarget)}>Detalles</button>
    </article>
    {onChoose && <button className="primary card-play-button" aria-label={`Jugar ${card.name}`} aria-pressed={selected} disabled={disabled} onClick={() => onChoose(card.id)}>{selected ? 'Carta seleccionada' : 'Jugar carta'}</button>}
  </div>;
}

export function CardDetails({ card, attributes, activeAttributeId, onClose }: {
  card: CardView; attributes: InitialGameView['attributes']; activeAttributeId: string; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (dialog.current && !dialog.current.open) dialog.current.showModal(); }, []);
  return <dialog ref={dialog} className="card-details-dialog" aria-labelledby="card-details-title" onClose={onClose}>
    <h2 id="card-details-title">Detalles de {card.name}</h2>
    <CardInformation card={card} attributes={attributes} activeAttributeId={activeAttributeId} details />
    <button className="secondary" autoFocus onClick={() => dialog.current?.close()}>Cerrar detalles</button>
  </dialog>;
}
