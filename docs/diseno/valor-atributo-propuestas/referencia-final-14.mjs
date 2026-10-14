// Revisión mínima 14/10: solo orden de puntuaciones; las referencias 13/10 quedan intactas.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const folder=path.dirname(fileURLToPath(import.meta.url)),require=createRequire(path.resolve(folder,'../../../package.json'));
const {chromium}=require('@playwright/test');
const sharp=require('sharp');
const read=(name)=>fs.readFileSync(path.join(folder,name),'utf8');
const previous=['complemento-7-7.html','complemento-7-7.css','complemento-7-7.js','medidas-complemento-7-7.json'];
const hash=(buffer)=>crypto.createHash('sha256').update(buffer).digest('hex');
const oldHashes=Object.fromEntries(previous.map((p)=>[p,hash(read(p))]));
let html=read('complemento-7-7.html').replace('complemento-7-7.css','referencia-final-14.css').replace('complemento-7-7.js','referencia-final-14.js');
html=html.replace('<title>KARTA3 — complemento de Diseño §7.7, maqueta aislada</title>','<title>KARTA3 — referencia final móvil, 14/10/2026</title>');
html=html.replace('<header id="summary" aria-label="Resumen de mesa"></header>','<section id="score-summary" aria-label="Puntuaciones e identidades, consulta completa"></section>\n      <header id="summary" aria-label="Resumen de turno"></header>');
let css=read('complemento-7-7.css').replace('#summary{','#summary,#score-summary{');
css+='\n/* Refinamiento aprobado 14/10: puntuaciones antes del resumen, fuera de la cabecera combinada. */\n.normal #score-summary{display:none}.compact #score-summary{margin:8px 0}.compact #summary{margin:8px 0}.compact #score-summary .scores{width:100%}\n';
let js=read('complemento-7-7.js');
const insertion=js.indexOf("$('summary').insertAdjacentHTML");if(insertion<0)throw new Error('No se encontró el punto de separación de puntuaciones');
js=js.slice(0,insertion)+"// Se conserva el mismo nodo/control; no duplicar identidades ni cambiar su comportamiento.\n$('score-summary').appendChild($('summary').querySelector('.scores'));\n"+js.slice(insertion);
js=js.replaceAll('#summary [data-person','#score-summary [data-person').replaceAll('#summary .scores','#score-summary .scores');
for(const [name,content] of [['referencia-final-14.html',html],['referencia-final-14.css',css],['referencia-final-14.js',js]])fs.writeFileSync(path.join(folder,name),content);
const out=path.join(folder,'capturas','referencia-final-14');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome',args:['--disable-smooth-scrolling']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const errors=[];page.on('pageerror',(e)=>errors.push(String(e)));
const url=(name,query)=>pathToFileURL(path.join(folder,name)).href+'?'+query;
async function ready(){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map((i)=>i.decode().catch(()=>{})));await new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
async function open(name,query,width=390,height=844){await page.setViewportSize({width,height});await page.goto(url(name,query));await ready();}
async function measured(){return page.evaluate(()=>{
 const box=(el)=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
 const card=document.querySelector('#mesa .paper'),head=card.querySelector('h3'),value=card.querySelector('.value'),picture=card.querySelector('.picture');
 const ids=['score-summary','summary','people-panel','mesa-zone','indicator-zone','hand-zone'];
 return {state:window.complementMock.state,viewport:[innerWidth,innerHeight],scrollHeight:document.documentElement.scrollHeight,pageWidth:document.documentElement.scrollWidth,boxes:Object.fromEntries(ids.map((id)=>{const el=document.getElementById(id);return [id,el?{...box(el),visible:!!el.getClientRects().length&&!el.hidden}:null];})),card:box(card),style:{nameSize:getComputedStyle(head).fontSize,valueSize:getComputedStyle(value).fontSize,valueFamily:getComputedStyle(value).fontFamily,picture:box(picture)},summaryText:document.getElementById('summary').innerText,scores:document.getElementById('score-summary')?.innerText,dialogValues:[]};
});}
const report={date:'2026-10-14',scope:'Solo maqueta: refinamiento del orden; no producto/dispositivos/B14',browser:browser.version(),previousHashes:oldHashes,modes:{},wide:{},checks:{},errors};
for(const mode of ['play','data']){
 await open('complemento-7-7.html',`opt=1&mode=${mode}`);const before=await measured();
 await open('referencia-final-14.html',`opt=1&mode=${mode}`);const after=await measured();
 report.modes[mode]={before,after};
 await page.screenshot({path:path.join(out,mode==='play'?'movil-final-1-58-390.png':'movil-final-dato-390.png'),fullPage:true});
 // Encuadre a partir del resumen: evidencia de apartar puntuaciones, sin recorte de datos.
 await page.setViewportSize({width:390,height:800});await ready();
 await page.locator('#summary').evaluate((el)=>window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY));
 report.modes[mode].scrollToSummary=await page.evaluate(()=>({viewport:[innerWidth,innerHeight],scrollY,scoreBottom:document.getElementById('score-summary').getBoundingClientRect().bottom,summaryTop:document.getElementById('summary').getBoundingClientRect().top,mesaTop:document.getElementById('mesa-zone').getBoundingClientRect().top,handTop:document.getElementById('hand-zone').getBoundingClientRect().top}));
 await page.screenshot({path:path.join(out,mode==='play'?'movil-final-1-58-encuadre.png':'movil-final-dato-encuadre.png')});
}
await open('referencia-final-14.html','opt=1&mode=data',360,800);report.narrow=await measured();await page.screenshot({path:path.join(out,'movil-final-dato-360.png'),fullPage:true});
// Únicas interacciones repetidas: controles movidos y retorno de foco al cruzar la transición.
await open('referencia-final-14.html','opt=1&mode=play');
await page.locator('#score-summary [data-person=p2]').press('Enter');await ready();
report.identities=await page.locator('#people-content').innerText();await page.keyboard.press('Escape');
await page.waitForFunction(()=>document.activeElement===document.querySelector('#score-summary [data-person=p2]'));
report.checks.movedIdentityFocus=true;
await page.setViewportSize({width:1400,height:1080});await ready();
report.focusWide=await page.evaluate(()=>({id:document.activeElement.dataset.person,parent:document.activeElement.parentElement.id}));
await page.setViewportSize({width:390,height:844});await ready();
report.focusNarrow=await page.evaluate(()=>({id:document.activeElement.dataset.person,parent:document.activeElement.closest('section').id}));
await page.locator('#hand [data-detail]').first().press('Enter');await ready();
report.detailsValues=await page.locator('#details-dialog .value').allTextContents();await page.keyboard.press('Escape');
// Igualdad visual de normal ≥1368: regiones de juego, no etiqueta inspectora del pie.
for(const opt of [0,1]){
 await open('referencia-final-14.html',`opt=${opt}&mode=data`,1400,1080);report.wide[opt]=await measured();
 // Mismo encuadre/alineación para comparar píxeles; captura de elemento puede alterar scroll/subpíxel.
 await page.evaluate(()=>window.scrollTo(0,0));await ready();
 const normalBuffer=await page.screenshot({clip:{x:0,y:0,width:1400,height:1000}});
 fs.writeFileSync(path.join(out,`normal-1368-${opt?'on':'off'}.png`),normalBuffer);
 report.wide[opt].sameFrameHash=hash(normalBuffer);
 report.wide[opt].images=await page.locator('#shell img').evaluateAll((images)=>images.filter((img)=>img.getClientRects().length).map((img)=>{const r=img.getBoundingClientRect();return {src:img.getAttribute('src'),left:r.left,top:r.top,right:r.right,bottom:r.bottom};}));
}
const a=await sharp(path.join(out,'normal-1368-off.png')).raw().toBuffer({resolveWithObject:true});
const b=await sharp(path.join(out,'normal-1368-on.png')).raw().toBuffer({resolveWithObject:true});
let differentPixels=0,outsideImages=0,maxDifference=0;
for(let p=0;p<a.info.width*a.info.height;p++){let different=false;for(let c=0;c<a.info.channels;c++){const difference=Math.abs(a.data[p*a.info.channels+c]-b.data[p*a.info.channels+c]);if(difference){different=true;maxDifference=Math.max(maxDifference,difference);}}if(different){differentPixels++;const x=p%a.info.width,y=Math.floor(p/a.info.width);if(!report.wide[0].images.some((r)=>x>=Math.floor(r.left)&&x<=Math.ceil(r.right)&&y>=Math.floor(r.top)&&y<=Math.ceil(r.bottom)))outsideImages++;}}
report.normalPixelComparison={differentPixels,outsideImages,maxDifference,note:'Registrar la variación de rasterización de fotos entre capturas; no afirmar identidad binaria de PNG ni fijar una tolerancia normativa a partir de este ensayo. Composición, fuente, textos y recursos se comparan explícitamente.'};
await open('referencia-final-14.html','opt=0&mode=data');report.off=await measured();
report.checks={...report.checks,
 ordered:Object.values(report.modes).every(({after:a})=>a.boxes['score-summary'].bottom<=a.boxes.summary.y&&a.boxes.summary.bottom<=a.boxes['mesa-zone'].y&&a.boxes['mesa-zone'].bottom<=a.boxes['hand-zone'].y),
 noScoresInsideTurn:Object.values(report.modes).every(({after:a})=>!a.summaryText.includes('A·2 10')&&a.scores.includes('A·2 10')),
 noInterleavedBlocks:Object.values(report.modes).every(({after:a})=>!a.boxes['people-panel'].visible&&!a.boxes['indicator-zone'].visible),
 cardGeometryUnchanged:Object.values(report.modes).every(({before:b,after:a})=>b.card.width===a.card.width&&b.card.height===a.card.height&&b.style.nameSize===a.style.nameSize&&b.style.valueSize===a.style.valueSize&&b.style.valueFamily===a.style.valueFamily&&b.style.picture.width===a.style.picture.width&&b.style.picture.height===a.style.picture.height),
 turnComplete:Object.values(report.modes).every(({after:a})=>['Dist','Turno:','00:24','ALTO','BAJO','Indicadora: Bennu','R6','Mazo: 12'].every((t)=>a.summaryText.includes(t))),
 focusTransition:report.focusWide.id==='p2'&&report.focusWide.parent==='people-inline'&&report.focusNarrow.id==='p2'&&report.focusNarrow.parent==='score-summary',
 detailsStillData:report.detailsValues.join('|')==='34.52 km/s|198.08 MKm|0.33 km',
 normalOnOffEqual:JSON.stringify(report.wide[0].boxes)===JSON.stringify(report.wide[1].boxes)&&JSON.stringify(report.wide[0].style)===JSON.stringify(report.wide[1].style)&&report.wide[0].summaryText===report.wide[1].summaryText&&JSON.stringify(report.wide[0].images)===JSON.stringify(report.wide[1].images)&&outsideImages===0,
 scoresCanScrollAway:Object.values(report.modes).every((m)=>m.scrollToSummary.scoreBottom<=0),
 offStillNormal:!report.off.state.compact&&report.off.boxes['people-panel'].visible&&report.off.boxes['indicator-zone'].visible,
 previousReferencesUnchanged:previous.every((p)=>hash(read(p))===oldHashes[p]),noJsErrors:errors.length===0};
await browser.close();fs.writeFileSync(path.join(folder,'medidas-referencia-final-14.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({checks:report.checks,modes:Object.fromEntries(Object.entries(report.modes).map(([k,v])=>[k,{summary:v.after.boxes.summary,scores:v.after.boxes['score-summary'],mesa:v.after.boxes['mesa-zone'],hand:v.after.boxes['hand-zone'],card:v.after.card,scroll:v.scrollToSummary}])),errors}));
if(Object.values(report.checks).some((v)=>!v))process.exitCode=1;
