import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import { vi } from 'vitest';
import { createRuntime } from '../../server/composition/createApp.js';
import { prepareDecks } from '../../server/infrastructure/decks/catalog.js';
import { MemoryRoomRepository } from '../../server/infrastructure/memoryRoomRepository.js';
import { MemorySessions } from '../../server/infrastructure/memorySessions.js';
import { manualTrace } from './manualGameTrace.js';
import { writeFixture, realImage } from './deckFixtures.js';
import { ControlledTime } from './controlledTime.js';
import { removeTestInstallation } from './compiledDeckServer.js';
import type { RoundResolvedEvent, TurnExpiredEvent } from '../../shared/contracts/game.js';
import type { CurrentRoomResponse, InitialGameRoomView, ResultsHomeEvent, RoomView, SocketAck } from '../../shared/contracts/room.js';

export const socketAck = <T = { room: RoomView }>(socket: Socket, event: string, input: unknown, timeout = 3000) => new Promise<SocketAck<T>>((resolve, reject) => {
  socket.timeout(timeout).emit(event, input, (error: Error | null, result: SocketAck<T>) => error ? reject(error) : resolve(result));
});
export function accepted(result: SocketAck<{ room: RoomView }>): RoomView {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.room;
}
export async function manualSockets(count = 2, options: { observer?: boolean; tie?: boolean; review?: 0 | 5; winners?: readonly number[]; turn?: 15 | 30 | 60 } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-b04-b07-sockets-'));
  const prepared = manualTrace(count, options.winners); const fixture = prepared.fixture;
  fixture.collection.cards[0].imageRef = 'imagenes/carta.png'; fixture.collection.cards[0].imageAlt = 'Imagen validada de traza manual';
  const directory = await writeFixture(root, fixture); await fs.mkdir(path.join(directory, 'imagenes')); await fs.writeFile(path.join(directory, 'imagenes/carta.png'), await realImage('png'));
  const loaded = await prepareDecks(root); const time = new ControlledTime(); const repository = new MemoryRoomRepository(); const sessions = new MemorySessions();
  const permutation = vi.fn((ids: readonly string[]) => [...ids]); let code = 42;
  const runtime = createRuntime({ repository, sessions, clock: time, scheduler: time, decks: loaded.catalog, deckVersions: loaded.catalog, gameDecks: loaded.catalog,
    permutation, codes: () => code++ });
  const server = createServer(runtime.app); const channel = runtime.attachRealtime(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Puerto ausente');
  const base = `http://127.0.0.1:${address.port}`; const clients: Socket[] = [];
  const tab = async (cookie: string) => {
    const socket = io(base, { transports: ['websocket'], reconnection: false, extraHeaders: { Cookie: cookie, Origin: base } }); clients.push(socket);
    await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
    await socketAck<CurrentRoomResponse>(socket, 'room:resume', {}); return socket;
  };
  const session = async () => {
    const response = await request(base).get('/api/rooms/current'); const cookie = String(response.headers['set-cookie'][0]).split(';')[0];
    const socket = await tab(cookie); const states: RoomView[] = []; const resolutions: RoundResolvedEvent[] = []; const homes: ResultsHomeEvent[] = []; const expirations: TurnExpiredEvent[] = [];
    socket.on('room:state', (event) => states.push(event.room)); socket.on('game:round-resolved', (event) => resolutions.push(event)); socket.on('results:home', (event) => homes.push(event));
    socket.on('game:turn-expired', (event) => expirations.push(event));
    return { cookie, socket, states, resolutions, homes, expirations, sessionId: sessions.get(cookie.split('=')[1])! };
  };
  const people = []; for (let index = 0; index < count + Number(!!options.observer); index++) people.push(await session());
  const host = people[0]; const room: RoomView = (await request(base).post('/api/rooms').set('Cookie', host.cookie).send({})).body.room;
  const config = (id: string, change: unknown) => socketAck(host.socket, 'room:configure', { requestId: id, roomId: room.id, change });
  if (options.observer) await config('observer', { field: 'hostPlays', value: false });
  await config('review', { field: 'reviewSeconds', value: options.review ?? 0 }); await config('tie', { field: 'forceTieBreak', value: options.tie ?? false });
  if (options.turn) await config('turn', { field: 'turnSeconds', value: options.turn });
  for (let index = 1; index < people.length; index++) await socketAck(people[index].socket, 'room:join', { requestId: 'join', code: room.code, name: `Persona ${index}` });
  await config('deck', { field: 'deck', value: { id: 'manual', contentVersion: 7 } });
  const start = accepted(await socketAck(host.socket, 'room:start', { requestId: 'start', roomId: room.id })) as InitialGameRoomView;
  const own = async (person = host) => (await request(base).get('/api/rooms/current').set('Cookie', person.cookie)).body.room as RoomView;
  let n = 0;
  const inputs: { person: typeof host; input: object; ack: RoomView }[] = [];
  async function play() {
    const current = await own() as InitialGameRoomView;
    const person = people.find((item) => sessions.get(item.cookie.split('=')[1]) === repository.findById(room.id)!.participants.find((p) => p.id === current.game.interaction.turn!.playerId)!.sessionId)!;
    const view = await own(person) as InitialGameRoomView;
    const input = { requestId: `human-${++n}`, roomId: room.id, gameId: view.game.id, roundNumber: view.game.round.number, turnId: view.game.interaction.turn!.id,
      cardId: view.game.hand[0].id, direction: view.game.round.direction ? null : 'HIGH' };
    const ack = accepted(await socketAck(person.socket, 'game:play', input)); inputs.push({ person, input, ack }); return ack;
  }
  async function complete() {
    while (repository.findById(room.id)!.status === 'IN_GAME') {
      if (repository.findById(room.id)!.gameReview) time.advance((options.review ?? 0) * 1000); else await play();
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  return { base, root, runtime, channel, repository, sessions, time, people, host, prepared, start, room, own, play, complete, inputs, config, tab, session, permutation,
    stop: async () => { runtime.dispose(); clients.forEach((socket) => socket.disconnect()); await new Promise<void>((resolve) => channel.close(() => resolve())); await removeTestInstallation(root); } };
}
