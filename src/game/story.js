import { clearLevel, addBox, addFloor } from '../world/level.js';
import { rebuildNavGrid } from '../world/navigation.js';
import { S, P } from './state.js';
import { makeBot } from './bots.js';
import { banner, feed } from './hud.js';
import { sfx } from '../core/audio.js';
import { goMenu } from './flow.js';

// Testmission: schmaler Korridor (Deckung unterwegs), der in einen etwas
// breiteren Raum mündet. Beim Überschreiten von triggerZ im Korridor werden
// die Gegner im Raum "scharfgeschaltet" - Ziel: alle ausschalten.
function buildMission1Geometry() {
  const wallH = 6;
  // Korridor: x in [-3.5, 3.5], z in [-30, 15]
  addFloor(9, 46, 0, -7.5);
  addBox(-4, -7.5, 1, 46, wallH, 'concrete');
  addBox(4, -7.5, 1, 46, wallH, 'concrete');
  addBox(0, -30.5, 9, 1, wallH, 'concrete');
  addBox(-2, -1, 1.6, 1.6, 1.3, 'crate');
  addBox(2, 9, 1.6, 1.6, 1.3, 'crate');

  // Zielraum: x in [-7.5, 7.5], z in [15, 33]
  addFloor(16, 20, 0, 24);
  addBox(-7.5, 24, 1, 18, wallH, 'concrete');
  addBox(7.5, 24, 1, 18, wallH, 'concrete');
  addBox(0, 33.5, 15, 1, wallH, 'concrete');
  addBox(-4.5, 26, 1.8, 1.8, 1.6, 'crate');
  addBox(4.5, 29, 1.8, 1.8, 1.6, 'crate');

  // Ecken am Übergang Korridor -> Raum schließen (Korridor ist schmaler als
  // der Raum, ohne diese Stücke gibt es dort eine Lücke ohne Boden).
  addBox(6.25, 15.25, 3.5, 1, wallH, 'concrete');
  addBox(-6.25, 15.25, 3.5, 1, wallH, 'concrete');
}

let mission = null;

export function startMission1() {
  clearLevel();
  buildMission1Geometry();
  rebuildNavGrid();
  Object.assign(P, { x: 0, y: 1.2, z: -27, vx: 0, vy: 0, vz: 0, yaw: Math.PI, pitch: 0, onGround: true });
  mission = { stage: 'idle', triggerZ: 8, spawns: [[-4, 22], [4, 22], [-3, 30], [3, 30]], missionBots: [] };
  banner('Mission: Erster Kontakt', 'Dringe in den Bunker-Trakt vor');
}

export function missionStatusText() {
  if (!mission) return '';
  if (mission.stage === 'idle') return 'Weiter vorrücken';
  if (mission.stage === 'won') return 'Mission erfüllt';
  const left = mission.missionBots.filter(b => !b.dead).length;
  return left === 1 ? '1 Gegner übrig' : left + ' Gegner übrig';
}

export function storyTick() {
  if (!mission) return;
  if (mission.stage === 'idle') {
    if (P.z > mission.triggerZ) {
      mission.stage = 'engaged';
      mission.missionBots = mission.spawns.map(([x, z]) => makeBot(x, z));
      banner('Kontakt!', mission.missionBots.length + ' Gegner gesichtet');
      sfx.wave();
    }
  } else if (mission.stage === 'engaged') {
    if (mission.missionBots.every(b => b.dead)) {
      mission.stage = 'won';
      banner('Mission erfüllt', 'Rückkehr zum Hauptmenü …');
      feed('Mission abgeschlossen');
      setTimeout(() => { if (S.mode === 'play' && S.gameType === 'story') goMenu(); }, 2600);
    }
  }
}
