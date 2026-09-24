// Le miroir bienveillant : l'auto-compassion (Neff, 2003 ; Neff & Germer, 2013).
// Une phrase dure embue le miroir ; on compose une réponse en trois temps, dans l'ordre de la pause
// d'auto-compassion : reconnaître, relier, soutenir. Le miroir s'éclaircit à chaque étape. Rien n'est enregistré.

import { h } from '../dom.js';
import { audio, vibrate } from './feedback.js';
import { layout, choices, timers } from './kit.js';

const HARSH = ['T’es vraiment nul·le.', 'Tu aurais dû faire mieux.', 'Tout le monde y arrive, sauf toi.', 'Tu gâches toujours tout.'];

const STEPS = [
  {
    id: 'reconnaitre',
    title: 'Reconnaître',
    prompt: 'D’abord, reconnais ce que tu ressens, sans le juger.',
    options: ['C’est un moment difficile.', 'Là, j’ai mal, et c’est normal de le remarquer.', 'Je me sens déçu·e, et ce sentiment passera.'],
  },
  {
    id: 'relier',
    title: 'Relier',
    prompt: 'Ensuite, rappelle-toi que tu n’es pas seul·e dans ce cas.',
    options: ['Tout le monde se trompe parfois.', 'D’autres ont vécu la même chose.', 'Je ne suis pas seul·e à trouver ça dur.'],
  },
  {
    id: 'soutenir',
    title: 'Soutenir',
    prompt: 'Enfin, parle-toi comme à un·e ami·e.',
    options: ['Je fais de mon mieux avec ce que j’ai aujourd’hui.', 'De quoi ai-je besoin, là, maintenant ?', 'Je peux être doux·ce avec moi, comme avec un·e ami·e.'],
  },
];

export function createMiroir({ stage, onEnd }) {
  const { cue, scene, controls } = layout(stage, { sceneClass: 'miroir-scene' });
  const t = timers();
  const answer = [];

  const words = h('div', { class: 'mirror-words', 'aria-live': 'polite' });
  const mirror = h('div', { class: 'mirror' }, h('span', { class: 'mirror-fog', 'aria-hidden': 'true' }), words);
  const setFog = (v) => mirror.style.setProperty('--fog', String(v));

  function pickHarsh() {
    setFog(1);
    words.replaceChildren();
    cue.textContent = 'Quelle phrase ta voix intérieure te dit-elle parfois ?';
    const own = h('input', { type: 'text', id: 'miroir-own', placeholder: 'Ou écris la tienne…', maxlength: '80' });
    const ownBtn = h('button', { type: 'button', class: 'btn btn-quiet btn-small' }, 'Celle-ci');
    ownBtn.addEventListener('click', () => own.value.trim() && start(own.value.trim()));
    scene.replaceChildren(mirror, choices(HARSH, (text) => start(text)), h('div', { class: 'ex-add' }, own, ownBtn));
    controls.replaceChildren(h('span', { class: 'small muted', text: 'Rien de ce que tu choisis ou écris n’est enregistré.' }));
  }

  function start(harsh) {
    words.replaceChildren(h('p', { class: 'mirror-harsh', text: harsh }));
    step(0, harsh);
  }

  function step(i, harsh) {
    const s = STEPS[i];
    cue.textContent = `${s.title} · ${s.prompt}`;
    const own = h('input', { type: 'text', id: `miroir-${s.id}`, placeholder: 'Ou avec tes mots…', maxlength: '90' });
    const ownBtn = h('button', { type: 'button', class: 'btn btn-quiet btn-small' }, 'Ajouter');
    const accept = (text) => {
      answer.push(text);
      audio.blip('pop');
      vibrate(15);
      setFog(1 - (i + 1) / STEPS.length);
      words.replaceChildren(h('p', { class: 'mirror-harsh faded', text: harsh }), ...answer.map((a) => h('p', { class: 'mirror-kind', text: a })));
      if (i < STEPS.length - 1) step(i + 1, harsh);
      else breathe();
    };
    ownBtn.addEventListener('click', () => own.value.trim() && accept(own.value.trim()));
    scene.replaceChildren(mirror, choices(s.options, (text) => accept(text)), h('div', { class: 'ex-add' }, own, ownBtn));
    controls.replaceChildren(h('span', { class: 'small muted', text: `Étape ${i + 1} sur ${STEPS.length}` }));
  }

  function breathe() {
    cue.textContent = 'Relis ces mots lentement, le temps de trois respirations.';
    mirror.classList.add('breathing');
    scene.replaceChildren(mirror);
    controls.replaceChildren(h('span', { class: 'small muted', text: 'Inspire… expire…' }));
    t.later(() => onEnd({ message: 'Le miroir est clair.', details: ['Ce que tu t’es dit :', ...answer] }), 15000);
  }

  pickHarsh();
  return { destroy: () => t.clear() };
}
