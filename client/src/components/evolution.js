// Comparaison d'un bilan au précédent, sans chiffres : un marqueur « avant → maintenant » par sphère,
// une tendance écrite en toutes lettres, et une mini-courbe dès 3 bilans.
// Les points d'attention proposent directement l'exercice adapté.

import { h, sphereColor, formatDate, qualitative } from '../dom.js';
import { openExercise } from './exercise.js';

const TREND = {
  up: { icon: '↗', label: 'en hausse' },
  stable: { icon: '→', label: 'stable' },
  down: { icon: '↘', label: 'demande de l’attention' },
};

const SVG_NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

// Avant → maintenant sur l'échelle de la jauge (0 à 100), une seule teinte en deux états.
function dumbbell(entry) {
  const color = sphereColor(entry.id);
  const lo = Math.min(entry.before, entry.now);
  const hi = Math.max(entry.before, entry.now);
  return h(
    'div',
    { class: 'dumbbell', role: 'img', 'aria-label': `${entry.label} : ${TREND[entry.trend].label} depuis le bilan précédent, ressources ${qualitative(entry.now)}` },
    h('span', { class: 'db-link', style: { left: `${lo}%`, width: `${hi - lo}%`, '--c': color } }),
    h('span', { class: 'db-before', style: { left: `${entry.before}%`, '--c': color } }),
    h('span', { class: 'db-now', style: { left: `${entry.now}%`, '--c': color } }),
  );
}

// Mini-courbe d'une sphère sur les derniers bilans : échelle fixe 0-100 pour ne pas exagérer les écarts.
function sparkline(points, sphere, label) {
  const W = 120;
  const H = 34;
  const pad = 5;
  const x = (i) => pad + (i * (W - 2 * pad)) / Math.max(1, points.length - 1);
  const y = (v) => pad + (1 - v / 100) * (H - 2 * pad);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`;

  const el = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'spark', role: 'img', 'aria-label': `${label} : évolution sur les ${points.length} derniers bilans` });
  el.append(svg('line', { x1: pad, x2: W - pad, y1: H - pad, y2: H - pad, class: 'spark-base' }));
  el.append(svg('path', { d: area, style: `fill: var(--${sphere}); fill-opacity: 0.1` }));
  el.append(svg('path', { d: line, style: `fill: none; stroke: var(--${sphere}); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round` }));
  points.forEach((p, i) => {
    if (i === points.length - 1) {
      el.append(svg('circle', { cx: x(i), cy: y(p.value), r: 4, style: `fill: var(--${sphere}); stroke: var(--spark-ring); stroke-width: 2` }));
    }
    // Zone de survol plus large que le point : date et niveau qualitatif, jamais de chiffre.
    const hit = svg('circle', { cx: x(i), cy: y(p.value), r: 9, class: 'spark-hit' });
    const title = svg('title');
    title.textContent = `Bilan du ${formatDate(p.at)} : ${qualitative(p.value)}`;
    hit.append(title);
    el.append(hit);
  });
  return el;
}

function highlightList(title, items, { exercises, empty }) {
  return h(
    'div',
    { class: 'evo-list' },
    h('h3', { text: title }),
    items.length
      ? h(
          'ul',
          {},
          items.map((item) => {
            const exercise = item.exercise ? exercises[item.exercise] : null;
            return h(
              'li',
              {},
              h('span', { class: 'evo-item' }, h('i', { class: 'dot', style: { '--c': sphereColor(item.sphere) } }), h('span', { text: item.label }), h('span', { class: 'evo-icon', 'aria-hidden': 'true', text: TREND[item.trend].icon })),
              exercise
                ? h('button', { type: 'button', class: 'btn btn-quiet btn-small', onClick: () => openExercise(exercise) }, `Essayer : ${exercise.title}`)
                : null,
            );
          }),
        )
      : h('p', { class: 'small muted', text: empty }),
  );
}

export function comparisonPanel({ result, history, exercises }) {
  const comparison = result.comparison;
  if (!comparison) return null;
  const series = history.filter((b) => b.completedAt <= result.completedAt).reverse().slice(-8);
  const withSparks = series.length >= 3;

  return h(
    'section',
    { class: 'panel glass', 'aria-labelledby': 'evo-title' },
    h(
      'div',
      { class: 'panel-head' },
      h('h2', { id: 'evo-title', text: `Depuis ton bilan du ${formatDate(comparison.since)}` }),
      h('span', { class: 'evo-legend', 'aria-hidden': 'true' }, h('span', { class: 'db-key before' }), 'avant', h('span', { class: 'db-key now' }), 'maintenant'),
    ),
    h('p', { class: 'lead', text: comparison.summary }),
    h(
      'div',
      { class: `evo-rows${withSparks ? ' with-sparks' : ''}` },
      comparison.spheres
        .filter((s) => s.delta !== null)
        .map((s) =>
          h(
            'div',
            { class: 'evo-row' },
            h('span', { class: 'evo-name' }, h('i', { class: 'dot', style: { '--c': sphereColor(s.id) } }), s.label),
            dumbbell(s),
            h('span', { class: `trend trend-${s.trend}` }, h('span', { 'aria-hidden': 'true', text: TREND[s.trend].icon }), TREND[s.trend].label),
            withSparks ? sparkline(series.map((b) => ({ at: b.completedAt, value: b.spheres[s.id] ?? 0 })), s.id, s.label) : null,
          ),
        ),
    ),
    h(
      'div',
      { class: 'grid-2 evo-lists' },
      highlightList('Ce qui progresse', comparison.improvements, { exercises, empty: 'Pas de hausse nette cette fois-ci : les petites variations ne sont pas comptées.' }),
      highlightList('Ce qui mérite ton attention', comparison.attention, { exercises, empty: 'Rien ne recule nettement depuis le dernier bilan.' }),
    ),
    h('p', { class: 'small muted', text: 'Une variation de moins de 5 points sur 100 est considérée comme stable : un curseur bouge toujours un peu d’une fois sur l’autre.' }),
  );
}
