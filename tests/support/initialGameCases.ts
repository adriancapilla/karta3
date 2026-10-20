import { vi } from 'vitest';
import { RoomUseCases } from '../../server/application/roomUseCases.js';
import { WaitingLifecycle } from '../../server/application/waitingLifecycle.js';
import { RoomCoordinator } from '../../server/application/roomCoordinator.js';
import { GameCoordinator } from '../../server/application/gameCoordinator.js';
import { MemoryRoomRepository } from '../../server/infrastructure/memoryRoomRepository.js';
import { MemoryRoomRequests } from '../../server/infrastructure/memoryRoomRequests.js';
import { validatePackageFormat } from '../../server/infrastructure/decks/packageFormat.js';
import { LoadedDeckCatalog } from '../../server/infrastructure/decks/catalog.js';
import type { PublishedGameDecks } from '../../server/application/deckCatalog.js';
import type { CardPermutation } from '../../server/application/ports.js';
import { ControlledTime } from './controlledTime.js';
import { deckFixture } from './deckFixtures.js';
import type { StatisticsRecorder } from '../../server/application/statistics/recording.js';

export function initialGameCases(options: { gameDecks?: PublishedGameDecks; permutation?: CardPermutation; fixture?: ReturnType<typeof deckFixture>; statistics?: StatisticsRecorder; time?: ControlledTime } = {}) {
  const fixture = options.fixture ?? deckFixture(); const deckId = fixture.metadata.id;
  const definition = validatePackageFormat(fixture.metadata, fixture.collection, fixture.metadata.id).data!.definition;
  const summary = { id: deckId, schemaVersion: 2 as const, contentVersion: 7, name: 'Prueba', subtitle: '', description: 'Sintética', imageUrl: null, imageAlt: '' };
  const catalog = new LoadedDeckCatalog([summary], new Map([[deckId, { contentVersion: 7, definition, instructions: fixture.metadata.instructions,
    presentation: definition.cards.map((card) => ({ id: card.id, imageUrl: null, imageAlt: '' })) }]]), new Map());
  const repository = new MemoryRoomRepository(); const requests = new MemoryRoomRequests();
  const events = { updated: vi.fn(), closed: vi.fn(), left: vi.fn(), roundResolved: vi.fn(), turnExpired: vi.fn(), resultsHome: vi.fn(), technicalFailure: vi.fn() };
  const connected = new Set(['host', 'other', ...Array.from({ length: 6 }, (_, n) => `g${n}`)]);
  const ends = new Map(); const time = options.time ?? new ControlledTime();
  const waiting = new WaitingLifecycle(repository, time, time, { isConnected: (id) => connected.has(id) },
    { getEnd: (id) => ends.get(id), saveEnd: (id, end) => ends.set(id, end), clearEnd: (id) => { ends.delete(id); } }, events, options.statistics);
  let n = 0; const permutation = vi.fn(options.permutation ?? ((ids) => [...ids]));
  const games = new GameCoordinator(repository, requests, events, time, time, permutation, options.statistics);
  const coordinator = new RoomCoordinator(repository, waiting, events, games);
  const rooms = new RoomUseCases(repository, () => `id-${++n}`, () => n + 42, requests, coordinator, catalog, options.gameDecks ?? catalog, permutation, games, options.statistics);
  const initial = rooms.createOrGet('host'); const room = repository.findById(initial.id)!;
  const configure = (change: Parameters<typeof rooms.configure>[3], id = `config-${++n}`) => rooms.configure('host', id, room.id, change);
  const select = () => configure({ field: 'deck', value: { id: deckId, contentVersion: 7 } }, 'select');
  const join = (session = 'g0') => rooms.join(session, `join-${session}`, room.code, 'Ana');
  const start = (requestId = 'start') => rooms.start('host', requestId, room.id);
  return { rooms, room, initial, repository, requests, events, time, waiting, connected, coordinator, catalog, definition, permutation, configure, select, join, start };
}
