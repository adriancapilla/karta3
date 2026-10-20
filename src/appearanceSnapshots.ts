import type { RoomView } from '../shared/contracts/room';
import type { AppearanceValue, AppearanceWindow } from '../shared/contracts/appearance';
import { currentAppearance } from './appearance';
import { browserUsageMode, recordAppearance } from './usage';

/** Captura local breve; recuperación/recarga nunca inventan una transición. */
export class AppearanceCaptures {
  private readonly captures = new Map<string, { value: AppearanceValue; connection: string; deadline: number; sent: boolean }>();
  clear() { this.captures.clear(); }
  private sweep() { for (const [key, value] of this.captures) if (performance.now() >= value.deadline) this.captures.delete(key); }
  transition(previous: RoomView | null, next: RoomView, connection: string) {
    this.sweep(); if (!connection || !browserUsageMode() || !previous || previous.id !== next.id || !next.participant.isPlayer) return;
    const moment = previous.status === 'WAITING' && next.status === 'IN_GAME' ? 'START'
      : previous.status === 'IN_GAME' && next.status === 'RESULTS' && previous.game.id === next.result.gameId ? 'END' : null;
    if (!moment) return;
    const gameId = next.status === 'IN_GAME' ? next.game.id : next.status === 'RESULTS' ? next.result.gameId : '';
    const key = `${gameId}:${moment}`; if (this.captures.has(key)) return;
    const { theme, origin } = currentAppearance();
    this.captures.set(key, { value: { theme, origin }, connection, deadline: performance.now() + 10_000, sent: false });
  }
  window(window: AppearanceWindow, connection: string, connected: () => boolean) {
    this.sweep(); const capture = this.captures.get(`${window.gameId}:${window.moment}`);
    if (!capture || capture.sent || capture.connection !== connection || !connected() || !browserUsageMode()) return;
    capture.sent = true;
    recordAppearance({ gameId: window.gameId, moment: window.moment, windowToken: window.token, ...capture.value },
      () => performance.now() < capture.deadline && connected() && this.captures.get(`${window.gameId}:${window.moment}`) === capture);
  }
}
