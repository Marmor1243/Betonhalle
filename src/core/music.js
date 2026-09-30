import { settings, onSettingsChange } from './settings.js';

// Hintergrundmusik fürs Hauptmenü. Browser blocken Autoplay mit Ton ohne
// vorherige Nutzerinteraktion - falls play() abgelehnt wird, versuchen wir es
// beim ersten Klick/Tastendruck erneut.
const menuMusic = new Audio('/audio/MainMusik.mp3');
menuMusic.loop = true;
menuMusic.volume = settings.volume;

let wantsMenuMusic = false;

function tryPlay() {
  if (!wantsMenuMusic) return;
  menuMusic.play().catch(() => {});
}

export function playMenuMusic() {
  wantsMenuMusic = true;
  tryPlay();
}
export function pauseMenuMusic() {
  wantsMenuMusic = false;
  menuMusic.pause();
}

onSettingsChange((key, value) => { if (key === 'volume') menuMusic.volume = value; });

const unlock = () => { tryPlay(); };
addEventListener('pointerdown', unlock);
addEventListener('keydown', unlock);
