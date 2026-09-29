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
  }
];
