import json, os, urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo

API_KEY=os.environ.get('OPENAI_API_KEY','').strip()
if not API_KEY:
    print('OPENAI_API_KEY fehlt – bestehender Bericht bleibt unverändert.')
    raise SystemExit(0)

today=datetime.now(ZoneInfo('Europe/Zurich'))
date_display=today.strftime('%d.%m.%Y')


def call_web_json(prompt_text, timeout=180):
    payload={
        'model':'gpt-5.6-luna',
        'tools':[{'type':'web_search'}],
        'reasoning':{'effort':'low'},
        'input':prompt_text
    }
    req=urllib.request.Request(
        'https://api.openai.com/v1/responses',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Authorization':f'Bearer {API_KEY}','Content-Type':'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
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
        lines=text.splitlines()
        if lines and lines[0].startswith('```'):
            lines=lines[1:]
        if lines and lines[-1].strip()=='```':
            lines=lines[:-1]
        text='\n'.join(lines).strip()
        if text.startswith('json'):
            text=text[4:].lstrip()
    return json.loads(text)


def normalize_scorers(items):
    merged={}
    names={}
    for item in items or []:
        if not isinstance(item,dict):
            continue
        name=str(item.get('name','')).strip()
        if not name:
            continue
        try:
            goals=int(item.get('goals',0))
        except (TypeError,ValueError):
            continue
        if goals<=0:
            continue
        key=' '.join(name.split()).casefold()
        merged[key]=merged.get(key,0)+goals
        names.setdefault(key,' '.join(name.split()))
    result=[{'name':names[k],'goals':v} for k,v in merged.items()]
    result.sort(key=lambda x:(-x['goals'],x['name'].casefold()))
    return result


prompt=f'''Du bist Sportredaktor für den Schweizer Amateurfussball. Recherchiere mit Websuche die aktuelle Situation der IFV 5. Liga, Gruppe 4, Saison 2026/27. Fokus klar auf FC Eschenbach II.

Stichtag: {date_display} (Europe/Zurich).

RECHERCHE-ABLAUF – VERBINDLICH UND SYSTEMATISCH:
1. Ermittle zuerst im offiziellen IFV Matchcenter die AKTUELLE Zusammensetzung der 5. Liga, Gruppe 4, die vollständige Tabelle, die Resultate der letzten 7 Tage und die Spiele der kommenden 14 Tage.
2. Übernimm für JEDES Team sämtliche in der IFV-Rangliste ausgewiesenen Tabellenwerte: Rang, Spiele, Siege, Unentschieden, Niederlagen, Strafpunkte, Tore erzielt, Tore erhalten, Tordifferenz und Punkte. Keine dieser Angaben weglassen. Falls der IFV einen Wert in Klammern ausweist, handelt es sich um die Strafpunkte.
3. Identifiziere anschliessend für JEDEN Verein bzw. jedes Team dieser Gruppe die offizielle Vereinswebsite. Die derzeit bekannten Teams sind u. a. FC Eschenbach II, FC Knutwil II, FC Hochdorf III, FC Dagmersellen, FC Wauwil-Egolzwil, FC Altbüron-Grossdietwil, SC Nebikon, FC Grosswangen-Ettiswil, FC Ruswil III und FC Schötz III. Falls sich die Gruppenzusammensetzung geändert hat, gilt immer die aktuelle IFV-Liste.
4. Durchsuche danach die offizielle Website JEDES dieser Vereine gezielt nach neuen Matchberichten, Spielberichten, News, Vorschauen, Rückblicken, Torschützenangaben oder sonstigen relevanten Meldungen zur 5.-Liga-Mannschaft bzw. zum betreffenden Gruppenteam. Suche nicht nur auf der Startseite, sondern auch in Bereichen wie News, Aktive, Herren, Teams, Spielberichte oder Matchberichte, soweit öffentlich zugänglich.
5. Suche besonders gründlich auf den offiziellen Websites des letzten Gegners und des nächsten Gegners von FC Eschenbach II.
6. Ergänze danach eine normale Websuche nach weiteren seriösen öffentlich zugänglichen Matchberichten, z. B. lokale Medien oder offizielle Vereinskanäle. Soziale Medien nur verwenden, wenn Inhalte öffentlich sichtbar und eindeutig verifizierbar sind.
7. Bevor du den Bericht schreibst, vergleiche alle gefundenen Angaben mit dem IFV Matchcenter. Bei Widersprüchen haben offizielle Resultat- und Tabellendaten des IFV Vorrang.
8. Verwende nur tatsächlich gefundene Informationen. Wenn auf einer Vereinswebsite kein aktueller Matchbericht vorhanden ist, erfinde nichts und lasse diesen Verein inhaltlich einfach weg. Die Website soll trotzdem im Rahmen der Recherche geprüft worden sein.

QUELLENPRIORITÄT:
- Primär: offizieller IFV Matchcenter für Resultate, Tabelle, Termine und offizielle Matchdaten.
- Danach: offizielle Websites ALLER Vereine der aktuellen Gruppe 4.
- Danach: seriöse lokale Medien und andere öffentlich zugängliche, verifizierbare Quellen.

Erstelle einen aktuellen Bericht mit:
- Rückblick auf relevante Spiele/Entwicklungen der letzten 7 Tage
- aktuelle Situation: vollständige Gruppentabelle, Form und Einordnung
- Ausblick auf die kommenden 14 Tage
- interessante, verifizierte Details aus Matchberichten der beteiligten Vereine, sofern vorhanden
- Quellenlinks zu den tatsächlich verwendeten Seiten für die interne Nachvollziehbarkeit

WICHTIG: Nichts erfinden. Keine Torschützen, Aufstellungen, Verletzungen oder Spielverläufe ergänzen, wenn sie nicht verifizierbar sind. Wenn kein Matchbericht auffindbar ist, stütze dich nur auf Resultat-/Ereignisdaten. Ein Matchbericht darf nur dann als Grundlage für Details dienen, wenn er eindeutig zum richtigen Spiel und Team gehört. Die Saison-Torschützen von Eschenbach II werden anschliessend in einem separaten, verbindlichen Audit über ALLE bisherigen Meisterschaftsspiele nochmals vollständig geprüft.

Antworte ausschliesslich als valides JSON in exakt dieser Struktur:
{{
  "report_date":"DD.MM.YYYY",
  "title":"...",
  "lead":"...",
  "review":"...",
  "current_situation":"...",
  "outlook":"...",
  "eschenbach":{{"rank":1,"played":0,"wins":0,"draws":0,"losses":0,"penalty_points":0,"goals_for":0,"goals_against":0,"goal_difference":0,"points":0,"form":"..."}},
  "recent_results":[{{"date":"DD.MM.YYYY","time":"","home":"...","away":"...","home_goals":0,"away_goals":0,"note":"..."}}],
  "standings":[{{"rank":1,"team":"...","played":0,"wins":0,"draws":0,"losses":0,"penalty_points":0,"goals_for":0,"goals_against":0,"goal_difference":0,"points":0,"is_eschenbach":false}}],
  "upcoming_matches":[{{"date":"DD.MM.YYYY","time":"HH:MM","home":"...","away":"...","note":"..."}}],
  "scorers":[],
  "scorer_note":"Die Saison-Torschützen werden separat geprüft.",
  "sources":[{{"title":"...","url":"https://..."}}]
}}
'''

data=call_web_json(prompt, timeout=180)

# Separater Torschützen-Audit: jedes bisherige Meisterschaftsspiel von Eschenbach II prüfen.
expected_goals=int(data.get('eschenbach',{}).get('goals_for') or 0)
scorer_prompt=f'''Du bist Datenprüfer für Schweizer Amateurfussball. Ermittle die VOLLSTÄNDIGE Saison-Torschützenliste von FC Eschenbach II in der IFV 5. Liga, Gruppe 4, Saison 2026/27 bis einschliesslich {date_display}.

VERBINDLICHES VORGEHEN:
1. Ermittle im offiziellen IFV Matchcenter zuerst ALLE bis zum Stichtag bereits ausgetragenen MEISTERSCHAFTSSPIELE von FC Eschenbach II. Keine Cup-, Test- oder Freundschaftsspiele einbeziehen.
2. Öffne für JEDES dieser Spiele die einzelne IFV-Matchdetailseite und erfasse jedes Tor von FC Eschenbach II mit Torschütze. Falls ein Spieler in einem Spiel mehrfach trifft, erfasse die korrekte Anzahl.
3. Eigentore des Gegners zugunsten von Eschenbach separat als own_goals zählen und NICHT einem Eschenbach-Spieler zuschreiben.
4. Falls eine IFV-Matchdetailseite die Torschützen nicht vollständig zeigt, suche für GENAU DIESES SPIEL zusätzlich auf den offiziellen Websites von FC Eschenbach und des Gegners sowie in verifizierbaren Matchberichten. Nutze auch öffentlich erreichbare IFV-/Matchcenter-Spiegel oder Detailvarianten, wenn sie denselben offiziellen Spieldatensatz zeigen.
5. Führe identische Spielernamen zusammen und summiere sämtliche Tore seit Saisonbeginn. Sortiere die Torschützen absteigend nach Toranzahl, bei Gleichstand alphabetisch.
6. KONTROLLSUMME: Die Summe aller Spielertore plus own_goals muss exakt der offiziellen Anzahl erzielter Saisontore von Eschenbach II entsprechen. Laut der eben ermittelten Tabelle sind das {expected_goals} Tore. Falls deine erste Summe nicht stimmt, suche weiter und prüfe jedes Spiel nochmals, bevor du antwortest.
7. Nichts schätzen und nichts erfinden. Wenn trotz zweiter Prüfung einzelne Tore nicht zugeordnet werden können, setze complete=false und gib exakt an, wie viele Tore noch fehlen.

Antworte ausschliesslich als valides JSON:
{{
  "complete":true,
  "expected_goals":{expected_goals},
  "own_goals":0,
  "scorers":[{{"name":"...","goals":1}}],
  "checked_matches":[{{"date":"DD.MM.YYYY","opponent":"...","result":"...","scorers":"...","own_goals":0}}],
  "note":"..."
}}
'''

audit=call_web_json(scorer_prompt, timeout=240)
audit_scorers=normalize_scorers(audit.get('scorers',[]))
try:
    own_goals=max(0,int(audit.get('own_goals',0) or 0))
except (TypeError,ValueError):
    own_goals=0
player_goals=sum(x['goals'] for x in audit_scorers)
accounted=player_goals+own_goals
complete=bool(audit.get('complete')) and accounted==expected_goals

# Falls die Kontrollsumme noch nicht stimmt, genau die fehlenden Tore in einem zweiten Audit suchen.
if not complete and expected_goals>0:
    missing=expected_goals-accounted
    retry_prompt=f'''Prüfe die Saison-Torschützen von FC Eschenbach II nochmals vollständig. Die erste Prüfung hat nur {accounted} von offiziell {expected_goals} erzielten Meisterschaftstoren zugeordnet; Differenz: {missing}.

Bisheriges Audit:
{json.dumps(audit, ensure_ascii=False)}

Gehe erneut JEDES bisherige Meisterschaftsspiel der Saison 2026/27 einzeln durch. Öffne die IFV-Matchdetailseiten und suche für Spiele mit fehlenden Angaben zusätzlich auf den offiziellen Websites von FC Eschenbach und dem jeweiligen Gegner sowie nach offiziellen Matchcenter-Spiegeln desselben Spiels. Ergänze die fehlenden Torschützen oder Eigentore, ohne bereits verifizierte Tore doppelt zu zählen. Die Endsumme aus Spielertoren plus Eigentoren muss exakt {expected_goals} ergeben. Nichts erfinden.

Antworte ausschliesslich als valides JSON im selben Format:
{{"complete":true,"expected_goals":{expected_goals},"own_goals":0,"scorers":[{{"name":"...","goals":1}}],"checked_matches":[{{"date":"DD.MM.YYYY","opponent":"...","result":"...","scorers":"...","own_goals":0}}],"note":"..."}}
'''
    retry=call_web_json(retry_prompt, timeout=240)
    retry_scorers=normalize_scorers(retry.get('scorers',[]))
    try:
        retry_own=max(0,int(retry.get('own_goals',0) or 0))
    except (TypeError,ValueError):
        retry_own=0
    retry_total=sum(x['goals'] for x in retry_scorers)+retry_own
    if retry_total>=accounted:
        audit=retry
        audit_scorers=retry_scorers
        own_goals=retry_own
        player_goals=sum(x['goals'] for x in audit_scorers)
        accounted=retry_total
        complete=bool(retry.get('complete')) and accounted==expected_goals

data['scorers']=audit_scorers
data['own_goals']=own_goals
if complete:
    suffix=f' Zusätzlich {own_goals} Eigentor' + ('e' if own_goals!=1 else '') + ' zugunsten von Eschenbach.' if own_goals else ''
    data['scorer_note']=f'Alle bisherigen Meisterschaftsspiele von FC Eschenbach II wurden einzeln geprüft. {player_goals} Spielertore{suffix} Kontrollsumme: {accounted} von {expected_goals} Saisontoren.'
else:
    missing=max(0,expected_goals-accounted)
    data['scorer_note']=f'Torschützen-Audit über alle bisherigen Meisterschaftsspiele durchgeführt. Verifiziert zugeordnet: {accounted} von {expected_goals} Toren; noch nicht eindeutig zuordenbar: {missing}.'

data['scorer_audit']={
    'complete':complete,
    'expected_goals':expected_goals,
    'player_goals':player_goals,
    'own_goals':own_goals,
    'accounted_goals':accounted,
    'checked_matches':audit.get('checked_matches',[])
}

data['report_date']=date_display
data['generated_at']=today.strftime('%d.%m.%Y %H:%M')

os.makedirs('data',exist_ok=True)
with open('data/report.json','w',encoding='utf-8') as f:
    json.dump(data,f,ensure_ascii=False,indent=2)
    f.write('\n')
print('Bericht aktualisiert:', date_display)
print('Torschützen-Audit:', 'vollständig' if complete else 'unvollständig', f'({accounted}/{expected_goals})')
