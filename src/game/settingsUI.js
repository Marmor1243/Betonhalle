import { $ } from '../core/utils.js';
import { settings, setSetting } from '../core/settings.js';

function show(id, on) { $(id).hidden = !on; }
let returnTo = 'ovStart';

function syncUI() {
  $('sens').value = settings.sens;
  $('setSfxVolume').value = settings.sfxVolume;
  $('setMusicVolume').value = settings.musicVolume;
  $('setFov').value = settings.fov;
  $('setShake').value = settings.shake;
  $('setAdsToggle').checked = settings.adsToggle;
  $('setMinimap').checked = settings.minimap;
  $('setMinimapSize').value = settings.minimapSize;
}

export function openSettings(from) {
  returnTo = from;
  show(from, false);
  syncUI();
  show('ovSettings', true);
}
function closeSettings() {
  show('ovSettings', false);
  show(returnTo, true);
}

$('sens').addEventListener('input', e => setSetting('sens', parseFloat(e.target.value)));
$('setSfxVolume').addEventListener('input', e => setSetting('sfxVolume', parseFloat(e.target.value)));
$('setMusicVolume').addEventListener('input', e => setSetting('musicVolume', parseFloat(e.target.value)));
$('setFov').addEventListener('input', e => setSetting('fov', parseFloat(e.target.value)));
$('setShake').addEventListener('input', e => setSetting('shake', parseFloat(e.target.value)));
$('setAdsToggle').addEventListener('change', e => setSetting('adsToggle', e.target.checked));
$('setMinimap').addEventListener('change', e => setSetting('minimap', e.target.checked));
$('setMinimapSize').addEventListener('input', e => setSetting('minimapSize', parseFloat(e.target.value)));
$('btnSettingsBack').addEventListener('click', closeSettings);
$('btnSettingsMenu').addEventListener('click', () => openSettings('ovStart'));
$('btnSettingsPause').addEventListener('click', () => openSettings('ovPause'));
