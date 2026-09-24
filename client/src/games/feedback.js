// Sons doux et vibrations légères des mini-jeux, désactivables (préférences gardées sur l'appareil).
// Les sons sont synthétisés à la volée (Web Audio) : aucun fichier à charger.
// Les vibrations n'existent que là où le navigateur les permet (Android notamment, pas iPhone).

import { storage } from '../storage.js';

export const settings = {
  get sound() {
    return storage.get('sound') !== 'off';
  },
  set sound(on) {
    storage.set('sound', on ? 'on' : 'off');
    if (!on) audio.stopAll();
  },
  get vibration() {
    return storage.get('vibration') !== 'off';
  },
  set vibration(on) {
    storage.set('vibration', on ? 'on' : 'off');
  },
};

export const canVibrate = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export function vibrate(pattern) {
  if (settings.vibration && canVibrate()) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* refusé par le navigateur : on continue sans */
    }
  }
}

let ctx = null;
const live = new Set();

function context() {
  if (!ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export const audio = {
  // Houle : bruit filtré, dont on règle le volume (0 à 1) au fil du jeu.
  waves() {
    const ac = settings.sound ? context() : null;
    if (!ac) return { level() {}, stop() {} };
    const buffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = 0.98 * last + 0.02 * (Math.random() * 2 - 1); // bruit brun, plus doux que le blanc
      data[i] = last * 3;
    }
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    const gain = ac.createGain();
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(ac.destination);
    source.start();
    const handle = {
      level(v) {
        gain.gain.setTargetAtTime(0.02 + 0.1 * v, ac.currentTime, 0.5);
        filter.frequency.setTargetAtTime(350 + 500 * v, ac.currentTime, 0.5);
      },
      stop() {
        gain.gain.setTargetAtTime(0, ac.currentTime, 0.2);
        setTimeout(() => source.stop(), 600);
        live.delete(handle);
      },
    };
    live.add(handle);
    handle.level(0.4);
    return handle;
  },

  // Souffle : une note très douce qui monte à l'inspiration et redescend à l'expiration.
  breath() {
    const ac = settings.sound ? context() : null;
    if (!ac) return { set() {}, stop() {} };
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 196;
    const gain = ac.createGain();
    gain.gain.value = 0;
    osc.connect(gain).connect(ac.destination);
    osc.start();
    const handle = {
      set(level) {
        gain.gain.setTargetAtTime(0.012 + 0.035 * level, ac.currentTime, 0.4);
        osc.frequency.setTargetAtTime(196 + 40 * level, ac.currentTime, 0.6);
      },
      stop() {
        gain.gain.setTargetAtTime(0, ac.currentTime, 0.2);
        setTimeout(() => osc.stop(), 600);
        live.delete(handle);
      },
    };
    live.add(handle);
    return handle;
  },

  // Petit son ponctuel : « pop » d'une bulle ou carillon de fin.
  blip(kind = 'pop') {
    const ac = settings.sound ? context() : null;
    if (!ac) return;
    const notes = kind === 'chime' ? [523, 659, 784] : [880];
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ac.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(kind === 'chime' ? 0.05 : 0.03, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'chime' ? 1.2 : 0.18));
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 1.3);
    });
  },

  stopAll() {
    [...live].forEach((h) => h.stop());
  },
};

// Couleurs du thème courant (ciel, dunes, lumière), pour peindre les scènes dans la palette « Le Voyage ».
export function themeColors() {
  const css = getComputedStyle(document.documentElement);
  const read = (name) => css.getPropertyValue(name).trim();
  return {
    sky1: read('--bg-1'),
    sky2: read('--sky-2'),
    sky3: read('--sky-3'),
    ground: read('--bg-3'),
    dune1: read('--dune-1'),
    dune2: read('--dune-2'),
    dune3: read('--dune-3'),
    sun: read('--sun'),
    sunGlow: read('--sun-glow'),
    gold: read('--gold'),
    star: read('--star'),
    ink: read('--ink'),
    inkSoft: read('--ink-soft'),
    machine: read('--machine'),
    pilote: read('--pilote'),
    reseau: read('--reseau'),
    cadre: read('--cadre'),
    soupapes: read('--soupapes'),
    dark: matchMedia('(prefers-color-scheme: dark)').matches,
  };
}

// Canvas net sur écran haute densité, redimensionné avec son conteneur.
export function fitCanvas(canvas, onResize) {
  const ctx2d = canvas.getContext('2d');
  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    onResize?.(width, height);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  return { ctx: ctx2d, size: () => canvas.getBoundingClientRect(), disconnect: () => ro.disconnect() };
}

// Couleurs calculées (le canvas n'accepte pas partout color-mix) : les jetons du thème sont en #rrggbb.
function parseHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  const n = m ? parseInt(m[1], 16) : 0x808080;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex, alpha = 1) {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function mix(hexA, hexB, t = 0.5) {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  const [r, g, bl] = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${r}, ${g}, ${bl})`;
}
