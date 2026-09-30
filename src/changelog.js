// Update-Log für die Startseite. Neue Einträge werden unten angehängt (chronologisch),
// die Anzeige scrollt automatisch nach unten zum neuesten Eintrag.
export const CHANGELOG = [
  {
    date: '29.09.2026',
    title: 'Projekt-Refactor',
    items: [
      'Vom Einzeldatei-Prototyp auf ein modulares Vite-Projekt umgestellt.',
      'Klare Ordnerstruktur (Rendering, Welt, Spiellogik) für einfachere Weiterentwicklung.'
    ]
  },
  {
    date: '29.09.2026',
    title: 'Zielen (ADS)',
    items: [
      'Rechte Maustaste: Zielen durch ein Rotpunktvisier mit 2x Zoom.',
      'Beim Zielen engere Streuung, aber langsamere Bewegung.',
      'Zielen wird im Sprung unterbrochen und erst nach der Landung wieder aktiv.'
    ]
  },
  {
    date: '29.09.2026',
    title: 'Story-Modus (Testmission)',
    items: [
      'Neuer Spielmodus neben dem Wellen-Modus: kurze, lineare Missionen statt endloser Arena.',
      'Erste Testmission: Korridor mit Deckung, der in einen Raum mit Gegner-Hinterhalt mündet.',
      'Missionsziel im HUD sichtbar, automatische Rückkehr ins Hauptmenü nach Abschluss.'
    ]
  },
  {
    date: '29.09.2026',
    title: 'Story-Modus: Missionsstufen & Capture Point',
    items: [
      'Testmission um eine zweite Stufe erweitert: verriegelte Tür nach der ersten Kill Zone, dahinter ein Kontrollpunkt.',
      'Capture Point: Ring auf dem Boden halten, während Verstärkung nachrückt; verlässt man den Ring, setzt sich die Zeit zurück.',
      'Gegner-Schwierigkeit in der Mission spürbar angehoben.'
    ]
  },
  {
    date: '29.09.2026',
    title: 'Minimap & Kartenansicht',
    items: [
      'Neue Minimap oben rechts: dreht sich mit der Blickrichtung, zeigt Wände/Deckung und Gegner in der Nähe.',
      'Gegner außerhalb der Minimap-Reichweite werden als roter Punkt am Kartenrand in ihrer echten Richtung angezeigt.',
      'Taste Tab öffnet eine nordausgerichtete Vogelperspektive der gesamten Karte inkl. Kontrollpunkt im Story-Modus.'
    ]
  },
  {
    date: '30.09.2026',
    title: 'Einstellungen',
    items: [
      'Neues Einstellungen-Menü, erreichbar vom Hauptmenü UND per Escape aus einer laufenden Runde.',
      'Maus-Empfindlichkeit, Lautstärke, Sichtfeld (FOV) und Bildschirm-Shake einstellbar - alles live wirksam.',
      'Zielen wahlweise als Halten oder Umschalten, Minimap ein-/ausblendbar und in der Größe einstellbar.'
    ]
  }
];
