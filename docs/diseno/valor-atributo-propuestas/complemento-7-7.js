/* Maqueta offline: fixtures de diseño. No Game, red, validación o envío de producto. */
const q=new URLSearchParams(location.search),$=(id)=>document.getElementById(id);
const mode=q.get('mode')==='data'?'data':'play',optimize=q.get('opt')==='1';
const observer=q.get('role')==='observer',guest=q.get('role')==='guest',automatic=q.get('auto')==='1',disconnected=q.get('disconnected')==='1';
const opening=q.get('opening')==='1',review=q.get('review')==='1',stress=q.get('stress')==='1';
const deck=q.get('deck')==='generic'?'generic':'solar',collection=SAMPLES[deck];
const esc=(s)=>String(s).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const symbols=['●','▲','■'];
const CANDIDATE=1368; // Útiles del contenedor; aprobado por el autor el 13/10/2026.
const actions={plays:0,directions:0,details:0,cancels:0};let direction=opening?null:'HIGH',selected=null;
const members=[
 {id:'p1',name:'Alex',position:1,kind:'BOT',difficulty:'Fácil',role:'GUEST',points:5},
 {id:'p2',name:'Ana',position:2,kind:'HUMAN',role:'GUEST',points:10,presence:'Sin conexión'},
 {id:'p3',name:'Alex',position:3,kind:'BOT',difficulty:'Difícil',role:'GUEST',points:0},
 {id:'p4',name:'Alicia',position:4,kind:'HUMAN',role:'GUEST',points:5,automatic:true},
 {id:'p5',name:'Ana',position:5,kind:'HUMAN',role:guest||observer?'GUEST':'HOST',points:5,self:!observer,automatic, presence:disconnected?'Sin conexión':'Conectado'},
 ...(observer?[{id:'o1',name:'Ana',kind:'HUMAN',role:'HOST',observer:true,self:true,presence:disconnected?'Sin conexión':'Conectado'}]:[])
];
const initial=(m)=>[...new Intl.Segmenter('es',{granularity:'grapheme'}).segment(m.name)][0].segment;
for(const m of members){const same=members.filter((other)=>initial(other)===initial(m)).length>1;m.label=initial(m)+(same?'·'+(m.observer?'O':m.position):'');}
const openerId=opening?'p5':'p2',activeId=automatic||observer?'p1':'p5';
const person=(id)=>members.find((m)=>m.id===id);
function identity(m){return `${m.name} (${m.observer?'O':m.position})${m.self?' · tú':''} · ${m.role}${m.observer?' · Observador':` · ${m.points} puntos`}${m.kind==='BOT'?` · BOT ${m.difficulty}`:''}${m.id===openerId?' · Abridor':''}${!review&&m.id===activeId?' · Juega':''}${m.automatic?' · Automático':''}${m.kind==='HUMAN'&&m.presence?' · '+m.presence:''}`;}
const hand=collection.hand.map((id)=>collection.cards.find((c)=>c.id===id));
let publicCards=(deck==='solar'?['sedna','borrelly','encke','67p-churyumov-gerasimenko']:collection.mesa.slice(0,4)).map((id,i)=>({card:collection.cards.find((c)=>c.id===id),member:members[i]}));
const excluded=new Set([...hand,...publicCards.map((p)=>p.card)].map((c)=>c.id));
const indicator=collection.cards.find((c)=>c.indicator===1&&!excluded.has(c.id));
if(review)publicCards.push({card:hand[0],member:members[4]});
publicCards.sort((a,b)=>b.card.current.values[1].play-a.card.current.values[1].play); // fixture ALTO; no resultado real
const lookup=new Map(collection.cards.map((c)=>[c.id,c]));
if(stress){const artificial=structuredClone(SAMPLES.examples.find((c)=>c.id==='ejemplo-ancho'));lookup.set(artificial.id,artificial);hand[0]=artificial;publicCards[0].card=artificial;}
function variant(card){const v=structuredClone(card.proposal);if(deck==='generic'&&collection.cards.some((c)=>c.id===card.id))v.attributes=card.current.attributes;return v;}
function attributeName(card,i){return variant(card).attributes[i].label;}
const neutral='<svg viewBox="0 0 80 70" aria-hidden="true"><rect x="17" y="5" width="46" height="60" rx="7" fill="none" stroke="currentColor" stroke-width="3"/><path d="M40 18 52 35 40 52 28 35Z" fill="currentColor"/></svg>';
function picture(card){return `<div class="picture">${card.image?`<img src="${esc(card.image)}" alt="${esc(card.imageAlt)}">`:neutral}</div>`;}
function table(card,details=false){const v=variant(card);return `<table class="values"><tbody>${v.attributes.map((a,i)=>{const value=v.values[i],text=details||mode==='data'?value.display+(value.unit?' '+value.unit:''):String(value.play);return `<tr class="${i===1?'active':''}"><th scope="row"><span class="attribute" aria-label="${esc(a.label)}${i===1?', atributo activo':''}">${symbols[i]} ${esc(a.label)}${i===1?'<span class="active-mark" aria-hidden="true">◆</span>':''}</span></th><td><span class="value">${esc(text)}</span></td></tr>`;}).join('')}</tbody></table>`;}
function cardMarkup(card,inHand=false,member=null){return `<div class="slot" data-card="${esc(card.id)}"><article class="paper"><div class="card-head"><h3>${esc(card.name)}</h3><span class="own-icon" role="img" aria-label="Atributo indicador: ${esc(attributeName(card,card.indicator))}">${symbols[card.indicator]}</span>${picture(card)}</div>${table(card)}<button type="button" class="details-button" data-detail="${esc(card.id)}">Detalles</button></article>${inHand?`<button type="button" class="play-button" data-play="${esc(card.id)}" ${review||automatic||disconnected||observer?'disabled':''}>Jugar carta</button>`:''}${member?`<button type="button" class="author" data-person="${member.id}" aria-label="Jugada de ${esc(identity(member))}">${member.label}</button>`:''}</div>`;}
// La imagen usa el mismo nodo al cambiar presentación: foco, diálogos y contexto permanecen.
$('deck-heading').textContent=`${COMPLEMENT_METADATA[deck].name} · R6 · Mazo: 12 · contenido editorial propuesto en maqueta · ${mode==='data'?'Dato':'1-58'}`;
$('cancel').hidden=guest;$('cancel').disabled=disconnected;
const noticeTexts=[];
if(q.get('warn')==='1'&&!automatic)noticeTexts.push('No completaste tu último turno a tiempo. Si vuelve a ocurrir sin una jugada manual entre medias, pasarás a automático');
if(automatic)noticeTexts.push('Has pasado a automático. Puedes seguir viendo la partida, pero ya no jugar manualmente');
if(disconnected)noticeTexts.push('Conexión interrumpida. Intentando recuperarla…');
if(q.get('phase')==='final')noticeTexts.push('Fase final · ronda 2 de 3 · sin reposición');
if(q.get('phase')==='tie')noticeTexts.push('Desempate · una única ronda sin puntos nuevos');
$('notices').innerHTML=noticeTexts.map((text)=>`<p class="notice ${text.startsWith('Conexión')?'connection':''}" role="status">${esc(text)}</p>`).join('');
$('summary').innerHTML=`<div class="summary-row"><span class="active-summary">${symbols[1]} ${esc(attributeName(indicator,1))}</span><span class="turn-summary">${review?'Revisión · 00:03':`Turno: ${person(activeId).label} · 00:24`}</span></div><div class="summary-row"><button type="button" class="indicator-link" data-open="indicator">Indicadora: ${esc(indicator.name)}</button><div class="direction" aria-label="Dirección"><button type="button" data-direction="HIGH" aria-pressed="${direction==='HIGH'}" ${opening&&!review&&!automatic&&!disconnected&&!observer?'':'disabled'}>ALTO</button><button type="button" data-direction="LOW" aria-pressed="${direction==='LOW'}" ${opening&&!review&&!automatic&&!disconnected&&!observer?'':'disabled'}>BAJO</button></div></div><div class="summary-row"><div class="scores" aria-label="Identidades y puntuaciones">${members.map((m)=>`<button type="button" data-person="${m.id}" class="${m.id===openerId?'opener':''}" aria-label="${esc(identity(m))}">${m.label}${m.observer?'':' '+m.points}</button>`).join('')}</div><span class="round-pile">R6 · Mazo: 12</span></div>`;
$('people-inline').innerHTML=members.map((m)=>`<button type="button" data-person="${m.id}" class="${m.id===openerId?'opener':''}">${esc(identity(m))}</button>`).join('');
$('summary').insertAdjacentHTML('beforeend',`<p class="summary-opener">Abridor: ${esc(person(openerId).name)} (${person(openerId).position})</p>`);
$('mesa').innerHTML=publicCards.map((p)=>cardMarkup(p.card,false,p.member)).join('');$('mesa-count').textContent=`${publicCards.length} cartas · desliza ↔`;
$('hand').innerHTML=observer?'':(review?hand.slice(1):hand).map((c)=>cardMarkup(c,true)).join('');$('hand-zone').hidden=observer;
if(review)$('hand-title').lastElementChild.textContent='2 cartas · desliza ↔';
$('indicator-card').innerHTML=cardMarkup(indicator);
$('turn-description').textContent=`${review?'Revisión':`Juega: ${identity(person(activeId))}`}`;
if(review)$('turn-panel').querySelector('strong').textContent='00:03';
$('opener-description').textContent=`Abridor: ${person(openerId).name} (${person(openerId).position})`;$('active-description').textContent=`Atributo activo: ${attributeName(indicator,1)}`;
if(review||observer){$('review-note').hidden=false;$('review-note').textContent=observer?'Observando':`Revisión de ejemplo: ${publicCards[0].member.label} · +5 puntos · siguiente abridor ${publicCards[1].member.label}`;}
$('prototype-note').textContent=`Maqueta §7.7 · Optimizar para móvil ${optimize?'Sí':'No'} · umbral aprobado: ${CANDIDATE} px útiles. Contenido editorial no publicado.`;
const triggers=new WeakMap();
function show(dialog,trigger){triggers.set(dialog,trigger);dialog.showModal();(dialog.id==='cancel-dialog'?$('continue'):dialog.querySelector('[data-close]')).focus();}
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>{const trigger=triggers.get(dialog);if(!trigger?.isConnected)return;if(trigger.getClientRects().length)trigger.focus();else if(trigger.dataset.person)document.querySelector(`#summary [data-person="${trigger.dataset.person}"]`)?.focus();else if(trigger.closest('#indicator-zone'))document.querySelector('[data-open=indicator]')?.focus();});
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('keydown',(e)=>{if(e.key!=='Tab'||e.target.closest('dialog')!==dialog)return;const stops=[...dialog.querySelectorAll('button:not(:disabled),[tabindex="0"]')].filter((el)=>el.getClientRects().length);if((!e.shiftKey&&document.activeElement===stops.at(-1))||(e.shiftKey&&document.activeElement===stops[0])){e.preventDefault();(e.shiftKey?stops.at(-1):stops[0]).focus();}});
function openInfo(trigger){const meta=COMPLEMENT_METADATA[deck];$('info-content').innerHTML=`<p class="fixture-note">Fixture de la versión editorial propuesta, no aprobada para publicación. Fuente histórica: formato ${meta.schemaVersion}, contenido ${meta.contentVersion}. El producto deberá proyectar la versión seleccionada exacta.</p><h3>${esc(meta.name)}</h3><p>${esc(meta.description)}</p><h3>Instrucciones y significado</h3><p>${esc(meta.proposedInstructions)}</p><h3>Notas y procedencia</h3><p>${esc(meta.notes)}</p>`;show($('info-dialog'),trigger);}
function openDetails(id,trigger){const card=lookup.get(id);actions.details++;$('details-content').innerHTML=`<h2 id="details-title">${esc(card.name)}</h2><p class="fixture-note">Contenido editorial propuesto · mismos nombres y datos que la carta · sin J</p>${picture(card)}${table(card,true)}${card.characteristic?`<p>${esc(card.characteristic)}</p>`:''}${card.note?`<p>${esc(card.note)}</p>`:''}`;show($('details-dialog'),trigger);}
let pointer=null;
document.addEventListener('pointerdown',(e)=>{pointer={x:e.clientX,y:e.clientY,drag:false};});
document.addEventListener('pointermove',(e)=>{if(pointer&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>6)pointer.drag=true;});
document.addEventListener('pointercancel',()=>{if(pointer)pointer.drag=true;});
document.addEventListener('click',(e)=>{
 if(pointer?.drag&&e.detail!==0)return;
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.hasAttribute('data-close')){b.closest('dialog').close();return;}
 if(b.id==='cancel'){show($('cancel-dialog'),b);return;}
 if(b.id==='confirm-cancel'){actions.cancels++;b.disabled=true;$('cancel-status').textContent='Cancelando… (simulación sin envío ni resultado real)';return;}
 if(b.dataset.open==='info'){openInfo(b);return;}
 if(b.dataset.open==='indicator'){$('indicator-content').innerHTML=cardMarkup(indicator);show($('indicator-dialog'),b);return;}
 if(b.dataset.person){$('people-content').innerHTML=members.map((m)=>`<p class="person" data-identity="${m.id}"><strong>${esc(m.label)} · ${esc(m.name)} (${m.observer?'O':m.position})</strong><br>${esc(identity(m))}</p>`).join('');show($('people-dialog'),b);return;}
 if(b.dataset.detail){openDetails(b.dataset.detail,b);return;}
 if(b.dataset.direction){direction=b.dataset.direction;actions.directions++;document.querySelectorAll('[data-direction]').forEach((el)=>el.setAttribute('aria-pressed',String(el.dataset.direction===direction)));return;}
 if(b.dataset.play){selected=b.dataset.play;actions.plays++;$('demo-status').textContent=`Selección ficticia: ${lookup.get(selected).name} · sin envío`;}
});
for(const rail of document.querySelectorAll('.rail'))rail.addEventListener('keydown',(e)=>{if(e.target!==rail)return;const step=rail.querySelector('.slot').getBoundingClientRect().width+parseFloat(getComputedStyle(rail).gap);if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();rail.scrollLeft=e.key==='End'?rail.scrollWidth:e.key==='Home'?0:rail.scrollLeft+(e.key==='ArrowRight'?step:-step);}});
let useful=0;
new ResizeObserver(([entry])=>{useful=entry.contentRect.width;const focus=document.activeElement;$('work').style.setProperty('--compact-slot',Math.min(220,Math.max(1,useful-6))+'px');$('work').classList.toggle('compact',optimize&&useful<CANDIDATE);$('work').classList.toggle('normal',!optimize||useful>=CANDIDATE);$('work').dataset.space=useful<CANDIDATE?'limited':'wide';if(focus?.closest('#people-panel')&&$('work').classList.contains('compact'))document.querySelector(`#summary [data-person="${focus.dataset.person}"]`)?.focus();if(focus?.closest('#summary .scores')&&$('work').classList.contains('normal'))document.querySelector(`#people-inline [data-person="${focus.dataset.person}"]`)?.focus();if(focus?.closest('#indicator-zone')&&$('work').classList.contains('compact'))document.querySelector('[data-open=indicator]')?.focus();}).observe($('work'));
window.complementMock={actions,get state(){return {mode,optimize,useful,candidate:CANDIDATE,compact:$('work').classList.contains('compact'),direction,selected,indicator:indicator.id,members:members.map((m)=>({id:m.id,label:m.label,name:m.name,position:m.position,observer:!!m.observer}))};}};
