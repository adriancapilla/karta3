import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const folder=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(folder,'../../..');
const require=createRequire(path.join(root,'package.json'));
const {chromium}=require('@playwright/test');
const protectedPaths=['src/GameCard.tsx','src/GameScreen.tsx','src/style.css','shared/contracts/game.ts','shared/contracts/room.ts','barajas/sistema-solar/baraja.json','barajas/sistema-solar/cartas.json','barajas/generica/baraja.json','barajas/generica/cartas.json'];
const hash=(p)=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const before=Object.fromEntries(protectedPaths.map((p)=>[p,hash(p)]));
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const chars=(s)=>[...new Intl.Segmenter('es',{granularity:'grapheme'}).segment(s)].length;
/* Propuestas SOLO para el documento/maqueta. No cambia paquetes o presentación de producto. */
function fitNumber(value,unit,maxDecimals){
  const room=10-(unit?chars(unit)+1:0);
  for(let decimals=Math.min(maxDecimals,8);decimals>=0;decimals--){
    const [whole,fraction='']=String(value).split('.');
    let scaled=BigInt(whole+fraction.slice(0,decimals).padEnd(decimals,'0'));
    if(Number(fraction[decimals]??'0')>=5)scaled++;
    const digits=String(scaled).padStart(decimals+1,'0');
    let candidate=decimals?digits.slice(0,-decimals)+'.'+digits.slice(-decimals):digits;
    if(candidate.includes('.'))candidate=candidate.replace(/0+$/,'').replace(/\.$/,'');
    if(chars(candidate)<=room)return candidate;
  }
  return String(value);
}
function millions(value){
 const [whole,fraction='']=value.split('.'),scale=fraction.length+6;
 const digits=(whole+fraction).padStart(scale+1,'0');
 return (digits.slice(0,-scale).replace(/^0+(?=\d)/,'')+'.'+digits.slice(-scale)).replace(/0+$/,'').replace(/\.$/,'');
}
const samples={};
for(const [key,id] of [['solar','sistema-solar'],['generic','generica']]){
  const meta=read(`barajas/${id}/baraja.json`),collection=read(`barajas/${id}/cartas.json`);
  samples[key]={name:meta.name,cards:collection.cards.map((card)=>{
    const attributes=meta.attributes.map((a)=>({full:a.name,label:a.name}));
    const current={attributes,values:meta.attributes.map((a)=>({display:card.values[a.id].displayValue,unit:card.values[a.id].unit,play:card.values[a.id].playValue}))};
    const proposal=structuredClone(current);
    if(key==='solar'){
      proposal.attributes[0].label='Vel';proposal.attributes[1].label='Dist';
      proposal.values=proposal.values.map((value,i)=>{
        if(i===1)return {...value,display:fitNumber(millions(value.display),'MKm',6),unit:'MKm'};
        const decimalCount=value.display.includes('.')?value.display.split('.')[1].length:0;
        return {...value,display:fitNumber(value.display,value.unit,decimalCount)};
      });
    }else proposal.attributes[1].label='Triáng.';
    return {id:card.id,name:card.name,characteristic:card.characteristic,note:card.note,imageAlt:card.imageAlt,image:card.imageRef?`../../../barajas/${id}/${card.imageRef}`:null,indicator:meta.attributes.findIndex((a)=>a.id===card.roundAttribute),current,proposal};
  })};
  if(key==='solar'){
    samples[key].indicator='sedna';samples[key].hand=['itokawa','fobos','hyakutake'];
    samples[key].mesa=['encke','borrelly','hyakutake','sedna','itokawa'].sort((a,b)=>samples[key].cards.find((c)=>c.id===b).current.values[2].play-samples[key].cards.find((c)=>c.id===a).current.values[2].play);
  }else{
    samples[key].indicator='carta-001';samples[key].hand=['carta-002','carta-003','carta-004'];
    samples[key].mesa=['carta-005','carta-006','carta-007','carta-008','carta-009'].sort((a,b)=>samples[key].cards.find((c)=>c.id===b).current.values[2].play-samples[key].cards.find((c)=>c.id===a).current.values[2].play);
  }
}
function example(id,name,labels,values,note){
 const content={attributes:labels.map((label)=>({label,full:label})),values:values.map(([display,unit],i)=>({display,unit,play:i+1}))};
 return {id,name,characteristic:'Ejemplo ficticio, no pertenece a una baraja oficial',note,image:null,imageAlt:'',indicator:0,current:content,proposal:structuredClone(content)};
}
samples.examples=[
 example('ejemplo-tiempo','Hito de ejemplo',['Fecha','Época','Estado'],[['13/10/2026',''],['2.5','eones'],['Indefinido','']],'Fecha, duración y texto ficticios para explorar campos. La notación temporal depende de la temática; no prescribe un formato universal.'),
 example('ejemplo-ancho','Contraste de anchura',['WWWWWWWW','Cantidad','Texto'],[['WWWWWWWWWW',''],['999999','MKm'],['iiiiiiiiii','']],'Cadenas artificiales de ancho: diez caracteres no garantizan el mismo espacio. La primera etiqueta tiene ocho letras más símbolo.'),
 example('ejemplo-nombre','Nombre de carta extenso para explorar la cabecera',['Nombre','Origen','Tipo'],[['Desconoc.',''],['1492',''],['Sin datos','']],'Nombre y nota largos ficticios. El diálogo admite contenido íntegro y desplazamiento, sin ocultar el cierre.')
];
samples.examples.push(samples.solar.cards.find((c)=>c.id==='67p-churyumov-gerasimenko'));
fs.writeFileSync(path.join(folder,'muestras.js'),`window.SAMPLES=${JSON.stringify(samples)};\n`);
fs.writeFileSync(path.join(folder,'alternativas-editoriales.json'),JSON.stringify({status:'PROPUESTAS DE MAQUETA, NO PAQUETE NI CONTENIDO APROBADO',sourceVersion:2,cards:samples.solar.cards.map((c)=>({id:c.id,name:c.name,current:c.current,proposal:c.proposal})),genericAlias:'Triáng. es propuesta pendiente, no nombre aprobado'},null,2)+'\n');
fs.mkdirSync(path.join(folder,'capturas'),{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome',args:['--disable-smooth-scrolling']});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
const errors=[];page.on('pageerror',(e)=>errors.push(String(e)));
await page.goto(pathToFileURL(path.join(folder,'maqueta.html')).href);
await page.evaluate(()=>document.fonts.ready);
const report={status:'MEDIDAS Y RECORRIDOS DE MAQUETA AISLADA; NO PRUEBAS DE PRODUCTO',date:'2026-10-13',environment:{browser:browser.version(),scale:1,viewports:[[1920,1080],[390,844],[360,800]],node:process.version},protectedBefore:before,profiles:{},captures:[],interaction:{},editorialSummary:{},fieldInventory:{}};
const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
const {root:dom}=await cdp.send('DOM.getDocument');
const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:dom.nodeId,selector:'.value'});
report.environment.platformFonts=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;
async function settings({mode='data',deck='solar',content='proposal',optimized=false,width=1920,height=1080}={}){
 await page.setViewportSize({width,height});
 await page.evaluate((state)=>{
  document.getElementById('deck').value=state.deck;document.getElementById('mode').value=state.mode;
  document.getElementById('content').value=state.content;document.getElementById('optimize').checked=state.optimized;window.mock.render();
 },{mode,deck,content,optimized});
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map((img)=>img.decode().catch(()=>{})));await new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(r)));window.mock.inspect();});
}
async function measure(name){
 report.profiles[name]=await page.evaluate(()=>{
  const count=(s)=>[...new Intl.Segmenter('es',{granularity:'grapheme'}).segment(s)].length;
  const rect=(e)=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
  const attr=document.querySelector('#hand .attribute'),value=document.querySelector('#hand .value');
  const attrStyle=getComputedStyle(attr),valueStyle=getComputedStyle(value);
  const usable=(e)=>{const cell=e.closest('td,th'),s=getComputedStyle(cell);return cell.getBoundingClientRect().width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight);};
  const attrHtml=attr.innerHTML,valueText=value.textContent;
  const title=document.querySelector('#hand .heading h3'),titleText=title.textContent;
  const measure=(e,s)=>{e.textContent=s;return e.getBoundingClientRect().width;};
  const measureAttribute=(symbol,label)=>{attr.textContent=symbol+' '+label;const mark=document.createElement('span');mark.className='active-mark';mark.textContent='◆';attr.appendChild(mark);return attr.getBoundingClientRect().width;};
  const rows=[];
  for(const [deck,data]of Object.entries(SAMPLES)){
   if(!data.cards)continue;
   for(const card of data.cards)for(const variant of ['current','proposal'])for(let i=0;i<3;i++){
    const a=card[variant].attributes[i],v=card[variant].values[i];
    const text=v.display+(v.unit?' '+v.unit:'');
    const width=measure(value,text),attributeWidth=measureAttribute(['●','▲','■'][i],a.label);
    rows.push({deck,id:card.id,variant,attribute:a.label,attributeChars:count(a.label),text,chars:count(text),width,available:usable(value),fits:width<=usable(value)+.5,attributeWidth,attributeAvailable:usable(attr),attributeFits:attributeWidth<=usable(attr)+.5});
   }
  }
  const probes=['58','1','12.34 km/s','81339 MKm','13/10/2026','999999 MKm','WWWWWWWWWW','iiiiiiiiii','1492','2.5 eones'].map((text)=>({text,chars:count(text),width:measure(value,text),available:usable(value)}));
  const attributeProbes=['Velocidad','Distancia','Triángulo','Cuadrado','Diámetro','Triáng.','WWWWWWWW'].map((text)=>({text,chars:count(text),width:measureAttribute('■',text),available:usable(attr)}));
  attr.innerHTML=attrHtml;value.textContent=valueText;
  const nameProbes=SAMPLES.solar.cards.map((c)=>{title.textContent=c.name;return {text:c.name,chars:count(c.name),title:rect(title),card:rect(title.closest('.paper')),contentHeight:title.closest('.paper').scrollHeight,clientHeight:title.closest('.paper').clientHeight};});title.textContent=titleText;
  return {card:rect(document.querySelector('#hand .paper')),slot:rect(document.querySelector('#hand .slot')),valueFont:{family:valueStyle.fontFamily,size:valueStyle.fontSize,weight:valueStyle.fontWeight},attributeFont:{family:attrStyle.fontFamily,size:attrStyle.fontSize,weight:attrStyle.fontWeight},columnSpace:{attribute:usable(attr),value:usable(value)},probes,attributeProbes,nameProbes,rows,images:[...document.querySelectorAll('#sample img')].map((e)=>({loaded:e.complete&&e.naturalWidth>0,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),globalOverflow:document.documentElement.scrollWidth>innerWidth,visibleIssues:[...document.querySelectorAll('#sample .field-overflow')].map((e)=>e.textContent)};
 });
}
async function capture(name,locator){
 await page.locator(locator).screenshot({path:path.join(folder,'capturas',name+'.png')});report.captures.push(name+'.png');
}
await settings();await measure('pc-paper');await capture('pc-dato','#sample');
await settings({mode:'play'});await capture('pc-1-58','#sample');
await settings({mode:'data',content:'current'});await capture('pc-actual-sin-adaptar','#sample');
await settings({width:390,height:844,mode:'data'});await measure('mobile-paper-390');await capture('movil-carta-dato','#hand');
await settings({width:390,height:844,mode:'play'});await capture('movil-carta-1-58','#hand');
await settings({width:390,height:844,mode:'data',optimized:true});await measure('mobile-optimized-390');await capture('movil-optimizada-dato','#hand .slot:first-child');await capture('movil-optimizada-mano-dato','#hand');
await settings({width:390,height:844,mode:'play',optimized:true});await capture('movil-optimizada-1-58','#hand .slot:first-child');
await settings({width:360,height:800,mode:'data',optimized:true});await measure('mobile-optimized-360');
await settings({width:360,height:800,mode:'data'});await measure('mobile-paper-360');
await settings({deck:'generic',mode:'data'});await capture('generica-dato','#sample');
await settings({mode:'data'});await capture('revision-cinco-primeras-cuatro','.review-area');
await page.locator('#mesa').evaluate((e)=>{e.scrollLeft=e.scrollWidth;});
await page.waitForFunction(()=>{const e=document.getElementById('mesa');return Math.abs(e.scrollLeft-(e.scrollWidth-e.clientWidth))<1;});
await capture('revision-quinta-accesible','#mesa');
report.interaction.fifth=await page.locator('#mesa').evaluate((e)=>{const a=e.getBoundingClientRect(),b=e.lastElementChild.getBoundingClientRect();return {allCards:e.children.length,scrollLeft:e.scrollLeft,lastCardFullyVisible:b.left>=a.left&&b.right<=a.right};});
await page.locator('#hand .slot').nth(2).locator('.details-button').click();
await capture('detalles-pc','#details');
report.interaction.detailsPC=await page.locator('#details').evaluate((e)=>({width:e.getBoundingClientRect().width,containsJ:!!e.querySelector('[aria-label="J: valor jugable"]')||[...e.querySelectorAll('th')].some((t)=>t.textContent==='Jugable'||t.textContent==='J'),dataCells:[...e.querySelectorAll('.value')].map((c)=>c.textContent),scroll:e.scrollHeight>e.clientHeight}));
await page.locator('#close-details').press('Enter');
report.interaction.focusReturned=await page.evaluate(()=>document.activeElement===document.querySelectorAll('#hand .details-button')[2]);
report.interaction.detailsDidNotPlay=await page.evaluate(()=>window.mock.getActions().plays===0);
await settings({width:390,height:844,mode:'play',optimized:true});
await page.locator('#hand .slot').nth(2).locator('.details-button').click();await capture('detalles-movil','#details');
report.interaction.detailsMobile=await page.locator('#details').evaluate((e)=>({width:e.getBoundingClientRect().width,dataCells:[...e.querySelectorAll('.value')].map((c)=>c.textContent),hasPlayValueHeader:[...e.querySelectorAll('th')].some((t)=>t.textContent==='J'||t.textContent==='1-58'||t.textContent==='Jugable')}));
await page.keyboard.press('Escape');
report.interaction.actionsBeforeKeyboard=await page.evaluate(()=>window.mock.getActions());
await page.locator('#hand .play-button').first().press('Enter');
await page.evaluate(()=>new Promise((r)=>requestAnimationFrame(r)));
report.interaction.actionsAfterKeyboard=await page.evaluate(()=>window.mock.getActions());
report.interaction.keyboardSingleSelection=await page.evaluate(()=>window.mock.getActions().plays===1);
await settings({width:390,height:844,mode:'data'});
const cardBox=await page.locator('#hand .paper').first().boundingBox();
await page.mouse.move(cardBox.x+150,cardBox.y+35);await page.mouse.down();await page.mouse.move(cardBox.x+75,cardBox.y+35,{steps:5});await page.mouse.up();
report.interaction.pointerMovementDidNotPlay=await page.evaluate(()=>window.mock.getActions().plays===0);
await settings({mode:'data'});await capture('fechas-textos-contraste','#examples');
await capture('nombre-actual-extenso','#examples .slot:last-child');
for(const [deck,data]of Object.entries(samples)){
 if(!data.cards)continue;
 const max=(fn)=>data.cards.reduce((best,c)=>{const text=fn(c);return chars(text)>best.chars?{id:c.id,text,chars:chars(text)}:best;},{chars:0});
 report.fieldInventory[deck]={name:max((c)=>c.name),characteristic:max((c)=>c.characteristic),note:max((c)=>c.note),imageAlt:max((c)=>c.imageAlt),attributeNames:data.cards[0].current.attributes.map((a)=>({text:a.full,chars:chars(a.full)}))};
 const meta=read(`barajas/${deck==='solar'?'sistema-solar':'generica'}/baraja.json`);
 report.fieldInventory[deck].metadata=Object.fromEntries(['name','subtitle','description','notes','instructions'].map((field)=>[field,{chars:chars(meta[field])}]));
 const pairs=data.cards.flatMap((c)=>c.proposal.values.map((v,i)=>({id:c.id,attribute:i,current:c.current.values[i].display+(c.current.values[i].unit?' '+c.current.values[i].unit:''),proposal:v.display+(v.unit?' '+v.unit:'')})));
 report.editorialSummary[deck]={overTenCurrent:pairs.filter((p)=>chars(p.current)>10).length,overTenProposal:pairs.filter((p)=>chars(p.proposal)>10).length,changed:pairs.filter((p)=>p.current!==p.proposal).length,cards:data.cards.length};
}
report.protectedAfter=Object.fromEntries(protectedPaths.map((p)=>[p,hash(p)]));
report.protectedUnchanged=protectedPaths.every((p)=>before[p]===report.protectedAfter[p]);report.pageErrors=errors;
await browser.close();
fs.writeFileSync(path.join(folder,'medidas.json'),JSON.stringify(report,null,2)+'\n');
const summaries=Object.fromEntries(Object.entries(report.profiles).map(([name,p])=>[name,{card:p.card,columnSpace:p.columnSpace,valueFont:p.valueFont,proposalValueOverflows:p.rows.filter((r)=>r.variant==='proposal'&&!r.fits).length,proposalAttributeOverflows:p.rows.filter((r)=>r.variant==='proposal'&&!r.attributeFits).length,globalOverflow:p.globalOverflow,probes:p.probes}]));
console.log(JSON.stringify({summaries,editorialSummary:report.editorialSummary,fieldInventory:report.fieldInventory,interaction:report.interaction,platformFonts:report.environment.platformFonts,protectedUnchanged:report.protectedUnchanged,pageErrors:errors}));
if(errors.length||!report.protectedUnchanged)process.exitCode=1;
