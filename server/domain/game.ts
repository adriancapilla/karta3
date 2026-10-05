import { validateDeck, type Card, type Deck } from './deck.js';
import { autoPlayPolicy } from './autoPlay.js';
import { botPlayPolicy, isBotDifficulty, type BotDifficulty } from './botPlay.js';

export class GameInitializationError extends Error {
  constructor(readonly code: 'INVALID_DECK' | 'INVALID_PLAYERS' | 'INVALID_PERMUTATION') { super(code); }
}
export type GameSettings = Readonly<{ turnTimeout: 15 | 30 | 60; forceTieBreak: boolean }>;
export type PlayerPreparation = Readonly<{ id: string; name: string } & (
  { kind: 'HUMAN'; botDifficulty?: never } | { kind: 'BOT'; botDifficulty: BotDifficulty })>;
export type InitialPlayer = Readonly<{ id: string; displayName: string; order: number; hand: readonly Card[]; wonCards: readonly Card[] } & (
  { kind: 'HUMAN'; status: 'ACTIVE' | 'AUTOMATIC'; consecutiveTimeouts: 0 | 1 | 2; botDifficulty?: never }
  | { kind: 'BOT'; botDifficulty: BotDifficulty; status?: never; consecutiveTimeouts?: never })>;
export type Direction = 'HIGH' | 'LOW';
export type GamePhase = 'PLAYING' | 'FINAL_PHASE' | 'TIE_BREAK' | 'FINISHED';
export type Play = Readonly<{ playerId: string; card: Card; order: number; mode: 'MANUAL' | 'TIMEOUT' | 'AUTOMATIC' | 'BOT' }>;
export type Round = Readonly<{
  number: number; kind: 'BASE' | 'TIE_BREAK'; finalRoundIndex: number | null; playerIds: readonly string[];
  state: 'WAITING_FOR_DIRECTION' | 'WAITING_FOR_PLAYS' | 'RESOLVED'; openerPlayerId: string;
  indicator: Card; activeAttributeId: string; direction: Direction | null; plays: readonly Play[];
}>;
export type RoundResolution = Readonly<{
  id: string; roundNumber: number; kind: 'BASE' | 'TIE_BREAK';
  ranking: readonly Readonly<{ playerId: string; card: Card; playValue: number; position: number }>[];
  winnerPlayerId: string; nextOpenerPlayerId: string | null; awardedCardCount: number;
  nextStage: 'ROUND' | 'TIE_BREAK' | 'RESULTS';
}>;
export type GameResult = Readonly<{
  endReason: 'DECK_COMPLETED' | 'NO_ACTIVE_HUMAN_PLAYERS'; completedNormally: boolean;
  standings: readonly Readonly<{ playerId: string; score: number; position: number }>[];
  winnerIds: readonly string[]; tieBreakWinnerId: string | null;
}>;
export class GameRuleError extends Error {
  constructor(readonly code: 'NOT_YOUR_TURN' | 'CARD_NOT_IN_HAND' | 'INVALID_INPUT' | 'ROUND_IN_REVIEW' | 'GAME_FINISHED' | 'PLAYER_AUTOMATIC') { super(code); }
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Agregado puro e inmutable: cada jugada devuelve un sucesor, conservando la instantánea. */
export class Game {
  readonly phase: GamePhase = 'PLAYING';
  readonly id: string;
  readonly definition: Deck;
  readonly settings: GameSettings;
  readonly players: readonly InitialPlayer[];
  readonly drawPile: readonly Card[];
  readonly round: Round;
  readonly attributeDiscard: readonly Card[] = [];
  readonly resolution: RoundResolution | null = null;
  readonly result: GameResult | null = null;
  readonly tieBreakUnused: readonly Card[] = [];
  readonly tieBreakPlayed: readonly Card[] = [];

  constructor(input: { id: string; deck: Deck; players: readonly PlayerPreparation[]; settings: GameSettings; permutation: readonly string[] }) {
    if (!validateDeck(input.deck).valid) throw new GameInitializationError('INVALID_DECK');
    if (!Array.isArray(input.players) || input.players.length < 2 || input.players.length > 5
      || input.players.some((p) => !p || typeof p.id !== 'string' || !p.id || typeof p.name !== 'string' || !p.name.trim()
        || p.kind !== 'HUMAN' && p.kind !== 'BOT' || p.kind === 'BOT' && !isBotDifficulty(p.botDifficulty)
        || p.kind === 'HUMAN' && p.botDifficulty !== undefined)
      || new Set(input.players.map((p) => p.id)).size !== input.players.length || !input.players.some((p) => p.kind === 'HUMAN') || !input.id
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
    this.players = freeze(input.players.map((player, order): InitialPlayer => ({ id: player.id, displayName: player.name,
      order, hand: hands[order], wonCards: [], ...(player.kind === 'BOT'
        ? { kind: 'BOT', botDifficulty: player.botDifficulty } : { kind: 'HUMAN', status: 'ACTIVE', consecutiveTimeouts: 0 }) })));
    const indicator = pile[acquired++];
    this.drawPile = freeze(pile.slice(acquired));
    this.round = freeze({ number: 1, kind: 'BASE', finalRoundIndex: null, playerIds: this.players.map((player) => player.id), state: 'WAITING_FOR_DIRECTION', openerPlayerId: this.players[0].id,
      indicator, activeAttributeId: indicator.roundAttribute, direction: null, plays: [] });
    freeze(this.attributeDiscard);
    freeze(this.tieBreakUnused); freeze(this.tieBreakPlayed);
    Object.freeze(this);
  }

  score(playerId: string): number { return this.players.find((player) => player.id === playerId)?.wonCards.length ?? 0; }

  get turn(): { id: string; playerId: string } | null {
    if (this.phase === 'FINISHED' || this.round.state === 'RESOLVED') return null;
    const order = this.circular(this.round.openerPlayerId, this.round.playerIds);
    return { id: `${this.id}:r${this.round.number}:p${this.round.plays.length + 1}`, playerId: order[this.round.plays.length] };
  }

  assertActor(playerId: string): void {
    if (this.phase === 'FINISHED') throw new GameRuleError('GAME_FINISHED');
    if (this.round.state === 'RESOLVED') throw new GameRuleError('ROUND_IN_REVIEW');
    if (this.turn?.playerId !== playerId) throw new GameRuleError('NOT_YOUR_TURN');
  }

  play(playerId: string, cardId: string, direction: Direction | null): Game {
    this.assertManualActor(playerId);
    return this.applyPlay(playerId, cardId, direction, 'MANUAL');
  }

  assertManualActor(playerId: string): void {
    if (this.players.find((person) => person.id === playerId)?.kind === 'BOT') throw new GameRuleError('INVALID_INPUT');
    if (this.players.find((person) => person.id === playerId)?.status === 'AUTOMATIC') throw new GameRuleError('PLAYER_AUTOMATIC');
    this.assertActor(playerId);
  }

  timeout(playerId: string, acceptedDirection: Direction | null): Game {
    this.assertActor(playerId);
    const person = this.players.find((player) => player.id === playerId)!;
    if (person.kind !== 'HUMAN') throw new GameRuleError('INVALID_INPUT');
    if (person.status !== 'ACTIVE') throw new GameRuleError('PLAYER_AUTOMATIC');
    const decision = autoPlayPolicy(person.hand, this.round.activeAttributeId, this.round.plays.length === 0, acceptedDirection);
    return this.applyPlay(playerId, decision.cardId, decision.direction, 'TIMEOUT');
  }

  automaticPlay(playerId: string): Game {
    this.assertActor(playerId);
    const person = this.players.find((player) => player.id === playerId)!;
    if (person.kind !== 'HUMAN' || person.status !== 'AUTOMATIC') throw new GameRuleError('INVALID_INPUT');
    const decision = autoPlayPolicy(person.hand, this.round.activeAttributeId, this.round.plays.length === 0);
    return this.applyPlay(playerId, decision.cardId, decision.direction, 'AUTOMATIC');
  }

  botPlay(playerId: string): Game {
    this.assertActor(playerId);
    const person = this.players.find((player) => player.id === playerId)!;
    if (person.kind !== 'BOT') throw new GameRuleError('INVALID_INPUT');
    const decision = botPlayPolicy(person.hand, this.round.activeAttributeId, this.round.plays.length === 0, this.round.direction, person.botDifficulty);
    return this.applyPlay(playerId, decision.cardId, decision.direction, 'BOT');
  }

  private applyPlay(playerId: string, cardId: string, direction: Direction | null, mode: Play['mode']): Game {
    this.assertActor(playerId);
    const opening = this.round.plays.length === 0;
    if (opening ? direction !== 'HIGH' && direction !== 'LOW' : direction !== null) throw new GameRuleError('INVALID_INPUT');
    const player = this.players.find((person) => person.id === playerId)!;
    if ((player.kind === 'BOT') !== (mode === 'BOT')) throw new GameRuleError('INVALID_INPUT');
    const card = player.hand.find((item) => item.id === cardId);
    if (!card) throw new GameRuleError('CARD_NOT_IN_HAND');
    const plays = [...this.round.plays, { playerId, card, order: this.round.plays.length + 1, mode }];
    const next = this.evolve({ players: this.players.map((person): InitialPlayer => {
      if (person.id !== playerId) return person;
      const hand = person.hand.filter((item) => item.id !== cardId);
      if (person.kind === 'BOT') return { ...person, hand };
      const count = mode === 'MANUAL' ? 0 : mode === 'TIMEOUT' ? Math.min(2, person.consecutiveTimeouts + 1) as 1 | 2 : 2;
      return { ...person, hand, consecutiveTimeouts: count, status: count === 2 ? 'AUTOMATIC' : 'ACTIVE' };
    }),
      round: { ...this.round, direction: opening ? direction : this.round.direction,
        state: plays.length === this.round.playerIds.length ? 'RESOLVED' : 'WAITING_FOR_PLAYS', plays } });
    return next.round.state === 'RESOLVED' ? next.resolve() : next;
  }

  private resolve(): Game {
    const attribute = this.round.activeAttributeId;
    const ranked = [...this.round.plays].sort((a, b) => (a.card.values[attribute].playValue - b.card.values[attribute].playValue) * (this.round.direction === 'HIGH' ? -1 : 1));
    const ranking = ranked.map((play, index) => ({ playerId: play.playerId, card: play.card, playValue: play.card.values[attribute].playValue, position: index + 1 }));
    const winnerPlayerId = ranking[0].playerId;
    const last = this.phase === 'FINAL_PHASE' && this.players.every((person) => person.hand.length === 0);
    const tie = this.round.kind === 'TIE_BREAK';
    const players = this.players.map((person) => !tie && person.id === winnerPlayerId ? { ...person, wonCards: [...person.wonCards, ...this.round.plays.map((play) => play.card)] } : person);
    const humans = players.filter((person) => person.kind === 'HUMAN');
    const inactive = humans.length > 0 && humans.every((person) => person.status === 'AUTOMATIC');
    const result = last || tie || inactive ? this.resultFor(players, tie ? winnerPlayerId : null, inactive) : this.result;
    const nextStage = tie || inactive ? 'RESULTS' : last ? this.settings.forceTieBreak && result!.winnerIds.length > 1 ? 'TIE_BREAK' : 'RESULTS' : 'ROUND';
    return this.evolve({ players, result,
      attributeDiscard: this.phase === 'PLAYING' || last || inactive && !tie ? [...this.attributeDiscard, this.round.indicator] : this.attributeDiscard,
      tieBreakPlayed: tie ? this.round.plays.map((play) => play.card) : this.tieBreakPlayed,
      resolution: { id: `${this.id}:r${this.round.number}:resolved`, roundNumber: this.round.number, kind: this.round.kind,
        ranking, winnerPlayerId, nextOpenerPlayerId: last || tie || inactive ? null : ranking[1].playerId, awardedCardCount: tie ? 0 : this.round.plays.length, nextStage } });
  }

  /** Aplicación llama una vez tras revisión. El dominio decide adquisición y siguiente abridor. */
  advance(permutation?: readonly string[]): Game {
    if (this.phase === 'FINISHED') throw new GameRuleError('GAME_FINISHED');
    if (!this.resolution || this.round.state !== 'RESOLVED') throw new GameRuleError('INVALID_INPUT');
    if (this.resolution.nextStage === 'RESULTS') return this.evolve({ phase: 'FINISHED',
      ...(this.phase === 'TIE_BREAK' ? { tieBreakUnused: [...this.tieBreakUnused, ...this.players.flatMap((person) => person.hand)],
        players: this.players.map((person) => ({ ...person, hand: [] })) } : {}) });
    if (this.resolution.nextStage === 'TIE_BREAK') return this.prepareTieBreak(permutation);
    const opener = this.resolution.nextOpenerPlayerId!;
    if (this.phase === 'FINAL_PHASE') {
      return this.evolve({ resolution: null, round: { ...this.round, number: this.round.number + 1, finalRoundIndex: this.round.finalRoundIndex! + 1,
        state: 'WAITING_FOR_DIRECTION', openerPlayerId: opener, direction: null, plays: [] } });
    }
    const order = this.circular(opener, this.round.playerIds);
    const pile = [...this.drawPile];
    if (pile.length < order.length + 1) throw new GameRuleError('INVALID_INPUT');
    const acquisitions = new Map(order.map((id) => [id, pile.shift()!]));
    const players = this.players.map((person) => ({ ...person, hand: [...person.hand, acquisitions.get(person.id)!] }));
    const final = pile.length === 1 && players.every((person) => person.hand.length === 3);
    const indicator = pile.shift()!;
    return this.evolve({ phase: final ? 'FINAL_PHASE' : 'PLAYING', players, drawPile: pile, resolution: null,
      round: { number: this.round.number + 1, kind: 'BASE', finalRoundIndex: final ? 1 : null, playerIds: this.round.playerIds,
        state: 'WAITING_FOR_DIRECTION', openerPlayerId: opener, indicator, activeAttributeId: indicator.roundAttribute, direction: null, plays: [] } });
  }

  /** Diagnóstico puro de propiedad; las cartas públicas resueltas son referencias, no otra ubicación. */
  locations(): readonly Card[] {
    const discarded = this.attributeDiscard.some((card) => card.id === this.round.indicator.id);
    return [...this.drawPile, ...this.players.flatMap((person) => [...person.hand, ...person.wonCards]), ...this.attributeDiscard, ...this.tieBreakUnused, ...this.tieBreakPlayed,
      ...(discarded ? [] : [this.round.indicator]), ...(this.round.state === 'RESOLVED' ? [] : this.round.plays.map((play) => play.card))];
  }

  get tieBreakCardIds(): readonly string[] { return this.resolution?.nextStage === 'TIE_BREAK' ? this.attributeDiscard.map((card) => card.id) : []; }

  private resultFor(players: readonly InitialPlayer[], tieBreakWinnerId: string | null, inactive = false): GameResult {
    const maximum = Math.max(...players.map((person) => person.wonCards.length));
    const leaders = players.filter((person) => person.wonCards.length === maximum).map((person) => person.id);
    const order = [...players].sort((a, b) => b.wonCards.length - a.wonCards.length
      || (a.id === tieBreakWinnerId ? -1 : b.id === tieBreakWinnerId ? 1 : a.order - b.order));
    return { endReason: inactive ? 'NO_ACTIVE_HUMAN_PLAYERS' : 'DECK_COMPLETED', completedNormally: !inactive, tieBreakWinnerId, winnerIds: tieBreakWinnerId ? [tieBreakWinnerId] : leaders,
      standings: order.map((person) => ({ playerId: person.id, score: person.wonCards.length, position: 1 + players.filter((other) => other.wonCards.length > person.wonCards.length).length })) };
  }

  private prepareTieBreak(permutation?: readonly string[]): Game {
    const ids = this.tieBreakCardIds;
    if (!permutation || permutation.length !== ids.length || new Set(permutation).size !== ids.length || permutation.some((id) => !ids.includes(id))) throw new GameInitializationError('INVALID_PERMUTATION');
    const leaders = this.players.filter((person) => this.result!.winnerIds.includes(person.id));
    const size = Math.min(3, Math.floor((ids.length - 1) / leaders.length));
    const cards = new Map(this.attributeDiscard.map((card) => [card.id, card]));
    const pile = permutation.map((id) => cards.get(id)!); const hands = new Map(leaders.map((person) => [person.id, [] as Card[]]));
    for (let pass = 0; pass < size; pass++) for (const person of leaders) hands.get(person.id)!.push(pile.shift()!);
    const indicator = pile.shift()!;
    return this.evolve({ phase: 'TIE_BREAK', attributeDiscard: [], tieBreakUnused: pile, resolution: null,
      players: this.players.map((person) => ({ ...person, hand: hands.get(person.id) ?? [] })),
      round: { number: this.round.number + 1, kind: 'TIE_BREAK', finalRoundIndex: null, playerIds: leaders.map((person) => person.id),
        state: 'WAITING_FOR_DIRECTION', openerPlayerId: leaders[0].id, indicator, activeAttributeId: indicator.roundAttribute, direction: null, plays: [] } });
  }

  private circular(opener: string, ids: readonly string[]): string[] {
    const index = ids.indexOf(opener);
    return [...ids.slice(index), ...ids.slice(0, index)];
  }

  private evolve(change: Partial<Game>): Game {
    return freeze(Object.assign(Object.create(Game.prototype) as Game, this, change));
  }
}
