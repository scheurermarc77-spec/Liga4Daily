(()=>{
  const API='https://kfpxheegmeupnuzqjqqt.supabase.co/functions/v1/scorer-hearts-public';
  const deviceKey='go-eschenbach-mood-device';
  const teamNeedle='fc eschenbach ii';
  let report=null;
  let cycle=null;
  let rebuildTimer=null;
  let kickoffTimer=null;
  let loading=false;
  let state={counts:{},voted_player_key:null};

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
  const normalize=s=>String(s||'').normalize('NFKC').trim().toLocaleLowerCase('de-CH').replace(/\s+/g,' ');
  const playerKey=name=>normalize(name).slice(0,120);
  const isEschenbach=m=>normalize(m?.home).includes(teamNeedle)||normalize(m?.away).includes(teamNeedle);

  function kickoffInfo(m){
    const dm=String(m?.date||'').match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    const tm=String(m?.time||'').match(/^(\d{1,2}):(\d{2})$/);
    if(!dm||!tm)return null;
    const ts=new Date(Number(dm[3]),Number(dm[2])-1,Number(dm[1]),Number(tm[1]),Number(tm[2]),0,0).getTime();
    if(!Number.isFinite(ts))return null;
    const key=`${m.date} ${String(m.time).padStart(5,'0')}|${String(m.home||'').trim()}|${String(m.away||'').trim()}`.slice(0,220);
    return {ts,key};
  }

  function deriveCycle(d){
    const all=[...(Array.isArray(d?.recent_results)?d.recent_results:[]),...(Array.isArray(d?.upcoming_matches)?d.upcoming_matches:[])];
    const matches=all.filter(isEschenbach).map(m=>({...m,...kickoffInfo(m)})).filter(m=>m.ts&&m.key);
    const now=Date.now();
    const started=matches.filter(m=>m.ts<=now).sort((a,b)=>b.ts-a.ts);
    const future=matches.filter(m=>m.ts>now).sort((a,b)=>a.ts-b.ts);
    return {
      key:started[0]?.key||'saisonstart',
      nextAt:future[0]?.ts||null
    };
  }

  function findScorerCard(){
    return [...document.querySelectorAll('#app section.card')].find(card=>card.querySelector(':scope > h2')?.textContent?.trim()==='Eschenbach-Torschützen')||null;
  }

  function scorerRows(){
    const card=findScorerCard();
    if(!card)return[];
    return [...card.children].filter(el=>el.classList?.contains('match'));
  }

  function setStatus(text){
    const card=findScorerCard();
    let el=card?.querySelector('.scorer-hearts-status');
    if(!card)return;
    if(!el){
      el=document.createElement('div');
      el.className='scorer-hearts-status';
      el.setAttribute('aria-live','polite');
      const summary=[...card.children].find(child=>child.classList?.contains('muted'));
      if(summary)card.insertBefore(el,summary);else card.appendChild(el);
    }
    el.textContent=text||'';
  }

  function mountRows(){
    const rows=scorerRows();
    if(!rows.length)return false;
    rows.forEach(row=>{
      if(row.dataset.scorerHeartMounted==='1')return;
      const name=row.querySelector('strong')?.textContent?.trim();
      if(!name)return;
      const key=playerKey(name);
      const content=[...row.children].find(el=>el.tagName==='DIV');
      if(!content)return;
      row.dataset.scorerHeartMounted='1';
      row.dataset.scorerKey=key;
      const wrap=document.createElement('div');
      wrap.className='scorer-heart-wrap';
      wrap.innerHTML=`<button class="scorer-heart-button" type="button" data-player-key="${key}" data-player-name="${name.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}" aria-label="Volltreffer für ${name.replace(/"/g,'&quot;')}"><span class="scorer-heart-icon" aria-hidden="true">❤️</span><span class="scorer-heart-label">Volltreffer</span><span class="scorer-heart-count">0</span></button>`;
      content.appendChild(wrap);
      wrap.querySelector('button')?.addEventListener('click',()=>vote(name,key));
    });
    renderState();
    return true;
  }

  function renderState(){
    document.querySelectorAll('.scorer-heart-button').forEach(button=>{
      const key=button.dataset.playerKey||'';
      const count=button.querySelector('.scorer-heart-count');
      if(count)count.textContent=String(state.counts?.[key]||0);
      const selected=state.voted_player_key===key;
      button.classList.toggle('is-selected',selected);
      button.setAttribute('aria-pressed',selected?'true':'false');
      button.disabled=Boolean(state.voted_player_key)||loading;
    });
    if(state.voted_player_key)setStatus('Dein Volltreffer ist gesetzt. Beim nächsten Eschenbach-Spiel kannst du wieder wählen.');
    else setStatus('Pro Person ein Volltreffer. Ab dem nächsten Spielbeginn ist ein weiterer möglich.');
  }

  async function refreshState(){
    if(!cycle)return;
    try{
      const r=await fetch(`${API}?cycle_key=${encodeURIComponent(cycle.key)}&device_id=${encodeURIComponent(getDeviceId())}&t=${Date.now()}`,{cache:'no-store'});
      if(!r.ok)throw Error();
      const d=await r.json();
      state={counts:d.counts||{},voted_player_key:d.voted_player_key||null};
      renderState();
    }catch{
      setStatus('Volltreffer sind gerade nicht verfügbar.');
    }
  }

  async function vote(name,key){
    if(!cycle||state.voted_player_key||loading)return;
    loading=true;
    renderState();
    setStatus('Volltreffer wird gespeichert …');
    try{
      const r=await fetch(API,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({player_key:key,player_name:name,device_id:getDeviceId(),cycle_key:cycle.key})
      });
      const d=await r.json().catch(()=>({}));
      if(r.status===409){
        state.voted_player_key=d.voted_player_key||state.voted_player_key;
        await refreshState();
        return;
      }
      if(!r.ok)throw Error();
      state.voted_player_key=key;
      state.counts[key]=(Number(state.counts[key])||0)+1;
      renderState();
    }catch{
      setStatus('Volltreffer konnte nicht gespeichert werden.');
    }finally{
      loading=false;
      renderState();
    }
  }

  function scheduleNextKickoff(){
    if(kickoffTimer){clearTimeout(kickoffTimer);kickoffTimer=null;}
    if(!cycle?.nextAt)return;
    const delay=cycle.nextAt-Date.now()+1500;
    if(delay<=0){location.reload();return;}
    kickoffTimer=setTimeout(()=>location.reload(),Math.min(delay,2147480000));
  }

  const rebuild=()=>{
    if(mountRows())refreshState();
  };
  const scheduleRebuild=()=>{clearTimeout(rebuildTimer);rebuildTimer=setTimeout(rebuild,60)};

  (async()=>{
    try{
      const r=await fetch(`data/report.json?scorerhearts=${Date.now()}`,{cache:'no-store'});
      if(!r.ok)throw Error();
      report=await r.json();
      cycle=deriveCycle(report);
      scheduleNextKickoff();
    }catch{
      cycle={key:'saisonstart',nextAt:null};
    }
    rebuild();
    const app=document.getElementById('app');
    if(app)new MutationObserver(scheduleRebuild).observe(app,{childList:true,subtree:true,characterData:true});
  })();
})();
