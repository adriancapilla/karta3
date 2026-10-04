import { expect, type Browser, type Page } from '@playwright/test';
import type { InitialGameRoomView, RoomView } from '../../shared/contracts/room.js';

export const readRoom = (page: Page): Promise<RoomView> => page.evaluate(async () => (await (await fetch('/api/rooms/current')).json()).room);
export const readGame = async (page: Page) => await readRoom(page) as InitialGameRoomView;
export async function manualTable(browser: Browser, base: string, options: { width?: number; count?: number; observer?: boolean; deckId?: string; version?: number; review?: number; tie?: boolean } = {}) {
  const width = options.width ?? 1280; const count = options.count ?? 2;
  const contexts = await Promise.all(Array.from({ length: count + Number(!!options.observer) }, () => browser.newContext({ viewport: { width, height: 844 }, hasTouch: width < 760, isMobile: width < 760 })));
  const pages = await Promise.all(contexts.map((context) => context.newPage()));
  await Promise.all(pages.map((page) => page.goto(base)));
  const host = pages[0]; await host.getByRole('button', { name: 'Crear sala', exact: true }).click();
  const code = (await host.locator('.code').textContent())!;
  if (options.observer) await host.getByLabel('El anfitrión juega').uncheck();
  for (let index = 1; index < pages.length; index++) {
    await pages[index].getByLabel('Código de sala').fill(code);
    await pages[index].getByLabel('Tu nombre', { exact: true }).fill(`Persona ${index}`);
    await pages[index].getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(pages[index].getByRole('heading', { name: 'Ya estás en la sala' })).toBeVisible();
  }
  await host.getByLabel('Baraja', { exact: true }).selectOption(JSON.stringify({ id: options.deckId ?? 'generica', contentVersion: options.version ?? 2 }));
  if (options.review !== undefined) await host.getByLabel('Revisión de ronda').selectOption(String(options.review));
  if (options.tie) await host.getByLabel('Forzar desempate').check();
  await expect(host.getByRole('button', { name: 'Iniciar partida', exact: true })).toBeEnabled();
  await host.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
  await Promise.all(pages.map((page) => expect(page.getByRole('heading', { level: 1 })).toContainText('Partida ·')));
  const views = await Promise.all(pages.map(readGame));
  const actors = new Map(views.map((view, index) => [view.participant.id, pages[index]]));
  return { pages, contexts, host, code, actors, close: () => Promise.all(contexts.map((context) => context.close())) };
}

/** Solo gestos humanos legales. No asigna puntos ni modifica Game, manos o fases. */
export async function humanPlay(table: Awaited<ReturnType<typeof manualTable>>, cardFirst = false, direction: 'HIGH' | 'LOW' = 'HIGH') {
  const before = await readGame(table.host); const actor = table.actors.get(before.game.interaction.turn!.playerId)!;
  const own = await readGame(actor); const button = actor.locator(`.game-hand [data-card-id="${own.game.hand[0].id}"] .card-play-button`);
  await expect(button).toBeEnabled();
  if (before.game.round.direction === null) {
    if (cardFirst) { await button.click(); await actor.getByRole('button', { name: direction === 'HIGH' ? 'ALTO' : 'BAJO', exact: true }).click(); }
    else { await actor.getByRole('button', { name: direction === 'HIGH' ? 'ALTO' : 'BAJO', exact: true }).click(); await button.click(); }
  } else await button.click();
  await expect.poll(async () => {
    const after = await readRoom(table.host);
    return after.status !== 'IN_GAME' || after.game.interaction.turn?.id !== before.game.interaction.turn!.id;
  }).toBe(true);
  return readRoom(table.host);
}
