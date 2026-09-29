import type { CodeCandidateSource, IdentifierGenerator, RoomRepository } from '../application/ports.js';
import { RoomUseCases } from '../application/roomUseCases.js';
import { createId, drawCodeCandidate } from '../infrastructure/generators.js';
import { createHttpApp } from '../infrastructure/http/expressApp.js';
import { MemoryRoomRepository } from '../infrastructure/memoryRoomRepository.js';
import { MemorySessions } from '../infrastructure/memorySessions.js';

export function createApp(options: {
  repository?: RoomRepository;
  sessions?: MemorySessions;
  identifiers?: IdentifierGenerator;
  codes?: CodeCandidateSource;
  production?: boolean;
} = {}) {
  const repository = options.repository ?? new MemoryRoomRepository();
  const sessions = options.sessions ?? new MemorySessions();
  const rooms = new RoomUseCases(repository, options.identifiers ?? createId, options.codes ?? drawCodeCandidate);
  return createHttpApp({ rooms, sessions, production: options.production ?? process.env.NODE_ENV === 'production' });
}
