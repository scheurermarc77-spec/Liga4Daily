(()=>{
  const button=document.getElementById('shareAppButton');
  const toast=document.getElementById('shareToast');
  if(!button)return;
  const url='https://go-eschenbach-ii.github.io/';
  let timer=null;
  const showToast=text=>{
    if(!toast)return;
    toast.textContent=text;
    toast.hidden=false;
    clearTimeout(timer);
    timer=setTimeout(()=>{toast.hidden=true},1800);
  };
  button.addEventListener('click',async()=>{
    const data={title:'GO Eschenbach II',text:'GO Eschenbach II – der aktuelle Überblick rund um FC Eschenbach II.',url};
    try{
      if(navigator.share){
        await navigator.share(data);
        return;
      }
      if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(url);
        showToast('Link kopiert');
        return;
      }
      const area=document.createElement('textarea');
      area.value=url;
      area.setAttribute('readonly','');
      area.style.position='fixed';
      area.style.opacity='0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      showToast('Link kopiert');
    }catch(error){
      if(error?.name!=='AbortError')showToast('Teilen nicht möglich');
    }
  });
})();
