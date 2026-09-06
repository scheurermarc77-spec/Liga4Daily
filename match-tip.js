(()=>{
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const parseKickoff=(date,time)=>{
    const m=String(date||'').match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    const t=String(time||'').match(/^(\d{1,2}):(\d{2})/);
    if(!m)return null;
    return new Date(Number(m[3]),Number(m[2])-1,Number(m[1]),t?Number(t[1]):0,t?Number(t[2]):0,0,0);
  };
  const clamp=v=>Math.max(0,Math.min(20,Number(v)||0));

  function mount(d){
    if(document.querySelector('.match-tip-card'))return true;
    const match=Array.isArray(d.upcoming_matches)?d.upcoming_matches[0]:null;
    if(!match)return false;
    const app=document.getElementById('app');
    if(!app)return false;
    const sections=[...app.querySelectorAll(':scope > section.card')];
    const outlook=sections.find(s=>s.querySelector(':scope > h2')?.textContent?.trim()==='Ausblick');
    if(!outlook)return false;

    const id=[match.date,match.time,match.home,match.away].join('|');
    const key='go-eschenbach-match-tip:'+id;
    const kickoff=parseKickoff(match.date,match.time);
    const locked=kickoff?Date.now()>=kickoff.getTime():false;
    let saved=null;
    try{saved=JSON.parse(localStorage.getItem(key)||'null')}catch{}

    const card=document.createElement('section');
    card.className='match-tip-card';
    card.innerHTML=`
      <span class="match-tip-kicker">MATCH-TIPP</span>
      <h2>Wie geht das nächste Spiel aus?</h2>
      <div class="match-tip-meta">${esc(match.date)}${match.time?` · ${esc(match.time)} Uhr`:''}</div>
      <div class="match-tip-pairing">
        <div class="match-tip-team">${esc(match.home)}</div>
        <div class="match-tip-vs">VS</div>
        <div class="match-tip-team">${esc(match.away)}</div>
      </div>
      <div class="match-tip-form${saved||locked?' is-hidden':''}">
        <div class="match-tip-score">
          <input class="match-tip-home" type="number" inputmode="numeric" min="0" max="20" aria-label="Tore ${esc(match.home)}">
          <span class="match-tip-colon">:</span>
          <input class="match-tip-away" type="number" inputmode="numeric" min="0" max="20" aria-label="Tore ${esc(match.away)}">
        </div>
        <button class="match-tip-action" type="button">Tipp speichern</button>
      </div>
      <div class="match-tip-saved${saved?' is-visible':''}">
        <div class="match-tip-saved-label">DEIN TIPP</div>
        <div class="match-tip-saved-score">${saved?`${esc(saved.home)} : ${esc(saved.away)}`:''}</div>
        ${!locked?'<button class="match-tip-change" type="button">Tipp ändern</button>':''}
      </div>
      ${locked&&!saved?'<div class="match-tip-locked">Tipps sind für dieses Spiel geschlossen.</div>':''}
    `;
    outlook.before(card);

    const form=card.querySelector('.match-tip-form');
    const savedBox=card.querySelector('.match-tip-saved');
    const savedScore=card.querySelector('.match-tip-saved-score');
    const home=card.querySelector('.match-tip-home');
    const away=card.querySelector('.match-tip-away');
    const action=card.querySelector('.match-tip-action');
    const change=card.querySelector('.match-tip-change');

    action?.addEventListener('click',()=>{
      if(home.value===''||away.value===''){
        if(home.value==='')home.focus();else away.focus();
        return;
      }
      const tip={home:clamp(home.value),away:clamp(away.value)};
      try{localStorage.setItem(key,JSON.stringify(tip))}catch{}
      savedScore.textContent=`${tip.home} : ${tip.away}`;
      form.classList.add('is-hidden');
      savedBox.classList.add('is-visible');
    });
    change?.addEventListener('click',()=>{
      let tip=null;
      try{tip=JSON.parse(localStorage.getItem(key)||'null')}catch{}
      if(tip){home.value=tip.home;away.value=tip.away;}
      savedBox.classList.remove('is-visible');
      form.classList.remove('is-hidden');
      home.focus();
    });
    return true;
  }

  fetch('data/report.json?'+Date.now()).then(r=>r.json()).then(d=>{
    if(mount(d))return;
    const app=document.getElementById('app');
    if(!app)return;
    const observer=new MutationObserver(()=>{if(mount(d))observer.disconnect();});
    observer.observe(app,{childList:true,subtree:true});
  }).catch(()=>{});
})();
