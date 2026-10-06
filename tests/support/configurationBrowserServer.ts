import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { ConfigureRoomRequest, StartRoomRequest, RoomView, SocketAck, CurrentRoomResponse, ReturnHomeRequest, BotResponse } from '../../shared/contracts/room.js';
import { ControlledTime } from './controlledTime.js';
import { deckFixture, realImage, writeFixture } from './deckFixtures.js';
import { removeTestInstallation } from './compiledDeckServer.js';
import { manualTrace } from './manualGameTrace.js';
import { botTrace } from './botTrace.js';
import type { TurnExpiredEvent } from '../../shared/contracts/game.js';

/** Conexiones y paquetes reales, compilación actual; solamente el reloj es sustituido. */
export async function configurationBrowserServer(single = false, initialGame = false, manual?: { count: number; winners?: readonly number[]; botSeed?: number }, presentation: { longText?: boolean; generic?: boolean; distinct?: boolean } = {}) {
  const { createRuntime } = await import('../../dist-server/server/composition/createApp.js');
  const { prepareDecks, loadPreparedDecks } = await import('../../dist-server/server/infrastructure/decks/catalog.js');
  const { attachPublicFiles } = await import('../../dist-server/server/infrastructure/http/publicFiles.js');
  const { MemoryRoomRepository } = await import('../../dist-server/server/infrastructure/memoryRoomRepository.js');
  const { MemorySessions } = await import('../../dist-server/server/infrastructure/memorySessions.js');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-b04-b05-browser-'));
  const mixed = manual?.botSeed === undefined ? undefined : botTrace(manual.count, manual.botSeed);
  const prepared = manual ? { ...manualTrace(manual.count, manual.winners), ...(mixed ? { fixture: mixed.fixture } : {}) } : undefined;
  const image = prepared?.fixture ?? deckFixture('portada'); image.metadata.imageRef = 'imagenes/portada.png'; image.metadata.imageAlt = 'Portada sintética azul';
  if (initialGame && !manual) {
    image.metadata.attributes[0].unit = 'NO HEREDAR';
    image.collection.cards.forEach((card, index) => {
      card.name = `Carta de prueba ${index + 1}`;
      card.characteristic = `Característica completa de la carta ${index + 1}`;
      card.note = `Nota completa de la carta ${index + 1}`;
      card.values.atributo1.displayValue = String(card.values.atributo1.playValue);
      card.values.atributo2.unit = 'km';
      card.roundAttribute = index === 6 ? 'atributo2' : 'atributo3';
      if (index % 2 === 0) { card.imageRef = 'imagenes/portada.png'; card.imageAlt = `Imagen validada de carta ${index + 1}`; }
    });
  }
  if (manual) { image.collection.cards[0].imageRef = 'imagenes/portada.png'; image.collection.cards[0].imageAlt = 'Imagen validada de traza manual'; }
  if (presentation.longText) {
    image.metadata.attributes[0].name = 'Magnitud de observación longitudinal';
    image.collection.cards.forEach((card) => { card.values.atributo1.unit = 'kilómetros por segundo cuadrado'; });
  }
  if (presentation.distinct) {
    image.collection.cards[0].roundAttribute = 'atributo2';
    image.collection.cards[6].roundAttribute = 'atributo1';
    image.collection.cards[0].values.atributo1.displayValue = '700';
    image.collection.cards[0].values.atributo1.unit = 'km';
  }
  const dir = await writeFixture(root, image); await fs.mkdir(path.join(dir, 'imagenes')); await fs.writeFile(path.join(dir, image.metadata.imageRef), await realImage('png'));
  if (!single) await writeFixture(root, deckFixture('sin-imagen', true, 1));
  await writeFixture(root, deckFixture('borrador', false, 2));
  if (presentation.generic) await fs.cp(path.resolve('barajas/generica'), path.join(root, 'generica'), { recursive: true });
  const loaded = await prepareDecks(root).then(() => loadPreparedDecks(root)).catch(async (error: unknown) => { await removeTestInstallation(root); throw error; });
  const time = new ControlledTime(); const repository = new MemoryRoomRepository(); const sessions = new MemorySessions();
  let permute: (ids: readonly string[]) => readonly string[] = (ids) => mixed && ids.length === 58 ? mixed.permutation : [...ids];
  let permutations = 0;
  let code = 42;
  const runtime = createRuntime({ repository, sessions, decks: loaded.catalog, deckVersions: loaded.catalog, gameDecks: loaded.catalog,
    ...(initialGame ? { permutation: (ids: readonly string[]) => { permutations++; return permute(ids); } } : {}),
    clock: time, scheduler: time, codes: () => code++ });
  attachPublicFiles(runtime.app, path.resolve('dist'), loaded.catalog);
  const server = createServer(runtime.app); const io = runtime.attachRealtime(server);
  const requests: ConfigureRoomRequest[] = [];
  type Ack = SocketAck<{ room: RoomView }>;
  let intercept: ((payload: ConfigureRoomRequest, deliver: (result: Ack) => void, result: Ack) => void) | undefined;
  const starts: StartRoomRequest[] = [];
  let interceptStart: ((payload: StartRoomRequest, deliver: (result: Ack) => void, result: Ack) => void) | undefined;
  const gameRequests: { event: string; payload: Record<string, unknown> }[] = [];
  const botRequests: { event: string; payload: Record<string, unknown> }[] = [];
  type BotAck = SocketAck<BotResponse>;
  let interceptBot: ((event: string, payload: Record<string, unknown>, deliver: (result: BotAck) => void, result: BotAck) => void) | undefined;
  let interceptGame: ((event: string, payload: Record<string, unknown>, deliver: (result: Ack) => void, result: Ack) => void) | undefined;
  type CurrentAck = SocketAck<CurrentRoomResponse>;
  let interceptHome: ((payload: ReturnHomeRequest, deliver: (result: CurrentAck) => void, result: CurrentAck) => void) | undefined;
  let interceptResume: ((deliver: (result: CurrentAck) => void, result: CurrentAck) => void) | undefined;
  let suppressStateFor: string | undefined;
  const target = io.to.bind(io);
  io.to = (name: string | string[]) => {
    const operator = target(name); const emit = operator.emit.bind(operator);
    operator.emit = (event: string, data: { room?: RoomView }) => event === 'room:state' && data.room?.status === 'IN_GAME'
      && name === `session:${suppressStateFor}` ? true : emit(event, data);
    return operator;
  };
  io.on('connection', (socket) => {
    for (const event of ['room:bot-add', 'room:bot-difficulty', 'room:bot-rename', 'room:bot-remove']) {
      const original = socket.listeners(event)[0]; socket.removeAllListeners(event);
      socket.on(event, (payload: Record<string, unknown>, ack: (result: BotAck) => void) => {
        botRequests.push({ event, payload }); original(payload, (result: BotAck) => interceptBot ? interceptBot(event, payload, ack, result) : ack(result));
      });
    }
    const home = socket.listeners('results:return-home')[0]; socket.removeAllListeners('results:return-home');
    socket.on('results:return-home', (payload: ReturnHomeRequest, ack: (result: CurrentAck) => void) => {
      home(payload, (result: CurrentAck) => interceptHome ? interceptHome(payload, ack, result) : ack(result));
    });
    const resume = socket.listeners('room:resume')[0]; socket.removeAllListeners('room:resume');
    socket.on('room:resume', (payload: object, ack: (result: CurrentAck) => void) => {
      resume(payload, (result: CurrentAck) => interceptResume ? interceptResume(ack, result) : ack(result));
    });
    const original = socket.listeners('room:configure')[0];
    socket.removeAllListeners('room:configure');
    socket.on('room:configure', (payload: ConfigureRoomRequest, ack: (result: Ack) => void) => {
      requests.push(payload);
      original(payload, (result: Ack) => intercept ? intercept(payload, ack, result) : ack(result));
    });
    const start = socket.listeners('room:start')[0]; socket.removeAllListeners('room:start');
    socket.on('room:start', (payload: StartRoomRequest, ack: (result: Ack) => void) => {
      starts.push(payload); start(payload, (result: Ack) => interceptStart ? interceptStart(payload, ack, result) : ack(result));
    });
    for (const event of ['game:opening-direction', 'game:play']) {
      const original = socket.listeners(event)[0]; socket.removeAllListeners(event);
      socket.on(event, (payload: Record<string, unknown>, ack: (result: Ack) => void) => {
        gameRequests.push({ event, payload }); original(payload, (result: Ack) => interceptGame ? interceptGame(event, payload, ack, result) : ack(result));
      });
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Puerto ausente');
  return { base: `http://127.0.0.1:${address.port}`, time, repository, sessions, requests, loaded, starts, prepared, gameRequests, botRequests,
    interceptBot: (handler: typeof interceptBot) => { interceptBot = handler; },
    intercept: (handler: typeof intercept) => { intercept = handler; },
    interceptStart: (handler: typeof interceptStart) => { interceptStart = handler; },
    interceptGame: (handler: typeof interceptGame) => { interceptGame = handler; },
    interceptHome: (handler: typeof interceptHome) => { interceptHome = handler; },
    interceptResume: (handler: typeof interceptResume) => { interceptResume = handler; },
    suppressGameState: (sessionId?: string) => { suppressStateFor = sessionId; },
    permutation: (handler: typeof permute) => { permute = handler; },
    permutations: () => permutations,
    disconnect: (sessionId: string) => { io.in(`session:${sessionId}`).disconnectSockets(true); },
    dropOneTransport: (sessionId: string) => { [...io.sockets.sockets.values()].find((socket) => socket.data.sessionId === sessionId)?.conn.close(); },
    repeatTurnExpired: (event: TurnExpiredEvent) => {
      for (const sessionId of repository.findById(event.roomId)!.memberSessions) io.to(`session:${sessionId}`).emit('game:turn-expired', event);
    },
    stop: async () => { runtime.dispose(); await new Promise<void>((resolve) => io.close(() => resolve())); await removeTestInstallation(root); } };
}
