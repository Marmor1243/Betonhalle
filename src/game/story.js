import * as THREE from 'three';
import { clearLevel, addBox, addFloor, addDecor, removeBox } from '../world/level.js';
import { setNavBounds, rebuildNavGrid } from '../world/navigation.js';
import { S, P, diffFor } from './state.js';
import { makeBot } from './bots.js';
import { banner, feed } from './hud.js';
import { sfx } from '../core/audio.js';
import { goMenu } from './flow.js';

// Testmission: zwei Missionsstufen hintereinander.
// - Kill Zone: Korridor + Hinterhalt-Raum, Tür bleibt verriegelt bis alle
//   Gegner tot sind (physisch UND logisch - man kommt vorher gar nicht durch).
// - Capture Point: dahinter ein Kontrollpunkt, den man eine Zeit lang halten
//   muss, während Verstärkung eintrifft.
function buildMission1() {
  const wallH = 6;

  // --- Stufe 1: Korridor + Hinterhalt-Raum (x [-3.5,3.5]/[-7.5,7.5], z [-30,34]) ---
  addFloor(9, 46, 0, -7.5);
  addBox(-4, -7.5, 1, 46, wallH, 'concrete');
  addBox(4, -7.5, 1, 46, wallH, 'concrete');
  addBox(0, -30.5, 9, 1, wallH, 'concrete');
  addBox(-2, -1, 1.6, 1.6, 1.3, 'crate');
  addBox(2, 9, 1.6, 1.6, 1.3, 'crate');

  addFloor(16, 20, 0, 24);
  addBox(-7.5, 24, 1, 18, wallH, 'concrete');
  addBox(7.5, 24, 1, 18, wallH, 'concrete');
  addBox(-4.5, 26, 1.8, 1.8, 1.6, 'crate');
  addBox(4.5, 29, 1.8, 1.8, 1.6, 'crate');
  addBox(6.25, 15.25, 3.5, 1, wallH, 'concrete');
  addBox(-6.25, 15.25, 3.5, 1, wallH, 'concrete');
  // Rückwand mit verriegelter Tür in der Mitte
  addBox(-4.5, 33.5, 6, 1, wallH, 'concrete');
  addBox(4.5, 33.5, 6, 1, wallH, 'concrete');
  const gate1 = addBox(0, 33.5, 3, 1, wallH, 'concrete');

  // --- Verbindungskorridor zur Stufe 2 (z [34,52]) ---
  addFloor(7, 18, 0, 43);
  addBox(-3, 43, 1, 18, wallH, 'concrete');
  addBox(3, 43, 1, 18, wallH, 'concrete');
  addBox(-1, 40, 1.4, 1.4, 1.2, 'crate');
  addBox(1, 48, 1.4, 1.4, 1.2, 'crate');
  addBox(5.5, 52.25, 5, 1, wallH, 'concrete');
  addBox(-5.5, 52.25, 5, 1, wallH, 'concrete');

  // --- Stufe 2: Kontrollpunkt-Raum (x [-8,8], z [52,73]) ---
  addFloor(16, 21, 0, 62.5);
  addBox(-8, 62, 1, 20, wallH, 'concrete');
  addBox(8, 62, 1, 20, wallH, 'concrete');
  addBox(0, 72.5, 17, 1, wallH, 'concrete');
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.7, 3, 48), new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: .55 }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(0, .02, 62); addDecor(ring);

  return { gate1 };
}

let mission = null;

export function startMission1() {
  clearLevel();
  const { gate1 } = buildMission1();
  setNavBounds(-11, 11, -32, 74);
  rebuildNavGrid();
  Object.assign(P, { x: 0, y: 1.2, z: -27, vx: 0, vy: 0, vz: 0, yaw: Math.PI, pitch: 0, onGround: true });
  S.diff = diffFor(6);
  mission = {
    idx: 0, active: null,
    stages: [
      {
        type: 'kill', triggerZ: 8, spawns: [[-4, 22], [4, 22], [-3, 30], [3, 30]], gate: gate1,
        startMsg: ['Kontakt!', 'Gegner gesichtet'], clearMsg: ['Weg frei', 'Die Blockade ist durchbrochen']
      },
      {
        type: 'capture', triggerZ: 52, point: { x: 0, z: 62 }, radius: 3, holdTime: 10,
        spawns: [[-5, 58], [5, 58], [0, 68]],
        reinforceInterval: 3, reinforceMax: 6,
        reinforcePoints: [[-6, 64], [6, 64], [-6, 58], [6, 58], [0, 70], [-6, 68]],
        startMsg: ['Kontrollpunkt', 'Punkt halten, während Verstärkung eintrifft']
      }
    ]
  };
  banner('Mission: Erster Kontakt', 'Dringe in den Bunker-Trakt vor');
}

function completeStage(stage) {
  mission.active = null;
  mission.idx++;
  if (stage.gate) { removeBox(stage.gate); rebuildNavGrid(); }
  if (mission.idx >= mission.stages.length) {
    banner('Mission erfüllt', 'Rückkehr zum Hauptmenü …');
    feed('Mission abgeschlossen');
    setTimeout(() => { if (S.mode === 'play' && S.gameType === 'story') goMenu(); }, 2600);
  } else {
    const [t, s] = stage.clearMsg || ['Bereich gesichert', ''];
    banner(t, s); feed(t);
  }
}

export function missionStatusText() {
  if (!mission) return '';
  const stage = mission.stages[mission.idx];
  if (!stage) return 'Mission erfüllt';
  if (!mission.active) return 'Weiter vorrücken';
  if (stage.type === 'kill') {
    const left = mission.active.bots.filter(b => !b.dead).length;
    return left === 1 ? '1 Gegner übrig' : left + ' Gegner übrig';
  }
  if (stage.type === 'capture') {
    const remain = Math.max(0, Math.ceil(stage.holdTime - mission.active.hold));
    return mission.active.holding ? 'Punkt wird gehalten: ' + remain + 's' : 'Zum Kontrollpunkt: ' + remain + 's';
  }
  return '';
}

export function storyTick(dt) {
  if (!mission) return;
  const stage = mission.stages[mission.idx];
  if (!stage) return;

  if (!mission.active) {
    if (P.z > stage.triggerZ) {
      mission.active = { bots: stage.spawns.map(([x, z]) => makeBot(x, z)), hold: 0, holding: false, reinforceT: stage.reinforceInterval || 0, reinforced: 0 };
      banner(stage.startMsg[0], stage.startMsg[1]); sfx.wave();
    }
    return;
  }

  if (stage.type === 'kill') {
    if (mission.active.bots.every(b => b.dead)) completeStage(stage);
  } else if (stage.type === 'capture') {
    const dx = P.x - stage.point.x, dz = P.z - stage.point.z;
    mission.active.holding = Math.hypot(dx, dz) <= stage.radius && Math.abs(P.y) < 2.2;
    if (mission.active.holding) mission.active.hold += dt; else mission.active.hold = 0;

    if (stage.reinforcePoints && mission.active.reinforced < stage.reinforceMax) {
      mission.active.reinforceT -= dt;
      if (mission.active.reinforceT <= 0) {
        const [x, z] = stage.reinforcePoints[mission.active.reinforced % stage.reinforcePoints.length];
        mission.active.bots.push(makeBot(x, z));
        mission.active.reinforced++;
        mission.active.reinforceT = stage.reinforceInterval;
        feed('Verstärkung trifft ein'); sfx.bot(20);
      }
    }

    if (mission.active.hold >= stage.holdTime) completeStage(stage);
  }
}
