import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { ConfigureRoomRequest, RoomView, SocketAck } from '../../shared/contracts/room.js';
import { ControlledTime } from './controlledTime.js';
import { deckFixture, realImage, writeFixture } from './deckFixtures.js';
import { removeTestInstallation } from './compiledDeckServer.js';

/** Conexiones y paquetes reales, compilación actual; solamente el reloj es sustituido. */
export async function configurationBrowserServer(single = false) {
  const { createRuntime } = await import('../../dist-server/server/composition/createApp.js');
  const { prepareDecks, loadPreparedDecks } = await import('../../dist-server/server/infrastructure/decks/catalog.js');
  const { attachPublicFiles } = await import('../../dist-server/server/infrastructure/http/publicFiles.js');
  const { MemoryRoomRepository } = await import('../../dist-server/server/infrastructure/memoryRoomRepository.js');
  const { MemorySessions } = await import('../../dist-server/server/infrastructure/memorySessions.js');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'karta3-b04-b05-browser-'));
  const image = deckFixture('portada'); image.metadata.imageRef = 'imagenes/portada.png'; image.metadata.imageAlt = 'Portada sintética azul';
  const dir = await writeFixture(root, image); await fs.mkdir(path.join(dir, 'imagenes')); await fs.writeFile(path.join(dir, image.metadata.imageRef), await realImage('png'));
  if (!single) await writeFixture(root, deckFixture('sin-imagen', true, 1));
  await writeFixture(root, deckFixture('borrador', false, 2));
  const loaded = await prepareDecks(root).then(() => loadPreparedDecks(root)).catch(async (error: unknown) => { await removeTestInstallation(root); throw error; });
  const time = new ControlledTime(); const repository = new MemoryRoomRepository(); const sessions = new MemorySessions();
  const runtime = createRuntime({ repository, sessions, decks: loaded.catalog, deckVersions: loaded.catalog,
    clock: time, scheduler: time, codes: () => 42 });
  attachPublicFiles(runtime.app, path.resolve('dist'), loaded.catalog);
  const server = createServer(runtime.app); const io = runtime.attachRealtime(server);
  const requests: ConfigureRoomRequest[] = [];
  type Ack = SocketAck<{ room: RoomView }>;
  let intercept: ((payload: ConfigureRoomRequest, deliver: (result: Ack) => void, result: Ack) => void) | undefined;
  io.on('connection', (socket) => {
    const original = socket.listeners('room:configure')[0];
    socket.removeAllListeners('room:configure');
    socket.on('room:configure', (payload: ConfigureRoomRequest, ack: (result: Ack) => void) => {
      requests.push(payload);
      original(payload, (result: Ack) => intercept ? intercept(payload, ack, result) : ack(result));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Puerto ausente');
  return { base: `http://127.0.0.1:${address.port}`, time, repository, sessions, requests, loaded,
    intercept: (handler: typeof intercept) => { intercept = handler; },
    disconnect: (sessionId: string) => { io.in(`session:${sessionId}`).disconnectSockets(true); },
    dropOneTransport: (sessionId: string) => { [...io.sockets.sockets.values()].find((socket) => socket.data.sessionId === sessionId)?.conn.close(); },
    stop: async () => { runtime.dispose(); await new Promise<void>((resolve) => io.close(() => resolve())); await removeTestInstallation(root); } };
}
