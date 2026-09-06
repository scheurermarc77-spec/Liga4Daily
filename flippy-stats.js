(()=>{
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const enhance=()=>{
    const grid=document.querySelector('#app .grid');
    if(!grid||grid.classList.contains('stats-flip'))return false;
    const cards=[...grid.querySelectorAll('.stat')];
    if(cards.length<3)return false;
    const rank=cards[0].querySelector('strong')?.textContent?.trim()||'–';
    const points=cards[1].querySelector('strong')?.textContent?.trim()||'–';
    const winsRaw=cards[2].querySelector('strong')?.textContent?.trim()||'0';
    const wins=Number(String(winsRaw).replace(/[^0-9-]/g,''))||0;
    const leader=rank==='#1'?'LEADER':`RANG ${rank.replace('#','')}`;
    const marks=Array.from({length:5},(_,i)=>`<span class="wins-mark${i<wins?'':' dim'}"></span>`).join('');
    grid.classList.add('stats-flip');
    grid.innerHTML=`
      <div class="stat stat-rank" aria-label="${esc(rank)} Rang">
        <span class="rank-sticker">${esc(leader)}</span>
        <strong class="rank-number">${esc(rank)}</strong>
        <span class="rank-label">Rang</span>
      </div>
      <div class="stat stat-points" aria-label="${esc(points)} Punkte">
        <div class="points-orbit"><strong class="points-number">${esc(points)}</strong></div>
        <div class="points-copy"><b>Punkte</b><small>Saison 26/27</small></div>
        <span class="points-label">Punktestand</span>
      </div>
      <div class="stat stat-wins" aria-label="${esc(winsRaw)} Siege">
        <strong class="wins-number">${esc(winsRaw)}</strong>
        <div class="wins-copy"><b>SIEGE</b><small>Saisonsiege</small><div class="wins-marks" aria-hidden="true">${marks}</div></div>
      </div>`;
    return true;
  };
  if(!enhance()){
    const target=document.getElementById('app');
    if(target){
      const observer=new MutationObserver(()=>{if(enhance())observer.disconnect();});
      observer.observe(target,{childList:true,subtree:true});
    }
  }
  if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js?v=17').catch(()=>{});}
})();
