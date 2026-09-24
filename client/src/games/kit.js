// Petit kit commun aux mini-jeux en HTML : mise en page, choix, mélange, minuteries propres.

import { h } from '../dom.js';

// Consigne en haut, scène au centre, commandes en bas.
export function layout(stage, { sceneClass = '' } = {}) {
  const cue = h('p', { class: 'game-cue static', 'aria-live': 'polite' });
  const scene = h('div', { class: `game-scene ${sceneClass}`.trim() });
  const controls = h('div', { class: 'game-controls' });
  stage.append(h('div', { class: 'game-layout' }, cue, scene, controls));
  return { cue, scene, controls };
}

export function choices(options, onPick, { className = '' } = {}) {
  const buttons = options.map((option, i) =>
    h('button', { type: 'button', class: `card-option ${className}`.trim() }, h('span', { class: 'check', 'aria-hidden': 'true' }), h('span', { text: option.label ?? option })),
  );
  buttons.forEach((b, i) => b.addEventListener('click', () => onPick(options[i], i, b)));
  return h('div', { class: 'card-grid frequency' }, buttons);
}

export function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Minuteries regroupées : tout s'arrête d'un coup quand on quitte le jeu.
export function timers() {
  const ids = new Set();
  return {
    later(fn, ms) {
      const id = setTimeout(() => (ids.delete(id), fn()), ms);
      ids.add(id);
      return id;
    },
    every(fn, ms) {
      const id = setInterval(fn, ms);
      ids.add(id);
      return id;
    },
    clear() {
      ids.forEach((id) => (clearTimeout(id), clearInterval(id)));
      ids.clear();
    },
  };
}
