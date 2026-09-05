import json, os, urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo

API_KEY=os.environ.get('OPENAI_API_KEY','').strip()
if not API_KEY:
    print('OPENAI_API_KEY fehlt – bestehender Bericht bleibt unverändert.')
    raise SystemExit(0)

today=datetime.now(ZoneInfo('Europe/Zurich'))
date_display=today.strftime('%d.%m.%Y')

prompt=f'''Du bist Sportredaktor für den Schweizer Amateurfussball. Recherchiere mit Websuche die aktuelle Situation der IFV 5. Liga, Gruppe 4, Saison 2026/27. Fokus klar auf FC Eschenbach II.

Stichtag: {date_display} (Europe/Zurich).
Primärquelle: offizieller IFV Matchcenter. Offizielle Vereinsseite FC Eschenbach und öffentlich zugängliche Matchberichte dürfen ergänzend verwendet werden.

Erstelle einen aktuellen Bericht mit:
- Rückblick auf relevante Spiele/Entwicklungen der letzten 7 Tage
- aktuelle Situation: vollständige Gruppentabelle, Form und Einordnung
- Ausblick auf die kommenden 14 Tage
- verifizierte Eschenbach-Torschützen, falls publiziert
- Quellenlinks

WICHTIG: Nichts erfinden. Keine Torschützen, Aufstellungen, Verletzungen oder Spielverläufe ergänzen, wenn sie nicht verifizierbar sind. Wenn kein Matchbericht auffindbar ist, stütze dich nur auf Resultat-/Ereignisdaten.

Antworte ausschliesslich als valides JSON in exakt dieser Struktur:
{{
  "report_date":"DD.MM.YYYY",
  "title":"...",
  "lead":"...",
  "review":"...",
  "current_situation":"...",
  "outlook":"...",
  "eschenbach":{{"rank":1,"played":0,"wins":0,"draws":0,"losses":0,"goals_for":0,"goals_against":0,"goal_difference":0,"points":0,"form":"..."}},
  "recent_results":[{{"date":"DD.MM.YYYY","time":"","home":"...","away":"...","home_goals":0,"away_goals":0,"note":"..."}}],
  "standings":[{{"rank":1,"team":"...","played":0,"goal_difference":0,"points":0,"is_eschenbach":false}}],
  "upcoming_matches":[{{"date":"DD.MM.YYYY","time":"HH:MM","home":"...","away":"...","note":"..."}}],
  "scorers":[{{"name":"...","goals":1}}],
  "scorer_note":"...",
  "sources":[{{"title":"...","url":"https://..."}}]
}}
'''

payload={
    'model':'gpt-5.6-luna',
    'tools':[{'type':'web_search'}],
    'reasoning':{'effort':'low'},
    'input':prompt
}
req=urllib.request.Request(
    'https://api.openai.com/v1/responses',
    data=json.dumps(payload).encode('utf-8'),
    headers={'Authorization':f'Bearer {API_KEY}','Content-Type':'application/json'},
    method='POST'
)
with urllib.request.urlopen(req, timeout=180) as r:
    response=json.loads(r.read().decode('utf-8'))

text=response.get('output_text','').strip()
if not text:
    chunks=[]
    for item in response.get('output',[]):
        for content in item.get('content',[]) if isinstance(item,dict) else []:
            if isinstance(content,dict) and content.get('type') in ('output_text','text'):
                chunks.append(content.get('text',''))
    text=''.join(chunks).strip()

if text.startswith('```'):
    text=text.strip('`')
    if text.startswith('json'):
        text=text[4:].lstrip()

data=json.loads(text)
data['report_date']=date_display
data['generated_at']=today.strftime('%d.%m.%Y %H:%M')

os.makedirs('data',exist_ok=True)
with open('data/report.json','w',encoding='utf-8') as f:
    json.dump(data,f,ensure_ascii=False,indent=2)
    f.write('\n')
print('Bericht aktualisiert:', date_display)
