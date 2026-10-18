import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { SqliteUsageStore, DETAIL_MS } from './sqliteStore.js';
import type { ServerUsageFact, UsageConfiguration, UsageEvent, UsageReportName } from '../../application/usage/contracts.js';
import { backupUsage, restoreUsageBackup } from './backups.js';
import { validUsageEvent } from './eventValidation.js';

const start = Date.UTC(2026, 0, 1); const boot = randomUUID();
const configuration: UsageConfiguration = { deckId: 'generica', deckSchemaVersion: 2, deckContentVersion: 4, humanPlayerCount: 2,
  humanObserverCount: 0, botCount: 0, playerCount: 2, hostPlays: true, botsByDifficulty: { EASY: 0, HARD: 0 }, turnSeconds: 15,
  reviewSeconds: 5, forceTieBreak: false, attributeValueMode: 'PLAY_VALUE', optimizeForMobile: false };
const event = (fact: ServerUsageFact, at = start + 1): UsageEvent => ({ ...fact, eventId: randomUUID(), bootRef: boot, version: 1,
  source: 'SERVER', environment: 'test', traffic: 'SYNTHETIC', occurredAt: at, receivedAt: at });
const directories: string[] = []; const stores: SqliteUsageStore[] = [];
function setup() { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'karta3-usage-')); directories.push(root);
  const store = new SqliteUsageStore(path.join(root, 'usage.sqlite'), 'test', start, boot); stores.push(store); return { root, store }; }
function read(store: SqliteUsageStore, report: UsageReportName, now = start + 10_000) { return store.read({ report, environment: 'test', from: start, to: now }, now, 'SYNTHETIC'); }
afterEach(() => { for (const store of stores.splice(0)) { try { store.close(); } catch { /* ya cerrado para reinicio */ } }
  for (const root of directories.splice(0)) { if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-usage-')) throw new Error('ruta temporal'); fs.rmSync(root, { recursive: true, force: true }); } });
describe('B18 SQLite temporal real, reloj controlado', () => {
  it('inserción/replay/conflicto y rollback conservan lo primero', () => {
    const { store } = setup(); const fact = event({ name: 'room_created', data: { roomRef: randomUUID() } });
    store.append([fact, fact]); expect(read(store, 'creation').rows.find((r) => r.metric === 'created')?.count).toBe(1);
    store.append([{ ...fact, data: { roomRef: randomUUID() } }]); expect(read(store, 'creation').quality.conflicts).toBe(1);
    expect(() => store.append([event({ name: 'room_created', data: { roomRef: randomUUID() } })], () => { throw new Error('interrupción'); })).toThrow('interrupción');
    expect(read(store, 'creation').rows.find((r) => r.metric === 'created')?.count).toBe(1);
  });
  it('fórmulas conocidas 2/4, 1/2, 1/3 y suma/media, cohortes no por fin', () => {
    const { store } = setup(); const rooms = Array.from({ length: 4 }, () => randomUUID()); const games = [randomUUID(), randomUUID()];
    const people = [randomUUID(), randomUUID(), randomUUID()];
    store.append(rooms.map((roomRef) => event({ name: 'room_created', data: { roomRef } })));
    store.append(games.map((gameRef, i) => event({ name: 'game_started', data: { roomRef: rooms[i], gameRef,
      configuration: i ? { ...configuration, humanPlayerCount: 1, botCount: 1, botsByDifficulty: { EASY: 0, HARD: 1 } } : configuration,
      humanParticipations: (i ? [people[2]] : people.slice(0, 2)).map((participationRef) => ({ participationRef, isHost: false })) } })));
    store.append([event({ name: 'room_waiting_closed', data: { roomRef: rooms[3], reason: 'HOST_CLOSED' } }),
      event({ name: 'human_became_automatic', data: { roomRef: rooms[0], gameRef: games[0], participationRef: people[0], phase: 'BASE' } }),
      ...games.map((gameRef, i) => event({ name: 'game_ended', data: { gameRef, roomRef: rooms[i], reason: i ? 'HOST_CANCELLED' : 'DECK_COMPLETED', durationMs: i ? 3000 : 1000, evidence: 'GAME_RESULT' } }))]);
    expect(read(store, 'room-conversion')).toMatchObject({ numerator: 2, denominator: 4, percentage: 50 });
    expect(read(store, 'completion')).toMatchObject({ numerator: 1, denominator: 2, percentage: 50 });
    expect(read(store, 'automatic')).toMatchObject({ numerator: 1, denominator: 3 });
    expect(read(store, 'duration')).toMatchObject({ numerator: 4000, denominator: 2 });
    const before = read(store, 'completion'); const cutoff = start + 1 + DETAIL_MS;
    store.maintain(cutoff - 1); expect(store.db.prepare('SELECT count(*) n FROM subjects').get()?.n).not.toBe(0);
    store.maintain(cutoff); store.maintain(cutoff);
    expect(read(store, 'completion', cutoff)).toMatchObject({ numerator: before.numerator, denominator: before.denominator });
    expect(store.db.prepare('SELECT count(*) n FROM events').get()?.n).toBe(0);
    const contents = JSON.stringify(store.db.prepare('SELECT * FROM monthly').all()); for (const id of [...rooms, ...games, ...people]) expect(contents).not.toContain(id);
    const bytes = fs.readFileSync(store.file); for (const id of [...rooms, ...games, ...people, boot]) expect(bytes.includes(Buffer.from(id))).toBe(false);
    expect(() => store.read({ report: 'completion', environment: 'test', from: start + 1, to: cutoff }, cutoff, 'SYNTHETIC')).toThrow('INSUFFICIENT_DETAIL');
  });
  it('censura/reinicio desconocido y entorno no se convierten en resultados', () => {
    const { store, root } = setup(); store.append([event({ name: 'room_created', data: { roomRef: randomUUID() } })]); store.close();
    expect(() => new SqliteUsageStore(path.join(root, 'usage.sqlite'), 'production', start + 2)).toThrow('ENVIRONMENT_MISMATCH');
    const next = new SqliteUsageStore(path.join(root, 'usage.sqlite'), 'test', start + 2, randomUUID()); stores.push(next);
    expect(read(next, 'room-conversion').rows.some((r) => r.metric === 'WAITING_LOST_ON_RESTART')).toBe(true);
    expect(read(next, 'room-conversion').quality.possibleLoss).toBe(true);
  });
  it('archivo nuevo cifrado/restaurado contiene agregados actuales, cero detalle/IDs', async () => {
    const { store, root } = setup(); const id = randomUUID(); store.append([event({ name: 'room_created', data: { roomRef: id } })]);
    const key = Buffer.alloc(32, 7); const file = await backupUsage(store, path.join(root, 'copies'), key, start + 1000);
    expect(fs.readFileSync(file).includes(Buffer.from(id))).toBe(false);
    const restoredFile = path.join(root, 'restored.sqlite'); await restoreUsageBackup(file, restoredFile, key, 'test', start + 2000);
    expect(fs.readFileSync(restoredFile).includes(Buffer.from(id))).toBe(false);
    const restored = new SqliteUsageStore(restoredFile, 'test', start + 2000); stores.push(restored);
    expect(restored.db.prepare('SELECT count(*) n FROM events').get()?.n).toBe(0);
    expect(restored.db.prepare('SELECT count(*) n FROM subjects').get()?.n).toBe(0);
    expect(read(restored, 'creation', Date.UTC(2026, 1, 1)).rows.find((r) => r.metric === 'created')?.count).toBe(1);
    expect(read(restored, 'creation', start + 2000).quality).toMatchObject({ asOf: start + 1000, restoredAggregatesOnly: true, partialCoverage: true });
    expect(() => restored.append([event({ name: 'room_created', data: { roomRef: randomUUID() } })])).toThrow('STORAGE_UNAVAILABLE');
  });
  it('rechaza datos ampliados y fuentes falsificadas', () => {
    const fact = event({ name: 'room_created', data: { roomRef: randomUUID() } });
    expect(validUsageEvent(fact)).toBe(true); expect(validUsageEvent({ ...fact, data: { ...fact.data, name: 'excluido' } } as UsageEvent)).toBe(false);
    expect(validUsageEvent({ ...fact, source: 'BROWSER' } as UsageEvent)).toBe(false);
  });
  it('intención tardía se enlaza; intención sin resultado no se denomina rechazo', () => {
    const { store } = setup(); const visitId = randomUUID(); const intentId = randomUUID();
    store.append([event({ name: 'room_created', data: { roomRef: randomUUID(), visitId, intentId } })]);
    store.append([{ eventId: randomUUID(), version: 1, source: 'BROWSER', environment: 'test', traffic: 'SYNTHETIC', bootRef: boot,
      occurredAt: start + 2, receivedAt: start + 2, visitId, name: 'room_create_intended', data: { intentId } }]);
    expect(read(store, 'creation')).toMatchObject({ numerator: 1, denominator: 1, percentage: 100 });
    expect(read(store, 'creation').rows.find((r) => r.metric === 'linked-creations')?.count).toBe(1);
  });
  it('corte de abiertos censura sin abandono; doce meses UTC y cero denominador', () => {
    const { store } = setup(); store.append([event({ name: 'room_created', data: { roomRef: randomUUID() } })]);
    expect(read(store, 'completion').percentage).toBeNull();
    const cut = start + DETAIL_MS + 1; store.maintain(cut);
    expect(read(store, 'room-conversion', cut).rows.some((r) => r.metric === 'WAITING_CENSORED')).toBe(true);
    const nextYear = Date.UTC(2027, 0, 1); store.maintain(nextYear);
    expect(store.db.prepare('SELECT count(*) n FROM monthly').get()?.n).toBe(0);
    expect(() => read(store, 'room-conversion', nextYear)).toThrow('INSUFFICIENT_DETAIL');
  });
  it('reinicio de partida sin terminal durable conserva UNKNOWN sin duración inventada', () => {
    const { store, root } = setup(); const roomRef = randomUUID();
    store.append([event({ name: 'room_created', data: { roomRef } }), event({ name: 'game_started', data: { roomRef, gameRef: randomUUID(), configuration,
      humanParticipations: [1, 2].map(() => ({ participationRef: randomUUID(), isHost: false })) } })]); store.close();
    const next = new SqliteUsageStore(path.join(root, 'usage.sqlite'), 'test', start + 3, randomUUID()); stores.push(next);
    const completion = read(next, 'completion'); expect(completion.denominator).toBe(0);
    expect(completion.rows.some((r) => r.metric === 'UNRESOLVED_AFTER_RESTART')).toBe(true);
    expect(read(next, 'duration').rows).toEqual([]);
  });
  it('siete copias cifradas y retirada al vencer el mes contenido', async () => {
    const { store, root } = setup(); const key = Buffer.alloc(32, 8); const directory = path.join(root, 'copies');
    for (let day = 1; day <= 8; day++) await backupUsage(store, directory, key, start + day * 86_400_000);
    expect(fs.readdirSync(directory)).toHaveLength(7);
    await backupUsage(store, directory, key, Date.UTC(2026, 1, 1)); expect(fs.readdirSync(directory)).toHaveLength(1);
  });
  it('cruza medianoche/mes: conversión por creación, configuración por inicio y duración por fin', () => {
    const { store } = setup(); const roomRef = randomUUID(); const gameRef = randomUUID();
    const january = Date.UTC(2026, 0, 31, 23, 59, 59); const february = Date.UTC(2026, 1, 1);
    store.append([event({ name: 'room_created', data: { roomRef } }, january), event({ name: 'game_started', data: { roomRef, gameRef, configuration,
      humanParticipations: [1, 2].map(() => ({ participationRef: randomUUID(), isHost: false })) } }, february),
      event({ name: 'game_ended', data: { roomRef, gameRef, reason: 'DECK_COMPLETED', durationMs: 5000, evidence: 'GAME_RESULT' } }, february + 5000)]);
    const januaryReport = store.read({ report: 'room-conversion', environment: 'test', from: start, to: february }, february + 5001, 'SYNTHETIC');
    expect(januaryReport).toMatchObject({ numerator: 1, denominator: 1 });
    const januaryConfig = store.read({ report: 'configuration', environment: 'test', from: start, to: february }, february + 5001, 'SYNTHETIC'); expect(januaryConfig.numerator).toBe(0);
    const februaryDuration = store.read({ report: 'duration', environment: 'test', from: february, to: february + 5001 }, february + 5001, 'SYNTHETIC');
    expect(februaryDuration).toMatchObject({ denominator: 1, meanDurationMs: 5000 });
  });
  it('entrada rechazada es resultado resuelto, no nueva incorporación; sin resultado deja tasa incompleta', () => {
    const { store } = setup(); const visitId = randomUUID(); const ids = [randomUUID(), randomUUID()]; const roomRef = randomUUID();
    store.append([event({ name: 'room_created', data: { roomRef } }), ...ids.map((intentId): UsageEvent => ({ eventId: randomUUID(), version: 1, source: 'BROWSER',
      environment: 'test', traffic: 'SYNTHETIC', bootRef: boot, occurredAt: start + 1, receivedAt: start + 1, visitId, name: 'room_join_attempted', data: { intentId } }))]);
    expect(read(store, 'joining').percentage).toBeNull();
    store.append([event({ name: 'room_join_resolved', data: { intentRef: randomUUID(), outcome: 'REJECTED', reason: 'ROOM_FULL', visitId, intentId: ids[0] } }),
      event({ name: 'room_join_resolved', data: { intentRef: randomUUID(), outcome: 'NEW_JOIN', reason: null, roomRef, participationRef: randomUUID(), visitId, intentId: ids[1] } })]);
    expect(read(store, 'joining')).toMatchObject({ numerator: 1, denominator: 2, percentage: 50 });
    expect(read(store, 'joining').rows.find((r) => r.metric === 'resolved-intentions')?.count).toBe(2);
  });
});
