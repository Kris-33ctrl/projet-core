// Check-in quotidien (~30 s) : 3 cartes fixes + 1 carte tirée de la sphère la plus sollicitée au dernier bilan.
// Le PHQ-4 s'y ajoute quand il est dû (routine de 14 jours, ou vigilance après 7 jours).

import { TRIAGE as T } from './config.js';
import { DAILY_QUESTIONS, publicQuestion } from './questions.js';
import { SCREENING_QUESTIONS } from './screening.js';
import { getNudge } from './recommendations.js';

const BY_ID = Object.fromEntries(DAILY_QUESTIONS.map((q) => [q.id, q]));
const FIXED = ['daily.battery', 'daily.mood', 'daily.clarity'];
const ROTATION = {
  machine: 'daily.tension',
  pilote: 'daily.agency',
  reseau: 'daily.connection',
  cadre: 'daily.motivation',
  soupapes: 'daily.screens',
};

// Sphère la plus basse du dernier bilan : c'est elle qui mérite un suivi quotidien.
export function rotatingSphere(lastResult) {
  const entries = Object.entries(lastResult?.spheres ?? {}).filter(([, v]) => v !== null);
  if (!entries.length) return 'pilote';
  return entries.sort((a, b) => a[1] - b[1])[0][0];
}

export function planCheckin({ lastResult = null, screeningDue = false, profile = null } = {}) {
  const ids = [...FIXED, ROTATION[rotatingSphere(lastResult)]];
  return [...ids.map((id) => BY_ID[id]), ...(screeningDue ? SCREENING_QUESTIONS : [])].map((q) =>
    publicQuestion(q, profile),
  );
}

const SUGGESTIONS = {
  'daily.battery': 'sommeil_batterie',
  'daily.mood': 'coherence_cardiaque',
  'daily.clarity': 'vider_la_tete',
  'daily.tension': 'micro_mouvement',
  'daily.agency': 'coherence_cardiaque',
  'daily.connection': 'lien_leger',
  'daily.motivation': 'sens_projets',
  'daily.screens': 'ecrans_choisis',
};

// Niveaux de ressource du jour (0-100, plus haut = plus disponible) et jour d'alerte éventuel.
export function summarizeCheckin(answers) {
  const levels = {};
  for (const id of Object.keys(BY_ID)) {
    if (typeof answers[id] === 'number') levels[id.slice('daily.'.length)] = Math.round((100 - answers[id]) * 10) / 10;
  }
  const alert = answers['daily.mood'] > T.gate.mood || answers['daily.agency'] > T.gate.agency;

  // Une seule micro-aide : celle de la carte la plus basse, si elle passe sous 40.
  const [lowestId, lowest] = Object.entries(answers)
    .filter(([id, v]) => id in BY_ID && typeof v === 'number')
    .map(([id, v]) => [id, 100 - v])
    .sort((a, b) => a[1] - b[1])[0] ?? [null, 100];
  const suggestion = lowest < 40 ? getNudge(SUGGESTIONS[lowestId]) : null;

  return { levels, alert: Boolean(alert), suggestion };
}
