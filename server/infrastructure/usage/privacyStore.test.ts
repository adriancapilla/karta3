import { afterEach, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { SqliteUsageStore, DETAIL_MS } from './sqliteStore.js';
import { backupUsage, restoreUsageBackup } from './backups.js';
import type { ServerUsageFact, UsageEvent, UsageFilter } from '../../application/usage/contracts.js';
import { usageCsv } from '../../application/usage/reports.js';

const at = Date.UTC(2026, 9, 19); const roots: string[] = []; const stores: SqliteUsageStore[] = [];
afterEach(() => { stores.splice(0).forEach(store => { try { store.close(); } catch { /* Ya cerrado por el ensayo de reinicio. */ } });
  for (const root of roots.splice(0)) { if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-b19-proof-')) throw new Error('ruta propia'); fs.rmSync(root, { recursive: true, force: true }); }
});
function setup() { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'karta3-b19-proof-')); roots.push(root);
  const store = new SqliteUsageStore(path.join(root, 'usage.sqlite'), 'test', at); stores.push(store); return { root, store }; }
const event = (fact: ServerUsageFact, time = at + 1): UsageEvent => ({ ...fact, source: 'SERVER', version: 1, eventId: randomUUID(),
  bootRef: randomUUID(), environment: 'test', traffic: 'SYNTHETIC', occurredAt: time, receivedAt: time });
const filter = (report: UsageFilter['report'], to = at + 1000): UsageFilter => ({ report, environment: 'test', from: at, to });
const configuration = { deckId: 'generica', deckSchemaVersion: 2, deckContentVersion: 4, humanPlayerCount: 2, humanObserverCount: 0,
  botCount: 0, playerCount: 2, hostPlays: true, botsByDifficulty: { EASY: 0, HARD: 0 }, turnSeconds: 15, reviewSeconds: 0,
  forceTieBreak: false, attributeValueMode: 'PLAY_VALUE' as const, optimizeForMobile: false };
it('recibo cerrado e inmutable; vencimiento/retirada y purga exacta, sin ids de juego o sesión', () => {
  const { store } = setup(); const proof = { proofRef: randomUUID(), noticeVersion: '2026-10-19.1', acceptedAt: at + 1, validUntil: at + 1 + 12 * 60 * 60_000 };
  store.privacyControl({ kind: 'accept', proof }); store.privacyControl({ kind: 'accept', proof });
  expect(() => store.privacyControl({ kind: 'accept', proof: { ...proof, noticeVersion: 'other' } })).toThrow('INVALID_FILTER');
  const withdrawal = at + 100; const cut = { kind: 'cut' as const, at: withdrawal, proofRefs: [proof.proofRef], roomRefs: [], gameRefs: [] };
  store.privacyControl(cut); store.privacyControl(cut);
  const row = store.db.prepare('SELECT * FROM usage_choice_proofs').get()!; expect(Object.keys(row).sort()).toEqual(['accepted_at', 'notice_version', 'proof_ref', 'purge_at', 'valid_until', 'withdrawn_at']);
  expect(row.withdrawn_at).toBe(withdrawal); expect(row.purge_at).toBe(withdrawal + DETAIL_MS);
  store.maintain(withdrawal + DETAIL_MS - 1); expect(store.db.prepare('SELECT count(*) n FROM usage_choice_proofs').get()?.n).toBe(1);
  store.maintain(withdrawal + DETAIL_MS); expect(store.db.prepare('SELECT count(*) n FROM usage_choice_proofs').get()?.n).toBe(0);
});
it('censura idempotente conserva inicio/denominadores/automático conocido, no inventa terminal o duración', () => {
  const { store } = setup(); const roomRef = randomUUID(); const gameRef = randomUUID(); const person = randomUUID();
  store.append([event({ name: 'room_created', data: { roomRef } }), event({ name: 'game_started', data: { roomRef, gameRef,
    configuration, humanParticipations: [{ participationRef: person, isHost: true }, { participationRef: randomUUID(), isHost: false }] } }),
    event({ name: 'human_became_automatic', data: { roomRef, gameRef, participationRef: person, phase: 'BASE' } })]);
  const command = { kind: 'cut' as const, at: at + 100, proofRefs: [], roomRefs: [roomRef], gameRefs: [gameRef] };
  store.privacyControl(command); store.privacyControl(command);
  store.append([event({ name: 'game_ended', data: { roomRef, gameRef, reason: 'DECK_COMPLETED', durationMs: 100, evidence: 'GAME_RESULT' } })]);
  const conversion = store.read(filter('room-conversion'), at + 1000, 'SYNTHETIC'); expect(conversion.numerator).toBe(1); expect(conversion.denominator).toBe(1);
  const completion = store.read(filter('completion'), at + 1000, 'SYNTHETIC'); expect(completion.rows).toContainEqual(expect.objectContaining({ metric: 'OBSERVATION_CENSORED', count: 1 }));
  expect(completion.percentage).toBeNull(); expect(completion.quality.partialCoverage).toBe(true);
  const automatic = store.read(filter('automatic'), at + 1000, 'SYNTHETIC'); expect(automatic.numerator).toBe(1); expect(automatic.denominator).toBe(2); expect(automatic.percentage).toBeNull();
  const duration = store.read(filter('duration'), at + 1000, 'SYNTHETIC'); expect(duration.denominator).toBe(0); expect(duration.meanDurationMs).toBeNull();
  expect(store.db.prepare("SELECT count(*) n FROM subjects WHERE key LIKE 'end:%'").get()?.n).toBe(0);
  expect(usageCsv(automatic)).not.toContain(roomRef); expect(usageCsv(automatic)).not.toContain(person);
});
it('espera censurada no inicia después; terminal confirmado no se transforma y control no crea huérfanos', () => {
  const { store } = setup(); const roomRef = randomUUID(); store.append([event({ name: 'room_created', data: { roomRef } })]);
  store.privacyControl({ kind: 'cut', at: at + 2, proofRefs: [], roomRefs: [roomRef, randomUUID()], gameRefs: [randomUUID()] });
  const gameRef = randomUUID(); const people = [{ participationRef: randomUUID(), isHost: true }, { participationRef: randomUUID(), isHost: false }];
  store.append([event({ name: 'game_started', data: { roomRef, gameRef, configuration, humanParticipations: people } })]);
  expect(store.db.prepare('SELECT count(*) n FROM subjects').get()?.n).toBe(1);
  const result = store.read(filter('room-conversion'), at + 1000, 'SYNTHETIC'); expect(result.denominator).toBe(1); expect(result.percentage).toBeNull();
  const other = randomUUID(); const finished = randomUUID();
  store.append([event({ name: 'room_created', data: { roomRef: other } }), event({ name: 'game_started', data: { roomRef: other, gameRef: finished, configuration, humanParticipations: people } }),
    event({ name: 'game_ended', data: { roomRef: other, gameRef: finished, reason: 'HOST_CANCELLED', durationMs: 20, evidence: 'GAME_RESULT' } })]);
  store.privacyControl({ kind: 'cut', at: at + 10, proofRefs: [], roomRefs: [other], gameRefs: [finished] });
  expect(store.read(filter('completion'), at + 1000, 'SYNTHETIC').rows).toContainEqual(expect.objectContaining({ metric: 'HOST_CANCELLED', count: 1 }));
  expect(store.read(filter('duration'), at + 1000, 'SYNTHETIC').meanDurationMs).toBe(20);
});
it('archivo agregado nuevo/restauración excluyen recibos; censura sobrevive mantenimiento y reinicio', async () => {
  const { root, store } = setup(); const ref = randomUUID(); const proof = { proofRef: randomUUID(), noticeVersion: '2026-10-19.1', acceptedAt: at, validUntil: at + 12 * 60 * 60_000 };
  store.privacyControl({ kind: 'accept', proof }); store.append([event({ name: 'room_created', data: { roomRef: ref } })]);
  store.privacyControl({ kind: 'cut', at: at + 2, proofRefs: [], roomRefs: [ref], gameRefs: [] });
  const copies = path.join(root, 'copies'); fs.mkdirSync(copies); const key = randomBytes(32); const file = await backupUsage(store, copies, key, at + 1000);
  const restoredPath = path.join(root, 'restored.sqlite'); await restoreUsageBackup(file, restoredPath, key, 'test', at + 1000);
  const restored = new SqliteUsageStore(restoredPath, 'test', at + 1000); stores.push(restored);
  expect(restored.db.prepare('SELECT count(*) n FROM usage_choice_proofs').get()?.n).toBe(0);
  expect(restored.db.prepare('SELECT count(*) n FROM events').get()?.n).toBe(0);
  expect(JSON.stringify(restored.aggregateSnapshot(at + 1000))).not.toContain(proof.proofRef);
  store.close(true); const restarted = new SqliteUsageStore(path.join(root, 'usage.sqlite'), 'test', at + 2000, randomUUID()); stores.push(restarted);
  expect(restarted.read(filter('room-conversion', at + 2000), at + 2000, 'SYNTHETIC').rows).toContainEqual(expect.objectContaining({ metric: 'OBSERVATION_CENSORED' }));
  restarted.maintain(at + 91 * 86_400_000);
  const report = restarted.read({ ...filter('room-conversion', at + 91 * 86_400_000), from: Date.UTC(2026, 9, 1) }, at + 91 * 86_400_000, 'SYNTHETIC');
  expect(report.percentage).toBeNull(); expect(report.rows.some(row => /LOST_ON_RESTART/.test(row.metric))).toBe(false);
});
it('migración v1 sin reinterpretar eventos y lector de copia v2 compatible, sin convertir juego en persistencia', () => {
  const { root, store } = setup(); const fact = event({ name: 'room_created', data: { roomRef: randomUUID() } }); store.append([fact]);
  const metadata = JSON.parse(String(store.db.prepare('SELECT value FROM metadata WHERE id=1').get()!.value)); metadata.version = 1;
  store.db.prepare('UPDATE metadata SET value=? WHERE id=1').run(JSON.stringify(metadata)); store.db.exec('DROP TABLE usage_choice_proofs'); store.close();
  const migrated = new SqliteUsageStore(path.join(root, 'usage.sqlite'), 'test', at + 1000); stores.push(migrated);
  expect(JSON.parse(String(migrated.db.prepare('SELECT payload FROM events').get()!.payload))).toEqual(fact);
  expect(JSON.parse(String(migrated.db.prepare('SELECT value FROM metadata WHERE id=1').get()!.value)).version).toBe(3);
  expect(migrated.db.prepare('SELECT count(*) n FROM usage_choice_proofs').get()?.n).toBe(0);
});
