// Première visite : le Core au-dessus des dunes, puis les cinq sphères en paysages.

import { h, formatDate } from '../dom.js';
import { createBlob } from '../components/blob.js';
import { brand } from '../components/brand.js';
import { emblem } from '../art/emblems.js';
import { landscape, dunes } from '../art/landscapes.js';

export function renderWelcome(root, { meta, history, pending, onStart, onResume, onOpenResult }) {
  const latest = history[0];
  const stage = h('div');

  const actions = pending
    ? [
        h('button', { type: 'button', class: 'btn btn-primary', onClick: onResume }, 'Reprendre mon bilan'),
        h('button', { type: 'button', class: 'btn btn-ghost', onClick: onStart }, 'Recommencer à zéro'),
      ]
    : [h('button', { type: 'button', class: 'btn btn-primary', onClick: onStart }, latest ? 'Faire un nouveau bilan' : 'Commencer le voyage')];

  if (latest) {
    actions.push(
      h('button', { type: 'button', class: 'btn btn-quiet', onClick: () => onOpenResult(latest.id), title: `Bilan du ${formatDate(latest.completedAt)}` }, 'Revoir mon dernier bilan'),
    );
  }

  root.append(
    h(
      'div',
      { class: 'welcome' },
      h('header', { class: 'dash-head' }, brand()),
      h(
        'section',
        { class: 'welcome-hero' },
        h(
          'div',
          { class: 'welcome-copy' },
          h('h1', { text: 'Cartographier ton équilibre, sans te noter.' }),
          h('p', {
            class: 'lead',
            text: 'Quelques cartes et des curseurs, sans formulaire ni score sur 10. Core traverse avec toi cinq paysages de ton quotidien et te propose de petites aides au bon moment.',
          }),
          h('div', { class: 'actions' }, actions),
          h('p', { class: 'small muted', text: pending ? 'Tes réponses précédentes sont gardées.' : 'Compte environ 4 minutes.' }),
        ),
        h('div', { class: 'hero-scene' }, dunes({ ribbon: true }), stage),
      ),
      h(
        'section',
        { 'aria-labelledby': 'spheres-title' },
        h('h2', { id: 'spheres-title', class: 'eyebrow', text: 'Les cinq paysages du voyage', style: { 'margin-bottom': '16px' } }),
        h(
          'ul',
          { class: 'sphere-tiles' },
          meta.spheres.map((s) =>
            h(
              'li',
              { class: 'sphere-tile', style: { '--c': `var(--${s.id})` } },
              landscape(s.id),
              h('h3', {}, emblem(s.id), s.label),
              h('p', { text: s.subtitle }),
            ),
          ),
        ),
      ),
      h('p', { class: 'disclaimer', text: meta.disclaimer }),
    ),
  );

  const blob = createBlob(stage, latest ? { levels: latest.spheres, harmony: latest.harmony } : { harmony: 0.75 });
  return () => blob.destroy();
}
