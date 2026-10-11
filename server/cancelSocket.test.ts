import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { io } from 'socket.io-client';
import { manualSockets, accepted, socketAck } from '../tests/support/manualSocketCases.js';
import type { ResultsRoomView, RoomView } from '../shared/contracts/room.js';

describe('B13 transportes reales con reloj sustituido', () => {
  it('forma exacta, autoridad original, dos pestañas y proyección de cada humano/observador', async () => {
    const f = await manualSockets(2, { observer: true, review: 5 });
    try {
      const tab = await f.tab(f.host.cookie); const tabStates: RoomView[] = []; tab.on('room:state', (event) => tabStates.push(event.room));
      const input = { requestId: 'cancel-socket', roomId: f.room.id, gameId: f.start.game.id };
      for (const invalid of [null, [], {}, { ...input, role: 'HOST' }, { ...input, points: 999 }, { ...input, reason: 'HOST_CANCELLED' }, { ...input, sessionId: 'x' },
        { ...input, turnId: 'x' }, { ...input, requestId: '' }, { ...input, gameId: 'a'.repeat(101) }, { ...input, roomId: 8 }, { requestId: 'x', roomId: input.roomId }]) {
        expect(await socketAck(f.host.socket, 'game:cancel', invalid)).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
      }
      expect(await socketAck(f.people[1].socket, 'game:cancel', input)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
      const other = await f.session(); expect(await socketAck(other.socket, 'game:cancel', input)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
      expect(await socketAck(f.host.socket, 'game:cancel', { ...input, gameId: 'otra' })).toMatchObject({ ok: false, error: { code: 'STALE_GAME_CONTEXT' } });
      expect(await socketAck(f.host.socket, 'game:cancel', { ...input, roomId: 'ausente' })).toMatchObject({ ok: false, error: { code: 'ROOM_NOT_AVAILABLE' } });
      const unauthorized = io(f.base, { transports: ['websocket'], reconnection: false, extraHeaders: { Origin: f.base } });
      const error = await new Promise<Error>((resolve) => unauthorized.once('connect_error', resolve)); unauthorized.close(); expect(error.message).toBe('Sesión no disponible.');
      await f.play(); // Ronda incompleta: no hay puntos.
      const [first, second] = await Promise.all([socketAck(f.host.socket, 'game:cancel', input), socketAck(tab, 'game:cancel', { ...input, requestId: 'other-tab' })]);
      const result = accepted(first) as ResultsRoomView; expect(accepted(second)).toEqual(result);
      expect(result.result).toMatchObject({ endReason: 'HOST_CANCELLED', winnerIds: [], tieBreakWinnerId: null, completedNormally: false });
      expect(result.result.standings.every((p) => p.score === 0)).toBe(true); expect(result.participant.role).toBe('HOST'); expect(result.participant.score).toBeNull();
      await vi.waitFor(() => { for (const person of f.people) expect(person.states.filter((r) => r.status === 'RESULTS')).toHaveLength(1); expect(tabStates.filter((r) => r.status === 'RESULTS')).toHaveLength(1); });
      for (const person of f.people) {
        const current = await request(f.base).get('/api/rooms/current').set('Cookie', person.cookie);
        expect(current.body.room).toBeNull(); expect(current.body.lastResult.gameId).toBe(input.gameId);
        const response = await request(f.base).get(`/api/results/${input.gameId}`).set('Cookie', person.cookie);
        expect(response.status).toBe(200); expect(response.headers['cache-control']).toBe('no-store');
        const view = response.body.room as ResultsRoomView;
        expect(view.participant.id).toBe(f.repository.findById(f.room.id)!.participantFor(person.sessionId)!.id);
        expect(view).toEqual(person.states.filter((r) => r.status === 'RESULTS')[0]);
        expect(Object.keys(view).sort()).toEqual(['id', 'code', 'status', 'revision', 'participant', 'participants', 'settings', 'selectedDeck', 'result'].sort());
        expect(JSON.stringify(view)).not.toMatch(/hand|drawPile|wonCards|presence|sessionId|seed|generation|monotonic|cards|openingSelection/);
        const oldUrl = await request(f.base).get(`/api/rooms/${f.room.id}`).set('Cookie', person.cookie); expect(oldUrl.body.room.status).toBe('RESULTS');
        expect(f.repository.findActiveBySession(person.sessionId)).toBeUndefined();
      }
      expect((await request(f.base).get(`/api/results/${input.gameId}`).set('Cookie', other.cookie)).status).toBe(403);
      expect((await request(f.base).get(`/api/results/${input.gameId}`)).status).toBe(401);
      expect(await socketAck(f.people[1].socket, 'game:cancel', input)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
      expect(await socketAck(tab, 'game:cancel', { ...input, requestId: 'start' })).toMatchObject({ ok: false, error: { code: 'REQUEST_CONFLICT' } });
      const expiresAt = result.result.retention.expiresAt;
      for (const person of f.people) expect((await request(f.base).post('/api/rooms').set('Cookie', person.cookie).send({})).status).toBe(201);
      const newRooms = f.people.map((p) => f.repository.findActiveBySession(p.sessionId)!.id);
      f.time.elapse(1000);
      for (const [index, person] of f.people.entries()) await request(f.base).patch(`/api/rooms/${newRooms[index]}/name`).set('Cookie', person.cookie).send({ name: 'Nueva mesa' });
      const replay = accepted(await socketAck(tab, 'game:cancel', input)) as ResultsRoomView; expect(replay.result.retention.expiresAt).toBe(expiresAt);
      expect(await socketAck(f.host.socket, 'results:return-home', { ...input, requestId: 'late-home' })).toMatchObject({ ok: false, error: { code: 'STALE_GAME_CONTEXT' } });
      f.time.elapse(expiresAt - f.time.now().unix);
      expect((await request(f.base).get(`/api/results/${input.gameId}`).set('Cookie', f.host.cookie)).status).toBe(404);
      expect(await socketAck(tab, 'game:cancel', input)).toMatchObject({ ok: false, error: { code: 'ROOM_NOT_AVAILABLE' } });
      expect(f.people.map((p) => f.repository.findActiveBySession(p.sessionId)?.id)).toEqual(newRooms);
    } finally { await f.stop(); }
  }, 15_000);
  it('ack y evento perdidos: lectura autorizada/replay recuperan el registro sin repetir publicación', async () => {
    const f = await manualSockets(2);
    try {
      const tab = await f.tab(f.host.cookie); const input = { requestId: 'lost', roomId: f.room.id, gameId: f.start.game.id };
      const serverSocket = [...f.channel.sockets.sockets.values()].find((s) => s.data.sessionId === f.host.sessionId)!;
      const handler = serverSocket.listeners('game:cancel')[0]; serverSocket.removeAllListeners('game:cancel');
      serverSocket.on('game:cancel', (payload: object) => handler(payload, () => {}));
      const to = f.channel.to.bind(f.channel); let publications = 0;
      f.channel.to = (name: string | string[]) => {
        const operator = to(name); const emit = operator.emit.bind(operator);
        operator.emit = (event: string, payload: { room?: RoomView }) => {
          if (event === 'room:state' && payload.room?.status === 'RESULTS') { publications++; if (name === `session:${f.host.sessionId}`) return true; }
          return emit(event, payload);
        }; return operator;
      };
      await expect(socketAck(f.host.socket, 'game:cancel', input, 100)).rejects.toThrow();
      const retained = f.repository.findById(f.room.id)!.retention;
      expect(publications).toBe(2); expect(f.repository.findActiveBySession(f.host.sessionId)).toBeUndefined();
      const response = await request(f.base).get(`/api/results/${input.gameId}`).set('Cookie', f.host.cookie); expect(response.body.room.result.endReason).toBe('HOST_CANCELLED');
      expect(accepted(await socketAck(tab, 'game:cancel', input))).toEqual(response.body.room);
      expect(f.repository.findById(f.room.id)!.retention).toBe(retained); expect(publications).toBe(2); expect(f.time.pending).toBe(1);
    } finally { await f.stop(); }
  }, 10_000);
});
