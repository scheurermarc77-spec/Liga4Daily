# Liga 4 Daily – FC Eschenbach II

Öffentliche Web-App für die **IFV 5. Liga, Gruppe 4** mit klarem Fokus auf **FC Eschenbach II**.

## Öffentliche Seite

Die Seite läuft über GitHub Pages und kann auf iPhone, Android und Computer direkt im Browser geöffnet werden:

`https://scheurermarc77-spec.github.io/Liga4Daily/`

## Aktualisierung

Es gibt **keine automatische tägliche Aktualisierung** mehr. Der Bericht wird nur dann neu recherchiert, wenn der Administrator die Aktualisierung manuell startet.

Auf der Webseite führt der Button **„Bericht aktualisieren“** zur passenden GitHub-Aktion. Dort:

1. **Run workflow** öffnen.
2. Nochmals **Run workflow** drücken.
3. Die Recherche läuft mit OpenAI-Websuche.
4. Der neue Bericht wird automatisch in `data/report.json` gespeichert und kurz danach auf GitHub Pages angezeigt.

Andere Besucher können die Seite lesen, aber ohne Schreibrechte keine Aktualisierung auslösen.

## OpenAI-Key

Der API-Key wird als GitHub Actions Secret mit dem Namen `OPENAI_API_KEY` gespeichert. Er gehört niemals in den öffentlichen Quellcode.

Pfad in GitHub:

**Settings → Secrets and variables → Actions → New repository secret**

Name: `OPENAI_API_KEY`

## Recherche

Primärquelle ist der offizielle IFV Matchcenter. Ergänzend werden die offizielle Website des FC Eschenbach und öffentlich zugängliche Vereins- bzw. Matchberichte berücksichtigt.

Der Bericht enthält:

- Rückblick
- aktuelle Situation und Tabelle
- Resultate
- Ausblick auf kommende Spiele
- verifizierte Torschützen, sofern publiziert
- Quellenlinks

Es werden keine nicht verifizierten Torschützen, Aufstellungen, Verletzungen oder Spielverläufe erfunden.

## Kostenkontrolle

OpenAI wird nur bei einer manuell ausgelösten Aktualisierung verwendet. Ohne Klick entstehen durch die OpenAI-Recherche keine neuen API-Kosten.

## Archiv

Die frühere native iPhone-Projektversion liegt weiterhin als ZIP im Repository. Für die öffentliche Nutzung wird jedoch ausschliesslich die Web-App benötigt.
