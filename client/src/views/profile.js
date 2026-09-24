// Carte « avant de commencer » : situation (adapte exemples et ressources) et confirmation 18 ans et plus.

import { h } from '../dom.js';

const STATUSES = [
  { id: 'etudiant', label: 'Étudiant·e' },
  { id: 'actif', label: 'En activité' },
  { id: 'autre', label: 'Autre situation' },
];

function choiceGroup(label, options, initial, onChange) {
  let value = initial ?? null;
  const buttons = options.map((o) =>
    h('button', { type: 'button', class: 'card-option', role: 'radio', 'aria-checked': String(o.id === value) }, h('span', { class: 'check', 'aria-hidden': 'true' }), h('span', { text: o.label })),
  );
  buttons.forEach((btn, i) =>
    btn.addEventListener('click', () => {
      value = options[i].id;
      buttons.forEach((b, j) => b.setAttribute('aria-checked', String(j === i)));
      onChange(value);
    }),
  );
  return h('div', { class: 'choice-block' }, h('p', { class: 'choice-label', text: label }), h('div', { class: 'card-grid', role: 'radiogroup', 'aria-label': label }, buttons));
}

export function renderProfile(root, { profile, onSubmit, onBack }) {
  const answer = { status: profile?.status ?? null, adult: profile?.adult ?? null };
  const submit = h('button', { type: 'button', class: 'btn btn-primary', disabled: true }, 'Continuer');
  const error = h('p', { class: 'error-banner', role: 'alert', hidden: true });
  const refresh = () => (submit.disabled = !answer.status || answer.adult === null);

  submit.addEventListener('click', async () => {
    submit.disabled = true;
    error.hidden = true;
    try {
      await onSubmit(answer);
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      refresh();
    }
  });

  root.append(
    h(
      'div',
      { class: 'flow' },
      h('div', { class: 'flow-top' }, h('button', { type: 'button', class: 'btn btn-ghost', onClick: onBack }, '← Accueil')),
      h(
        'section',
        { class: 'question-card glass', style: { '--c': 'var(--accent)' }, 'aria-labelledby': 'profile-title' },
        h('span', { class: 'eyebrow', text: 'Avant de commencer' }),
        h('h2', { id: 'profile-title', tabindex: '-1', text: 'Deux précisions pour adapter Core à ton quotidien' }),
        choiceGroup('Tu es plutôt…', STATUSES, answer.status, (v) => {
          answer.status = v;
          refresh();
        }),
        choiceGroup(
          'As-tu 18 ans ou plus ?',
          [
            { id: 'yes', label: 'Oui' },
            { id: 'no', label: 'Non' },
          ],
          answer.adult === null ? null : answer.adult ? 'yes' : 'no',
          (v) => {
            answer.adult = v === 'yes';
            refresh();
          },
        ),
        error,
        h('div', { class: 'card-footer' }, h('span', { class: 'foundation', text: 'Ces réponses restent liées à ton profil et adaptent les exemples et les ressources proposées.' }), submit),
      ),
    ),
  );
  refresh();
  root.querySelector('#profile-title').focus({ preventScroll: true });
}

// Moins de 18 ans : Core n'est pas conçu pour ce public, on oriente vers des ressources adaptées.
export function renderUnderage(root, { onBack }) {
  root.append(
    h(
      'div',
      { class: 'flow' },
      h(
        'section',
        { class: 'intro-card plain glass', style: { '--c': 'var(--care)' } },
        h(
          'div',
          { class: 'intro-body' },
          h('span', { class: 'eyebrow', text: 'Merci pour ta franchise' }),
          h('h2', { text: 'Core est pensé pour les 18 ans et plus.' }),
          h('p', { class: 'lead', text: "Si tu as envie de parler de ce que tu vis, des personnes t'écoutent, gratuitement et sans jugement." }),
          h(
            'div',
            { class: 'resources' },
            h('div', { class: 'resource' }, h('strong', { text: 'Fil Santé Jeunes' }), h('span', { class: 'small muted', text: 'Anonyme et gratuit, pour les 12-25 ans' }), h('a', { class: 'contact', href: 'tel:0800235236', text: '0 800 235 236' })),
            h('div', { class: 'resource' }, h('strong', { text: '3114' }), h('span', { class: 'small muted', text: 'Écoute professionnelle en cas de grande détresse, 24 h/24' }), h('a', { class: 'contact', href: 'tel:3114', text: '3114' })),
          ),
          h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn btn-ghost', onClick: onBack }, 'Je me suis trompé·e')),
        ),
      ),
    ),
  );
}
