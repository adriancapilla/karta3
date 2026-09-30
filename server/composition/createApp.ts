import type { CodeCandidateSource, IdentifierGenerator, RoomRepository } from '../application/ports.js';
import type { Server as HttpServer } from 'node:http';
import { RoomUseCases } from '../application/roomUseCases.js';
import { createId, drawCodeCandidate } from '../infrastructure/generators.js';
import { createHttpApp } from '../infrastructure/http/expressApp.js';
import { MemoryRoomRepository } from '../infrastructure/memoryRoomRepository.js';
import { MemorySessions } from '../infrastructure/memorySessions.js';
import { MemoryRoomRequests } from '../infrastructure/memoryRoomRequests.js';
import { SocketRoomChanges } from '../infrastructure/socketRooms.js';

type Options = {
  repository?: RoomRepository;
  sessions?: MemorySessions;
  identifiers?: IdentifierGenerator;
  codes?: CodeCandidateSource;
  production?: boolean;
};

export function createRuntime(options: Options = {}) {
  const repository = options.repository ?? new MemoryRoomRepository();
  const sessions = options.sessions ?? new MemorySessions();
  const changes = new SocketRoomChanges();
  const rooms = new RoomUseCases(repository, options.identifiers ?? createId, options.codes ?? drawCodeCandidate, new MemoryRoomRequests(), changes);
  const production = options.production ?? process.env.NODE_ENV === 'production';
  return {
    app: createHttpApp({ rooms, sessions, production }),
    attachRealtime: (server: HttpServer) => changes.attach(server, rooms, sessions, production)
  };
}

export function createApp(options: Options = {}) {
  return createRuntime(options).app;
}
