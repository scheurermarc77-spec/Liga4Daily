(()=>{
  const adjust=()=>{
    const app=document.getElementById('app');
    const card=app?.querySelector('.match-tip-card');
    if(!app||!card)return false;
    const pairing=card.querySelector('.match-tip-pairing')?.textContent||'';
    if(!/FC\s+Eschenbach\s+II/i.test(pairing)){
      card.remove();
      return true;
    }
    const outlook=[...app.querySelectorAll(':scope > section.card')].find(section=>section.querySelector(':scope > h2')?.textContent?.trim()==='Ausblick');
    if(outlook&&outlook.nextElementSibling!==card)outlook.after(card);
    return true;
  };
  if(!adjust()){
    const app=document.getElementById('app');
    if(app){
      const observer=new MutationObserver(()=>{if(adjust())observer.disconnect();});
      observer.observe(app,{childList:true,subtree:true});
    }
  }
})();
