/* Interacción exclusiva de maqueta: nunca se conecta o ejecuta reglas de partida. */
const controls = ['deck','mode','content','optimize'].map((id)=>document.getElementById(id));
const symbols = ['●','▲','■'];
const byId = (id)=>document.getElementById(id);
const escapeHtml = (value)=>String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const count = (value)=>[...new Intl.Segmenter('es',{granularity:'grapheme'}).segment(value)].length;
let detailsTrigger = null;
let chosen = null;
let actions = { plays:0, details:0 };
let pointer = null;
const source = ()=>SAMPLES[byId('deck').value];
const presentation = (card)=>byId('content').value==='proposal'?card.proposal:card.current;
const cardKey = (card)=>`${byId('deck').value}:${card.id}`;
function rows(card,active,detail=false){
  const variant=presentation(card);
  return variant.attributes.map((attribute,i)=>{
    const v=variant.values[i];
    const label=detail?attribute.full:attribute.label;
    const text=detail||byId('mode').value==='data'?v.display+(v.unit?' '+v.unit:''):String(v.play);
    return `<tr class="${i===active?'active':''}"><th scope="row"><span class="attribute" aria-label="${escapeHtml(attribute.full)}${i===active?', atributo activo':''}">${symbols[i]} ${escapeHtml(label)}${i===active?'<span class="active-mark" aria-hidden="true">◆</span>':''}</span></th><td><span class="value" data-count="${count(text)}">${escapeHtml(text)}</span></td></tr>`;
  }).join('');
}
function image(card){return `<div class="image">${card.image?`<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.imageAlt)}">`:'<svg viewBox="0 0 80 70" aria-hidden="true"><rect x="17" y="5" width="46" height="60" rx="7" fill="none" stroke="currentColor" stroke-width="3"/><path d="M40 18 52 35 40 52 28 35Z" fill="currentColor"/></svg>'}</div>`;}
function renderCard(card,active,hand=false,author=''){
  const variant=presentation(card);
  return `<div class="slot" data-card="${escapeHtml(cardKey(card))}" data-active="${active}"><p class="editorial-note">${byId('content').value==='proposal'?'Propuesta editorial · maqueta':'Contenido actual · maqueta'}</p><article class="paper"><div class="heading"><h3>${escapeHtml(card.name)}</h3><span class="own-icon" role="img" aria-label="Atributo indicador: ${escapeHtml(variant.attributes[card.indicator].full)}">${symbols[card.indicator]}</span></div>${image(card)}<table class="values"><thead><tr><th scope="col">Atributo</th><th scope="col">${byId('mode').value==='play'?'1-58':'Dato'}</th></tr></thead><tbody>${rows(card,active)}</tbody></table><button class="details-button" type="button" data-detail="true">Detalles</button></article>${hand?'<button class="play-button" type="button" data-play="true">Jugar carta</button>':''}${author?`<p class="author">${escapeHtml(author)}</p>`:''}</div>`;
}
function currentCard(key){const [deck,id]=key.split(':');return SAMPLES[deck].cards.find((c)=>c.id===id)||SAMPLES.examples.find((c)=>c.id===id);}
function inspect(){
  document.querySelectorAll('.field-overflow,.budget-over').forEach((el)=>el.classList.remove('field-overflow','budget-over'));
  document.querySelectorAll('.values .attribute,.values .value').forEach((el)=>{
    const td=el.closest('td,th'),a=el.getBoundingClientRect(),b=td.getBoundingClientRect(),style=getComputedStyle(td);
    const usable=b.width-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
    if(a.width>usable+.5)el.classList.add('field-overflow');
    if(el.classList.contains('value')&&count(el.textContent)>10)el.classList.add('budget-over');
  });
}
function render(){
  document.body.classList.toggle('optimized',byId('optimize').checked);
  const data=source();
  byId('editorial-label').textContent=byId('content').value==='proposal'?'Propuesta editorial: Vel/Dist, MKm y precisión variable; Triáng. solo como alternativa pendiente para genérica. JSON oficiales intactos.':'Contenido actual literal. Los excesos de diez caracteres se señalan en rosa; los excesos de anchura, con contorno discontinuo.';
  byId('indicator').innerHTML=renderCard(data.cards.find((c)=>c.id===data.indicator),1);
  byId('hand').innerHTML=data.hand.map((id)=>renderCard(data.cards.find((c)=>c.id===id),1,true)).join('');
  byId('mesa').innerHTML=data.mesa.map((id,i)=>renderCard(data.cards.find((c)=>c.id===id),2,false,`Jugador ${i+1}`)).join('');
  byId('examples').innerHTML=SAMPLES.examples.map((card)=>renderCard(card,1)).join('');
  byId('demo-status').textContent='Ninguna acción de maqueta.';
  chosen=null;actions={plays:0,details:0};
  requestAnimationFrame(inspect);
}
function openDetails(slot,trigger){
  const card=currentCard(slot.dataset.card),active=Number(slot.dataset.active);
  detailsTrigger=trigger;actions.details++;
  byId('details-content').innerHTML=`<h2 id="details-title">Detalles de ${escapeHtml(card.name)}</h2><p class="editorial-note">${byId('content').value==='proposal'?'Propuesta editorial · maqueta':'Contenido actual · maqueta'}</p>${image(card)}${card.characteristic?`<p class="description">${escapeHtml(card.characteristic)}</p>`:''}<table class="values"><thead><tr><th scope="col">Atributo</th><th scope="col">Dato</th></tr></thead><tbody>${rows(card,active,true)}</tbody></table>${card.note?`<p class="note">${escapeHtml(card.note)}</p>`:''}`;
  byId('details').showModal();byId('close-details').focus();requestAnimationFrame(inspect);
}
function choose(slot){chosen=slot.dataset.card;actions.plays++;byId('demo-status').textContent=`Maqueta: seleccionada ${currentCard(chosen).name}. Sin envío de jugada.`;}
document.addEventListener('pointerdown',(event)=>{const slot=event.target.closest('.slot');pointer=slot?{key:slot.dataset.card,x:event.clientX,y:event.clientY,drag:false}:null;});
document.addEventListener('pointermove',(event)=>{if(pointer&&Math.hypot(pointer.x-event.clientX,pointer.y-event.clientY)>6)pointer.drag=true;});
document.addEventListener('pointercancel',()=>{if(pointer)pointer.drag=true;});
document.addEventListener('click',(event)=>{
  const slot=event.target.closest('.slot');if(!slot)return;
  if(event.target.closest('[data-detail]')){openDetails(slot,event.target.closest('[data-detail]'));return;}
  if(slot.querySelector('[data-play]')&&(!pointer?.drag||event.detail===0))choose(slot);
});
byId('close-details').addEventListener('click',()=>byId('details').close());
byId('details').addEventListener('close',()=>{if(detailsTrigger?.isConnected)detailsTrigger.focus();});
controls.forEach((control)=>control.addEventListener('change',render));
window.mock={render,inspect,getActions:()=>({...actions,chosen}),samples:SAMPLES};
render();
