import { afterEach, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { SqliteUsageStore, DETAIL_MS } from './sqliteStore.js';
import { backupUsage, restoreUsageBackup } from './backups.js';
import { usageCsv } from '../../application/usage/reports.js';
import { reports, type AppearanceFact, type AppearanceReport, type ServerUsageFact, type UsageConfiguration, type UsageEvent } from '../../application/usage/contracts.js';
import { browserUsage } from '../../../shared/contracts/usage.js';

const from = Date.UTC(2026, 8, 1); const startedAt = Date.UTC(2026, 8, 30, 23, 59, 59); const nextMonth = Date.UTC(2026, 9, 1);
const roots: string[] = []; const stores: SqliteUsageStore[] = [];
afterEach(() => { for (const s of stores.splice(0)) { try { s.close(); } catch { /* cerrado por migración */ } }
  for (const root of roots.splice(0)) { if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('karta3-b20-store-')) throw Error('ruta propia'); fs.rmSync(root, { recursive: true, force: true }); } });
function fixture(instrumented = true) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'karta3-b20-store-')); roots.push(root);
  const boot = randomUUID(); const roomRef = randomUUID(); const gameRef = randomUUID(); const people = [randomUUID(), randomUUID()];
  const file = path.join(root, 'usage.sqlite'); const store = new SqliteUsageStore(file, 'test', from, boot, 'SYNTHETIC', true, false, instrumented); stores.push(store);
  const configuration: UsageConfiguration = { deckId: 'generica', deckSchemaVersion: 2, deckContentVersion: 4, humanPlayerCount: 2,
    humanObserverCount: 0, botCount: 0, playerCount: 2, hostPlays: true, botsByDifficulty: { EASY: 0, HARD: 0 }, turnSeconds: 15,
    reviewSeconds: 0, forceTieBreak: false, attributeValueMode: 'PLAY_VALUE', optimizeForMobile: false };
  const event = (fact: ServerUsageFact, at = startedAt): UsageEvent => ({ ...fact, source: 'SERVER', version: 1, eventId: randomUUID(), bootRef: boot,
    environment: 'test', traffic: 'SYNTHETIC', occurredAt: at, receivedAt: at });
  const start = () => store.append([event({ name: 'room_created', data: { roomRef } }, startedAt - 1), event({ name: 'game_started',
    data: { roomRef, gameRef, configuration, humanParticipations: people.map(participationRef => ({ participationRef, isHost: false })) } })]);
  const photo = (person: number, moment: 'START' | 'END', theme: 'LIGHT' | 'DARK' = 'LIGHT', origin: 'DEFAULT' | 'EXPLICIT' = 'DEFAULT', at = startedAt + (moment === 'END' ? 2000 : 1)): UsageEvent => {
    const fact: AppearanceFact = { name: 'appearance_snapshot', version: 1, eventId: randomUUID(), visitId: randomUUID(), data: { roomRef, gameRef, participationRef: people[person], moment, theme, origin } };
    return { ...fact, source: 'BROWSER', bootRef: boot, environment: 'test', traffic: 'SYNTHETIC', occurredAt: at, receivedAt: at };
  };
  const read = (target = store, now = nextMonth + 10000, start = from, end = nextMonth) => target.read({ report: 'appearance', environment: 'test', from: start, to: end }, now, 'SYNTHETIC') as AppearanceReport;
  return { root, boot, file, store, roomRef, gameRef, people, event, start, photo, read };
}
it('petición cerrada y normalización separada: enums, DEFAULT/LIGHT y ausencia de contexto privado adicional', () => {
  const input = { eventId: randomUUID(), visitId: randomUUID(), version: 1, name: 'appearance_snapshot', data: { gameId: 'functional', windowToken: randomUUID(), moment: 'START', theme: 'LIGHT', origin: 'DEFAULT' } };
  expect(browserUsage(input)).toBeDefined();
  for (const patch of [{ theme: 'dark' }, { theme: 'DARK' }, { origin: 'unknown' }, { moment: 'LATER' }, { windowToken: 'wrong' }, { participationRef: randomUUID() }]) expect(browserUsage({ ...input, data: { ...input.data, ...patch } })).toBeUndefined();
  const f = fixture(); f.start(); const stored = f.photo(0, 'START');
  expect(() => f.store.append([{ ...stored, data: { ...stored.data, windowToken: randomUUID() } } as UsageEvent])).toThrow('INVALID_FILTER');
});
it('marginales/pares y cohortes UTC: END cruzando mes pertenece al inicio; primer válido gana entre pestañas', () => {
  const f = fixture(); expect(f.read().start.every(row => row.percentage === null)).toBe(true); f.start();
  const start = f.photo(0, 'START'); f.store.append([start, start, f.photo(0, 'START', 'DARK', 'EXPLICIT'), f.photo(0, 'END', 'LIGHT', 'EXPLICIT'), f.photo(1, 'END', 'DARK', 'EXPLICIT')]);
  const report = f.read(); expect(report.population).toMatchObject({ eligible: 2, withStart: 1, withEnd: 2, paired: 1, onlyStart: 0, onlyEnd: 1, neither: 0 });
  expect(report.start.find(row => row.origin === 'DEFAULT')).toMatchObject({ count: 1, denominator: 1, percentage: 100 });
  expect(report.transitions.find(row => row.count)).toMatchObject({ from: { theme: 'LIGHT', origin: 'DEFAULT' }, to: { theme: 'LIGHT', origin: 'EXPLICIT' }, denominator: 1 });
  expect(report.quality.conflicts).toBe(0); expect('numerator' in report).toBe(false);
  const october = f.read(f.store, nextMonth + 10000, nextMonth, nextMonth + 9000); expect(october.population.eligible).toBe(0); expect(october.end.every(row => row.percentage === null)).toBe(true);
  const csv = usageCsv(report); expect(csv).toContain('"PAIR"'); for (const id of [f.roomRef, f.gameRef, ...f.people, start.eventId]) expect(csv).not.toContain(id);
});
it('migración real 2→3 conserva hechos/recibos e informes; históricos no son Claro ni ausencia instrumentada', () => {
  const f = fixture(false); f.start();
  const proof = { proofRef: randomUUID(), noticeVersion: '2026-10-19.2', acceptedAt: startedAt, validUntil: startedAt + 12 * 3600000 };
  f.store.privacyControl({ kind: 'accept', proof });
  const previousReports = reports.filter(name => name !== 'appearance').map(report => f.store.read({ report, environment: 'test', from, to: nextMonth }, nextMonth + 1000, 'SYNTHETIC'));
  const before = f.store.db.prepare('SELECT payload FROM events ORDER BY rowid').all();
  const metadata = JSON.parse(String(f.store.db.prepare('SELECT value FROM metadata').get()!.value)); metadata.version = 2;
  f.store.db.prepare('UPDATE metadata SET value=?').run(JSON.stringify(metadata)); f.store.close();
  // Aislar el cambio de esquema: un boot nuevo/abrupto cambia legítimamente la calidad B18.
  const next = new SqliteUsageStore(f.file, 'test', nextMonth + 1000, f.boot, 'SYNTHETIC', true, false, true); stores.push(next);
  expect(JSON.parse(String(next.db.prepare('SELECT value FROM metadata').get()!.value)).version).toBe(3);
  expect(next.db.prepare('SELECT payload FROM events ORDER BY rowid').all()).toEqual(before);
  expect(next.db.prepare('SELECT count(*) n FROM usage_choice_proofs').get()?.n).toBe(1);
  for (const before of previousReports) {
    const after = next.read(before.filter, nextMonth + 1000, 'SYNTHETIC');
    expect(after.rows).toEqual(before.rows);
    for (const key of ['numerator', 'denominator', 'percentage', 'meanDurationMs'] as const) expect(after[key]).toEqual(before[key]);
  }
  const report = f.read(next); expect(report.population).toMatchObject({ eligible: 0, notInstrumented: 2, neither: 0 });
  expect(report.start.every(row => row.count === 0)).toBe(true); expect(report.quality.partialCoverage).toBe(true);
  expect(next.read({ report: 'configuration', environment: 'test', from, to: nextMonth }, nextMonth + 1000, 'SYNTHETIC').rows.find(row => row.metric === 'games')?.count).toBe(1);
});
it('consolidación idempotente 90d y copia/restauración de agregados conservan matriz sin ids/detalle', async () => {
  const f = fixture(); f.start(); f.store.append([f.photo(0, 'START'), f.photo(0, 'END', 'DARK', 'EXPLICIT'), f.event({ name: 'game_ended', data: { roomRef: f.roomRef, gameRef: f.gameRef, reason: 'DECK_COMPLETED', durationMs: 2000, evidence: 'GAME_RESULT' } }, startedAt + 2000)]);
  const before = f.read(); const now = startedAt + 2000 + DETAIL_MS;
  f.store.maintain(now); f.store.maintain(now);
  const consolidated = f.read(f.store, now); expect(consolidated.population).toEqual(before.population); expect(consolidated.transitions).toEqual(before.transitions);
  expect(f.store.db.prepare('SELECT count(*) n FROM events').get()?.n).toBe(0);
  const rows = JSON.stringify(f.store.db.prepare('SELECT * FROM monthly').all()); for (const id of [f.roomRef, f.gameRef, ...f.people]) expect(rows).not.toContain(id);
  const key = randomBytes(32); const file = await backupUsage(f.store, path.join(f.root, 'backups'), key, now);
  const restoredFile = path.join(f.root, 'restored.sqlite'); await restoreUsageBackup(file, restoredFile, key, 'test', now);
  const restored = new SqliteUsageStore(restoredFile, 'test', now); stores.push(restored);
  const report = f.read(restored, now); expect(report.population).toEqual(before.population); expect(report.transitions).toEqual(before.transitions);
  expect(restored.db.prepare('SELECT count(*) n FROM subjects').get()?.n).toBe(0);
  expect(restored.db.prepare('SELECT count(*) n FROM usage_choice_proofs').get()?.n).toBe(0);
  const bytes = fs.readFileSync(restoredFile); for (const id of [f.roomRef, f.gameRef, ...f.people]) expect(bytes.includes(Buffer.from(id))).toBe(false);
});
