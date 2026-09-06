const app=document.getElementById('app');
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const val=v=>v===null||v===undefined?'–':esc(v);
const matchHTML=m=>`<div class="match"><div class="muted">${esc(m.date)} ${esc(m.time||'')}</div><div><strong>${esc(m.home)}</strong> – <strong>${esc(m.away)}</strong> ${m.home_goals!=null?`<span class="score">${m.home_goals}:${m.away_goals}</span>`:''}</div>${m.note?`<div class="muted">${esc(m.note)}</div>`:''}</div>`;

// Übergang für den bereits gespeicherten Bericht vom 06.09.2026.
// Neue Recherchen liefern diese Werte direkt aus dem IFV Matchcenter.
const legacyStats={
  'FC Eschenbach II':{wins:3,draws:0,losses:0,penalty_points:1,goals_for:14,goals_against:4},
  'FC Knutwil II':{wins:2,draws:1,losses:0,penalty_points:2,goals_for:9,goals_against:3},
  'FC Dagmersellen':{wins:2,draws:0,losses:0,penalty_points:0,goals_for:9,goals_against:2},
  'FC Hochdorf III':{wins:2,draws:0,losses:1,penalty_points:0,goals_for:24,goals_against:4},
  'FC Altbüron-Grossdietwil':{wins:1,draws:0,losses:1,penalty_points:3,goals_for:5,goals_against:8},
  'FC Ruswil III':{wins:1,draws:0,losses:2,penalty_points:1,goals_for:8,goals_against:8},
  'FC Wauwil-Egolzwil':{wins:1,draws:0,losses:2,penalty_points:2,goals_for:8,goals_against:14},
  'SC Nebikon':{wins:0,draws:1,losses:1,penalty_points:1,goals_for:3,goals_against:6},
  'FC Grosswangen-Ettiswil':{wins:0,draws:0,losses:2,penalty_points:0,goals_for:2,goals_against:8},
  'FC Schötz III':{wins:0,draws:0,losses:3,penalty_points:5,goals_for:0,goals_against:25}
};
const fullRow=r=>({...legacyStats[r.team],...r});

function freshnessInfo(value){
  if(!value)return{date:'unbekannt',time:'',tone:'stale'};
  const m=String(value).match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
  if(!m)return{date:esc(value),time:'',tone:'fresh'};
  const dt=new Date(Number(m[3]),Number(m[2])-1,Number(m[1]),Number(m[4]),Number(m[5]));
  const hours=(new Date()-dt)/3600000;
  return{date:`${m[1]}.${m[2]}.${m[3]}`,time:`${m[4]}:${m[5]} Uhr`,tone:hours<24?'fresh':hours<72?'warm':'stale'};
}

function render(d){
  const e=d.eschenbach||{};
  const fresh=freshnessInfo(d.generated_at);
  app.innerHTML=`
<section class="team-photo-inline" id="teamPhotoCard">
  <img src="team-photo.jpg?v=3" alt="Mannschaft FC Eschenbach II" loading="eager" onerror="document.getElementById('teamPhotoCard').style.display='none'">
</section>
<section class="card report-card">
  <div class="update-sticker ${fresh.tone}" aria-label="Aktualisiert am ${fresh.date} ${fresh.time}">
    <span class="update-sticker-icon" aria-hidden="true">↻</span>
    <div class="update-sticker-copy"><span>AKTUALISIERT AM</span><strong>${fresh.date}</strong>${fresh.time?`<small>${fresh.time}</small>`:''}</div>
  </div>
  <span class="pill">FC ESCHENBACH II</span><h2 style="font-size:27px;margin-top:10px">${esc(d.title)}</h2><p class="lead">${esc(d.lead)}</p>
</section>
<section class="grid"><div class="stat"><strong>${esc(e.rank?`#${e.rank}`:'–')}</strong><span>Rang</span></div><div class="stat"><strong>${val(e.points)}</strong><span>Punkte</span></div><div class="stat"><strong>${val(e.wins)}</strong><span>Siege</span></div></section>
<section class="card"><h2>Rückblick</h2><p>${esc(d.review)}</p>${(d.recent_results||[]).map(matchHTML).join('')}</section>
<section class="card standings-card"><h2>Aktuelle Situation</h2><p>${esc(d.current_situation)}</p><div class="table-wrap"><table class="standings"><thead><tr><th>#</th><th>Team</th><th>Sp</th><th>S</th><th>U</th><th>N</th><th>Str</th><th>Tore</th><th>TD</th><th>Pkt</th></tr></thead><tbody>${(d.standings||[]).map(raw=>{const r=fullRow(raw);return`<tr class="${r.is_eschenbach?'fce':''}"><td>${val(r.rank)}</td><td>${esc(r.team)}</td><td>${val(r.played)}</td><td>${val(r.wins)}</td><td>${val(r.draws)}</td><td>${val(r.losses)}</td><td>${val(r.penalty_points)}</td><td>${r.goals_for!=null&&r.goals_against!=null?`${r.goals_for}:${r.goals_against}`:'–'}</td><td>${r.goal_difference!=null?`${r.goal_difference>0?'+':''}${r.goal_difference}`:'–'}</td><td><strong>${val(r.points)}</strong></td></tr>`}).join('')}</tbody></table></div><div class="table-legend">Sp = Spiele · S = Siege · U = Unentschieden · N = Niederlagen · Str = Strafpunkte · TD = Tordifferenz</div></section>
<section class="card"><h2>Ausblick</h2><p>${esc(d.outlook)}</p><h3 class="section-subtitle">Kommende Spiele</h3>${(d.upcoming_matches||[]).map(matchHTML).join('')}</section>
${d.scorers?.length?`<section class="card"><h2>Eschenbach-Torschützen</h2>${d.scorers.map(s=>`<div class="match"><strong>${esc(s.name)}</strong> · ${esc(s.goals)} Tore</div>`).join('')}<div class="muted">${esc(d.scorer_note||'')}</div></section>`:''}`;
}

fetch('data/report.json?'+Date.now()).then(r=>{if(!r.ok)throw Error();return r.json()}).then(render).catch(()=>app.innerHTML='<section class="status-card">Der Tagesbericht konnte gerade nicht geladen werden.</section>');

const logoButton=document.getElementById('logoButton');
const logoModal=document.getElementById('logoModal');
const logoClose=document.getElementById('logoClose');
function openModal(modal,closeButton){if(!modal)return;modal.hidden=false;modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');closeButton?.focus();}
function closeModal(modal,returnFocus){if(!modal)return;modal.hidden=true;modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');returnFocus?.focus();}
function openLogo(){openModal(logoModal,logoClose)}
function closeLogo(){closeModal(logoModal,logoButton)}
logoButton?.addEventListener('click',openLogo);
logoClose?.addEventListener('click',closeLogo);
logoModal?.addEventListener('click',e=>{if(e.target===logoModal)closeLogo();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&logoModal&&!logoModal.hidden)closeLogo();});
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js?v=13').catch(()=>{})}
