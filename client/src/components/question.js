// Carte-question partagée par le bilan complet et le check-in quotidien.

import { h, sphereColor } from '../dom.js';
import { slider, cards, frequency } from './inputs.js';

export const isScreening = (question) => question.type === 'frequency';

/**
 * @param {object} p
 * @param {object} p.question  question publique (slider, cards ou frequency)
 * @param {string} p.label     libellé de sphère pour le sur-titre
 * @param {*} p.initial        réponse déjà donnée, pour un retour en arrière
 * @param {(value: unknown) => Promise<void>} p.onSubmit
 */
export function questionCard({ question, label, initial, onSubmit }) {
  const submit = h('button', { type: 'button', class: 'btn btn-primary' }, 'Continuer');
  const error = h('p', { class: 'error-banner', role: 'alert', hidden: true });

  let input;
  if (question.type === 'slider') input = slider(question, initial, () => {});
  else if (question.type === 'frequency') {
    input = frequency(question, initial, () => (submit.disabled = false));
    submit.disabled = !Number.isInteger(initial);
  } else {
    input = cards(question, initial ?? [], (value) => (submit.textContent = value.length ? 'Continuer' : 'Aucune de ces cartes'));
    if (!(initial ?? []).length) submit.textContent = 'Aucune de ces cartes';
  }

  const heading = h('h2', { id: `h-${question.id}`, tabindex: '-1', text: question.prompt });

  submit.addEventListener('click', async () => {
    submit.disabled = true;
    error.hidden = true;
    try {
      await onSubmit(input.value());
    } catch (err) {
      error.textContent = `${err.message} Réessaie dans un instant.`;
      error.hidden = false;
      submit.disabled = false;
    }
  });

  const card = h(
    'section',
    { class: `question-card glass${isScreening(question) ? ' screening' : ''}`, style: { '--c': sphereColor(question.sphere) }, 'aria-labelledby': `h-${question.id}` },
    h('div', { class: 'question-meta' }, h('span', { class: 'dot', style: { '--c': sphereColor(question.sphere) } }), h('span', { class: 'eyebrow', text: `${label} · ${question.section}` })),
    question.lead ? h('p', { class: 'question-lead', text: question.lead }) : null,
    heading,
    input.el,
    error,
    h('div', { class: 'card-footer' }, h('span', { class: 'foundation', text: `Inspiré de : ${question.foundation}` }), submit),
  );
  return { el: card, focus: () => heading.focus({ preventScroll: true }) };
}

// Avant les quatre questions validées : expliquer pourquoi le format change.
export function screeningIntro(onContinue) {
  const go = h('button', { type: 'button', class: 'btn btn-primary', onClick: onContinue }, 'Continuer');
  const el = h(
    'section',
    { class: 'intro-card glass', style: { '--c': 'var(--pilote)' } },
    h('span', { class: 'eyebrow', text: 'Repérage · 1 minute' }),
    h('h2', { text: 'Quatre questions un peu différentes' }),
    h('p', {
      class: 'lead',
      text: "Elles viennent d'un outil de repérage utilisé par les professionnels de santé et portent sur les deux dernières semaines. Leur format ne change pas pour rester fiable. Il n'y a pas de bonne réponse.",
    }),
    h('div', { class: 'actions' }, go),
  );
  return { el, focus: () => go.focus({ preventScroll: true }) };
}
