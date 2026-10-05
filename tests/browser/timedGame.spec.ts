import { expect, test } from '@playwright/test';
import { configurationBrowserServer } from '../support/configurationBrowserServer';
import { humanPlay, manualTable, readGame, readRoom } from '../support/manualBrowserCases';
import type { ResultsRoomView } from '../../shared/contracts/room.js';

for (const width of [390, 1280]) test(`B08 T1 ${width}: deadline estable, carta local ignorada, aviso y recuperación`, async ({ browser }, testInfo) => {
  const f = await configurationBrowserServer(true, true, { count: 2 });
  const p = await manualTable(browser, f.base, { width, deckId: 'manual', version: 7, turn: 15, review: 5 });
  try {
    const original = await readGame(p.host); const actor = p.actors.get(original.game.interaction.turn!.playerId)!;
    const own = await readGame(actor); const deadline = own.game.interaction.turn!.timing!.endsAt;
    await expect(actor.getByRole('timer')).toHaveText('00:15');
    await actor.locator(`.game-hand [data-card-id="${own.game.hand[1].id}"] .card-play-button`).click();
    expect(f.gameRequests).toHaveLength(0); f.time.elapse(14000); await actor.reload();
    await expect(actor.getByRole('timer')).toHaveText('00:01');
    expect((await readGame(actor)).game.interaction.turn!.timing!.endsAt).toBe(deadline);
    await actor.locator(`.game-hand [data-card-id="${own.game.hand[1].id}"] .card-play-button`).click();
    f.time.elapse(1000); await readGame(p.host); // lectura real aplica límite, sin disparar callback
    await expect(actor.getByText('No completaste tu último turno a tiempo.', { exact: false })).toBeVisible();
    const after = await readGame(actor);
    expect(after.game.round.plays[0]).toMatchObject({ card: { id: own.game.hand[0].id }, mode: 'TIMEOUT' });
    expect(after.game.ownConsecutiveTimeouts).toBe(1); expect(f.gameRequests).toHaveLength(0);
    await expect(p.host.locator('.activity')).toContainText('agotó el tiempo; se jugó su carta más antigua');
    expect((await readGame(p.host)).game.ownConsecutiveTimeouts).toBe(0);
    await actor.reload(); await expect(actor.getByText('No completaste tu último turno a tiempo.', { exact: false })).toBeVisible();
    await expect(actor.getByText('agotó el tiempo; se jugó su carta más antigua', { exact: false })).toHaveCount(0);
    await expect(actor.getByRole('button', { name: 'ALTO', exact: true })).toHaveCount(0);
    expect(await actor.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await actor.screenshot({ path: testInfo.outputPath(`B08-T1-${width}.png`), fullPage: true });
  } finally { await p.close(); await f.stop(); }
});

test('B08 tiempo 60/01:00: hora cliente no manda; cero desconectado conserva Detalles y no encola jugadas', async ({ browser }) => {
  const f = await configurationBrowserServer(true, true);
  const p = await manualTable(browser, f.base, { width: 390, deckId: 'portada', version: 7, turn: 60 }); const actor = p.pages[1];
  try {
    await expect(actor.getByRole('timer')).toHaveText('01:00');
    await actor.clock.setSystemTime(new Date('2040-01-01T00:00:00Z'));
    await expect(actor.getByRole('timer')).toHaveText('01:00');
    const details = actor.locator('.game-hand .card-details-button').first(); await details.press('Enter');
    await expect(actor.getByRole('dialog')).toBeVisible();
    await p.contexts[1].setOffline(true); await actor.clock.fastForward(61000);
    await expect(actor.getByRole('timer')).toHaveText('00:00');
    await expect(actor.getByText('Esperando actualización del servidor…', { exact: true })).toBeVisible();
    await expect(actor.getByRole('dialog')).toBeVisible();
    await actor.getByRole('button', { name: 'Cerrar detalles' }).press('Escape'); await expect(details).toBeFocused();
    await expect(actor.getByRole('button', { name: 'ALTO', exact: true })).toBeDisabled();
    expect(f.gameRequests).toHaveLength(0); expect(f.repository.allActive()[0].game!.round.plays).toEqual([]);
    f.time.elapse(1000); await actor.clock.resume(); await p.contexts[1].setOffline(false);
    await actor.reload(); await expect(actor.getByRole('timer')).toHaveText('00:59');
    expect(f.gameRequests).toHaveLength(0);
  } finally { await p.close(); await f.stop(); }
});

test('B08 confirmación parcial antigua después del timeout no restaura dirección/acción del turno viejo', async ({ browser }) => {
  const f = await configurationBrowserServer(true, true);
  const p = await manualTable(browser, f.base, { width: 1280, deckId: 'portada', version: 7, turn: 15 }); const actor = p.pages[1];
  try {
    let release: (() => void) | undefined;
    f.interceptGame((_event, _payload, ack, result) => { release = () => ack(result); });
    const before = await readGame(actor); await actor.getByRole('button', { name: 'BAJO', exact: true }).click();
    await expect.poll(() => !!release).toBe(true);
    f.time.elapse(15000); await readGame(p.host);
    await expect(actor.getByText('No completaste tu último turno a tiempo.', { exact: false })).toBeVisible(); release!();
    await expect(actor.getByText('Enviando…', { exact: true })).toHaveCount(0);
    const after = await readGame(actor); expect(after.game.interaction.turn!.id).not.toBe(before.game.interaction.turn!.id);
    expect(after.game.interaction.openingSelection).toBeNull(); expect(after.game.ownConsecutiveTimeouts).toBe(1);
    await expect(actor.getByRole('button', { name: 'ALTO', exact: true })).toHaveCount(0);
    expect(f.gameRequests).toHaveLength(1); expect(after.game.round.plays).toHaveLength(1);
  } finally { await p.close(); await f.stop(); }
});

test('B08 aviso cinco segundos, nombres repetidos y evento duplicado no reanima aviso en la misma ronda', async ({ browser }) => {
  const f = await configurationBrowserServer(true, true);
  const p = await manualTable(browser, f.base, { observer: true, width: 390, deckId: 'portada', version: 7,
    turn: 15, names: ['Ana', 'Ana'] });
  try {
    const before = await readGame(p.pages[1]);
    f.time.advance(15000);
    await expect(p.host.locator('.activity')).toHaveText('Ana (1) agotó el tiempo; se jugó su carta más antigua');
    expect((await readGame(p.host)).game.ownConsecutiveTimeouts).toBeNull();
    await expect(p.host.locator('.activity')).toHaveCount(0, { timeout: 7000 });
    f.repeatTurnExpired({ id: `${before.game.id}:${before.game.interaction.turn!.id}:expired`, roomId: before.id, gameId: before.game.id,
      roundNumber: 1, turnId: before.game.interaction.turn!.id, playerId: before.participant.id, automatic: false });
    await readGame(p.host); // vuelta HTTP real deja tiempo para procesar el frame repetido
    await expect(p.host.locator('.activity')).toHaveCount(0);
    await expect(p.pages[1].getByText('No completaste tu último turno a tiempo.', { exact: false })).toBeVisible();
  } finally { await p.close(); await f.stop(); }
});

for (const width of [360, 390, 1280]) test(`B08 T2 ${width}: reset, dos fallos, automático sin control, revisión y resultado`, async ({ browser }, testInfo) => {
  const f = await configurationBrowserServer(true, true);
  const review = width === 390 ? 5 : 0;
  const p = await manualTable(browser, f.base, { width, deckId: 'portada', version: 7, turn: 15, review });
  const actor = p.pages[1]; const own = await readGame(actor); const tab = await p.contexts[1].newPage();
  const room = f.repository.findById(own.id)!;
  const seek = async () => {
    while (room.game!.turn?.playerId !== own.participant.id) {
      if (room.gameReview) f.time.advance(review * 1000);
      else await humanPlay(p, true, 'LOW');
    }
    await expect.poll(async () => (await readGame(actor)).game.interaction.turn?.playerId).toBe(own.participant.id);
  };
  try {
    await tab.goto(f.base);
    f.time.advance(15000);
    await expect(actor.getByText('No completaste tu último turno a tiempo.', { exact: false })).toBeVisible();
    await humanPlay(p, false, 'LOW');
    await expect(p.host.locator('.activity')).toContainText('agotó el tiempo');
    await expect(p.host.locator('.activity')).toContainText('ganó'); // ganador y timeout no se borran entre sí
    if (width === 360) {
      await expect(p.host.getByText('agotó el tiempo; se jugó su carta más antigua', { exact: false })).toHaveCount(0, { timeout: 7000 });
      await expect(actor.getByText('No completaste tu último turno a tiempo.', { exact: false })).toBeVisible();
    }
    await seek(); await humanPlay(p, true, 'LOW');
    await expect(actor.getByText('No completaste tu último turno a tiempo.', { exact: false })).toHaveCount(0);
    expect((await readGame(actor)).game.ownConsecutiveTimeouts).toBe(0);
    for (let index = 0; index < 2; index++) { await seek(); f.time.advance(15000); }
    await expect(actor.getByText('Has pasado a automático.', { exact: false })).toBeVisible();
    await expect(tab.getByText('Has pasado a automático.', { exact: false })).toBeVisible();
    await expect(p.host.locator('.game-players .badge').filter({ hasText: /^Automático$/ })).toHaveCount(1);
    for (const button of await actor.locator('.game-hand .card-play-button').all()) await expect(button).toBeDisabled();
    await expect(actor.getByRole('button', { name: 'ALTO', exact: true })).toHaveCount(0);
    const details = actor.locator('.game-hand .card-details-button').first(); await details.press('Enter');
    await expect(actor.getByRole('dialog')).toBeVisible(); await actor.getByRole('button', { name: 'Cerrar detalles' }).press('Escape');
    await expect(details).toBeFocused(); await actor.reload();
    await expect(actor.getByText('Has pasado a automático.', { exact: false })).toBeVisible();
    expect((await readGame(actor)).game.ownConsecutiveTimeouts).toBe(2);
    expect(await actor.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await actor.screenshot({ path: testInfo.outputPath(`B08-automatic-${width}.png`), fullPage: true });
    while (room.status === 'IN_GAME') {
      if (room.gameReview) f.time.advance(review * 1000);
      else if (room.gameTurn) f.time.advance(room.gameTurn.at - f.time.now().monotonic);
      else f.time.advance(0);
    }
    await expect(p.host.getByRole('heading', { level: 1 })).toHaveText('Partida terminada');
    await expect(p.host.getByText('La partida terminó porque todos los jugadores humanos pasaron a automático', { exact: true })).toBeVisible();
    expect((await readRoom(p.host)).status).toBe('RESULTS'); expect(f.time.pending).toBe(1);
  } finally { await p.close(); await f.stop(); }
});

for (const count of [2, 5]) test(`B08 navegador ${count} empatados legales: final, mano reducida y automático en desempate revisado`, async ({ browser }, testInfo) => {
  test.setTimeout(90_000);
  const f = await configurationBrowserServer(true, true, { count });
  const p = await manualTable(browser, f.base, { count, observer: true, width: count === 5 ? 360 : 1280,
    deckId: 'manual', version: 7, turn: 15, review: 5, tie: true });
  const room = f.repository.allActive()[0]; const survivor = room.game!.players[0].id; const final = f.prepared!.trace.length;
  const finalRounds = new Set<number>();
  try {
    while (room.game!.round.kind === 'BASE') {
      if (room.game!.phase === 'FINAL_PHASE') finalRounds.add(room.game!.round.number);
      if (room.gameReview) f.time.advance(5000);
      else {
        const game = room.game!;
        if (game.round.number >= final - 1 && (game.turn!.playerId !== survivor || game.round.number === final)) {
          const actor = p.actors.get(game.turn!.playerId)!;
          const own = await readGame(actor); const oldest = own.game.hand[0].id;
          if (!game.round.plays.length) {
            await expect(actor.getByRole('button', { name: 'ALTO', exact: true })).toBeEnabled();
            await actor.getByRole('button', { name: 'ALTO', exact: true }).click();
            await expect(actor.getByText('Dirección aceptada (solo tú): ALTO')).toBeVisible();
          }
          f.time.advance(15000);
          expect(room.game!.round.plays.find((play) => play.playerId === own.participant.id)!.card.id).toBe(oldest);
        } else await humanPlay(p);
      }
      expect(new Set(room.game!.locations().map((card) => card.id)).size).toBe(58);
    }
    expect(finalRounds.size).toBe(3);
    await expect(p.host.getByText('Desempate · una única ronda sin puntos nuevos')).toBeVisible();
    const own = await readGame(p.pages[1]); expect(own.game.hand).toHaveLength(count === 2 ? 3 : 1);
    expect(own.game.ownConsecutiveTimeouts).toBe(1); expect(own.game.interaction.turn!.timing!.endsAt - own.game.interaction.turn!.timing!.startedAt).toBe(15000);
    f.time.advance(15000);
    await expect(p.host.getByRole('heading', { name: 'Revisión de ronda', exact: true })).toBeVisible();
    await expect(p.pages[1].getByText('Has pasado a automático.', { exact: false })).toBeVisible();
    await expect(p.host.locator('.activity')).toContainText('ganó el desempate');
    await expect(p.host.locator('.activity')).toContainText('agotó el tiempo');
    expect(room.status).toBe('IN_GAME'); expect(room.gameTurn).toBeUndefined();
    expect(room.game!.round.plays.map((play) => play.mode)).toEqual(['TIMEOUT', ...Array(count - 1).fill('AUTOMATIC')]);
    f.time.elapse(4999); await readGame(p.host); expect(room.status).toBe('IN_GAME'); f.time.elapse(1); await readRoom(p.host);
    await expect(p.host.getByRole('heading', { name: 'Partida terminada', exact: true })).toBeVisible();
    const result = await readRoom(p.host) as ResultsRoomView;
    expect(result.result).toMatchObject({ endReason: 'NO_ACTIVE_HUMAN_PLAYERS', completedNormally: false });
    expect(result.result.winnerIds).toHaveLength(1); expect(result.result.standings.map((entry) => entry.score)).toEqual(f.prepared!.points);
    await expect(p.host.getByText('Anfitrión · Observador', { exact: true })).toBeVisible();
    await p.host.screenshot({ path: testInfo.outputPath(`B08-tie-${count}.png`), fullPage: true });
  } finally { await p.close(); await f.stop(); }
});
