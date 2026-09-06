(()=>{
  const el=document.getElementById('bottomUpdate');
  if(!el)return;
  const url='https://github.com/scheurermarc77-spec/Liga4Daily/actions/workflows/daily-report.yml';
  let timer=null;
  const cancel=()=>{if(timer){clearTimeout(timer);timer=null;}};
  const start=e=>{
    cancel();
    timer=setTimeout(()=>{
      timer=null;
      window.open(url,'_blank','noopener');
    },1400);
  };
  el.addEventListener('click',e=>e.preventDefault());
  el.addEventListener('contextmenu',e=>e.preventDefault());
  el.addEventListener('pointerdown',start);
  el.addEventListener('pointerup',cancel);
  el.addEventListener('pointercancel',cancel);
  el.addEventListener('pointerleave',cancel);
})();
