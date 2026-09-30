import { S } from './state.js';
import { setActiveWeapon } from '../render/weapon.js';
import { sfx } from '../core/audio.js';

// Waffen-Konfiguration: Schaden pro Trefferzone, Feuerrate, Magazingröße,
// Nachladezeit, Streuungs-Multiplikator (relativ zu spreadNow()) und ob die
// Waffe vollautomatisch ist (Halten feuert durchgehend) oder halbautomatisch
// (ein Klick = ein Schuss).
export const WEAPONS = {
  rifle: { label: 'Sturmgewehr', mag: 30, fireCd: .095, reload: 1.6, dmgHead: 70, dmgBody: 26, dmgLegs: 18, spread: 1, auto: true },
  // fireCd ist bei der Pistole nur eine technische Untergrenze (kein
  // gewolltes Feuertempo-Limit) - schnelles Klicken soll fast 1:1 durchschlagen.
  pistol: { label: 'Pistole', mag: 15, fireCd: .07, reload: 1.1, dmgHead: 70, dmgBody: 26, dmgLegs: 18, spread: .75, auto: false }
};

export function currentWeapon() { return WEAPONS[S.weapon]; }

export function switchWeapon(name) {
  if (!WEAPONS[name] || S.weapon === name || S.mode !== 'play') return;
  S.weapon = name;
  S.reloading = 0;
  S.triggerPrev = false;
  setActiveWeapon(name);
  sfx.reload();
}
