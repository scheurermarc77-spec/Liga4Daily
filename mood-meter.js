(()=>{
  const API='https://kfpxheegmeupnuzqjqqt.supabase.co/functions/v1/section-moods-public';
  const moods=[
    {id:'fire',emoji:'🔥',label:'Stark'},
    {id:'heart',emoji:'💛',label:'Hopp Eschenbach'},
    {id:'ball',emoji:'⚽',label:'Weiter so'}
  ];
  const deviceKey='go-eschenbach-mood-device';
  let rebuildTimer=null;

  const makeUuid=()=>{
    if(globalThis.crypto?.randomUUID)return crypto.randomUUID();
    const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
    const h=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
    return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
  };
  const getDeviceId=()=>{
    let id=localStorage.getItem(deviceKey);
    if(!id){id=makeUuid();localStorage.setItem(deviceKey,id)}
    return id;
  };
  const collectHeadings=()=>{
    const list=[];
    const hero=document.querySelector('.hero h1');
    if(hero)list.push(hero);
    document.querySelectorAll('#app h2,#app h3.section-subtitle').forEach(el=>list.push(el));
    return list.filter(el=>el.textContent?.trim());
  };
  const sectionKey=heading=>`heading:${heading.textContent.trim()}`.slice(0,300);
  const savedKey=key=>`go-eschenbach-mood-choice:${key}`;

  async function loadCounts(key,meter){
    const status=meter.querySelector('.mood-meter-status');
    try{
      const r=await fetch(`${API}?section_key=${encodeURIComponent(key)}`,{cache:'no-store'});
      if(!r.ok)throw Error();
      const d=await r.json();
      moods.forEach(m=>{const el=meter.querySelector(`[data-mood-count="${m.id}"]`);if(el)el.textContent=String(d.counts?.[m.id]||0)});
      if(status)status.textContent=d.total?`${d.total} ${d.total===1?'Reaktion':'Reaktionen'}`:'Noch keine Reaktion';
    }catch{
      if(status)status.textContent='Stimmung gerade nicht verfügbar.';
    }
  }

  async function vote(key,mood,meter){
    const buttons=[...meter.querySelectorAll('.mood-meter-button')];
    const status=meter.querySelector('.mood-meter-status');
    buttons.forEach(b=>b.disabled=true);
    if(status)status.textContent='Wird gespeichert …';
    try{
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({section_key:key,device_id:getDeviceId(),mood})});
      if(!r.ok)throw Error();
      localStorage.setItem(savedKey(key),mood);
      buttons.forEach(b=>{const selected=b.dataset.mood===mood;b.classList.toggle('is-selected',selected);b.setAttribute('aria-pressed',selected?'true':'false')});
      await loadCounts(key,meter);
    }catch{
      if(status)status.textContent='Speichern hat nicht funktioniert.';
    }finally{
      buttons.forEach(b=>b.disabled=false);
    }
  }

  function mountHeading(heading){
    if(heading.dataset.moodMeterMounted==='1')return;
    heading.dataset.moodMeterMounted='1';
    const key=sectionKey(heading);
    const selected=localStorage.getItem(savedKey(key));
    const meter=document.createElement('div');
    meter.className='mood-meter';
    meter.dataset.moodKey=key;
    meter.innerHTML=`<span class="mood-meter-label">Stimmungsbarometer</span><div class="mood-meter-actions">${moods.map(m=>`<button class="mood-meter-button${selected===m.id?' is-selected':''}" type="button" data-mood="${m.id}" aria-label="${m.label}" aria-pressed="${selected===m.id?'true':'false'}"><span class="mood-meter-emoji" aria-hidden="true">${m.emoji}</span><span>${m.label}</span><span class="mood-meter-count" data-mood-count="${m.id}">0</span></button>`).join('')}</div><div class="mood-meter-status">Stimmung wird geladen …</div>`;
    heading.insertAdjacentElement('afterend',meter);
    meter.addEventListener('click',event=>{
      const button=event.target.closest('.mood-meter-button');
      if(!button)return;
      vote(key,button.dataset.mood,meter);
    });
    loadCounts(key,meter);
  }

  const rebuild=()=>collectHeadings().forEach(mountHeading);
  const scheduleRebuild=()=>{clearTimeout(rebuildTimer);rebuildTimer=setTimeout(rebuild,40)};

  rebuild();
  const app=document.getElementById('app');
  if(app)new MutationObserver(scheduleRebuild).observe(app,{childList:true,subtree:true,characterData:true});
})();
