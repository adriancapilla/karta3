import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { io } from 'socket.io-client';
import { configurationBrowserServer } from '../support/configurationBrowserServer.js';
import { manualTable, humanPlay, readGame, readRoom } from '../support/manualBrowserCases.js';
import { assertGamePrivacy } from '../support/gamePrivacy.js';

const evidence = 'playwright-report/b15/after';
const solarPrefix = ['encke', 'borrelly', 'hyakutake', 'sedna', 'eris', 'hale-bopp', 'ryugu'];
async function server() {
  const s = await configurationBrowserServer(true, true, undefined, { generic: true, solar: true });
  s.permutation(ids => ids.includes('encke') ? [...solarPrefix, ...ids.filter(id => !solarPrefix.includes(id))] : [...ids]);
  return s;
}
async function measure(page: Page) {
  return page.evaluate(() => {
    const box = (e: Element) => { const b=e.getBoundingClientRect(); return {x:b.x,y:b.y+scrollY,width:b.width,height:b.height,bottom:b.bottom+scrollY}; };
    const composition=document.querySelector<HTMLElement>('.game-composition')!;
    const panels=Object.fromEntries(['people','initial-state','plays','hand','indicator'].map(name=>{const e=document.querySelector(`.game-${name}`);return [name,e?box(e):null];}));
    const cards=[...document.querySelectorAll('.game-layout .game-card')].filter(e=>e.getBoundingClientRect().width).map(e=>({box:box(e),name:e.querySelector('h3')!.textContent,nameFont:getComputedStyle(e.querySelector('h3')!).fontSize,valueFont:getComputedStyle(e.querySelector('td')!).fontSize,values:[...e.querySelectorAll('td')].map(td=>({text:td.textContent,client:td.clientWidth,scroll:td.scrollWidth,overflow:getComputedStyle(td).overflow,textOverflow:getComputedStyle(td).textOverflow})),columns:e.querySelectorAll('tbody tr:first-child>*').length,image:box(e.querySelector('.game-card-image')!)}));
    const authors=[...document.querySelectorAll('.played-row>div')].map(group=>({card:box(group.querySelector('.game-card')!),author:box(group.querySelector('.play-author')!)}));
    return {viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,scale:visualViewport?.scale},contentWidth:Number(composition.dataset.usefulWidth),composition:box(composition),layout:composition.dataset.layout,padding:getComputedStyle(document.querySelector('.game-shell')!).padding,bodyWidth:document.body.clientWidth,pageWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,residual:Math.max(0,document.documentElement.scrollHeight-innerHeight),font:getComputedStyle(composition).fontFamily,panels,cards,authors,stateCount:document.querySelectorAll('.game-initial-state').length};
  });
}
async function record(page:Page,name:string) {
  await page.evaluate(()=>scrollTo(0,0)); const measurements={...await measure(page),capturedAt:new Date().toISOString(),browserVersion:page.context().browser()!.version()};
  await fs.mkdir(evidence,{recursive:true}); await fs.writeFile(`${evidence}/${name}.json`,JSON.stringify(measurements,null,2)+'\n');
  await page.screenshot({path:`${evidence}/${name}-full.png`,fullPage:true}); await page.screenshot({path:`${evidence}/${name}-viewport.png`}); return measurements;
}
const literal=(value:{displayValue:string;unit:string})=>value.displayValue+(value.unit===''?'':` ${value.unit}`);
test('B15 fixture V2 fechas/textos/separadores: literal en dos columnas y consultas, sin interpretación', async({browser})=>{
  const s=await configurationBrowserServer(true,true,undefined,{literal:true});const p=await manualTable(browser,s.base,{deckId:'portada',version:7,optimize:true,valueMode:'DISPLAY_VALUE',width:360});
  try{
    expect(await p.pages[1].locator('.game-hand .game-card').first().locator('tbody td').allTextContents()).toEqual(['13/10/2026','sin dato','1  234 km']);
    expect(await p.host.locator('.game-hand .game-card').first().locator('tbody td').allTextContents()).toEqual(['13/10/2026','sin dato','1\u202F234 km']);
    expect(await p.pages[1].locator('.game-hand .game-card').first().locator('tbody td').last().evaluate(e=>getComputedStyle(e).whiteSpace)).toBe('pre-wrap');
    await p.host.getByRole('button',{name:'Información de la baraja',exact:true}).click();const paragraph=p.host.getByRole('dialog').locator('.literal-text').last();
    expect(await paragraph.textContent()).toBe('Primera línea\n<b>Literal, sin ejecutar HTML</b>');await expect(paragraph.locator('b')).toHaveCount(0);await p.host.getByRole('button',{name:'Cerrar consulta',exact:true}).press('Escape');
    const before=await readGame(p.pages[1]);const surface=p.pages[1].locator('.game-hand .card-play-surface').first();const b=await surface.boundingBox();
    await p.pages[1].mouse.move(b!.x+80,b!.y+12);await p.pages[1].mouse.down();await p.pages[1].mouse.move(b!.x+10,b!.y+12,{steps:6});await p.pages[1].mouse.up();expect(s.gameRequests).toHaveLength(0);
    await surface.click();await expect(p.pages[1].locator('.game-hand .card-play-button').first()).toHaveAttribute('aria-pressed','true');expect((await readGame(p.pages[1])).game.round.plays).toEqual([]);
    await p.pages[1].getByRole('button',{name:'BAJO',exact:true}).click();await expect.poll(()=>s.gameRequests.filter(r=>r.event==='game:play').length).toBe(1);expect((await readGame(p.host)).game.round.plays[0].card.id).toBe(before.game.hand[0].id);
  }finally{await p.close();await s.stop();}
});
test('B15 E7: consulta de A cancelada no sobrevive ni contamina B ante eventos antiguos', async({browser})=>{
  const s=await server();const p=await manualTable(browser,s.base,{deckId:'sistema-solar',version:4,optimize:true,width:390,turn:60});
  const cookie=(await p.contexts[0].cookies()).find(c=>c.name==='karta3_session')!;
  const socket=io(s.base,{transports:['websocket'],reconnection:false,extraHeaders:{Cookie:`${cookie.name}=${cookie.value}`,Origin:s.base}});
  try{
    await new Promise<void>((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
    const a=await readGame(p.host);await p.host.getByRole('button',{name:'Información de la baraja',exact:true}).click();
    const ack=await new Promise<{ok:boolean}>(resolve=>socket.emit('game:cancel',{requestId:'info-cancel',roomId:a.id,gameId:a.game.id},resolve));expect(ack.ok).toBe(true);
    await expect(p.host.getByRole('heading',{name:'Partida cancelada por el anfitrión',exact:true})).toBeVisible();await expect(p.host.getByRole('dialog')).toHaveCount(0);
    await p.host.getByRole('button',{name:'Volver al inicio',exact:true}).click();await p.host.getByRole('button',{name:'Crear sala',exact:true}).click();
    await p.host.getByLabel('Baraja',{exact:true}).selectOption(JSON.stringify({id:'generica',contentVersion:4}));const b=await readRoom(p.host);expect(b.id).not.toBe(a.id);expect(b.settings).toMatchObject({attributeValueMode:'PLAY_VALUE',optimizeForMobile:false});
    const session=s.sessions.get(cookie.value)!;s.repeatRoomState(session,a);await p.host.waitForTimeout(100);expect((await readRoom(p.host)).id).toBe(b.id);
    await p.host.getByRole('button',{name:'Información de la baraja',exact:true}).click();await expect(p.host.getByRole('dialog')).toContainText('atributos son abstractos');await expect(p.host.getByRole('dialog')).not.toContainText('MKm significa');
  }finally{socket.disconnect();await p.close();await s.stop();}
});
async function cards(page:Page,mode:'PLAY_VALUE'|'DISPLAY_VALUE') {
  const view=await readGame(page);
  for(const card of view.game.hand) {
    const element=page.locator(`.game-hand [data-card-id="${card.id}"]`);
    await expect(element.locator('tbody tr')).toHaveCount(3);
    await expect(element.locator('tbody td')).toHaveText(view.game.attributes.map(a=>mode==='PLAY_VALUE'?String(card.values[a.id].playValue):literal(card.values[a.id])));
    expect(await element.locator('tbody tr').evaluateAll(rows=>rows.every(r=>r.children.length===2))).toBe(true);
  }
  const own=(await readGame(page)).game.hand.map(c=>c.id);
  assertGamePrivacy(view,own,[],(condition,reason)=>expect(condition,reason).toBe(true));
}
for(const id of ['generica','sistema-solar']) for(const mode of ['PLAY_VALUE','DISPLAY_VALUE'] as const) for(const width of [390,1920]) test(`B15 ${id} ${mode} ${width}: producto, información, indicadora, Detalles y privacidad`,async({browser})=>{
  const s=await server(); const p=await manualTable(browser,s.base,{deckId:id,version:4,valueMode:mode,optimize:true,width,turn:60,review:2});
  try {
    const own=await readGame(p.host); await cards(p.host,mode); await cards(p.pages[1],mode);
    const expected=JSON.parse(await fs.readFile(`barajas/${id}/baraja.json`,'utf8'));
    expect(own.deckInformation).toEqual({id,contentVersion:4,instructions:expected.instructions});
    const sample=await record(p.host,`${id}-${mode}-${width}`);
    expect(sample.stateCount).toBe(1); expect(sample.pageWidth).toBeLessThanOrEqual(width);
    expect(sample.layout).toBe(width===390?'compact':'normal');
    for(const c of sample.cards){expect(c.columns).toBe(2);expect(c.valueFont).toBe('14px');for(const value of c.values){expect(value.overflow).not.toBe('hidden');expect(value.textOverflow).not.toBe('ellipsis');expect(value.scroll).toBeLessThanOrEqual(value.client+1);}}
    if(width===390){
      expect(sample.panels.people!.bottom).toBeLessThanOrEqual(sample.panels['initial-state']!.y);
      expect(sample.panels['initial-state']!.bottom).toBeLessThanOrEqual(sample.panels.plays!.y);
      expect(sample.panels.plays!.bottom).toBeLessThanOrEqual(sample.panels.hand!.y);
      expect(sample.cards.every(c=>c.box.width===220&&c.nameFont==='18px'&&c.image.width===32)).toBe(true);
      const trigger=p.host.getByRole('button',{name:`Carta indicadora: ${own.game.round.indicator.name}`,exact:true});await trigger.click();
      await expect(p.host.getByRole('dialog').locator('tbody tr')).toHaveCount(3); await p.host.getByRole('button',{name:'Cerrar consulta',exact:true}).press('Escape'); await expect(p.host.getByRole('dialog')).toHaveCount(0); await expect(trigger).toBeFocused();
    } else {expect(sample.contentWidth).toBe(1368);expect(sample.cards.every(c=>c.box.width===230)).toBe(true);}
    const trigger=p.host.locator('.game-hand .card-details-button').first();await trigger.focus();await trigger.press('Enter');
    const dialog=p.host.getByRole('dialog');await expect(dialog.locator('thead th')).toHaveText(['Atributo','Dato']);
    await expect(dialog.locator('tbody td')).toHaveText(own.game.attributes.map(a=>literal(own.game.hand[0].values[a.id])));
    await expect(dialog).not.toContainText('Jugable:');await expect(dialog.getByRole('button',{name:'Información de la baraja',exact:true})).toBeVisible();
    const nested=dialog.getByRole('button',{name:'Información de la baraja',exact:true});await nested.click();await expect(p.host.locator('.consultation')).toContainText(expected.instructions);
    await p.host.locator('.consultation').getByRole('button',{name:'Cerrar consulta',exact:true}).press('Escape');await expect(p.host.locator('.consultation')).toHaveCount(0);await expect(dialog).toBeVisible();await expect(nested).toBeFocused();
    await dialog.getByRole('button',{name:'Cerrar detalles',exact:true}).press('Escape');await expect(trigger).toBeFocused();
    const info=p.host.getByRole('button',{name:'Información de la baraja',exact:true});await info.click();
    await expect(p.host.getByRole('dialog').locator('.literal-text').last()).toHaveText(expected.instructions);
    expect(await p.host.getByRole('dialog').locator('.literal-text').last().evaluate(e=>getComputedStyle(e).whiteSpace)).toBe('pre-wrap');
    await p.host.getByRole('button',{name:'Cerrar consulta',exact:true}).click();await expect(info).toBeFocused();
    await Promise.all(p.pages.map(page=>page.reload()));await Promise.all(p.pages.map(page=>expect(page.getByRole('heading',{level:1})).toContainText('Partida ·')));
    expect((await readGame(p.host)).settings).toEqual(own.settings);expect((await readGame(p.host)).game.id).toBe(own.game.id);
    if(width===390){await p.host.evaluate(()=>scrollTo(0,document.querySelector('.game-initial-state')!.getBoundingClientRect().top+scrollY));await p.host.screenshot({path:`${evidence}/${id}-${mode}-390-apartadas.png`});}
  }finally{await p.close();await s.stop();}
});

test('B15 espera: dos sesiones y pestañas, info ligada a selección, cambios concurrentes y confirmación incierta',async({browser})=>{
  test.setTimeout(45000);const s=await server();const hc=await browser.newContext();const gc=await browser.newContext({viewport:{width:390,height:844}});const h=await hc.newPage();const g=await gc.newPage();
  try{
    await Promise.all([h.goto(s.base),g.goto(s.base)]);await h.getByRole('button',{name:'Crear sala',exact:true}).click();
    await expect(h.getByLabel('Baraja',{exact:true})).toHaveValue('');await expect(h.getByLabel('Valor del Atributo')).toHaveValue('PLAY_VALUE');await expect(h.getByLabel('Optimizar para móvil')).not.toBeChecked();
    await g.getByLabel('Código de sala').fill((await h.locator('.code').textContent())!);await g.getByLabel('Tu nombre',{exact:true}).fill('Ana');await g.getByRole('button',{name:'Entrar',exact:true}).click();
    const tab=await hc.newPage();await tab.goto(s.base);await expect(tab.getByLabel('Valor del Atributo')).toHaveValue('PLAY_VALUE');
    await Promise.all([h.getByLabel('Valor del Atributo').selectOption('DISPLAY_VALUE'),tab.getByLabel('Optimizar para móvil').check()]);await expect(g.locator('.configuration-summary')).toContainText('Dato');
    await h.getByLabel('Baraja',{exact:true}).selectOption(JSON.stringify({id:'generica',contentVersion:4}));await expect(g.getByRole('button',{name:'Información de la baraja',exact:true})).toBeVisible();
    await g.getByRole('button',{name:'Información de la baraja',exact:true}).click();await expect(g.getByRole('dialog')).toContainText('KARTA3 — Baraja genérica');
    await tab.getByLabel('Baraja',{exact:true}).selectOption(JSON.stringify({id:'sistema-solar',contentVersion:4}));await expect(g.getByRole('dialog')).toHaveCount(0);await expect(g.getByRole('button',{name:'Información de la baraja',exact:true})).toBeFocused();
    await h.getByRole('button',{name:'Información de la baraja',exact:true}).click();await tab.getByLabel('Baraja',{exact:true}).selectOption('');await expect(h.getByRole('dialog')).toHaveCount(0);await expect(h.getByLabel('Baraja',{exact:true})).toBeFocused();
    expect((await readRoom(h)).settings).toMatchObject({attributeValueMode:'DISPLAY_VALUE',optimizeForMobile:true});
    s.intercept((payload,deliver,result)=>{if(payload.change.field!=='attributeValueMode')deliver(result);});
    await h.getByLabel('Valor del Atributo').selectOption('PLAY_VALUE');await expect(h.locator('#config-attributeValueMode-state')).toContainText('No se pudo confirmar',{timeout:7000});
    const count=s.requests.length;await h.reload();await expect(h.getByLabel('Valor del Atributo')).toHaveValue('PLAY_VALUE');expect(s.requests).toHaveLength(count);
    expect((await readRoom(g)).settings).toMatchObject({attributeValueMode:'PLAY_VALUE',optimizeForMobile:true});
    await h.getByLabel('Baraja',{exact:true}).selectOption(JSON.stringify({id:'portada',contentVersion:7}));await h.getByRole('button',{name:'Información de la baraja',exact:true}).click();await expect(h.getByRole('dialog')).toContainText('Esta baraja no incluye instrucciones adicionales');
  }finally{await Promise.all([hc.close(),gc.close()]);await s.stop();}
});

test('B15 frontera medida 1367/1368, equivalencia normal on/off, foco, parciales, resize y quinta',async({browser})=>{
  const s=await server();const p=await manualTable(browser,s.base,{count:5,deckId:'generica',version:4,optimize:true,width:1920,turn:60,review:5,names:['Ana','Ana','Alba','Álex']});
  try{
    const opener=p.pages[1];await opener.getByRole('button',{name:'BAJO',exact:true}).click();
    const first=await readGame(opener);const timing=first.game.interaction.turn!.timing!;
    const chosen=opener.locator('.game-hand .card-play-button').first();await chosen.click(); // Completa la apertura ya aceptada una sola vez.
    await expect.poll(()=>s.gameRequests.filter(r=>r.event==='game:play').length).toBe(1);
    for(const target of [1367,1368,358,328,992,1368]){
      const previous=await measure(p.host);await p.host.setViewportSize({width:target+32+previous.viewport.width-previous.bodyWidth,height:target===328?800:844});
      await expect.poll(async()=>(await measure(p.host)).contentWidth).toBe(target);
      const sample=await record(p.host,`frontera-${target}`);expect(sample.contentWidth).toBe(target);expect(sample.layout).toBe(target<1368?'compact':'normal');expect(sample.pageWidth).toBeLessThanOrEqual(sample.viewport.width);
      const person=p.host.locator('.roster-identity').first();await person.focus();await person.press('Enter');await expect(p.host.getByRole('dialog')).toContainText('Ana (1)');await p.host.getByRole('button',{name:'Cerrar consulta',exact:true}).press('Escape');await expect(person).toBeFocused();
    }
    expect((await readGame(opener)).game.round.plays).toHaveLength(1);expect(first.game.interaction.turn!.timing).toEqual(timing);
    for(let i=1;i<5;i++)await humanPlay(p,false,'LOW');
    const review=await readGame(p.host);expect(review.game.interaction.stage).toBe('ROUND_REVIEW');
    await expect(p.host.locator('.played-row .game-card-slot')).toHaveCount(5);
    const ids=await p.host.locator('.played-row .game-card-slot').evaluateAll(es=>es.map(e=>e.getAttribute('data-card-id')));expect(ids).toEqual(review.game.interaction.review!.result.ranking.map(e=>e.card.id));
    const rail=p.host.locator('.played-row');await rail.focus();for(let i=0;i<16;i++)await rail.press('ArrowRight');await expect.poll(()=>rail.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);
    const fifth=rail.locator('.card-details-button').last();await fifth.focus();await fifth.press('Enter');await expect(p.host.getByRole('dialog').locator('tbody tr')).toHaveCount(3);await p.host.getByRole('button',{name:'Cerrar detalles',exact:true}).press('Escape');await expect(fifth).toBeFocused();
    await record(p.host,'cinco-publicas-revision');
  }finally{await p.close();await s.stop();}
  const samples=[];
  for(const optimize of [false,true]){const x=await server();const table=await manualTable(browser,x.base,{deckId:'generica',version:4,optimize,width:1920,height:1080,turn:60});try{samples.push(await record(table.host,`normal-${optimize?'on':'off'}-1368`));}finally{await table.close();await x.stop();}}
  expect(samples[0].panels).toEqual(samples[1].panels);expect(samples[0].cards).toEqual(samples[1].cards);expect(samples[0].layout).toBe(samples[1].layout);
});

for(const width of [360,390,1024])for(const mode of ['PLAY_VALUE','DISPLAY_VALUE']as const)test(`B15 observador, cinco jugadores e identidades estables ${width} ${mode}`,async({browser})=>{
  const s=await server();const p=await manualTable(browser,s.base,{count:5,observer:true,hostName:'Ana',deckId:'sistema-solar',version:4,optimize:true,valueMode:mode,width,height:width===360?800:width===390?844:768,turn:60,review:2,names:['Ana','Ana','Alba','Álex','Ana']});
  try{const own=await readGame(p.host);expect(own.game.hand).toEqual([]);await expect(p.host.locator('.game-hand')).toHaveCount(0);await expect(p.host.getByRole('button',{name:'Cancelar partida',exact:true})).toBeVisible();
    expect(await p.host.locator('.roster-identity .compact-identity').allTextContents()).toEqual(['A·1 0','A·2 0','A·3 0','Á 0','A·5 0','A·O']);
    const sample=await record(p.host,`observador-cinco-${width}-${mode}`);expect(sample.layout).toBe('compact');expect(sample.pageWidth).toBeLessThanOrEqual(width);
    const access=p.host.getByRole('button',{name:`Carta indicadora: ${own.game.round.indicator.name}`,exact:true});await access.click();await expect(p.host.getByRole('dialog')).toBeVisible();await p.host.setViewportSize({width:1920,height:1080});await expect(p.host.getByRole('dialog')).toBeVisible();await p.host.getByRole('button',{name:'Cerrar consulta',exact:true}).press('Escape');
    expect((await readGame(p.host)).game.id).toBe(own.game.id);expect(s.gameRequests).toHaveLength(0);
    await p.host.setViewportSize({width,height:width===360?800:width===390?844:768});
    for(let i=0;i<4;i++)await humanPlay(p,false,i===0?'LOW':'HIGH');await record(p.pages[5],`invitado-cuatro-publicas-${width}-${mode}`);
    await humanPlay(p);const review=await readGame(p.host);expect(review.game.interaction.stage).toBe('ROUND_REVIEW');const sampleReview=await record(p.host,`observador-cinco-publicas-${width}-${mode}`);
    for(const author of sampleReview.authors)expect(author.author.y).toBeGreaterThanOrEqual(author.card.bottom);
    await expect(p.host.locator('.played-row .game-card-slot')).toHaveCount(5);const fifth=p.host.locator('.played-row .card-details-button').last();await fifth.focus();await fifth.press('Space');await expect(p.host.getByRole('dialog').locator('thead th')).toHaveText(['Atributo','Dato']);await p.host.getByRole('button',{name:'Cerrar detalles',exact:true}).press('Escape');await expect(fifth).toBeFocused();
  }finally{await p.close();await s.stop();}
});
