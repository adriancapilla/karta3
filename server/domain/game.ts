import { validateDeck, type Card, type Deck } from './deck.js';

export class GameInitializationError extends Error {
  constructor(readonly code: 'INVALID_DECK' | 'INVALID_PLAYERS' | 'INVALID_PERMUTATION') { super(code); }
}
export type GameSettings = Readonly<{ turnTimeout: 15 | 30 | 60; forceTieBreak: boolean }>;
export type InitialPlayer = Readonly<{
  id: string; displayName: string; kind: 'HUMAN'; order: number;
  hand: readonly Card[]; wonCards: readonly Card[]; status: 'ACTIVE'; consecutiveTimeouts: 0;
}>;

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Estado inicial puro. Reparto circular: una carta por jugador, tres vueltas en orden base. */
export class Game {
  readonly phase = 'PLAYING' as const;
  readonly id: string;
  readonly definition: Deck;
  readonly settings: GameSettings;
  readonly players: readonly InitialPlayer[];
  readonly drawPile: readonly Card[];
  readonly round: Readonly<{
    number: 1; state: 'WAITING_FOR_DIRECTION'; openerPlayerId: string; indicator: Card;
    activeAttributeId: string; direction: null; plays: readonly never[];
  }>;

  constructor(input: { id: string; deck: Deck; players: readonly { id: string; name: string }[]; settings: GameSettings; permutation: readonly string[] }) {
    if (!validateDeck(input.deck).valid) throw new GameInitializationError('INVALID_DECK');
    if (input.players.length < 2 || input.players.length > 5 || new Set(input.players.map((p) => p.id)).size !== input.players.length
      || input.players.some((p) => !p.id || !p.name.trim()) || !input.id
      || ![15, 30, 60].includes(input.settings.turnTimeout) || typeof input.settings.forceTieBreak !== 'boolean') {
      throw new GameInitializationError('INVALID_PLAYERS');
    }
    const ids = new Set(input.deck.cards.map((card) => card.id));
    if (input.permutation.length !== 58 || new Set(input.permutation).size !== 58 || input.permutation.some((id) => !ids.has(id))) {
      throw new GameInitializationError('INVALID_PERMUTATION');
    }
    this.id = input.id;
    this.definition = freeze(structuredClone(input.deck));
    this.settings = freeze({ ...input.settings });
    const cards = new Map(this.definition.cards.map((card) => [card.id, card]));
    const pile = input.permutation.map((id) => cards.get(id)!);
    const hands: Card[][] = input.players.map(() => []);
    let acquired = 0;
    for (let pass = 0; pass < 3; pass++) for (const hand of hands) hand.push(pile[acquired++]);
    this.players = freeze(input.players.map((player, order) => ({ id: player.id, displayName: player.name,
      kind: 'HUMAN' as const, order, hand: hands[order], wonCards: [], status: 'ACTIVE' as const, consecutiveTimeouts: 0 as const })));
    const indicator = pile[acquired++];
    this.drawPile = freeze(pile.slice(acquired));
    this.round = freeze({ number: 1, state: 'WAITING_FOR_DIRECTION', openerPlayerId: this.players[0].id,
      indicator, activeAttributeId: indicator.roundAttribute, direction: null, plays: [] });
    Object.freeze(this);
  }

  score(playerId: string): number { return this.players.find((player) => player.id === playerId)?.wonCards.length ?? 0; }
}
