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
  return <>
    <h3>{card.name}</h3>
    <CardImage key={`${card.id}:${card.imageUrl}`} card={card} />
    {details && card.characteristic.trim() && <p className="card-characteristic">{card.characteristic}</p>}
    <table className="card-values"><thead><tr><th scope="col">Atributo</th><th scope="col">Jugable</th><th scope="col">Dato</th></tr></thead>
      <tbody>{attributes.map((attribute, index) => <tr key={attribute.id} className={attribute.id === activeAttributeId ? 'active-attribute' : undefined}>
        <th scope="row"><span aria-hidden="true">{['●', '▲', '■'][index]} </span>{attribute.name}{attribute.id === activeAttributeId && <span className="active-label">Activo</span>}</th>
        <td>{card.values[attribute.id].playValue}</td><td>{card.values[attribute.id].displayValue}{card.values[attribute.id].unit && ` ${card.values[attribute.id].unit}`}</td>
      </tr>)}</tbody>
    </table>
    {details && card.note.trim() && <p className="card-note">{card.note}</p>}
  </>;
}

export function GameCard({ card, attributes, activeAttributeId, onDetails }: {
  card: CardView; attributes: InitialGameView['attributes']; activeAttributeId: string; onDetails: (card: CardView, button: HTMLButtonElement) => void;
}) {
  return <article className="game-card" data-card-id={card.id}>
    <CardInformation card={card} attributes={attributes} activeAttributeId={activeAttributeId} />
    <button className="secondary card-details-button" aria-label={`Detalles de ${card.name}`} onClick={(event) => onDetails(card, event.currentTarget)}>Detalles</button>
  </article>;
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
