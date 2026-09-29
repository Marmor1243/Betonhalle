# Betonhalle

Ein browserbasierter 3D-Arena-Shooter aus der Egoperspektive, gebaut mit [Three.js](https://threejs.org/) und [Vite](https://vitejs.dev/). Kämpfe dich in endlosen Bot-Wellen durch eine Betonhalle oder spiele dich durch eine lineare Story-Testmission mit Hinterhalten und einem zu haltenden Kontrollpunkt.

**Live spielen:** über die Netlify-Deployment-URL des Projekts (siehe GitHub-Repo-Beschreibung/`netlify.toml`).

---

## Inhalt

- [Features](#features)
- [Steuerung](#steuerung)
- [Spielmodi](#spielmodi)
- [Tech-Stack](#tech-stack)
- [Projektstruktur](#projektstruktur)
- [Setup & Entwicklung](#setup--entwicklung)
- [Build & Deployment](#build--deployment)
- [Architektur-Überblick](#architektur-überblick)
- [Bekannte Einschränkungen](#bekannte-einschränkungen)

---

## Features

- **Egoperspektive-Shooter** mit eigenem Waffen-Viewmodel, Recoil, Mündungsfeuer und Bewegungs-Sway
- **ADS (Aim Down Sights):** Rechtsklick zieht ein Rotpunktvisier heran (2x Zoom), engere Streuung, aber langsamere Bewegung; wird im Sprung automatisch unterbrochen
- **Wellen-Modus:** endlose Bot-Wellen mit steigender Schwierigkeit (Zielgenauigkeit, Schaden, Feuerrate, Tempo, HP), Score/Kills/Treffer-Statistik und persistentem Bestwert (`localStorage`)
- **Story-Modus (Testmission):** lineare Mission mit
  - verriegelten Türen, die sich erst nach dem Clearen einer Kill-Zone öffnen
  - einem Capture Point, der eine festgelegte Zeit lang gehalten werden muss, während gegnerische Verstärkung nachrückt
- **Gegner-KI:** Bots mit Sichtlinienprüfung (Line-of-Sight), Pathfinding über ein Navigationsgrid, Memory-basiertem Verfolgen (suchen zuletzt bekannte Spielerposition), Strafing und Burst-Fire
- **Rotierende Minimap** oben rechts, dreht sich mit der Blickrichtung, zeigt Wände/Deckung und Gegner in der Nähe; Gegner außerhalb der Reichweite werden als Punkt am Kartenrand in ihrer echten Richtung markiert
- **Vollbild-Kartenansicht** (Taste `Tab`): nordausgerichtete Vogelperspektive der gesamten Karte inkl. Kontrollpunkt im Story-Modus
- **Pickups:** Reparaturkits mit automatischer Heilung bei Kontakt
- **Dynamisches HUD:** Gesundheit, Munition/Nachladen, Treffer-/Kopfschuss-Feedback, Schadensrichtungsanzeige, Kill-Feed, Rundenbanner
- **Touch-Steuerung** für mobile Geräte (virtueller Stick, Feuer/Sprung/Nachladen-Buttons)
- **In-Game-Changelog** im Hauptmenü (`src/changelog.js`)
- Partikeleffekte, Tracer, Schatten, prozedurale Texturen, Nebel und Tag-/Umgebungslicht

## Steuerung

### Desktop

| Taste | Aktion |
|---|---|
| `W` `A` `S` `D` | Bewegen |
| Maus | Zielen (Umsehen) |
| Linksklick | Schießen |
| Rechtsklick (halten) | Zielen (ADS-Zoom) |
| `R` | Nachladen |
| `Leertaste` | Springen |
| `Shift` | Sprinten |
| `←` `→` `↑` `↓` | Zielen ohne Maus |
| `Tab` | Vollbild-Karte ein-/ausblenden |
| `Esc` | Pause / Hauptmenü |

Die Maus-Empfindlichkeit lässt sich im Hauptmenü per Schieberegler einstellen (wird lokal gespeichert).

### Touch (Mobilgeräte)

- Linke Bildschirmhälfte ziehen: bewegen
- Rechte Bildschirmhälfte ziehen: zielen
- Buttons unten rechts: Feuer (halten), Sprung, Nachladen

## Spielmodi

### Wellen-Modus

Klassischer Horde-Modus in einer offenen Arena. Jede Welle bringt mehr und stärkere Bots; zwischen den Wellen gibt es eine kurze Pause samt Bonus-Punkten und Teilheilung. Score, Kills, Treffergenauigkeit und Kopfschüsse werden am Ende angezeigt; ein neuer Bestwert wird dauerhaft gespeichert.

### Story (Test)

Eine kurze, lineare Testmission in zwei Stufen:

1. **Kill Zone** – ein Korridor führt in einen Hinterhalt-Raum; eine Tür am Ende bleibt verriegelt, bis alle Gegner ausgeschaltet sind.
2. **Capture Point** – dahinter muss ein Kontrollpunkt eine festgelegte Zeit lang gehalten werden, während in Wellen Verstärkung eintrifft. Verlässt man den Punkt, setzt sich die Haltezeit zurück.

Der Missionsstatus wird oben im HUD angezeigt; nach Abschluss geht es automatisch zurück ins Hauptmenü.

## Tech-Stack

- [Three.js](https://threejs.org/) – 3D-Rendering (WebGL)
- [Vite](https://vitejs.dev/) – Dev-Server & Build-Tooling
- Vanilla JavaScript (ES-Module), kein Framework
- Reines CSS für UI/HUD (keine CSS-Frameworks)
- Deployment über [Netlify](https://www.netlify.com/) (`netlify.toml`)

## Projektstruktur

```
Betonhalle/
├─ index.html            # Einstiegspunkt, HUD-Markup, Overlays
├─ src/
│  ├─ main.js             # Bootstrap, Resize-Handling, Game-Loop
│  ├─ style.css           # gesamtes UI-/HUD-Styling
│  ├─ changelog.js        # Inhalte des In-Game-Update-Logs
│  ├─ core/
│  │  ├─ audio.js         # Soundeffekte
│  │  └─ utils.js         # Kleine Helper (DOM, Zufallszahlen, localStorage)
│  ├─ render/
│  │  ├─ renderer.js      # WebGLRenderer-Setup
│  │  ├─ scene.js         # Szene, Kameras, Licht, Nebel
│  │  ├─ particles.js     # Partikel & Tracer
│  │  ├─ textures.js      # Prozedurale Materialien/Texturen
│  │  └─ weapon.js        # Waffen-Viewmodel
│  ├─ world/
│  │  ├─ arena.js         # Aufbau der Wellen-Modus-Arena
│  │  ├─ level.js         # Level-Primitiven (Boxen, Boden, Deko)
│  │  ├─ collision.js     # Kollisions-/Raycast-Logik
│  │  └─ navigation.js    # Nav-Grid & Pathfinding für Bots
│  └─ game/
│     ├─ state.js         # globaler Spielzustand, Spawning, Schwierigkeitskurve
│     ├─ flow.js          # Menü-/Pause-/Gameover-Übergänge
│     ├─ input.js         # Tastatur/Maus/Touch-Eingabe
│     ├─ update.js        # Pro-Frame-Logik (Bewegung, Waffe, Viewmodel)
│     ├─ combat.js        # Schaden, Treffererkennung
│     ├─ bots.js          # Gegner-KI und -Modelle
│     ├─ story.js         # Story-Missionslogik (Stages, Capture Point)
│     ├─ hud.js           # HUD-Updates
│     ├─ minimap.js       # Minimap & Vollbild-Kartenansicht
│     ├─ pickups.js       # Reparaturkits
│     ├─ menu.js          # Hauptmenü-Deko/Attract-Mode
│     └─ changelog.js     # Rendering des Update-Logs im Menü
├─ package.json
├─ netlify.toml           # Netlify-Build-/Redirect-Konfiguration
└─ README.md
```

## Setup & Entwicklung

Voraussetzung: [Node.js](https://nodejs.org/) (aktuelle LTS-Version empfohlen).

```bash
# Repository klonen
git clone https://github.com/Marmor1243/Betonhalle.git
cd Betonhalle

# Abhängigkeiten installieren
npm install

# Dev-Server starten (mit Hot Reload)
npm run dev
```

Der Dev-Server läuft standardmäßig unter `http://localhost:5173/`.

## Build & Deployment

```bash
# Produktions-Build erzeugen (Ausgabe in dist/)
npm run build

# Produktions-Build lokal testen
npm run preview
```

Das Projekt ist für [Netlify](https://www.netlify.com/) konfiguriert (`netlify.toml`): Build-Command `npm run build`, Publish-Verzeichnis `dist`, mit SPA-Redirect (`/* → /index.html`). Ein Push auf `main` löst bei entsprechend verknüpftem Netlify-Projekt automatisch ein neues Deployment aus.

## Architektur-Überblick

- **Game-Loop** (`main.js`): eine einzige `requestAnimationFrame`-Schleife rendert je nach `S.mode` (`menu`, `play`, `paused`, `over`) die Hauptszene sowie separat die Waffen-Szene (eigene Kamera, eigener Tiefenpuffer) obendrüber.
- **Zustand** (`game/state.js`): ein zentrales, mutables Objekt `S` (Spielstatus, Schwierigkeit, Timer) und `P` (Spielerposition/-blick) werden von allen Modulen referenziert statt über Events/Redux-artige Patterns verteilt – bewusst simpel gehalten für ein kleines Arcade-Projekt.
- **Level-Daten** (`world/level.js`): Wände/Deckung werden als einfache achsenausgerichtete Boxen (`boxes`-Array) verwaltet, die sowohl für Kollision, Bot-Pathfinding als auch für die Minimap wiederverwendet werden.
- **Bots** (`game/bots.js`): einfache Zustandsmaschine pro Bot (verfolgen/erinnern/kämpfen) mit Raycast-basierter Sichtprüfung und A*-ähnlichem Pathfinding über ein Grid (`world/navigation.js`).
- **Minimap** (`game/minimap.js`): reines 2D-Canvas-Rendering (kein zusätzlicher WebGL-Layer), projiziert Weltkoordinaten relativ zum Spieler bzw. zur Levelbounding-Box.

## Bekannte Einschränkungen

- Kein Multiplayer – reines Singleplayer-Erlebnis gegen Bots.
- Story-Modus enthält aktuell nur eine Testmission mit zwei Stufen.
- Fortschritt/Bestwerte werden ausschließlich lokal im Browser gespeichert (`localStorage`), es gibt kein Backend.
