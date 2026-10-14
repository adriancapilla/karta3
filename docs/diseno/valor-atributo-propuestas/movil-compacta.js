/* Maqueta sin red ni reglas ejecutadas: datos fuente y propuestas editoriales locales. */
const query=new URLSearchParams(location.search);
const mode=query.get('mode')==='data'?'data':'play';
const review=query.get('review')==='1',opening=query.get('opening')==='1';
const observer=query.get('observer')==='1',useLongName=query.get('long')==='1';
const deck=query.get('deck')==='generic'?'generic':'solar';
const collection=SAMPLES[deck];
const $=(id)=>document.getElementById(id);
const escapeHtml=(value)=>String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const symbols=['●','▲','■'];
const members=[{initial:'M',name:'Marcos',points:5},{initial:'P',name:'Paula',points:10},{initial:'A',name:'Adrián',points:0},{initial:'N',name:'Nora',points:5},{initial:'L',name:observer?'Lucía':'Lucía (tú)',points:5}];
const hand=collection.hand.map((id)=>collection.cards.find((c)=>c.id===id));
let publicCards=deck==='solar'?['sedna','borrelly','encke',useLongName?'67p-churyumov-gerasimenko':'ryugu'].map((id,i)=>({card:collection.cards.find((c)=>c.id===id),member:members[i]})):collection.mesa.slice(0,4).map((id,i)=>({card:collection.cards.find((c)=>c.id===id),member:members[i]}));
const excluded=new Set([...hand,...publicCards.map((p)=>p.card)].map((c)=>c.id));
const indicator=collection.cards.find((c)=>c.indicator===1&&!excluded.has(c.id));
if(!indicator)throw new Error('La muestra no tiene indicadora distinta con atributo 2');
if(review)publicCards.push({card:hand[0],member:members[4]});
publicCards.sort((a,b)=>b.card.current.values[1].play-a.card.current.values[1].play);
if(review)members.find((m)=>m.initial===publicCards[0].member.initial).points+=5;
const actions={plays:0,details:0,directions:0};let previousFocus=null,pointer=null;
const neutral='<svg viewBox="0 0 80 70" aria-hidden="true"><rect x="17" y="5" width="46" height="60" rx="7" fill="none" stroke="currentColor" stroke-width="3"/><path d="M40 18 52 35 40 52 28 35Z" fill="currentColor"/></svg>';
function picture(card,full=false){return `<div class="${full?'image':'thumbnail'}">${card.image?`<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.imageAlt)}">`:neutral}</div>`;}
function table(card,details=false){
 const variant=card.proposal;
 return `<table class="values"><tbody>${variant.attributes.map((attribute,i)=>{
  const value=variant.values[i],text=details||mode==='data'?value.display+(value.unit?' '+value.unit:''):String(value.play);
  return `<tr class="${i===1?'active':''}"><th scope="row"><span class="attribute" aria-label="${escapeHtml(attribute.full)}${i===1?', atributo activo':''}">${symbols[i]} ${escapeHtml(details?attribute.full:attribute.label)}${i===1?'<span class="active-mark" aria-hidden="true">◆</span>':''}</span></th><td><span class="value">${escapeHtml(text)}</span></td></tr>`;
 }).join('')}</tbody></table>`;
}
function renderCard(card,inHand=false,member=null){
 return `<div class="slot" data-card="${card.id}"><article class="small-card"><div class="card-head">${picture(card)}<h3>${escapeHtml(card.name)}</h3><span class="own-icon" role="img" aria-label="Atributo indicador: ${escapeHtml(card.proposal.attributes[card.indicator].full)}">${symbols[card.indicator]}</span></div>${table(card)}<button class="details-button" type="button" data-detail="${card.id}">Detalles</button></article>${inHand?`<button class="play-button" type="button" data-play="${card.id}" ${review?'disabled':''}>Jugar carta</button>`:''}${member?`<p class="author" aria-label="Jugada de ${escapeHtml(member.name)}" title="${escapeHtml(member.name)}">${member.initial}</p>`:''}</div>`;
}
const active=indicator.proposal.attributes[1];
$('summary').innerHTML=`<div class="summary-row"><span class="active-summary" aria-label="Atributo activo: ${active.full}">▲ ${active.label}</span><span class="turn-summary">${review?'Revisión <strong>00:03</strong>':observer?'Turno: L · <strong>00:24</strong>':'Turno: <strong>L · 00:24</strong>'}</span></div><div class="summary-row"><button class="indicator-link" type="button" data-detail="${indicator.id}">Indicadora: ${escapeHtml(indicator.name)}</button><div class="direction" aria-label="Dirección"><button type="button" data-direction="HIGH" aria-pressed="${!opening}" ${opening&&!review&&!observer?'':'disabled'}>ALTO</button><button type="button" data-direction="LOW" aria-pressed="false" ${opening&&!review&&!observer?'':'disabled'}>BAJO</button></div></div><div class="summary-row"><div class="scores" aria-label="Puntuaciones">${members.map((m,i)=>`<button type="button" data-scores="true" class="${i===0?'opener':''}" aria-label="${escapeHtml(m.name)}, ${m.points} puntos${i===0?', abridor':''}">${m.initial} ${m.points}</button>`).join('')}</div><span class="round-pile">R6<br>Mazo: 12</span></div>`;
$('mesa').innerHTML=publicCards.map((p)=>renderCard(p.card,false,p.member)).join('');
$('mesa-count').textContent=`${publicCards.length} cartas · desliza ↔`;
$('hand').innerHTML=observer?'':(review?hand.slice(1):hand).map((c)=>renderCard(c,true)).join('');
if(review){$('review-note').hidden=false;$('review-note').textContent=`Ganó ${publicCards[0].member.initial} · +5 puntos · abre ${publicCards[1].member.initial}`;$('hand-title').lastElementChild.textContent='2 cartas · desliza ↔';}
if(observer){$('hand-zone').hidden=true;$('review-note').hidden=false;$('review-note').textContent='Observando';}
$('prototype-note').textContent=`Maqueta · ${mode==='data'?'Dato':'1-58'} · opción móvil activada. MKm, abreviaturas y redondeo son propuestas editoriales.`;
function close(){ $('details').close(); }
function openDetail(id,trigger){
 const card=collection.cards.find((c)=>c.id===id);previousFocus=trigger;actions.details++;
 $('details-content').innerHTML=`<h2 id="details-title">${escapeHtml(card.name)}</h2><p class="editorial-note">Propuesta editorial · maqueta</p>${picture(card,true)}${card.characteristic?`<p>${escapeHtml(card.characteristic)}</p>`:''}${table(card,true)}${card.note?`<p>${escapeHtml(card.note)}</p>`:''}`;
 $('details').showModal();$('close-details').focus();
}
document.addEventListener('pointerdown',(event)=>{pointer={x:event.clientX,y:event.clientY,drag:false};});
document.addEventListener('pointermove',(event)=>{if(pointer&&Math.hypot(pointer.x-event.clientX,pointer.y-event.clientY)>6)pointer.drag=true;});
document.addEventListener('pointercancel',()=>{if(pointer)pointer.drag=true;});
document.addEventListener('click',(event)=>{
 if(pointer?.drag&&event.detail!==0)return;
 const details=event.target.closest('[data-detail]');if(details){openDetail(details.dataset.detail,details);return;}
 const scores=event.target.closest('[data-scores]');if(scores){previousFocus=scores;$('details-content').innerHTML=`<h2 id="details-title">Jugadores y puntuaciones</h2>${members.map((m,i)=>`<p>${escapeHtml(m.name)} · ${m.points} puntos${i===0?' · abridor':''}</p>`).join('')}`;$('details').showModal();$('close-details').focus();return;}
 const direction=event.target.closest('[data-direction]');if(direction&&!direction.disabled){actions.directions++;document.querySelectorAll('[data-direction]').forEach((b)=>b.setAttribute('aria-pressed',String(b===direction)));$('demo-status').textContent='Dirección elegida en maqueta, sin comunicación al servidor.';return;}
 const slot=event.target.closest('#hand .slot');if(slot&&!review&&!observer&&(!pointer?.drag||event.detail===0)){actions.plays++;$('demo-status').textContent=`Maqueta: seleccionada ${collection.cards.find((c)=>c.id===slot.dataset.card).name}. Sin envío.`;}
});
$('close-details').addEventListener('click',close);
$('details').addEventListener('close',()=>{if(previousFocus?.isConnected)previousFocus.focus();});
window.mobileMock={actions,indicatorId:indicator.id,mode,review,handIds:hand.map((c)=>c.id),publicIds:publicCards.map((p)=>p.card.id)};
