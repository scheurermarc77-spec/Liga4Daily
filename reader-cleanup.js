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

  function cleanReaderText(value){
    let text=String(value??'').trim();
    if(!text)return'';

    text=text
      .replace(/Laut\s+öffentlich\s+zugänglichem\s+Matchbericht\s+fielen\s+die\s+Tore\s+durch/gi,'Die Tore fielen durch')
      .replace(/Öffentlich\s+zugänglicher\s+Matchbericht\s+nennt\s+(.+?)\s+als\s+Torschützen\.?/gi,'Torschützen: $1.')
      .replace(/\b(?:Offizielles?\s+)?IFV-Resultat\.?/gi,'')
      .replace(/\bIFV-Spielplan\.?/gi,'')
      .replace(/\bDie\s+offiziellen\s+IFV-Daten\s+haben\s+bei\s+der\s+Auswertung\s+Vorrang\.?/gi,'')
      .replace(/\b(?:Quelle|Quellen|Datenquelle|Matchcenter)\s*:\s*[^.!?]*(?:[.!?]|$)/gi,'')
      .replace(/\s+([,.;:!?])/g,'$1')
      .replace(/([.;])\s*\1+/g,'$1')
      .replace(/^\s*[;,.-]+\s*/,'')
      .replace(/\s*[;,.-]+\s*$/,'')
      .replace(/\s{2,}/g,' ')
      .trim();

    if(/^(?:offiziell(?:es|e|er|en)?\s+)?(?:IFV|Matchcenter|Quelle|Quellen|Spielplan|Resultat)$/i.test(text))return'';
    return text;
  }

  function cleanReviewText(value){
    const text=cleanReaderText(value);
    if(!text)return'';
    const scorePattern=/\b\d{1,2}\s*:\s*\d{1,2}\b/;
    const specialPattern=/(Spitzenspiel|Topspiel|Kellerduell|Überrasch|Sensation|Derby|Kantersieg|Torflut|Ausrufezeichen|Verfolgerduell|Schlüsselspiel|direktes?\s+Duell|Leader|Tabellenspitze|Schlusslicht|erste\s+Punkte|erster\s+Sieg|erste\s+Niederlage|ungeschlagen|Serie|Rekord)/i;
    const sentences=text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[text];
    return sentences.map(s=>s.trim()).filter(s=>{
      if(!s)return false;
      if(/FC\s+Eschenbach\s+II/i.test(s))return true;
      if(/(?:übrigen|weiteren|anderen)\s+Resultate\s*:/i.test(s)&&!specialPattern.test(s))return false;
      if(scorePattern.test(s)&&!specialPattern.test(s))return false;
      return true;
    }).join(' ').replace(/\s{2,}/g,' ').trim();
  }

  function cleanup(){
    const app=document.getElementById('app');
    if(!app)return false;

    app.querySelectorAll('.match .muted').forEach(el=>{
      const original=el.textContent||'';
      const cleaned=cleanReaderText(original);
      if(cleaned!==original.trim()){
        if(cleaned)el.textContent=cleaned;
        else el.remove();
      }
    });

    const reviewCard=[...app.querySelectorAll('.card')].find(card=>card.querySelector('h2')?.textContent?.trim()==='Rückblick');
    if(reviewCard){
      reviewCard.querySelectorAll('p').forEach(el=>{
        const original=el.textContent||'';
        const cleaned=cleanReviewText(original);
        if(cleaned!==original.trim())el.textContent=cleaned;
      });
    }

    app.querySelectorAll('.card p').forEach(el=>{
      if(reviewCard?.contains(el))return;
      const original=el.textContent||'';
      const cleaned=cleanReaderText(original);
      if(cleaned!==original.trim())el.textContent=cleaned;
    });
    return true;
  }

  cleanup();
  const target=document.getElementById('app');
  if(target){
    const observer=new MutationObserver(()=>cleanup());
    observer.observe(target,{childList:true,subtree:true,characterData:true});
  }
})();
