// Comparaison d'un bilan au précédent : ce qui progresse, ce qui est stable, ce qui demande plus d'attention.
// Vocabulaire non punitif : une baisse n'est jamais un échec, c'est une zone qui mérite de l'attention.

import { SPHERES, SPHERE_LABELS, COMPARISON as C } from './config.js';
import { SPHERE_WEIGHTS, SUB_LABELS } from './scoring.js';
import { GAME_FOR_SUB } from './games.js';

const round = (v) => Math.round(v * 10) / 10;

// Pour chaque sous-jauge qui demande de l'attention, l'exercice le plus directement utile.
export const EXERCISE_FOR_SUB = {
  sommeil: 'sommeil_batterie',
  dynamique: 'micro_mouvement',
  carburant: 'repas_poses',
  charge: 'vider_la_tete',
  stress: 'coherence_cardiaque',
  humeur: 'auto_compassion',
  soutien: 'exteriorisation',
  connexion: 'lien_leger',
  confort: 'lien_leger',
  projets: 'sens_projets',
  finances: 'budget_visuel',
  ecrans: 'ecrans_choisis',
  coping: 'restructuration',
  controle: 'reconnexion',
};

function trendOf(delta) {
  if (delta === null) return null;
  if (delta >= C.significant) return 'up';
  if (delta <= -C.significant) return 'down';
  return 'stable';
}

function entry(now, before) {
  const delta = now === null || now === undefined || before === null || before === undefined ? null : round(now - before);
  return { now: now ?? null, before: before ?? null, delta, trend: trendOf(delta) };
}

export function compareResults(current, previous, { since = null } = {}) {
  const spheres = SPHERES.map((id) => ({ id, label: SPHERE_LABELS[id], ...entry(current.spheres[id], previous.spheres[id]) }));

  const subs = SPHERES.flatMap((sphere) =>
    Object.keys(SPHERE_WEIGHTS[sphere]).map((id) => ({
      sphere,
      id,
      label: SUB_LABELS[id],
      ...entry(current.subs?.[sphere]?.[id], previous.subs?.[sphere]?.[id]),
    })),
  );

  const improvements = subs.filter((s) => s.trend === 'up').sort((a, b) => b.delta - a.delta).slice(0, C.maxHighlights);
  const attention = subs
    .filter((s) => s.trend === 'down')
    .sort((a, b) => a.delta - b.delta)
    .slice(0, C.maxHighlights)
    .map((s) => ({ ...s, exercise: EXERCISE_FOR_SUB[s.id] ?? null, game: GAME_FOR_SUB[s.id] ?? null }));

  let summary;
  if (improvements.length && attention.length) {
    summary = `${improvements[0].label} progresse, ${attention[0].label.toLowerCase()} demande plus d'attention.`;
  } else if (improvements.length) {
    summary = `Ça progresse, avec ${improvements[0].label.toLowerCase()} en tête.`;
  } else if (attention.length) {
    summary = `Semaine plus chargée : ${attention[0].label.toLowerCase()} demande plus d'attention.`;
  } else {
    summary = 'Ton équilibre est stable depuis le dernier bilan.';
  }

  return {
    since,
    summary,
    spheres,
    subs,
    improvements,
    attention,
    harmony: { now: current.harmony, before: previous.harmony, delta: round((current.harmony - previous.harmony) * 100) / 100 },
    bridage: { before: Boolean(previous.flags?.bridage), now: Boolean(current.flags?.bridage) },
  };
}
