const app=document.getElementById('app');
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const matchHTML=m=>`<div class="match"><div class="muted">${esc(m.date)} ${esc(m.time||'')}</div><div><strong>${esc(m.home)}</strong> – <strong>${esc(m.away)}</strong> ${m.home_goals!=null?`<span class="score">${m.home_goals}:${m.away_goals}</span>`:''}</div>${m.note?`<div class="muted">${esc(m.note)}</div>`:''}</div>`;
function render(d){const e=d.eschenbach||{};app.innerHTML=`
<section class="card"><span class="pill">FC ESCHENBACH II</span><h2 style="font-size:27px;margin-top:10px">${esc(d.title)}</h2><p class="lead">${esc(d.lead)}</p></section>
<section class="card team-photo-card" id="teamPhotoCard"><h2>Mannschaft FC Eschenbach II</h2><button id="teamPhotoButton" class="team-photo-button" type="button" aria-label="Mannschaftsbild vergrössern"><img class="team-photo-thumb" src="team-photo.jpg?v=1" alt="Mannschaft FC Eschenbach II" loading="lazy" onerror="document.getElementById('teamPhotoCard').style.display='none'"><span class="team-photo-caption"><strong>Offizielles Mannschaftsbild</strong><span>Antippen zum Vergrössern ↗</span></span></button></section>
<section class="grid"><div class="stat"><strong>${esc(e.rank?`#${e.rank}`:'–')}</strong><span>Rang</span></div><div class="stat"><strong>${esc(e.points??'–')}</strong><span>Punkte</span></div><div class="stat"><strong>${esc(e.form||'–')}</strong><span>Form</span></div></section>
<section class="card"><h2>Rückblick</h2><p>${esc(d.review)}</p>${(d.recent_results||[]).map(matchHTML).join('')}</section>
<section class="card"><h2>Aktuelle Situation</h2><p>${esc(d.current_situation)}</p><div class="table-wrap"><table class="standings"><thead><tr><th>#</th><th>Team</th><th>Sp.</th><th>TD</th><th>Pkt.</th></tr></thead><tbody>${(d.standings||[]).map(r=>`<tr class="${r.is_eschenbach?'fce':''}"><td>${r.rank}</td><td>${esc(r.team)}</td><td>${r.played}</td><td>${r.goal_difference>0?'+':''}${r.goal_difference}</td><td><strong>${r.points}</strong></td></tr>`).join('')}</tbody></table></div></section>
<section class="card"><h2>Ausblick</h2><p>${esc(d.outlook)}</p>${(d.upcoming_matches||[]).map(matchHTML).join('')}</section>
${d.scorers?.length?`<section class="card"><h2>Eschenbach-Torschützen</h2>${d.scorers.map(s=>`<div class="match"><strong>${esc(s.name)}</strong> · ${esc(s.goals)} Tore</div>`).join('')}<div class="muted">${esc(d.scorer_note||'')}</div></section>`:''}
<section class="card"><h2>Quellen</h2>${(d.sources||[]).map(s=>`<a class="source" target="_blank" rel="noopener" href="${esc(s.url)}">${esc(s.title||s.url)} ↗</a>`).join('')}</section>
<div class="updated">Stand: ${esc(d.report_date)} · aktualisiert ${esc(d.generated_at||'')}</div>`}
fetch('data/report.json?'+Date.now()).then(r=>{if(!r.ok)throw Error();return r.json()}).then(render).catch(()=>app.innerHTML='<section class="status-card">Der Tagesbericht konnte gerade nicht geladen werden.</section>');

const logoButton=document.getElementById('logoButton');
const logoModal=document.getElementById('logoModal');
const logoClose=document.getElementById('logoClose');
const teamPhotoModal=document.getElementById('teamPhotoModal');
const teamPhotoClose=document.getElementById('teamPhotoClose');

function openModal(modal,closeButton){if(!modal)return;modal.hidden=false;modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');closeButton?.focus();}
function closeModal(modal,returnFocus){if(!modal)return;modal.hidden=true;modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');returnFocus?.focus();}
function openLogo(){openModal(logoModal,logoClose)}
function closeLogo(){closeModal(logoModal,logoButton)}
function openTeamPhoto(){openModal(teamPhotoModal,teamPhotoClose)}
function closeTeamPhoto(){closeModal(teamPhotoModal,document.getElementById('teamPhotoButton'))}

logoButton?.addEventListener('click',openLogo);
logoClose?.addEventListener('click',closeLogo);
logoModal?.addEventListener('click',e=>{if(e.target===logoModal)closeLogo();});
teamPhotoClose?.addEventListener('click',closeTeamPhoto);
teamPhotoModal?.addEventListener('click',e=>{if(e.target===teamPhotoModal)closeTeamPhoto();});
document.addEventListener('click',e=>{if(e.target.closest('#teamPhotoButton'))openTeamPhoto();});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(logoModal&&!logoModal.hidden)closeLogo();if(teamPhotoModal&&!teamPhotoModal.hidden)closeTeamPhoto();});

if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js?v=8').catch(()=>{})}
