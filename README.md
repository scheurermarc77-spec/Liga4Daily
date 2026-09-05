# Version 3

Frisch neu erzeugte Projektversion für den Download.

# Liga 4 Daily v2 – FC Eschenbach II

SwiftUI-iPhone-App für die **IFV 5. Liga, Gruppe 4** mit klarem Fokus auf **FC Eschenbach II**.

## Neu in Version 2

- sportlicher Startscreen in Gelb/Schwarz
- eigenes App-Icon «FCE II – Liga 4 Daily»
- grosses aktuelles Mannschaftsfoto der 2. Mannschaft
- News-Startseite mit Rückblick, aktueller Situation und Ausblick
- prominente Vorschau auf das nächste Spiel
- eigene Tabellenansicht
- eigener Team-Bereich
- aktueller Kader 2026/27
- Trainer Daniel Muff und Assistent Elia Fischer-Amstutz
- Torschützenbereich
- tägliche automatische Webrecherche kann Torschützen und Kaderdaten mitliefern
- transparente Kennzeichnung, wenn Torschützendaten nicht für jedes Spiel vollständig publiziert sind

Das Mannschaftsfoto und die Kaderbasis stammen von der offiziellen Teamseite:
`https://fceschenbach.ch/aktive/2-mannschaft`

Der App-interne runde «FCE»-Badge ist eine eigene, reduzierte App-Marke und kein Ersatz für eine offizielle Logo-Datei. Eine offizielle Logo-PNG/SVG kann später ohne Änderung der Datenlogik eingesetzt werden.

## Datenquellen

Primär:
- IFV Matchcenter – 5. Liga, Gruppe 4
- IFV Teamseite FC Eschenbach II
- offizielle Website FC Eschenbach

Zusätzlich recherchiert das Backend öffentlich zugängliche Matchberichte und Detailseiten von Vereinen. Es darf keine Torschützen, Aufstellungen, Verletzungen oder Spielverläufe erfinden.

## App starten

Voraussetzungen:
- Mac mit Xcode
- iOS 17 oder neuer

1. `Liga4Daily.xcodeproj` öffnen.
2. Unter **Signing & Capabilities** das eigene Apple-Team auswählen.
3. Simulator oder iPhone auswählen.
4. **Run** drücken.

Ohne Backend-Konfiguration startet die App mit einer Demo auf Basis des Stands vom **5. September 2026**.

## Supabase vorbereiten

Im SQL Editor den Inhalt von

`backend/supabase/migrations/001_daily_reports.sql`

ausführen.

Danach die Edge Function deployen:

```bash
supabase login
supabase link --project-ref DEIN_PROJECT_REF
supabase functions deploy generate-daily-report --no-verify-jwt
```

Secrets setzen:

```bash
supabase secrets set OPENAI_API_KEY="DEIN_OPENAI_API_KEY"
supabase secrets set CRON_SECRET="EIN_LANGES_ZUFAELLIGES_PASSWORT"
supabase secrets set OPENAI_MODEL="gpt-5.5"
```

Der OpenAI-Key gehört **nie** in die iPhone-App.

## Täglichen Bericht erzeugen

```bash
curl -X POST \
  "https://DEIN_PROJECT_REF.supabase.co/functions/v1/generate-daily-report" \
  -H "x-cron-secret: EIN_LANGES_ZUFAELLIGES_PASSWORT" \
  -H "Content-Type: application/json"
```

## Automatische tägliche Recherche

Im Supabase Dashboard unter **Integrations → Cron** einen täglichen HTTP-Aufruf der Function einrichten.

Empfehlung:

`30 5 * * *`

Danach kann die iPhone-App den neuen Bericht morgens abrufen. Die lokale Erinnerung ist standardmässig auf **08:00 Uhr** eingestellt und kann in der App verändert werden.

## App mit Supabase verbinden

In der App auf das Zahnrad tippen und eintragen:
- Supabase Project URL
- Publishable Key bzw. legacy `anon` Key

Danach **Sichern**.

## Backend v2

Der Recherche-Agent liefert zusätzlich zu Rückblick, Situation, Ausblick, Resultaten, Tabelle und Spielplan:
- `scorers`: verifizierte Torschützen von Eschenbach II
- `scorer_note`: Hinweis zur Vollständigkeit
- `players`: aktueller Kader
- `coach`
- `assistant_coach`
- `team_photo_url`

Die neuen Felder sind in der iPhone-App optional. Dadurch kann die v2-App auch ältere v1-Berichte weiterhin öffnen.
