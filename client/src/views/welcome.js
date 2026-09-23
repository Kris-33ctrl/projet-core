import { h, sphereColor, formatDate } from '../dom.js';
import { createBlob } from '../components/blob.js';

export function renderWelcome(root, { meta, history, pending, onStart, onResume, onOpenResult }) {
  const latest = history[0];
  const stage = h('div');

  const actions = pending
    ? [
        h('button', { type: 'button', class: 'btn btn-primary', onClick: onResume }, 'Reprendre mon bilan'),
        h('button', { type: 'button', class: 'btn btn-ghost', onClick: onStart }, 'Recommencer à zéro'),
      ]
    : [h('button', { type: 'button', class: 'btn btn-primary', onClick: onStart }, latest ? 'Faire un nouveau bilan' : 'Commencer mon bilan')];

  if (latest) {
    actions.push(
      h('button', { type: 'button', class: 'btn btn-quiet', onClick: () => onOpenResult(latest.id), title: `Bilan du ${formatDate(latest.completedAt)}` }, 'Revoir mon dernier bilan'),
    );
  }

  root.append(
    h(
      'section',
      { class: 'welcome' },
      h(
        'div',
        { class: 'welcome-copy' },
        h('span', { class: 'brand', text: 'core' }),
        h('h1', { text: 'Cartographier ton équilibre, sans te noter.' }),
        h('p', {
          class: 'lead',
          text: 'Quelques cartes et des curseurs, sans formulaire ni score sur 10. Core croise cinq sphères de ton quotidien et te propose de petites aides au bon moment.',
        }),
        h(
          'ul',
          { class: 'pillars', 'aria-label': 'Les cinq sphères' },
          meta.spheres.map((s) => h('li', {}, h('span', { class: 'dot', style: { '--c': sphereColor(s.id) } }), s.label)),
        ),
        h('div', { class: 'actions' }, actions),
        h('p', { class: 'small muted', text: pending ? 'Tes réponses précédentes sont gardées.' : 'Compte environ 4 minutes.' }),
        h('p', { class: 'disclaimer', text: meta.disclaimer }),
      ),
      stage,
    ),
  );

  const blob = createBlob(stage, latest ? { levels: latest.spheres, harmony: latest.harmony } : { harmony: 0.75 });
  return () => blob.destroy();
}
