import { deckFixture } from './deckFixtures.js';

/** Paquete sintético completo y traza alcanzable. Simula solo adquisición para asignar valores únicos;
 * las pruebas aplican cada carta y dirección a Game/casos de uso reales y comprueban los ganadores. */
export function manualTrace(count: number, winners?: readonly number[]) {
  const rounds = ({ 2: 20, 3: 15, 4: 12, 5: 10 } as Record<number, number>)[count];
  if (!rounds) throw new Error('Cantidad de jugadores de prueba inválida');
  const plan = winners ?? Array.from({ length: rounds }, (_, n) => n % count);
  if (plan.length !== rounds || plan.some((winner) => winner < 0 || winner >= count)) throw new Error('Plan de prueba inválido');
  const fixture = deckFixture('manual'); const pile = fixture.collection.cards.map((card) => card.id);
  const hands: string[][] = Array.from({ length: count }, () => []);
  for (let pass = 0; pass < 3; pass++) for (const hand of hands) hand.push(pile.shift()!);
  const indicators = [pile.shift()!]; let finalRound = 0; let opener = 0;
  const trace: { winner: number; opener: number; cards: string[]; direction: 'HIGH' }[] = [];
  const values = new Map<string, number>(); let value = 1;
  for (const winner of plan) {
    const cards = hands.map((hand) => hand.shift()!);
    const second = Array.from({ length: count }, (_, n) => n).find((id) => id !== winner)!;
    const rankAscending = [...Array.from({ length: count }, (_, n) => n).filter((id) => id !== winner && id !== second), second, winner];
    rankAscending.forEach((id) => values.set(cards[id], value++));
    trace.push({ winner, opener, cards, direction: 'HIGH' }); opener = second;
    if (finalRound) { finalRound++; continue; }
    for (let offset = 0; offset < count; offset++) hands[(second + offset) % count].push(pile.shift()!);
    if (pile.length === 1) finalRound = 1;
    indicators.push(pile.shift()!);
  }
  for (const id of indicators) values.set(id, value++);
  if (value !== 59 || new Set(values.keys()).size !== 58) throw new Error('Traza no conserva 58 cartas');
  for (const card of fixture.collection.cards) {
    card.name = `Carta manual ${card.id}`; card.roundAttribute = 'atributo1';
    for (const entry of Object.values(card.values)) { entry.playValue = values.get(card.id)!; entry.displayValue = `Inv ${100 - entry.playValue}`; }
  }
  return { fixture, trace, indicators, points: Array.from({ length: count }, (_, player) => plan.filter((id) => id === player).length * count) };
}
