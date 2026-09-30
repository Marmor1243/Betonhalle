import { settings, onSettingsChange } from './settings.js';

// Hintergrundmusik fürs Hauptmenü. Browser blocken Autoplay mit Ton ohne
// vorherige Nutzerinteraktion - falls play() abgelehnt wird, versuchen wir es
// beim ersten Klick/Tastendruck erneut.
// Die Musikspuren sind selbst schon voll ausgesteuert - hier wird gedämpft,
// damit der Regler auch bei niedrigeren Ständen noch fein reagiert.
const MUSIC_GAIN_SCALE = .66;

const menuMusic = new Audio('/audio/MainMenuMusic.mp3');
menuMusic.loop = true;
menuMusic.volume = settings.musicVolume * MUSIC_GAIN_SCALE;

const waveMusic = new Audio('/audio/betongame.mp3');
waveMusic.loop = true;
waveMusic.volume = settings.musicVolume * MUSIC_GAIN_SCALE;

let wantsMenuMusic = false, wantsWaveMusic = false;

function tryPlay() {
  if (wantsMenuMusic) menuMusic.play().catch(() => {});
  if (wantsWaveMusic) waveMusic.play().catch(() => {});
}

// Jeder (Wieder-)Einstieg ins Hauptmenü bzw. in den Wellen-Modus startet den
// jeweiligen Track von vorne, statt an der alten Stelle weiterzuspielen.
export function playMenuMusic() { menuMusic.currentTime = 0; wantsMenuMusic = true; tryPlay(); }
export function pauseMenuMusic() { wantsMenuMusic = false; menuMusic.pause(); }

export function playWaveMusic() { waveMusic.currentTime = 0; wantsWaveMusic = true; tryPlay(); }
export function pauseWaveMusic() { wantsWaveMusic = false; waveMusic.pause(); }

onSettingsChange((key, value) => { if (key === 'musicVolume') { menuMusic.volume = value * MUSIC_GAIN_SCALE; waveMusic.volume = value * MUSIC_GAIN_SCALE; } });

const unlock = () => { tryPlay(); };
addEventListener('pointerdown', unlock);
addEventListener('keydown', unlock);
