(()=>{
  const originalFetch=window.fetch.bind(window);
  window.fetch=async(...args)=>{
    const response=await originalFetch(...args);
    const requestUrl=String(typeof args[0]==='string'?args[0]:args[0]?.url||'');
    if(!requestUrl.includes('data/report.json'))return response;
    try{
      const data=await response.clone().json();
      if(Array.isArray(data.upcoming_matches)){
        data.upcoming_matches=data.upcoming_matches.filter(match=>/FC\s+Eschenbach\s+II/i.test(String(match.home||''))||/FC\s+Eschenbach\s+II/i.test(String(match.away||'')));
      }
      return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:response.headers});
    }catch{
      return response;
    }
  };

  const provenancePattern=/(IFV-Spielnummer|Matchcenter|Datenquelle|Quelle\s*:|Kontrollsumme|Recherche|verifiziert|geprüft|offizielle\s+IFV-Daten)/i;

  function cleanupNotes(){
    const app=document.getElementById('app');
    if(!app)return false;
    app.querySelectorAll('.match .muted').forEach(el=>{
      const text=(el.textContent||'').trim();
      if(provenancePattern.test(text))el.remove();
    });
    return true;
  }

  cleanupNotes();
  const target=document.getElementById('app');
  if(target){
    const observer=new MutationObserver(()=>cleanupNotes());
    observer.observe(target,{childList:true,subtree:true});
  }
})();
