import type { Clock, CodeCandidateSource, IdentifierGenerator, RoomRepository, Scheduler } from '../application/ports.js';
import type { Server as HttpServer } from 'node:http';
import { RoomUseCases } from '../application/roomUseCases.js';
import { createId, drawCodeCandidate } from '../infrastructure/generators.js';
import { createHttpApp } from '../infrastructure/http/expressApp.js';
import { MemoryRoomRepository } from '../infrastructure/memoryRoomRepository.js';
import { MemorySessions } from '../infrastructure/memorySessions.js';
import { MemoryRoomRequests } from '../infrastructure/memoryRoomRequests.js';
import { SocketRoomChanges } from '../infrastructure/socketRooms.js';
import { WaitingLifecycle } from '../application/waitingLifecycle.js';
import { SystemClock, TimerScheduler } from '../infrastructure/time.js';

type Options = {
  repository?: RoomRepository;
  sessions?: MemorySessions;
  identifiers?: IdentifierGenerator;
  codes?: CodeCandidateSource;
  production?: boolean;
  clock?: Clock;
  scheduler?: Scheduler;
};

export function createRuntime(options: Options = {}) {
  const repository = options.repository ?? new MemoryRoomRepository();
  const sessions = options.sessions ?? new MemorySessions();
  const changes = new SocketRoomChanges();
  const lifecycle = new WaitingLifecycle(repository, options.clock ?? new SystemClock(), options.scheduler ?? new TimerScheduler(), changes, sessions, changes);
  const rooms = new RoomUseCases(repository, options.identifiers ?? createId, options.codes ?? drawCodeCandidate, new MemoryRoomRequests(), lifecycle);
  const production = options.production ?? process.env.NODE_ENV === 'production';
  return {
    app: createHttpApp({ rooms, sessions, production }),
    attachRealtime: (server: HttpServer) => changes.attach(server, rooms, sessions, production),
    dispose: () => { changes.dispose(); lifecycle.dispose(); }
  };
}

export function createApp(options: Options = {}) {
  return createRuntime(options).app;
}
