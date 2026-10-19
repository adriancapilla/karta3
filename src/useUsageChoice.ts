import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api';
import { socket } from './socket';
import type { UsageChoiceRequest, UsageChoiceView } from '../shared/contracts/usage';
import { browserUsageMode, invalidateBrowserUsage, releaseUsageSuppression, suspendBrowserUsage, usageAccepted } from './usage';

const withdrawalPending = 'Retirada pendiente; no se ha podido confirmar en el servidor';
export function useUsageChoice() {
  const [choice, setChoice] = useState<UsageChoiceView | null>(null); const current = useRef<UsageChoiceView | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const pending = useRef<UsageChoiceRequest | null>(null); const serial = useRef(0); const active = useRef(false);
  const apply = useCallback((view: UsageChoiceView, observeHome = false) => {
    const old = current.current;
    if (old && old.noticeVersion === view.noticeVersion && view.decision === 'ACCEPTED' && view.revision < old.revision) return;
    current.current = view; setChoice(view);
    if (pending.current?.decision === 'REJECTED' && view.decision === 'ACCEPTED') { setError(withdrawalPending); return; }
    if (pending.current?.decision === 'ACCEPTED' && view.decision === 'UNDECIDED') { setError('Aceptación sin confirmar. Consulta el estado antes de reintentar.'); return; }
    if (view.decision !== 'ACCEPTED') {
      pending.current = null; releaseUsageSuppression();
      if (browserUsageMode() !== 'synthetic') invalidateBrowserUsage();
    }
    setError(''); if (observeHome && view.available && view.decision === 'ACCEPTED') usageAccepted();
  }, []);
  const refresh = useCallback(async (observeHome = false) => {
    const request = ++serial.current;
    try {
      let view = await api.usageChoice(); if (!active.current || request !== serial.current) return;
      if (pending.current?.decision === 'ACCEPTED' && view.decision === 'ACCEPTED') {
        pending.current = null; releaseUsageSuppression(); view = await api.usageChoice(); observeHome = true;
        if (!active.current || request !== serial.current) return;
      }
      apply(view, observeHome);
    } catch { if (active.current && request === serial.current) setError(pending.current?.decision === 'REJECTED' ? withdrawalPending : 'No se pudo consultar la elección de analítica.'); }
    finally { if (active.current && request === serial.current) setBusy(false); }
  }, [apply]);
  useEffect(() => {
    active.current = true;
    const sequence = serial;
    const changed = (view: UsageChoiceView) => {
      if (current.current && view.noticeVersion === current.current.noticeVersion && view.revision < current.current.revision) return;
      const newlyAccepted = view.decision === 'ACCEPTED' && current.current?.decision !== 'ACCEPTED';
      if (view.decision !== 'ACCEPTED') invalidateBrowserUsage();
      void refresh(newlyAccepted);
    };
    const disconnected = () => {
      serial.current++; invalidateBrowserUsage();
      if (current.current) current.current = { ...current.current, available: false };
      setChoice(value => value ? { ...value, available: false } : null); setBusy(false);
      if (pending.current) setError(pending.current.decision === 'REJECTED' ? withdrawalPending : 'Aceptación sin confirmar. Revisa el estado al recuperar la conexión.');
    };
    const connected = () => { void refresh(); };
    socket.on('usage:choice', changed); socket.on('disconnect', disconnected); socket.on('connect', connected);
    void refresh();
    return () => { active.current = false; sequence.current++; socket.off('usage:choice', changed); socket.off('disconnect', disconnected); socket.off('connect', connected); };
  }, [refresh]);
  const decide = useCallback(async (decision: 'ACCEPTED' | 'REJECTED') => {
    const own = current.current; if (!own || decision === 'ACCEPTED' && !own.available) return;
    if (decision === 'REJECTED') suspendBrowserUsage();
    const input = pending.current?.decision === decision ? pending.current : { decision, noticeVersion: own.noticeVersion,
      expectedRevision: own.revision, requestId: crypto.randomUUID() };
    pending.current = input; setBusy(true); setError(''); const request = ++serial.current;
    try {
      let view = await api.chooseUsage(input); if (!active.current || request !== serial.current) return;
      pending.current = null;
      if (decision === 'REJECTED' && view.decision === 'ACCEPTED') {
        current.current = view; setChoice(view); setError('La elección ha cambiado. Pulsa Retirar permiso para enviar una retirada nueva.'); return;
      }
      if (decision === 'ACCEPTED' && view.decision === 'ACCEPTED') {
        releaseUsageSuppression(); view = await api.usageChoice(); if (!active.current || request !== serial.current) return;
      }
      apply(view, decision === 'ACCEPTED');
    } catch (failure) {
      if (!active.current || request !== serial.current) return;
      if (failure instanceof ApiError && failure.code === 'CHOICE_CONFLICT') { pending.current = null; void refresh(); }
      setError(decision === 'REJECTED' ? withdrawalPending : 'Aceptación sin confirmar. Consulta el estado antes de reintentar.');
    } finally { if (active.current && request === serial.current) setBusy(false); }
  }, [apply, refresh]);
  return { choice, busy, error, decide, refresh };
}
