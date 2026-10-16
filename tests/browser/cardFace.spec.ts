import { expect, test, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { manualTable, humanPlay, readGame } from '../support/manualBrowserCases.js';
import { assertGamePrivacy } from '../support/gamePrivacy.js';

const literal = (value: { displayValue: string; unit: string }) => value.displayValue + (value.unit ? ` ${value.unit}` : '');
const fullDetails = (page: Page) => page.locator('dialog.card-details-dialog:not(.consultation)');
const closeDetails = async (page: Page) => {
  await fullDetails(page).getByRole('button', { name: 'Cerrar detalles', exact: true }).press('Escape');
  await expect(fullDetails(page)).toHaveCount(0); // Esperar también el desmontaje React tras el cierre nativo.
};
async function scene(id = 'criaturas-magicas', active = 'atributo1') {
  const server = await configurationBrowserServer(true, true, undefined, { generic: true, solar: true, creatures: true });
  const cards = (JSON.parse(await fs.readFile(`barajas/${id}/cartas.json`, 'utf8')) as { cards: { id: string; name: string; roundAttribute: string }[] }).cards;
  const names = id === 'criaturas-magicas' ? ['Espíritu del arcoíris', 'Tritón de las profundidades', 'Grifo de plumas de hierro']
    : id === 'sistema-solar' ? ['67P / Churyumov-Gerasimenko', 'Hyakutake', 'Encke'] : cards.slice(0, 3).map(card => card.name);
  const hand = names.map(name => cards.find(card => card.name === name)!.id);
  const indicator = cards.find(card => card.roundAttribute === active && !hand.includes(card.id))!.id;
  // Reparto legal: anfitrión al final; no se altera Game, atributo, cartas o puntos.
  server.permutation(ids => {
    const rest = ids.filter(id => !hand.includes(id) && id !== indicator);
    return [rest.shift()!, hand[0], rest.shift()!, hand[1], rest.shift()!, hand[2], indicator, ...rest];
  });
  return server;
}
async function geometry(card: Locator) {
  return card.evaluate(element => {
    const box = (e: Element) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height, right: b.right, bottom: b.bottom }; };
    const image = element.querySelector('.game-card-image')!;
    const table = element.querySelector('table')!;
    const button = element.querySelector('.card-details-button')!;
    const imageBox = box(image); const tableBox = box(table); const cardBox = box(element); const buttonBox = box(button);
    const th = element.querySelector('tbody th')!;
    const img = image.querySelector('img');
    return { card: cardBox, image: imageBox, table: tableBox, button: buttonBox,
      right: imageBox.right - buttonBox.right, bottom: imageBox.bottom - buttonBox.bottom,
      gaps: [tableBox.y - imageBox.bottom, cardBox.bottom - 1 - tableBox.bottom],
      padding: Number.parseFloat(getComputedStyle(th).paddingTop), nameFont: getComputedStyle(element.querySelector('h3')!).fontSize,
      valueFont: getComputedStyle(element.querySelector('td')!).fontSize,
      borders: [...element.querySelectorAll('tbody th')].map(e => getComputedStyle(e).borderBottomWidth),
      header: box(element.querySelector('thead')!), clip: getComputedStyle(element.querySelector('thead')!).clipPath,
      circle: element.querySelector('.attribute-circle') ? box(element.querySelector('.attribute-circle')!) : null,
      imageFit: img ? getComputedStyle(img).objectFit : null, natural: img ? [img.naturalWidth, img.naturalHeight] : null,
      intact: [...element.querySelectorAll('tbody th, tbody td, h3')].every(e => e.scrollWidth <= e.clientWidth + 1 && getComputedStyle(e).textOverflow !== 'ellipsis'),
    };
  });
}
async function expandedImage(page: Page) {
  const dialog = fullDetails(page);
  await expect.poll(() => dialog.locator('img').evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
  const sizes = await dialog.evaluate(e => {
    const img = e.querySelector('img')!; const b = img.getBoundingClientRect(); const style = getComputedStyle(e);
    return { width: b.width, height: b.height, inner: e.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight), ratio: img.naturalWidth / img.naturalHeight };
  });
  expect(sizes.width).toBeCloseTo(sizes.inner, 1);
  expect(sizes.width / sizes.height).toBeCloseTo(sizes.ratio, 3);
  await expect(dialog.locator('thead th')).toHaveText(['Atributo', 'Dato']);
  await expect(dialog.locator('.card-details-overlay, .attribute-circle')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Información de la baraja', exact: true })).toBeVisible();
}
async function record(page: Page, name: string) {
  const directory = 'playwright-report/b17/tests'; await fs.mkdir(directory, { recursive: true });
  await page.screenshot({ path: `${directory}/${name}.png`, fullPage: true });
  const sample = await page.evaluate(() => {
    const composition = document.querySelector<HTMLElement>('.game-composition')!;
    return { viewport: [innerWidth, innerHeight], scale: visualViewport?.scale, dpr: devicePixelRatio,
      layout: composition.dataset.layout, useful: composition.dataset.usefulWidth, height: document.documentElement.scrollHeight };
  });
  await fs.writeFile(`${directory}/${name}.json`, JSON.stringify({ date: new Date().toISOString(), ...sample,
    cards: await Promise.all((await page.locator('.game-card:visible').all()).map(geometry)) }, null, 2) + '\n');
}

for (const id of ['generica', 'sistema-solar', 'criaturas-magicas']) for (const mode of ['PLAY_VALUE', 'DISPLAY_VALUE'] as const) {
  test(`B17 ${id} ${mode}: cara completa, encaje autorizado, datos, públicos y normal adaptada`, async ({ browser }) => {
    const s = await scene(id); const p = await manualTable(browser, s.base, { deckId: id, version: id === 'criaturas-magicas' ? 2 : 4, valueMode: mode, width: 1920, height: 1080, turn: 60, review: 5 });
    try {
      const view = await readGame(p.host); const guest = await readGame(p.pages[1]);
      for (const owner of [view, guest]) assertGamePrivacy(owner, owner.game.hand.map(c => c.id), (owner === view ? guest : view).game.hand.map(c => c.id), (condition, reason) => expect(condition, reason).toBe(true));
      await expect(p.host.getByRole('table', { name: mode === 'PLAY_VALUE' ? 'Valores 1-58' : 'Datos informativos' })).toHaveCount(4);
      if (id !== 'generica') await expect.poll(() => p.host.locator('.game-card-image img').evaluateAll(es => es.every(e => (e as HTMLImageElement).naturalWidth === 640))).toBe(true);
      for (const card of [view.game.round.indicator, ...view.game.hand]) {
        const slot = p.host.locator(`[data-card-id="${card.id}"]`); const face = slot.locator('article');
        await expect.poll(() => geometry(face).then(g => g.gaps.every(gap => gap >= -0.01))).toBe(true);
        const g = await geometry(face);
        expect([g.card.width, g.card.height, g.image.width, g.image.height]).toEqual([230, 321, 230, 172.5]);
        expect(g.image.x).toBe(g.card.x); expect([g.button.width, g.button.height, g.right, g.bottom]).toEqual([44, 44, 5, 5]);
        expect(Math.abs(g.gaps[0] - g.gaps[1])).toBeLessThan(0.05); expect(g.borders).toEqual(['1px', '1px', '0px']);
        expect([g.circle!.width, g.circle!.height]).toEqual([12, 12]); expect(g.header.width).toBe(1); expect(g.clip).toBe('inset(50%)');
        expect(g.intact).toBe(true); expect(g.nameFont).toBe('16px'); expect(g.valueFont).toBe('14px');
        expect(g.padding).toBe(/67P|Tritón|Grifo/.test(card.name) ? 4.9 : 6);
        if (id !== 'generica') { expect(g.imageFit).toBe('contain'); expect(g.natural).toEqual([640, 480]); }
        await expect(slot.locator('.active-mark')).toHaveCount(0);
        await expect(slot.locator('tbody td')).toHaveText(view.game.attributes.map(a => mode === 'PLAY_VALUE' ? String(card.values[a.id].playValue) : literal(card.values[a.id])));
        await expect(slot.getByRole('rowheader', { name: 'Poder, atributo activo', exact: true })).toHaveCount(id === 'criaturas-magicas' ? 1 : 0);
        await expect(slot.locator('.card-details-button')).toHaveText('D');
      }
      if (id === 'criaturas-magicas') await expect(p.host.locator('.game-hand [data-card-id="carta-038"] .card-round-attribute')).toHaveAttribute('aria-label', 'Atributo indicador: Astucia');
      await record(p.host, `${id}-${mode}-1920`);
      const first = p.host.locator('.game-hand .card-details-button').first(); await first.click();
      if (id !== 'generica') await expandedImage(p.host);
      await expect(fullDetails(p.host).locator('tbody td')).toHaveText(view.game.attributes.map(a => literal(view.game.hand[0].values[a.id])));
      await closeDetails(p.host); await expect(first).toBeFocused();
      await humanPlay(p); await humanPlay(p);
      await expect(p.host.locator('.played-row .full-card')).toHaveCount(2); expect((await readGame(p.host)).game.interaction.stage).toBe('ROUND_REVIEW');
      await p.host.setViewportSize({ width: 390, height: 844 });
      await expect(p.host.locator('.game-composition')).toHaveAttribute('data-layout', 'normal');
      expect(await p.host.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      await record(p.host, `${id}-${mode}-normal-390`);
      const publicD = p.host.locator('.played-row .card-details-button').first(); await publicD.click();
      if (id !== 'generica') await expandedImage(p.host);
      await closeDetails(p.host); await expect(publicD).toBeFocused();
    } finally { await p.close(); await s.stop(); }
  });
}

test('B17 D: clic/Enter/Space/arrastre no juegan; parcial/plazo, Información, resize y foco equivalentes', async ({ browser }) => {
  const s = await scene(); const p = await manualTable(browser, s.base, { deckId: 'criaturas-magicas', version: 2, optimize: true, width: 1920, turn: 60 });
  try {
    const opener = p.pages[1]; await opener.getByRole('button', { name: 'ALTO', exact: true }).click();
    await expect.poll(() => s.gameRequests.length).toBe(1); const before = await readGame(opener);
    const id = before.game.hand[0].id; const slot = opener.locator(`.game-hand [data-card-id="${id}"]`); const d = slot.locator('.card-details-button');
    for (const gesture of ['click', 'Enter', 'Space']) {
      await test.step(`Abrir con ${gesture}`, async () => {
        if (gesture === 'click') await d.click(); else { await d.focus(); await d.press(gesture); }
        await expect(fullDetails(opener)).toHaveCount(1); await expandedImage(opener);
        await closeDetails(opener); await expect(d).toBeFocused();
      });
    }
    await d.scrollIntoViewIfNeeded(); const b = (await d.boundingBox())!;
    for (const distance of [15, -65]) {
      await opener.mouse.move(b.x + 22, b.y + 22); await opener.mouse.down(); await opener.mouse.move(b.x + 22 + distance, b.y + 22, { steps: 6 }); await opener.mouse.up();
      await expect(fullDetails(opener)).toHaveCount(0);
    }
    await d.focus(); await d.press('Enter'); // El arrastre anterior no bloquea el teclado.
    const info = fullDetails(opener).getByRole('button', { name: 'Información de la baraja', exact: true }); await info.click();
    await opener.locator('.consultation').getByRole('button', { name: 'Cerrar consulta', exact: true }).press('Escape'); await expect(info).toBeFocused();
    await opener.setViewportSize({ width: 390, height: 844 }); await expect(opener.locator('.game-composition')).toHaveAttribute('data-layout', 'compact');
    await expandedImage(opener); await closeDetails(opener); await expect(d).toBeFocused(); await expect(d).toHaveText('Detalles');
    await d.press('Space'); await opener.setViewportSize({ width: 1920, height: 1080 }); await closeDetails(opener); await expect(d).toBeFocused(); await expect(d).toHaveText('D');
    const after = await readGame(opener); expect(after.game.interaction.turn).toEqual(before.game.interaction.turn); expect(after.game.interaction.openingSelection).toEqual({ direction: 'HIGH' });
    expect(s.gameRequests).toHaveLength(1); await expect(slot.locator('.card-play-button')).toHaveAttribute('aria-pressed', 'false');
    await slot.locator('.card-play-surface .card-heading').click(); await expect.poll(() => s.gameRequests.filter(r => r.event === 'game:play').length).toBe(1);
    expect((await readGame(p.host)).game.round.plays.map(play => play.card.id)).toEqual([id]);
  } finally { await p.close(); await s.stop(); }
});

test('B17 consulta abierta: timeout retira la carta, revisión avanza y foco vuelve a región, sin pausas', async ({ browser }) => {
  const s = await scene(); const p = await manualTable(browser, s.base, { deckId: 'criaturas-magicas', version: 2, width: 1320, turn: 15, review: 5 });
  try {
    const before = await readGame(p.host); const id = before.game.hand[0].id;
    await p.host.locator(`.game-hand [data-card-id="${id}"] .card-details-button`).click();
    s.time.advance(15000); await expect.poll(async () => (await readGame(p.host)).game.round.plays.length).toBe(1);
    s.time.advance(15000); await expect.poll(async () => (await readGame(p.host)).game.interaction.stage).toBe('ROUND_REVIEW');
    await expect(fullDetails(p.host)).toBeVisible(); expect((await readGame(p.host)).game.hand.map(card => card.id)).not.toContain(id);
    s.time.advance(5000); await expect.poll(async () => (await readGame(p.host)).game.round.number).toBe(2);
    await closeDetails(p.host); await expect(p.host.getByRole('region', { name: 'Cartas de tu mano', exact: true })).toBeFocused();
    const rotated = await readGame(p.host); expect(rotated.game.interaction.turn!.timing!.startedAt).toBe(s.time.unixOrigin + 35000);
    expect(s.gameRequests).toHaveLength(0);
    await humanPlay(p); await humanPlay(p);
    const oldIndicator = (await readGame(p.host)).game.round.indicator.id;
    const indicatorD = p.host.locator('.indicator-full .card-details-button'); await indicatorD.focus();
    s.time.advance(5000); await expect.poll(async () => (await readGame(p.host)).game.round.number).toBe(3);
    expect((await readGame(p.host)).game.round.indicator.id).not.toBe(oldIndicator);
    await expect(indicatorD).not.toBeFocused(); // Sustituir otra carta no transfiere el foco como un resize.
  } finally { await p.close(); await s.stop(); }
});

for (const width of [360, 390]) test(`B17 compacta ${width}: cara intacta, consulta completa e imagen Detalles ampliada, anidación y foco`, async ({ browser }) => {
  const s = await scene('criaturas-magicas', 'atributo3'); const p = await manualTable(browser, s.base, { deckId: 'criaturas-magicas', version: 2, optimize: true, width, height: width === 360 ? 800 : 844, turn: 60 });
  try {
    await expect(p.host.locator('.game-composition')).toHaveAttribute('data-layout', 'compact');
    const face = p.host.locator('.game-hand article').first(); const g = await geometry(face);
    expect(g.card.width).toBe(220); expect([g.image.width, g.image.height]).toEqual([32, 32]); expect(g.circle).toBe(null);
    await expect(face.locator('.active-mark')).toHaveCount(1); await expect(face.getByRole('rowheader', { name: 'Resistencia, atributo activo', exact: true })).toBeVisible();
    await expect(face.locator('.card-details-button')).toHaveText('Detalles'); await expect(face.locator('.card-details-overlay')).toHaveCount(0);
    await face.locator('.card-details-button').click(); await expandedImage(p.host); await closeDetails(p.host); await expect(face.locator('.card-details-button')).toBeFocused();
    const summary = p.host.locator('.summary-indicator'); await summary.click();
    const consultation = p.host.locator('.consultation'); const full = consultation.locator('.full-card');
    await expect(full.locator('.card-details-overlay')).toHaveCount(1); const cg = await geometry(full);
    expect([cg.card.width, cg.card.height, cg.image.width, cg.image.height]).toEqual([230, 321, 230, 172.5]);
    await expect(full.getByRole('rowheader', { name: 'Resistencia, atributo activo', exact: true })).toBeVisible();
    const nestedD = full.locator('.card-details-button'); await nestedD.press('Enter'); await expandedImage(p.host); await closeDetails(p.host); await expect(nestedD).toBeFocused();
    await consultation.getByRole('button', { name: 'Cerrar consulta', exact: true }).press('Escape'); await expect(summary).toBeFocused();
    expect(s.gameRequests).toHaveLength(0);
  } finally { await p.close(); await s.stop(); }
});

test('B17 fallo/pendiente de medio: placeholder y aviso sin colisión con D, recurso original y recuperación', async ({ browser }) => {
  const s = await scene(); const p = await manualTable(browser, s.base, { deckId: 'criaturas-magicas', version: 2, width: 1320, turn: 60 });
  try {
    const view = await readGame(p.host); const card = view.game.hand[0]; const url = card.imageUrl!;
    await p.host.route(`**${url}`, route => route.abort()); await p.host.reload();
    const face = p.host.locator(`.game-hand [data-card-id="${card.id}"] article`);
    await expect(face.getByRole('status')).toHaveText('No se pudo cargar la imagen');
    const collision = await face.evaluate(e => {
      const text = e.querySelector('p[role="status"]')!.getBoundingClientRect(); const d = e.querySelector('button')!.getBoundingClientRect();
      return text.right > d.left && text.left < d.right && text.bottom > d.top && text.top < d.bottom;
    }); expect(collision).toBe(false); await expect(face.locator('svg rect')).toHaveCount(1);
    await record(p.host, 'medio-fallido-normal-1320');
    await face.locator('.card-details-button').click(); await expect(fullDetails(p.host).getByRole('status')).toBeVisible(); await closeDetails(p.host);
    await p.host.unroute(`**${url}`);
    let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
    await p.host.route(`**${url}`, async route => { await gate; await route.continue(); });
    await p.host.reload({ waitUntil: 'domcontentloaded' });
    await expect(face.locator('.card-details-button')).toBeVisible();
    await expect(face.locator('img')).toHaveAttribute('src', url);
    await face.locator('.card-details-button').click();
    await expect(fullDetails(p.host)).toBeVisible(); release(); await expandedImage(p.host); await closeDetails(p.host);
    expect((await readGame(p.host)).game.hand[0]).toEqual(card); expect(s.gameRequests).toHaveLength(0);
  } finally { await p.close(); await s.stop(); }
});
