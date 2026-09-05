const app=document.getElementById('app');
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const matchHTML=m=>`<div class="match"><div class="muted">${esc(m.date)} ${esc(m.time||'')}</div><div><strong>${esc(m.home)}</strong> – <strong>${esc(m.away)}</strong> ${m.home_goals!=null?`<span class="score">${m.home_goals}:${m.away_goals}</span>`:''}</div>${m.note?`<div class="muted">${esc(m.note)}</div>`:''}</div>`;
function render(d){const e=d.eschenbach||{};app.innerHTML=`
<section class="card"><span class="pill">FC ESCHENBACH II</span><h2 style="font-size:27px;margin-top:10px">${esc(d.title)}</h2><p class="lead">${esc(d.lead)}</p></section>
<section class="grid"><div class="stat"><strong>${esc(e.rank?`#${e.rank}`:'–')}</strong><span>Rang</span></div><div class="stat"><strong>${esc(e.points??'–')}</strong><span>Punkte</span></div><div class="stat"><strong>${esc(e.form||'–')}</strong><span>Form</span></div></section>
<section class="card"><h2>Rückblick</h2><p>${esc(d.review)}</p>${(d.recent_results||[]).map(matchHTML).join('')}</section>
<section class="card"><h2>Aktuelle Situation</h2><p>${esc(d.current_situation)}</p><div class="table-wrap"><table class="standings"><thead><tr><th>#</th><th>Team</th><th>Sp.</th><th>TD</th><th>Pkt.</th></tr></thead><tbody>${(d.standings||[]).map(r=>`<tr class="${r.is_eschenbach?'fce':''}"><td>${r.rank}</td><td>${esc(r.team)}</td><td>${r.played}</td><td>${r.goal_difference>0?'+':''}${r.goal_difference}</td><td><strong>${r.points}</strong></td></tr>`).join('')}</tbody></table></div></section>
<section class="card"><h2>Ausblick</h2><p>${esc(d.outlook)}</p>${(d.upcoming_matches||[]).map(matchHTML).join('')}</section>
${d.scorers?.length?`<section class="card"><h2>Eschenbach-Torschützen</h2>${d.scorers.map(s=>`<div class="match"><strong>${esc(s.name)}</strong> · ${esc(s.goals)} Tore</div>`).join('')}<div class="muted">${esc(d.scorer_note||'')}</div></section>`:''}
<section class="card"><h2>Quellen</h2>${(d.sources||[]).map(s=>`<a class="source" target="_blank" rel="noopener" href="${esc(s.url)}">${esc(s.title||s.url)} ↗</a>`).join('')}</section>
<div class="updated">Stand: ${esc(d.report_date)} · aktualisiert ${esc(d.generated_at||'')}</div>`}
fetch('data/report.json?'+Date.now()).then(r=>{if(!r.ok)throw Error();return r.json()}).then(render).catch(()=>app.innerHTML='<section class="status-card">Der Tagesbericht konnte gerade nicht geladen werden.</section>');
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{})}
