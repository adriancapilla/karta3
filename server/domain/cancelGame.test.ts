import { describe, expect, it } from 'vitest';
import { Game } from './game.js';
import { validatePackageFormat } from '../infrastructure/decks/packageFormat.js';
import { manualTrace } from '../../tests/support/manualGameTrace.js';

type Stage = 'INITIAL' | 'PARTIAL' | 'REVIEW' | 'FINAL_PARTIAL' | 'FINAL_REVIEW' | 'TIE_PARTIAL' | 'TIE_REVIEW';
function stage(count: number, target: Stage) {
  const trace = manualTrace(count);
  const deck = validatePackageFormat(trace.fixture.metadata, trace.fixture.collection, 'manual').data!.definition;
  let game = new Game({ id: 'cancel-pure', deck, players: Array.from({ length: count }, (_, n) => ({ id: `p${n}`, name: `Persona ${n}`, kind: 'HUMAN' as const })),
    settings: { turnTimeout: 15, forceTieBreak: target.startsWith('TIE') }, permutation: deck.cards.map((card) => card.id) });
  const play = () => { const actor = game.players.find((p) => p.id === game.turn!.playerId)!; game = game.play(actor.id, actor.hand[0].id, game.round.plays.length ? null : 'HIGH'); };
  if (target === 'INITIAL') return game;
  if (target === 'PARTIAL') { for (let n = 0; n < Math.min(2, count - 1); n++) play(); return game; }
  if (target === 'REVIEW') { while (game.turn) play(); return game; }
  let steps = 0;
  while (!(target.startsWith('FINAL') ? game.phase === 'FINAL_PHASE' : game.phase === 'TIE_BREAK')) {
    if (++steps > 150) throw new Error('Traza no alcanzó la fase');
    if (game.turn) play(); else game = game.advance(game.tieBreakCardIds.length ? game.tieBreakCardIds : undefined);
  }
  if (target.endsWith('PARTIAL')) play();
  else {
    while (!game.resolution || game.resolution.nextStage !== 'RESULTS') {
      if (game.turn) play(); else game = game.advance();
    }
  }
  return game;
}

describe('B13 Game terminal parcial puro', () => {
  for (const count of [2, 3, 4, 5]) it.each<Stage>(['INITIAL', 'PARTIAL', 'REVIEW', 'FINAL_PARTIAL', 'FINAL_REVIEW', 'TIE_PARTIAL', 'TIE_REVIEW'])(count + ' jugadores · %s: no adjudica ni mueve cartas al cancelar', (target) => {
    const before = stage(count, target); const cancelled = before.cancel();
    expect(cancelled.phase).toBe('FINISHED'); expect(cancelled.turn).toBeNull(); expect(before.phase).not.toBe('FINISHED');
    expect(Object.isFrozen(cancelled)).toBe(true); expect(Object.isFrozen(cancelled.result)).toBe(true);
    expect(cancelled.players).toBe(before.players); expect(cancelled.drawPile).toBe(before.drawPile); expect(cancelled.round).toBe(before.round);
    expect(cancelled.locations().map((c) => c.id)).toEqual(before.locations().map((c) => c.id));
    expect(cancelled.locations()).toHaveLength(58); expect(new Set(cancelled.locations().map((c) => c.id)).size).toBe(58);
    expect(cancelled.result).toMatchObject({ endReason: 'HOST_CANCELLED', completedNormally: false, winnerIds: [], tieBreakWinnerId: null });
    const order = [...before.players].sort((a, b) => before.score(b.id) - before.score(a.id) || a.order - b.order);
    expect(cancelled.result!.standings).toEqual(order.map((p) => ({ playerId: p.id, score: before.score(p.id), position: 1 + before.players.filter((other) => before.score(other.id) > before.score(p.id)).length })));
    if (target === 'INITIAL' || target === 'PARTIAL') expect(cancelled.result!.standings.every((p) => p.score === 0)).toBe(true);
    if (target === 'REVIEW') expect(cancelled.result!.standings.reduce((sum, p) => sum + p.score, 0)).toBe(count);
    expect(() => cancelled.advance()).toThrow('GAME_FINISHED'); expect(() => cancelled.cancel()).toThrow('GAME_FINISHED');
    expect(() => cancelled.play('p0', 'x', 'HIGH')).toThrow('GAME_FINISHED'); expect(() => cancelled.timeout('p0', null)).toThrow('GAME_FINISHED');
  });
  it('un final normal ya confirmado es inmutable', () => {
    const game = stage(2, 'FINAL_REVIEW').advance(); const result = game.result;
    expect(() => game.cancel()).toThrow('GAME_FINISHED'); expect(game.result).toBe(result); expect(result?.winnerIds).not.toHaveLength(0);
  });
});
