import './style.css';
import { renderer } from './render/renderer.js';
import { scene, camera, gunScene, gunCam } from './render/scene.js';
import { updateParticles, updateTracers } from './render/particles.js';
import { S } from './game/state.js';
import { update } from './game/update.js';
import { attract, setupDecor } from './game/menu.js';
import { renderChangelog } from './game/changelog.js';
import { buildWaveArena } from './world/arena.js';
import './game/flow.js';
import './game/input.js';

buildWaveArena();
setupDecor();
renderChangelog();

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = gunCam.aspect = w / h;
  camera.updateProjectionMatrix(); gunCam.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, .05); last = now;
  if (S.mode === 'play') update(dt);
  else if (S.mode === 'menu') attract(dt);
  if (S.mode === 'play' || S.mode === 'menu') { updateParticles(dt); updateTracers(dt); }
  renderer.clear();
  renderer.render(scene, camera);
  if (S.mode === 'play' || S.mode === 'paused') { renderer.clearDepth(); renderer.render(gunScene, gunCam); }
}
requestAnimationFrame(frame);
