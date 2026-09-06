(()=>{
  const button=document.getElementById('appMenuButton');
  const panel=document.getElementById('appMenuPanel');
  if(!button||!panel)return;

  const sectionByHeading=heading=>[...document.querySelectorAll('#app > section')].find(section=>section.querySelector(':scope > h2')?.textContent?.trim()===heading);
  const resolveTarget=name=>{
    if(name==='review')return sectionByHeading('Rückblick');
    if(name==='current')return sectionByHeading('Aktuelle Situation');
    if(name==='outlook')return sectionByHeading('Ausblick');
    if(name==='tip')return document.querySelector('#app .match-tip-card');
    if(name==='scorers')return sectionByHeading('Eschenbach-Torschützen');
    if(name==='upcoming')return [...document.querySelectorAll('#app .section-subtitle')].find(el=>el.textContent?.trim()==='Kommende Spiele');
    return null;
  };

  const decorateTargets=()=>{
    const ids={review:'rueckblick',current:'aktuell',outlook:'ausblick',tip:'resultat-tipp',scorers:'torschuetzen',upcoming:'kommende-spiele'};
    Object.entries(ids).forEach(([name,id])=>{
      const target=resolveTarget(name);
      if(target){target.id=id;target.classList.add('menu-scroll-target');}
    });
  };

  const close=()=>{
    panel.hidden=true;
    button.setAttribute('aria-expanded','false');
  };
  const open=()=>{
    panel.hidden=false;
    button.setAttribute('aria-expanded','true');
  };

  button.addEventListener('click',()=>panel.hidden?open():close());
  panel.addEventListener('click',event=>{
    const item=event.target.closest('[data-menu-target]');
    if(!item)return;
    const target=resolveTarget(item.dataset.menuTarget);
    close();
    if(target)setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'start'}),40);
  });
  document.addEventListener('click',event=>{
    if(panel.hidden||panel.contains(event.target)||button.contains(event.target))return;
    close();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});

  decorateTargets();
  const app=document.getElementById('app');
  if(app){new MutationObserver(decorateTargets).observe(app,{childList:true,subtree:true});}
})();