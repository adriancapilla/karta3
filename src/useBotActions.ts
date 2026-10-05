import { useEffect, useRef, useState } from 'react';
import type { BotOperation, BotResponse, CurrentRoomResponse, RoomView } from '../shared/contracts/room';
import { api, ApiError } from './api';
import { sendGame } from './socket';

type Attempt = { operation: BotOperation; payload: object; state: 'SENDING' | 'UNCERTAIN' | 'RECOVERED'; message: string };
export const botControlKey = (op: BotOperation) => op.type === 'ADD' ? 'ADD' : `${op.botId}:${op.type}`;
const events = { ADD: 'room:bot-add', DIFFICULTY: 'room:bot-difficulty', RENAME: 'room:bot-rename', REMOVE: 'room:bot-remove' };
export function useBotActions(roomId: string, accept: (room: RoomView) => boolean, acceptCurrent: (response: CurrentRoomResponse) => void) {
  const mounted = useRef(false);
  const attemptsRef = useRef<Record<string, Attempt>>({});
  const [attempts, setAttempts] = useState<Record<string, Attempt>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, [roomId]);
  const write = (key: string, value?: Attempt) => {
    const next = { ...attemptsRef.current }; if (value) next[key] = value; else delete next[key];
    attemptsRef.current = next; setAttempts(next);
  };
  async function transmit(key: string, attempt: Attempt) {
    const sending: Attempt = { ...attempt, state: 'SENDING', message: '' }; write(key, sending);
    try {
      const result = await sendGame<BotResponse>(events[attempt.operation.type], attempt.payload);
      if (!mounted.current || attemptsRef.current[key] !== sending) return false;
      accept(result.room); write(key); setErrors((old) => ({ ...old, [key]: '' })); return true;
    } catch (error) {
      if (!mounted.current || attemptsRef.current[key] !== sending) return false;
      const uncertain = error instanceof ApiError && ['NETWORK_ERROR', 'INTERNAL_ERROR', 'UNKNOWN_ERROR'].includes(error.code);
      const message = uncertain ? 'No se pudo confirmar la operación. Recupera el estado de la sala.' : error instanceof Error ? error.message : 'No se pudo completar la operación.';
      if (uncertain) write(key, { ...sending, state: 'UNCERTAIN', message });
      else { write(key); setErrors((old) => ({ ...old, [key]: message })); }
      return false;
    }
  }
  async function execute(operation: BotOperation) {
    const key = botControlKey(operation); if (attemptsRef.current[key]) return false;
    const { type: _type, ...fields } = operation; void _type;
    return transmit(key, { operation, payload: { requestId: crypto.randomUUID(), roomId, ...fields }, state: 'SENDING', message: '' });
  }
  async function recover(key: string) {
    const attempt = attemptsRef.current[key]; if (!attempt || attempt.state === 'SENDING') return;
    try {
      const result = await api.current();
      if (!mounted.current || attemptsRef.current[key] !== attempt) return;
      acceptCurrent(result);
      write(key, { ...attempt, state: 'RECOVERED', message: 'Estado recuperado. Confirma el envío original; no se enviará una operación nueva.' });
    } catch { if (mounted.current) write(key, { ...attempt, message: 'No se pudo recuperar el estado. La operación sigue sin confirmar.' }); }
  }
  const retry = async (key: string) => { const attempt = attemptsRef.current[key]; return attempt?.state === 'RECOVERED' ? transmit(key, attempt) : false; };
  return { attempts, errors, execute, recover, retry, pending: Object.keys(attempts).length > 0 };
}
