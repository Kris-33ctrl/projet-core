// « Ta semaine » : les 7 derniers jours de check-in, en barres continues sans chiffres.

import { h, localDay, formatDay, qualitative } from '../dom.js';

export const DAILY_LABELS = {
  battery: 'Batterie',
  mood: 'Météo',
  clarity: 'Espace de pensée',
  tension: 'Corps',
  agency: 'Contrôle',
  connection: 'Lien',
  motivation: 'Projets',
  screens: 'Écrans',
};

// Les trois cartes fixes sont suivies jour après jour ; la carte tournante varie et n'est pas tracée.
const TRACKED = [
  { key: 'battery', color: 'var(--machine)' },
  { key: 'mood', color: 'var(--pilote)' },
  { key: 'clarity', color: 'var(--reseau)' },
];

export function lastSevenDays(today) {
  const base = new Date(`${today}T12:00:00`);
  return Array.from({ length: 7 }, (_, i) => localDay(new Date(base.getTime() - (6 - i) * 86400000)));
}

export function weekPanel({ week, today, bilanDays = [] }) {
  const byDay = Object.fromEntries(week.map((c) => [c.day, c.summary]));
  const days = lastSevenDays(today);
  const filled = days.filter((d) => byDay[d]).length;

  const columns = days.map((day) => {
    const summary = byDay[day];
    const name = formatDay(day, { weekday: 'long', day: 'numeric' });
    const label = summary
      ? `${name} : ${TRACKED.map((t) => `${DAILY_LABELS[t.key].toLowerCase()} ${qualitative(summary.levels[t.key])}`).join(', ')}`
      : `${name} : pas de check-in`;
    return h(
      'div',
      { class: `day${day === today ? ' today' : ''}${summary ? '' : ' empty'}`, role: 'img', 'aria-label': label },
      h(
        'div',
        { class: 'day-bars', 'aria-hidden': 'true' },
        summary ? TRACKED.map((t) => h('i', { style: { '--v': String(summary.levels[t.key] ?? 0), '--c': t.color } })) : h('span', { class: 'day-empty' }),
      ),
      h('span', { class: 'day-name', 'aria-hidden': 'true', text: formatDay(day, { weekday: 'short' }).replace('.', '') }),
      h('span', { class: 'day-num', 'aria-hidden': 'true', text: formatDay(day, { day: 'numeric' }) }),
      bilanDays.includes(day) ? h('span', { class: 'day-mark', 'aria-hidden': 'true', text: 'bilan' }) : null,
    );
  });

  return h(
    'section',
    { class: 'panel glass', 'aria-labelledby': 'week-title' },
    h(
      'div',
      { class: 'panel-head' },
      h('h2', { id: 'week-title', text: 'Ta semaine' }),
      h('span', { class: 'small muted', text: filled ? `${filled} check-in${filled > 1 ? 's' : ''} sur 7 jours` : 'Ton premier check-in apparaîtra ici' }),
    ),
    h('div', { class: 'week' }, columns),
    h(
      'div',
      { class: 'legend', 'aria-hidden': 'true' },
      TRACKED.map((t) => h('span', {}, h('i', { class: 'dot', style: { '--c': t.color } }), DAILY_LABELS[t.key])),
    ),
  );
}

// Niveaux du jour, en barres horizontales, pour la carte « check-in fait ».
export function todayLevels(summary) {
  return h(
    'div',
    { class: 'today-levels' },
    Object.entries(summary.levels).map(([key, value]) =>
      h(
        'div',
        { class: 'sub' },
        h('span', { text: DAILY_LABELS[key] ?? key }),
        h(
          'div',
          { class: 'bar thin', role: 'img', 'aria-label': `${DAILY_LABELS[key] ?? key} : ${qualitative(value)}` },
          h('span', { class: 'bar-fill', style: { '--v': String(value), '--c': 'var(--accent)' } }),
        ),
      ),
    ),
  );
}
