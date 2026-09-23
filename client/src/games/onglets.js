// Onglets : la charge mentale. Cueillir des bulles pendant que des onglets s'ouvrent et encombrent l'écran,
// les ranger en décidant quand s'en occuper (plan, d'après Masicampo & Baumeister, 2011),
// puis recommencer l'esprit dégagé. Aucune note : seulement ce que la personne a pu remarquer.

import { h } from '../dom.js';
import { audio, vibrate } from './feedback.js';

const TASKS = [
  'Répondre à Léa',
  'Rendre le dossier',
  'Payer le loyer',
  'Rappeler le dentiste',
  'Acheter un cadeau',
  'Réviser le partiel',
  'Relancer le propriétaire',
  'Préparer la réunion',
  'Faire les courses',
  'Répondre au groupe',
  'Prendre rendez-vous',
  'Envoyer le mail',
];
const MOMENTS = ['Ce soir', 'Demain', 'Ce week-end'];
const LOADED = 45; // secondes avec onglets
const CLEAR = 40; // secondes l'esprit dégagé
const TIDY_MAX = 45; // temps maximum pour ranger

export function createOnglets({ stage, onEnd }) {
  const cue = h('p', { class: 'game-cue', 'aria-live': 'polite' });
  const clock = h('span', { class: 'game-clock' });
  const field = h('div', { class: 'onglets-field', role: 'application', 'aria-label': 'Zone de jeu : touche les bulles' });
  const notebook = h('div', { class: 'onglets-notebook', 'aria-live': 'polite' }, h('strong', { text: 'Carnet' }), h('span', { text: 'vide' }));
  stage.append(h('div', { class: 'onglets-wrap' }, cue, field, h('div', { class: 'game-controls' }, clock, notebook)));

  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => (timers.delete(id), fn()), ms);
    timers.add(id);
    return id;
  };
  const every = (fn, ms) => {
    const id = setInterval(fn, ms);
    timers.add(id);
    return id;
  };
  const clearAll = () => {
    timers.forEach((id) => (clearTimeout(id), clearInterval(id)));
    timers.clear();
  };

  const stats = { loaded: { shown: 0, hits: 0, rt: [] }, clear: { shown: 0, hits: 0, rt: [] } };
  const carnet = [];
  let phase = null;
  let phaseEnds = 0;
  let destroyed = false;

  function tickClock() {
    clock.textContent = phaseEnds ? `${Math.max(0, Math.ceil((phaseEnds - Date.now()) / 1000))} s` : '';
  }
  every(tickClock, 250);

  function spawnBubble() {
    const s = stats[phase];
    if (!s) return;
    s.shown += 1;
    const bubble = h('button', {
      type: 'button',
      class: 'bubble',
      'aria-label': 'Bulle',
      style: { left: `${6 + Math.random() * 84}%`, top: `${8 + Math.random() * 76}%` },
    });
    const born = performance.now();
    bubble.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      s.hits += 1;
      s.rt.push(performance.now() - born);
      audio.blip('pop');
      bubble.remove();
    });
    field.append(bubble);
    later(() => bubble.remove(), 1600);
  }

  function spawnTab() {
    const open = field.querySelectorAll('.tab').length;
    if (open >= 10) return;
    const used = new Set([...field.querySelectorAll('.tab')].map((t) => t.dataset.task));
    const task = TASKS.find((x) => !used.has(x)) ?? TASKS[open % TASKS.length];
    const tab = h('div', { class: 'tab', 'data-task': task, style: { left: `${Math.random() * 62}%`, top: `${Math.random() * 78}%` } }, h('span', { text: task }));
    field.append(tab);
    vibrate(15);
  }

  function wobble() {
    const tabs = field.querySelectorAll('.tab');
    if (!tabs.length) return;
    const tab = tabs[Math.floor(Math.random() * tabs.length)];
    tab.classList.remove('nudge-tab');
    void tab.offsetWidth; // relance l'animation
    tab.classList.add('nudge-tab');
  }

  function renderNotebook() {
    notebook.replaceChildren(
      h('strong', { text: 'Carnet' }),
      h('span', { text: carnet.length ? `${carnet.length} chose${carnet.length > 1 ? 's' : ''} notée${carnet.length > 1 ? 's' : ''}` : 'vide' }),
    );
  }

  function startLoaded() {
    phase = 'loaded';
    phaseEnds = Date.now() + LOADED * 1000;
    cue.textContent = 'Touche les bulles dès qu’elles apparaissent.';
    every(spawnBubble, 1100);
    later(spawnTab, 3000);
    every(spawnTab, 4200);
    every(wobble, 2300);
    later(startTidy, LOADED * 1000);
  }

  function startTidy() {
    clearAll();
    every(tickClock, 250);
    phase = 'tidy';
    phaseEnds = Date.now() + TIDY_MAX * 1000;
    field.querySelectorAll('.bubble').forEach((b) => b.remove());
    cue.textContent = 'Range tes onglets : pour chacun, décide quand tu t’en occupes.';
    const tabs = [...field.querySelectorAll('.tab')];
    if (!tabs.length) return startClear();
    // Les onglets s'alignent en liste : chacun devient facile à ranger.
    field.classList.add('tidying');
    tabs.forEach((tab) => {
      tab.classList.add('tidy');
      tab.style.left = '';
      tab.style.top = '';
      tab.append(
        h(
          'span',
          { class: 'tab-moments' },
          MOMENTS.map((moment) =>
            h(
              'button',
              {
                type: 'button',
                class: 'chip',
                onClick: () => {
                  carnet.push({ task: tab.dataset.task, moment });
                  audio.blip('pop');
                  tab.classList.add('filed');
                  later(() => {
                    tab.remove();
                    renderNotebook();
                    if (!field.querySelector('.tab')) startClear();
                  }, 260);
                },
              },
              moment,
            ),
          ),
        ),
      );
    });
    tabs[0].querySelector('.chip')?.focus();
    // Sans pression : ce qui n'est pas rangé à temps part dans « Plus tard ».
    later(() => {
      field.querySelectorAll('.tab').forEach((tab) => {
        carnet.push({ task: tab.dataset.task, moment: 'Plus tard' });
        tab.remove();
      });
      renderNotebook();
      startClear();
    }, TIDY_MAX * 1000);
  }

  function startClear() {
    if (phase === 'clear' || destroyed) return;
    clearAll();
    every(tickClock, 250);
    phase = 'clear';
    field.classList.remove('tidying');
    phaseEnds = Date.now() + CLEAR * 1000;
    cue.textContent = 'Même jeu, l’esprit rangé. Touche les bulles.';
    every(spawnBubble, 1100);
    later(finish, CLEAR * 1000);
  }

  function finish() {
    clearAll();
    phase = null;
    const rate = (s) => (s.shown ? s.hits / s.shown : 0);
    const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : Infinity);
    const easier = rate(stats.clear) - rate(stats.loaded) > 0.1 || mean(stats.clear.rt) < mean(stats.loaded.rt) * 0.9;
    const byMoment = MOMENTS.concat('Plus tard')
      .map((m) => [m, carnet.filter((c) => c.moment === m).map((c) => c.task)])
      .filter(([, tasks]) => tasks.length)
      .map(([m, tasks]) => `${m} : ${tasks.join(', ')}`);
    onEnd({
      message: easier
        ? 'Une fois tes onglets rangés, les bulles étaient plus faciles à cueillir.'
        : 'Cette fois, peu de différence. La charge mentale se fait souvent sentir sur la durée, plus qu’en deux minutes.',
      details: byMoment.length ? ['Ton carnet :', ...byMoment] : [],
    });
  }

  startLoaded();

  return {
    destroy() {
      destroyed = true;
      clearAll();
    },
  };
}
