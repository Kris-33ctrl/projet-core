// Trois enveloppes : la bande passante mentale (Mani et al., 2013).
// On répartit des jetons (pas de l'argent réel) entre charges fixes, quotidien et imprévus, puis le mois défile.
// Chaque surprise que la réserve n'absorbe pas embrume la « bande passante » ; on peut réajuster et rejouer.

import { h } from '../dom.js';
import { audio, vibrate } from './feedback.js';
import { layout, timers } from './kit.js';

const TOTAL = 100;
const FIXED = 55; // loyer, abonnements : non négociables
const DAILY_PER_WEEK = 6;
const WEEKS = [
  { label: 'Semaine 1', event: null },
  { label: 'Semaine 2', event: { text: 'Réparation du vélo', cost: 8 } },
  { label: 'Semaine 3', event: { text: 'Anniversaire d’un·e proche', cost: 6 } },
  { label: 'Semaine 4', event: { text: 'Facture surprise', cost: 6 } },
];

export function createEnveloppes({ stage, onEnd }) {
  const { cue, scene, controls } = layout(stage, { sceneClass: 'enveloppes-scene' });
  const t = timers();
  let reserve = 10;
  let plays = 0;

  const jetons = (n) => `${n} jeton${Math.abs(n) > 1 ? 's' : ''}`;
  const envelope = (label, value, note) =>
    h('div', { class: 'envelope' }, h('span', { class: 'eyebrow', text: label }), h('strong', { class: 'envelope-value', text: jetons(value) }), note ? h('span', { class: 'small muted', text: note }) : null);

  const fog = h('div', { class: 'bandwidth', role: 'img', 'aria-label': 'Ta bande passante mentale' }, h('span', { class: 'bandwidth-fog' }), h('span', { class: 'bandwidth-label', text: 'Bande passante' }));
  const setFog = (v) => fog.style.setProperty('--fog', String(Math.max(0, Math.min(1, v))));

  function setup() {
    plays += 1;
    setFog(0);
    cue.textContent = plays === 1 ? 'Tes ressources du mois : 100 jetons. Répartis ce qui reste après les charges fixes.' : 'Réajuste tes enveloppes, puis retraverse le mois.';
    const range = h('input', { type: 'range', id: 'enveloppes-split', min: 0, max: TOTAL - FIXED, step: 1, value: reserve, 'aria-label': 'Jetons mis de côté pour les imprévus' });
    const row = h('div', { class: 'envelopes' });
    const render = () => {
      reserve = Number(range.value);
      row.replaceChildren(
        envelope('Charges fixes', FIXED, 'loyer, abonnements'),
        envelope('Quotidien', TOTAL - FIXED - reserve, 'courses, sorties, transports'),
        envelope('Imprévus', reserve, 'ta réserve'),
      );
    };
    range.addEventListener('input', render);
    render();
    const go = h('button', { type: 'button', class: 'btn btn-primary' }, 'Traverser le mois');
    go.addEventListener('click', month);
    scene.replaceChildren(row, h('label', { class: 'enveloppes-slider', for: 'enveloppes-split' }, h('span', { class: 'small', text: 'Quotidien' }), range, h('span', { class: 'small', text: 'Imprévus' })), fog);
    controls.replaceChildren(h('span', { class: 'small muted', text: 'Ce sont des jetons, pas ton argent : aucun mauvais choix.' }), go);
    range.focus();
  }

  function month() {
    let daily = TOTAL - FIXED - reserve;
    let left = reserve;
    let worry = 0;
    const log = h('ul', { class: 'enveloppes-log', 'aria-live': 'polite' });
    scene.replaceChildren(h('div', { class: 'envelopes' }), log, fog);
    controls.replaceChildren(h('span', { class: 'small muted', text: 'Le mois défile…' }));
    const row = scene.querySelector('.envelopes');
    const render = () => row.replaceChildren(envelope('Quotidien', Math.max(0, daily)), envelope('Imprévus', left));
    render();

    WEEKS.forEach((week, i) =>
      t.later(() => {
        daily -= DAILY_PER_WEEK;
        let line = `${week.label} : dépenses du quotidien.`;
        if (week.event) {
          const covered = Math.min(left, week.event.cost);
          left -= covered;
          const rest = week.event.cost - covered;
          if (rest > 0) {
            daily -= rest;
            worry += 0.3;
            vibrate(30);
            line = `${week.label} : ${week.event.text.toLowerCase()} (${week.event.cost} jetons). La réserve ne suffit pas : ça déborde sur le quotidien.`;
          } else {
            line = `${week.label} : ${week.event.text.toLowerCase()} (${week.event.cost} jetons), absorbé par ta réserve.`;
          }
          audio.blip('pop');
        }
        if (daily < 0) worry += 0.2;
        setFog(worry);
        render();
        log.append(h('li', { text: line }));
        if (i === WEEKS.length - 1) t.later(() => end(worry), 1200);
      }, 1800 * (i + 1)),
    );
    cue.textContent = 'Regarde ce qui se passe quand les imprévus tombent.';
  }

  function end(worry) {
    const calm = worry === 0;
    cue.textContent = calm ? 'Toutes les surprises ont été absorbées : ta bande passante est restée claire.' : 'Les surprises non couvertes ont embrumé ta bande passante.';
    const again = h('button', { type: 'button', class: 'btn btn-quiet' }, 'Réajuster et rejouer');
    const finish = h('button', { type: 'button', class: 'btn btn-primary' }, 'Terminer');
    again.addEventListener('click', setup);
    finish.addEventListener('click', () =>
      onEnd({
        message: calm
          ? 'Ta réserve a absorbé les imprévus : rien n’est venu encombrer ta tête.'
          : 'Sans réserve suffisante, chaque surprise déborde sur le reste et occupe l’esprit. Même une petite enveloppe « imprévus » change la donne.',
        details: [`Ta réserve pour les imprévus : ${jetons(reserve)} sur ${TOTAL - FIXED} disponibles.`],
      }),
    );
    controls.replaceChildren(plays < 3 ? again : h('span'), finish);
    finish.focus();
  }

  setup();
  return { destroy: () => t.clear() };
}
