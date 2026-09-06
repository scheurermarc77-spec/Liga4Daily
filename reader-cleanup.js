(()=>{
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

    app.querySelectorAll('.card p').forEach(el=>{
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
