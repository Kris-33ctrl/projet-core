// Bilan non punitif : forme 3D, jauges continues sans chiffres, ce que Core remarque, micro-aides, bouclier éthique.

import { h, sphereColor, formatDate, qualitative } from '../dom.js';
import { createBlob } from '../components/blob.js';
import { openExercise } from '../components/exercise.js';
import { carePanel, specialisedPanel } from '../components/resources.js';
import { comparisonPanel } from '../components/evolution.js';

const KIND_LABEL = { exercice: 'Exercice', article: 'À lire', outil: 'Outil' };

function headline(result, meta) {
  const label = (id) => meta.spheres.find((s) => s.id === id).label;
  const entries = Object.entries(result.spheres).filter(([, v]) => v !== null);
  entries.sort((a, b) => b[1] - a[1]);
  const [strongest] = entries[0];
  const [weakest, weakValue] = entries[entries.length - 1];

  if (result.triage.pauseGamification) {
    return { title: 'Prends soin de toi, à ton rythme.', text: "Aujourd'hui, l'essentiel n'est pas dans les jauges. Des personnes formées sont là pour prendre le relais." };
  }
  if (result.harmony >= 0.85 && weakValue >= 60) {
    return { title: 'Ton Core est stable et bien ancré.', text: 'Tes cinq sphères se soutiennent mutuellement. Garde ce qui fonctionne.' };
  }
  return {
    title: `Ta force du moment : ${label(strongest)}.`,
    text: `${label(weakest)} te demande un peu d'attention. C'est là que tes prochaines actions auront le plus d'effet.`,
  };
}

function bar(value, sphere, label, thin = false, cap = null) {
  const capped = cap !== null && cap !== undefined;
  return h(
    'div',
    {
      class: `bar${thin ? ' thin' : ''}`,
      role: 'img',
      'aria-label': `${label} : ${qualitative(value)}${capped ? ', capacité temporairement bridée' : ''}`,
    },
    h('span', { class: 'bar-fill', style: { '--v': String(value ?? 0), '--c': sphereColor(sphere) } }),
    capped ? h('span', { class: 'bar-cap', style: { '--cap': String(cap) } }) : null,
  );
}

// Icône batterie basse : la baisse vient de la Machine, pas de la volonté.
function batteryIcon() {
  const span = h('span', { class: 'cap-icon', title: 'Capacité bridée : ta Machine est en mode économie d’énergie' });
  span.innerHTML =
    '<svg viewBox="0 0 24 12" aria-hidden="true"><rect x="0.75" y="0.75" width="19.5" height="10.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="21.2" y="3.5" width="2" height="5" rx="1" fill="currentColor"/><rect x="2.75" y="2.75" width="4.5" height="6.5" rx="1" fill="currentColor"/></svg>';
  span.append(h('span', { text: 'bridée' }));
  return span;
}

function gaugesPanel(result, meta) {
  return h(
    'section',
    { class: 'panel glass', 'aria-labelledby': 'g-title' },
    h('div', { class: 'panel-head' }, h('h2', { id: 'g-title', text: 'Tes cinq sphères' }), h('span', { class: 'small muted', text: 'Touche une sphère pour la détailler' })),
    h(
      'div',
      { class: 'gauges' },
      meta.spheres.map((s) =>
        h(
          'details',
          { class: 'gauge', style: { '--c': sphereColor(s.id) } },
          h(
            'summary',
            {},
            h(
              'span',
              { class: 'gauge-name' },
              h('strong', { text: s.label }),
              result.caps?.[s.id] ? batteryIcon() : h('span', { text: s.subtitle }),
            ),
            bar(result.spheres[s.id], s.id, s.label, false, result.caps?.[s.id]),
            h('span', { class: 'chevron', 'aria-hidden': 'true' }),
          ),
          h(
            'div',
            { class: 'subs' },
            s.subs.map((sub) =>
              h('div', { class: 'sub' }, h('span', { text: sub.label }), bar(result.subs[s.id][sub.id], s.id, sub.label, true), h('span')),
            ),
          ),
        ),
      ),
    ),
    h('p', { class: 'small muted', text: "Des jauges continues, sans note : ce qui compte, c'est l'équilibre entre les sphères et la façon dont il évolue." }),
    Object.keys(result.caps ?? {}).length
      ? h('p', { class: 'small muted', text: 'Zone hachurée : capacité temporairement bridée, le temps que ta Machine se recharge. Ce n’est pas un manque, c’est un mode économie d’énergie.' })
      : null,
  );
}

function insightsPanel(result) {
  const color = { impact: 'var(--pilote)', reframe: 'var(--machine)', buffer: 'var(--reseau)', care: 'var(--care)', alert: 'var(--soupapes)' };
  return h(
    'section',
    { class: 'panel glass', 'aria-labelledby': 'i-title' },
    h('h2', { id: 'i-title', text: 'Ce que Core remarque' }),
    result.insights.length
      ? h(
          'ul',
          { class: 'insights' },
          result.insights.map((i) => h('li', { class: 'insight' }, h('span', { class: 'dot', style: { '--c': color[i.kind] ?? 'var(--accent)' } }), h('span', { text: i.message }))),
        )
      : h('p', { class: 'muted', text: 'Rien de particulier à signaler : tes sphères se soutiennent mutuellement.' }),
  );
}

function nudgesPanel(result) {
  return h(
    'section',
    { class: 'panel glass', 'aria-labelledby': 'n-title' },
    h('h2', { id: 'n-title', text: 'Pour toi, maintenant' }),
    result.recommendations.length
      ? h(
          'div',
          { class: 'nudges' },
          result.recommendations.map((n) =>
            h(
              'button',
              { type: 'button', class: 'nudge', onClick: () => openExercise(n) },
              h('span', { class: 'nudge-meta' }, h('span', { text: KIND_LABEL[n.kind] ?? n.kind }), h('span', { text: n.duration })),
              h('h3', { text: n.title }),
              h('span', { class: 'small muted', text: n.summary }),
            ),
          ),
        )
      : h('p', { class: 'muted', text: 'Aucune aide particulière pour le moment. Reviens quand tu veux faire le point.' }),
  );
}

export function renderDashboard(root, { meta, result, history, onRestart, onOpenResult, onHome }) {
  const { title, text } = headline(result, meta);
  const stage = h('div');
  const firstReframe = result.insights.find((i) => i.kind === 'reframe') ?? result.insights.find((i) => i.kind === 'buffer');

  root.append(
    h(
      'div',
      { class: 'dash' },
      h(
        'header',
        { class: 'dash-head' },
        h('button', { type: 'button', class: 'btn btn-ghost brand', onClick: onHome }, 'core'),
        h('span', { class: 'small muted', text: `Bilan du ${formatDate(result.completedAt)}` }),
        h('button', { type: 'button', class: 'btn btn-quiet', onClick: onRestart }, 'Nouveau bilan'),
      ),
      result.triage.level === 'relais' ? carePanel(result.triage) : null,
      h(
        'section',
        { class: 'dash-hero' },
        stage,
        h(
          'div',
          { class: 'hero-copy' },
          h('span', { class: 'eyebrow', text: "Ton Core aujourd'hui" }),
          h('h1', { text: title }),
          h('p', { class: 'lead', text }),
          firstReframe ? h('p', { class: 'muted', text: firstReframe.message }) : null,
        ),
      ),
      gaugesPanel(result, meta),
      comparisonPanel({
        result,
        history,
        exercises: Object.fromEntries(meta.exercises.map((e) => [e.id, e])),
        games: Object.fromEntries(meta.games.filter((g) => g.status === 'ready').map((g) => [g.id, g])),
      }),
      h('div', { class: 'grid-2' }, insightsPanel(result), nudgesPanel(result)),
      result.triage.level === 'soutien' ? carePanel(result.triage) : null,
      specialisedPanel(result.triage),
      history.length > 1
        ? h(
            'section',
            { class: 'panel glass', 'aria-labelledby': 'h-title' },
            h('h2', { id: 'h-title', text: 'Tes bilans' }),
            h(
              'div',
              { class: 'history' },
              history.map((item) =>
                h('button', { type: 'button', class: 'chip', 'aria-current': String(item.id === result.id), onClick: () => onOpenResult(item.id) }, formatDate(item.completedAt)),
              ),
            ),
          )
        : null,
      h('p', { class: 'disclaimer', text: meta.disclaimer }),
    ),
  );

  const blob = createBlob(stage, { levels: result.spheres, harmony: result.harmony, calm: result.triage.pauseGamification });
  return () => blob.destroy();
}
