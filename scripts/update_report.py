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

RECHERCHE-ABLAUF – VERBINDLICH UND SYSTEMATISCH:
1. Ermittle zuerst im offiziellen IFV Matchcenter die AKTUELLE Zusammensetzung der 5. Liga, Gruppe 4, die vollständige Tabelle, die Resultate der letzten 7 Tage und die Spiele der kommenden 14 Tage.
2. Identifiziere anschliessend für JEDEN Verein bzw. jedes Team dieser Gruppe die offizielle Vereinswebsite. Die derzeit bekannten Teams sind u. a. FC Eschenbach II, FC Knutwil II, FC Hochdorf III, FC Dagmersellen, FC Wauwil-Egolzwil, FC Altbüron-Grossdietwil, FC Nebikon, FC Grosswangen-Ettiswil, FC Ruswil III und FC Schötz III. Falls sich die Gruppenzusammensetzung geändert hat, gilt immer die aktuelle IFV-Liste.
3. Durchsuche danach die offizielle Website JEDES dieser Vereine gezielt nach neuen Matchberichten, Spielberichten, News, Vorschauen, Rückblicken, Torschützenangaben oder sonstigen relevanten Meldungen zur 5.-Liga-Mannschaft bzw. zum betreffenden Gruppenteam. Suche nicht nur auf der Startseite, sondern auch in Bereichen wie News, Aktive, Herren, Teams, Spielberichte oder Matchberichte, soweit öffentlich zugänglich.
4. Suche besonders gründlich auf den offiziellen Websites des letzten Gegners und des nächsten Gegners von FC Eschenbach II.
5. Ergänze danach eine normale Websuche nach weiteren seriösen öffentlich zugänglichen Matchberichten, z. B. lokale Medien oder offizielle Vereinskanäle. Soziale Medien nur verwenden, wenn Inhalte öffentlich sichtbar und eindeutig verifizierbar sind.
6. Bevor du den Bericht schreibst, vergleiche alle gefundenen Angaben mit dem IFV Matchcenter. Bei Widersprüchen haben offizielle Resultat- und Tabellendaten des IFV Vorrang.
7. Verwende nur tatsächlich gefundene Informationen. Wenn auf einer Vereinswebsite kein aktueller Matchbericht vorhanden ist, erfinde nichts und lasse diesen Verein inhaltlich einfach weg. Die Website soll trotzdem im Rahmen der Recherche geprüft worden sein.

QUELLENPRIORITÄT:
- Primär: offizieller IFV Matchcenter für Resultate, Tabelle, Termine und offizielle Matchdaten.
- Danach: offizielle Websites ALLER Vereine der aktuellen Gruppe 4.
- Danach: seriöse lokale Medien und andere öffentlich zugängliche, verifizierbare Quellen.

Erstelle einen aktuellen Bericht mit:
- Rückblick auf relevante Spiele/Entwicklungen der letzten 7 Tage
- aktuelle Situation: vollständige Gruppentabelle, Form und Einordnung
- Ausblick auf die kommenden 14 Tage
- verifizierte Eschenbach-Torschützen, falls publiziert
- interessante, verifizierte Details aus Matchberichten der beteiligten Vereine, sofern vorhanden
- Quellenlinks zu den tatsächlich verwendeten Seiten

WICHTIG: Nichts erfinden. Keine Torschützen, Aufstellungen, Verletzungen oder Spielverläufe ergänzen, wenn sie nicht verifizierbar sind. Wenn kein Matchbericht auffindbar ist, stütze dich nur auf Resultat-/Ereignisdaten. Ein Matchbericht darf nur dann als Grundlage für Details dienen, wenn er eindeutig zum richtigen Spiel und Team gehört.

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
