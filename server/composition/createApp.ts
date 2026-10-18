import type { CardPermutation, Clock, CodeCandidateSource, IdentifierGenerator, RoomRepository, Scheduler } from '../application/ports.js';
import type { Server as HttpServer } from 'node:http';
import { RoomUseCases } from '../application/roomUseCases.js';
import { createId, drawCodeCandidate } from '../infrastructure/generators.js';
import { createHttpApp } from '../infrastructure/http/expressApp.js';
import { MemoryRoomRepository } from '../infrastructure/memoryRoomRepository.js';
import { MemorySessions } from '../infrastructure/memorySessions.js';
import { MemoryRoomRequests } from '../infrastructure/memoryRoomRequests.js';
import { SocketRoomChanges } from '../infrastructure/socketRooms.js';
import { WaitingLifecycle } from '../application/waitingLifecycle.js';
import { RoomCoordinator } from '../application/roomCoordinator.js';
import { GameCoordinator } from '../application/gameCoordinator.js';
import { permuteCards } from '../infrastructure/cardPermutation.js';
import { SystemClock, TimerScheduler } from '../infrastructure/time.js';
import { ListDecks, type DeckCatalog, type PublishedDeckVersions, type PublishedGameDecks } from '../application/deckCatalog.js';
import { LoadedDeckCatalog } from '../infrastructure/decks/catalog.js';
import { disabledUsage, type UsageRecorder } from '../application/usage/recording.js';

type Options = {
  repository?: RoomRepository;
  sessions?: MemorySessions;
  identifiers?: IdentifierGenerator;
  codes?: CodeCandidateSource;
  production?: boolean;
  clock?: Clock;
  scheduler?: Scheduler;
  decks?: DeckCatalog;
  deckVersions?: PublishedDeckVersions;
  gameDecks?: PublishedGameDecks;
  permutation?: CardPermutation;
  usage?: UsageRecorder;
  usageHttp?: import('../infrastructure/usage/http.js').UsageHttp;
};

export function createRuntime(options: Options = {}) {
  const repository = options.repository ?? new MemoryRoomRepository();
  const sessions = options.sessions ?? new MemorySessions();
  const changes = new SocketRoomChanges();
  const clock = options.clock ?? new SystemClock(); const scheduler = options.scheduler ?? new TimerScheduler();
  const usage = options.usage ?? disabledUsage;
  const lifecycle = new WaitingLifecycle(repository, clock, scheduler, changes, sessions, changes, usage);
  const emptyCatalog = new LoadedDeckCatalog([], new Map(), new Map());
  const requests = new MemoryRoomRequests();
  const games = new GameCoordinator(repository, requests, changes, clock, scheduler, options.permutation ?? permuteCards, usage);
  const coordinator = new RoomCoordinator(repository, lifecycle, changes, games);
  const rooms = new RoomUseCases(repository, options.identifiers ?? createId, options.codes ?? drawCodeCandidate, requests, coordinator,
    options.deckVersions ?? emptyCatalog, options.gameDecks ?? emptyCatalog, options.permutation ?? permuteCards, games, usage);
  const production = options.production ?? process.env.NODE_ENV === 'production';
  return {
    app: createHttpApp({ rooms, sessions, production, decks: new ListDecks(options.decks ?? emptyCatalog), usage: options.usageHttp }),
    attachRealtime: (server: HttpServer) => changes.attach(server, rooms, sessions, production),
    controlledStop: () => { for (const room of repository.allActive()) if (room.status === 'IN_GAME') usage.ended(room, true); },
    dispose: () => { changes.dispose(); coordinator.dispose(); }
  };
}

export function createApp(options: Options = {}) {
  return createRuntime(options).app;
}
