// La batterie : ce qui recharge et ce qui vide (Phillips et al., 2017 ; Walker & van der Helm, 2009).
// On range des habitudes, chaque réponse dévoile une courte explication (pas de bonne ou mauvaise réponse),
// puis on choisit un seul levier pour la semaine : la batterie se remplit.

import { h } from '../dom.js';
import { audio, vibrate } from './feedback.js';
import { layout, shuffle, timers } from './kit.js';

const HABITS = [
  { text: 'Se lever à la même heure, même le week-end', effect: 'recharge', why: 'La régularité stabilise ton horloge interne : endormissement et réveil deviennent plus faciles.' },
  { text: 'Dix minutes de lumière du jour le matin', effect: 'recharge', why: 'La lumière du matin recale ton horloge interne et aide à t’endormir le soir.' },
  { text: 'Scroller au lit jusqu’à une heure du matin', effect: 'vide', why: 'La lumière des écrans et la stimulation retardent l’endormissement et raccourcissent la nuit.' },
  { text: 'Un café à 17 h', effect: 'vide', why: 'La caféine agit encore plusieurs heures après : elle peut rendre l’endormissement plus difficile.' },
  { text: 'Une grasse matinée de trois heures le dimanche', effect: 'vide', why: 'Décaler fortement ton réveil crée un petit décalage horaire : le lundi matin devient plus dur.' },
  { text: 'Une sieste de 20 minutes en début d’après-midi', effect: 'recharge', why: 'Une sieste courte et pas trop tardive recharge sans empiéter sur la nuit.' },
  { text: 'Une marche de dix minutes', effect: 'recharge', why: 'Bouger un peu relance l’énergie et aide souvent à mieux dormir le soir.' },
  { text: 'Une routine calme avant de dormir', effect: 'recharge', why: 'Un rituel répété signale à ton corps que la nuit approche.' },
  { text: 'Réviser ou travailler dans ton lit', effect: 'vide', why: 'Associer le lit à l’activité mentale peut rendre l’endormissement plus difficile.' },
  { text: 'Sauter le déjeuner pour gagner du temps', effect: 'vide', why: 'Le coup de fatigue arrive souvent plus tard dans l’après-midi.' },
];
const ROUNDS = 8;

export function createBatterie({ stage, onEnd }) {
  const { cue, scene, controls } = layout(stage, { sceneClass: 'batterie-scene' });
  const t = timers();
  const habits = shuffle(HABITS).slice(0, ROUNDS);
  const discovered = [];
  let charge = 0.35;

  const fill = h('span', { class: 'battery-fill' });
  const battery = h('div', { class: 'battery', role: 'img', 'aria-label': 'Ta batterie' }, h('span', { class: 'battery-cap' }), fill);
  const setCharge = (v) => {
    charge = Math.max(0.08, Math.min(1, v));
    fill.style.setProperty('--level', String(charge));
  };
  setCharge(charge);

  function sortPhase(i = 0) {
    const habit = habits[i];
    cue.textContent = 'Cette habitude recharge ou vide ta batterie ?';
    const reveal = h('p', { class: 'batterie-why', 'aria-live': 'polite' });
    const buttons = ['recharge', 'vide'].map((effect) =>
      h('button', { type: 'button', class: 'btn btn-quiet' }, effect === 'recharge' ? 'Ça recharge' : 'Ça vide'),
    );
    buttons.forEach((b, k) =>
      b.addEventListener('click', () => {
        buttons.forEach((x) => (x.disabled = true));
        const guess = k === 0 ? 'recharge' : 'vide';
        reveal.textContent = `${guess === habit.effect ? 'Bien vu. ' : ''}Plutôt ça ${habit.effect === 'recharge' ? 'recharge' : 'vide'} : ${habit.why}`;
        setCharge(charge + (habit.effect === 'recharge' ? 0.07 : -0.05));
        audio.blip('pop');
        discovered.push(habit);
        next.hidden = false;
        next.focus();
      }),
    );
    const next = h('button', { type: 'button', class: 'btn btn-primary', hidden: true }, i < habits.length - 1 ? 'Habitude suivante' : 'Choisir mon levier');
    next.addEventListener('click', () => (i < habits.length - 1 ? sortPhase(i + 1) : choosePhase()));
    scene.replaceChildren(battery, h('p', { class: 'batterie-habit', text: habit.text }), h('div', { class: 'actions' }, buttons), reveal);
    controls.replaceChildren(h('span', { class: 'small muted', text: `Habitude ${i + 1} sur ${habits.length}` }), next);
    buttons[0].focus();
  }

  function choosePhase() {
    cue.textContent = 'Un seul levier pour ta semaine : lequel te semble le plus facile ?';
    const options = discovered.filter((x) => x.effect === 'recharge');
    const list = h(
      'div',
      { class: 'card-grid frequency' },
      options.map((habit) =>
        h(
          'button',
          {
            type: 'button',
            class: 'card-option',
            onClick: () => {
              setCharge(1);
              vibrate([20, 60, 20]);
              audio.blip('chime');
              t.later(() => onEnd({ message: 'Ta batterie a un levier pour la semaine.', details: [`Ton levier : ${habit.text.toLowerCase()}.`] }), 1200);
            },
          },
          h('span', { class: 'check', 'aria-hidden': 'true' }),
          h('span', { text: habit.text }),
        ),
      ),
    );
    scene.replaceChildren(battery, list);
    controls.replaceChildren(h('span', { class: 'small muted', text: 'Un seul, c’est déjà beaucoup.' }));
  }

  sortPhase();
  return { destroy: () => t.clear() };
}
