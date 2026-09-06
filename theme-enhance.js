(()=>{
  const fitPairing=row=>{
    const pairing=row?.children?.[1];
    if(!pairing||pairing.tagName!=='DIV')return;
    pairing.classList.add('match-pairing');
    pairing.style.whiteSpace='nowrap';
    pairing.style.fontSize='';
    pairing.style.letterSpacing='';
    requestAnimationFrame(()=>{
      let size=parseFloat(getComputedStyle(pairing).fontSize)||16;
      const minSize=9.5;
      while(pairing.scrollWidth>pairing.clientWidth&&size>minSize){
        size=Math.max(minSize,size-.5);
        pairing.style.fontSize=`${size}px`;
      }
      if(pairing.scrollWidth>pairing.clientWidth)pairing.style.letterSpacing='-.02em';
    });
  };

  const fitAllPairings=()=>{
    document.querySelectorAll('#app .review-card .match,#app .outlook-card .match').forEach(fitPairing);
  };

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

    document.querySelectorAll('#app .review-card .match,#app .outlook-card .match').forEach(row=>{
      if(row.textContent.includes('FC Eschenbach II'))row.classList.add('eschenbach-match');
      fitPairing(row);
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

  let resizeTimer=null;
  addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(fitAllPairings,100);
  });

  if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js?v=20').catch(()=>{});}
})();
