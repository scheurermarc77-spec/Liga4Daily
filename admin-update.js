(()=>{
  const el=document.getElementById('bottomUpdate');
  const statusEl=document.getElementById('bottomUpdateStatus');
  if(!el)return;

  const API='https://kfpxheegmeupnuzqjqqt.supabase.co/functions/v1/report-update-request';
  let pollTimer=null;
  let holdTimer=null;
  let requestedAt=null;
  let beforeGeneratedAt='';

  const setStatus=(text,state='')=>{
    if(!statusEl)return;
    statusEl.textContent=text||'';
    statusEl.dataset.state=state;
  };

  const getReportVersion=async()=>{
    try{
      const r=await fetch(`data/report.json?updatecheck=${Date.now()}`,{cache:'no-store'});
      if(!r.ok)return'';
      const d=await r.json();
      return String(d.generated_at||'');
    }catch{return'';}
  };

  const stopPolling=()=>{
    if(pollTimer){clearTimeout(pollTimer);pollTimer=null;}
  };
  const cancelHold=()=>{
    if(holdTimer){clearTimeout(holdTimer);holdTimer=null;}
  };

  const waitForPublishedReport=async()=>{
    setStatus('Bericht wird veröffentlicht …','publishing');
    const started=Date.now();
    while(Date.now()-started<120000){
      await new Promise(r=>setTimeout(r,5000));
      const current=await getReportVersion();
      if(current && current!==beforeGeneratedAt){
        setStatus('Aktualisiert ✓','done');
        el.textContent='Aktualisiert';
        setTimeout(()=>location.reload(),900);
        return;
      }
    }
    setStatus('Aktualisiert. App kurz neu öffnen.','done');
    el.textContent='Update';
    el.disabled=false;
  };

  const poll=async()=>{
    stopPolling();
    try{
      const r=await fetch(`${API}?t=${Date.now()}`,{cache:'no-store'});
      if(!r.ok)throw Error();
      const d=await r.json();
      if(d.pending){
        if(d.phase==='running')setStatus('Aktualisierung läuft …','running');
        else setStatus('Update startet …','running');
        pollTimer=setTimeout(poll,7000);
        return;
      }

      const completedAt=d.completed_at?new Date(d.completed_at).getTime():0;
      const failedAt=d.failed_at?new Date(d.failed_at).getTime():0;
      const reqTime=requestedAt?new Date(requestedAt).getTime():0;
      if(failedAt && (!reqTime||failedAt>=reqTime)){
        setStatus('Aktualisierung fehlgeschlagen. Bitte nochmals versuchen.','error');
        el.textContent='Update';
        el.disabled=false;
        return;
      }
      if(completedAt && (!reqTime||completedAt>=reqTime)){
        await waitForPublishedReport();
        return;
      }
      pollTimer=setTimeout(poll,7000);
    }catch{
      setStatus('Verbindung wird erneut geprüft …','running');
      pollTimer=setTimeout(poll,10000);
    }
  };

  const setupGitHub=async()=>{
    const token=window.prompt('Einmalige Einrichtung: Füge deinen GitHub Fine-grained Token ein. Er wird nicht auf dem iPhone gespeichert.');
    if(!token)return false;
    const code=window.prompt('Gib den einmaligen Setup-Code ein:');
    if(!code)return false;
    setStatus('GitHub wird verbunden …','running');
    try{
      const r=await fetch(API,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'setup',github_token:token.trim(),setup_code:code.trim()})
      });
      const d=await r.json().catch(()=>({}));
      if(!r.ok||!d.configured){
        setStatus(d.error==='wrong_setup_code'?'Setup-Code stimmt nicht.':'GitHub-Verbindung konnte nicht eingerichtet werden.','error');
        return false;
      }
      setStatus('GitHub verbunden ✓','done');
      return true;
    }catch{
      setStatus('GitHub-Verbindung konnte nicht eingerichtet werden.','error');
      return false;
    }
  };

  const requestUpdate=async()=>{
    if(el.disabled)return;
    el.disabled=true;
    el.textContent='Startet …';
    setStatus('Update wird gestartet …','running');
    beforeGeneratedAt=await getReportVersion();
    try{
      let r=await fetch(API,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'request'})
      });
      let d=await r.json().catch(()=>({}));

      if(r.status===503&&d.setup_required){
        el.disabled=false;
        el.textContent='Update';
        setStatus('Einmalige GitHub-Verbindung nötig.','info');
        const configured=await setupGitHub();
        if(configured)setTimeout(requestUpdate,400);
        return;
      }
      if(r.status===429){
        const mins=Math.max(1,Math.ceil(Number(d.cooldown_seconds||60)/60));
        setStatus(`Bereits kürzlich aktualisiert. In ca. ${mins} Min. wieder möglich.`,'info');
        el.textContent='Update';
        el.disabled=false;
        return;
      }
      if(!r.ok||!d.pending)throw Error();
      requestedAt=d.requested_at||new Date().toISOString();
      localStorage.setItem('go-eschenbach-last-update-request',requestedAt);
      setStatus(d.phase==='running'?'Aktualisierung läuft …':'Update gestartet …','running');
      el.textContent='Läuft …';
      poll();
    }catch{
      setStatus('Update konnte nicht gestartet werden.','error');
      el.textContent='Update';
      el.disabled=false;
    }
  };

  el.addEventListener('click',e=>e.preventDefault());
  el.addEventListener('contextmenu',e=>e.preventDefault());
  el.addEventListener('pointerdown',()=>{
    cancelHold();
    if(el.disabled)return;
    holdTimer=setTimeout(()=>{holdTimer=null;requestUpdate();},1200);
  });
  el.addEventListener('pointerup',cancelHold);
  el.addEventListener('pointercancel',cancelHold);
  el.addEventListener('pointerleave',cancelHold);

  (async()=>{
    try{
      const r=await fetch(`${API}?t=${Date.now()}`,{cache:'no-store'});
      if(!r.ok)return;
      const d=await r.json();
      if(d.pending){
        beforeGeneratedAt=await getReportVersion();
        requestedAt=d.requested_at||localStorage.getItem('go-eschenbach-last-update-request');
        el.disabled=true;
        el.textContent='Läuft …';
        setStatus(d.phase==='running'?'Aktualisierung läuft …':'Update startet …','running');
        poll();
      }
    }catch{}
  })();
})();
