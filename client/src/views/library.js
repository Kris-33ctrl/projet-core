// Boîte à outils : tous les exercices, accessibles à tout moment, pas seulement quand ils sont recommandés.

import { h } from '../dom.js';
import { openExercise } from '../components/exercise.js';

const KIND = { exercice: 'Exercice', outil: 'Outil', article: 'À lire' };

export function exerciseCard(exercise, { practiced = false } = {}) {
  return h(
    'button',
    { type: 'button', class: 'nudge', onClick: () => openExercise(exercise) },
    h(
      'span',
      { class: 'nudge-meta' },
      h('span', { text: KIND[exercise.kind] ?? exercise.kind }),
      h('span', { text: exercise.duration }),
      practiced ? h('span', { class: 'done-chip', text: 'fait cette semaine' }) : null,
    ),
    h('h3', { text: exercise.title }),
    h('span', { class: 'small muted', text: exercise.summary }),
  );
}

export function renderLibrary(root, { meta, today, onBack }) {
  const practiced = new Set((today?.practices ?? []).map((p) => p.exerciseId));
  const byId = Object.fromEntries(meta.exercises.map((e) => [e.id, e]));
  const recommended = (today?.lastBilan?.recommendations ?? []).map((id) => byId[id]).filter(Boolean);
  const card = (e) => exerciseCard(e, { practiced: practiced.has(e.id) });

  root.append(
    h(
      'div',
      { class: 'dash' },
      h('header', { class: 'dash-head' }, h('button', { type: 'button', class: 'btn btn-ghost', onClick: onBack }, '← Accueil')),
      h(
        'div',
        { class: 'hero-copy' },
        h('span', { class: 'eyebrow', text: `${meta.exercises.length} exercices` }),
        h('h1', { text: 'Ta boîte à outils' }),
        h('p', { class: 'lead', text: 'Des exercices courts, à pratiquer quand tu veux. Chacun explique pourquoi il aide. Ce que tu écris pendant un exercice n’est jamais enregistré.' }),
      ),
      recommended.length
        ? h('section', { class: 'panel glass', 'aria-labelledby': 'lib-reco' }, h('h2', { id: 'lib-reco', text: 'Pour toi en ce moment' }), h('div', { class: 'library-grid' }, recommended.map(card)))
        : null,
      meta.exerciseCategories.map((category) => {
        const items = meta.exercises.filter((e) => e.category === category.id);
        if (!items.length) return null;
        return h(
          'section',
          { class: 'panel glass', 'aria-labelledby': `lib-${category.id}` },
          h('h2', { id: `lib-${category.id}`, text: category.label }),
          h('div', { class: 'library-grid' }, items.map(card)),
        );
      }),
    ),
  );
}
