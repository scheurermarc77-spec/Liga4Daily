(()=>{
  const decorate=()=>{
    const cards=[...document.querySelectorAll('#app section.card')];
    if(!cards.length)return false;

    cards.forEach(card=>{
      const title=card.querySelector(':scope > h2')?.textContent?.trim()||'';
      if(title==='Rückblick')card.classList.add('section-card','review-card');
      if(title==='Aktuelle Situation')card.classList.add('section-card','standings-card');
      if(title==='Ausblick')card.classList.add('section-card','outlook-card');
      if(title==='Eschenbach-Torschützen')card.classList.add('section-card','scorers-card');
    });

    const scorerCard=document.querySelector('#app .scorers-card');
    if(scorerCard){
      scorerCard.querySelectorAll('.match').forEach(row=>row.classList.add('scorer-row'));
      const sticker=[...scorerCard.querySelectorAll('span')].find(el=>el.textContent.trim()==='TOPSCORER');
      if(sticker){
        sticker.className='topscorer-sticker';
        sticker.removeAttribute('style');
        sticker.closest('.match')?.classList.add('top-scorer');
      }
    }
    return true;
  };

  if(!decorate()){
    const target=document.getElementById('app');
    if(target){
      const observer=new MutationObserver(()=>{
        if(decorate())observer.disconnect();
      });
      observer.observe(target,{childList:true,subtree:true});
    }
  }

  if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js?v=18').catch(()=>{});}
})();
