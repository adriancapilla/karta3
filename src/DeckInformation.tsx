import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { DeckInformationView, DeckSummary } from '../shared/contracts/deck';

/** Consulta local de contenido autorizado; no envía acciones ni reinicia plazos. */
export function Consultation({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => { dialog.current?.showModal(); closeButton.current?.focus(); }, []);
  return <dialog ref={dialog} className="card-details-dialog consultation" aria-labelledby={titleId} onClose={event => { event.stopPropagation(); onClose(); }}>
    <h2 id={titleId}>{title}</h2>{children}
    <button ref={closeButton} className="secondary" autoFocus onClick={() => dialog.current?.close()}>Cerrar consulta</button>
  </dialog>;
}

export function DeckInformation({ deck, information, context }: { deck: DeckSummary | null; information: DeckInformationView | null; context: string }) {
  const button = useRef<HTMLButtonElement>(null);
  const identity = deck && information ? `${context}:${deck.id}:${deck.contentVersion}` : null;
  const [opened, setOpened] = useState<string | null>(null);
  const focusSelection = () => (button.current ?? document.getElementById('config-deck') ?? document.getElementById('configuration-heading'))?.focus();
  const close = () => { setOpened(null); focusSelection(); };
  useEffect(() => {
    if (opened === null || opened === identity) return;
    const task = window.setTimeout(() => { setOpened(null); (button.current ?? document.getElementById('config-deck') ?? document.getElementById('configuration-heading'))?.focus(); }, 0);
    return () => window.clearTimeout(task);
  }, [identity, opened]);
  return <>
    {identity && <button ref={button} className="secondary deck-information-button" onClick={() => setOpened(identity)}>Información de la baraja</button>}
    {identity && identity === opened && deck && information && <Consultation title={`${deck.name} · v${deck.contentVersion} · Información de la baraja`} onClose={close}>
      <p className="literal-text">{deck.description}</p>
      <h3>Instrucciones</h3><p className="literal-text">{information.instructions || 'Esta baraja no incluye instrucciones adicionales'}</p>
    </Consultation>}
  </>;
}
