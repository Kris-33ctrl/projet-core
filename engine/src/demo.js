// Scénarios de démonstration (outil de développement uniquement).
// Ils génèrent un historique réaliste en faisant avancer une horloge simulée :
// 3 bilans espacés d'une semaine, des check-ins quotidiens, quelques exercices pratiqués.
// Toutes les données passent par le vrai service, donc par les vraies règles (triage, comparaison…).

import { createCoreService } from './service.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const PREFIXES = ['sleep', 'body', 'fuel', 'mind', 'social', 'env', 'reg'];

// Valeurs des curseurs par famille de questions, semaine après semaine (0 = ressource, 100 = tension).
// `cards` : cartes cochées quand la question apparaît ; `phq` : réponse aux 4 items de repérage (0-3) ;
// `daily` : niveau de tension moyen du check-in (même échelle que les curseurs).
export const DEMO_SCENARIOS = [
  {
    id: 'equilibre',
    label: 'Équilibre qui progresse',
    description: 'Un profil plutôt stable, dont le sommeil et le cadre s’améliorent au fil des semaines.',
    status: 'etudiant',
    sliders: { sleep: [55, 45, 30], body: [40, 38, 35], fuel: [35, 35, 30], mind: [45, 40, 35], social: [30, 30, 25], env: [50, 40, 30], reg: [35, 35, 30] },
    cards: {},
    phq: [1, 0, 0],
    daily: [45, 38, 30],
  },
  {
    id: 'bridage',
    label: 'Machine épuisée (bridage)',
    description: 'Sommeil et énergie au plus bas : Pilote et Réseau bridés à 80, message « batterie physique d’abord ».',
    status: 'actif',
    sliders: { sleep: [70, 78, 82], body: [65, 75, 80], fuel: [60, 70, 75], mind: [40, 35, 25], social: [25, 20, 15], env: [35, 35, 35], reg: [40, 40, 40] },
    cards: { 'sleep.disturbances': ['wake', 'unrefreshing'], 'body.location': ['head'], 'fuel.deficits': ['hydration', 'rushed'] },
    phq: [1, 1, 1],
    daily: [55, 65, 72],
  },
  {
    id: 'relais',
    label: 'Surcharge persistante (relais)',
    description: 'Humeur lourde et perte de contrôle, PHQ-4 sévère : le jeu se met en pause et les ressources passent en premier.',
    status: 'etudiant',
    sliders: { sleep: [60, 65, 70], body: [55, 60, 60], fuel: [50, 55, 60], mind: [70, 80, 88], social: [55, 65, 70], env: [55, 60, 65], reg: [50, 55, 60] },
    cards: { 'mind.clouds': ['loop', 'drive'], 'social.map': ['friends'], 'env.terrain': ['projects'] },
    phq: [2, 3, 3],
    daily: [65, 75, 82],
  },
  {
    id: 'soupapes',
    label: 'Soupapes en tension',
    description: 'Écrans et échappatoires qui débordent : pas d’objectif de performance, lignes spécialisées proposées.',
    status: 'actif',
    sliders: { sleep: [45, 50, 50], body: [45, 45, 50], fuel: [45, 50, 55], mind: [50, 55, 55], social: [40, 40, 45], env: [40, 45, 45], reg: [70, 80, 85] },
    cards: { 'reg.refuges': ['screens', 'substances'], 'fuel.deficits': ['rushed'] },
    phq: [1, 1, 1],
    daily: [50, 55, 58],
  },
  {
    id: 'tampon',
    label: 'Réseau solide, charge élevée',
    description: 'Charge mentale forte mais entourage très présent : effet tampon et conseil d’extériorisation.',
    status: 'autre',
    sliders: { sleep: [40, 40, 40], body: [35, 35, 35], fuel: [35, 35, 35], mind: [65, 72, 78], social: [15, 10, 8], env: [60, 70, 82], reg: [35, 35, 35] },
    cards: { 'env.terrain': ['budget'] },
    phq: [1, 1, 1],
    daily: [50, 58, 64],
  },
];

export const getScenario = (id) => DEMO_SCENARIOS.find((s) => s.id === id) ?? DEMO_SCENARIOS[0];

// Petite variation déterministe pour que les check-ins ne soient pas tous identiques.
const wobble = (seed) => ((Math.sin(seed * 12.9898) * 43758.5453) % 1) * 8;
const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

// Réponse automatique à une question, pour une semaine donnée du scénario (0, 1 ou 2).
export function autoAnswer(question, scenario, week = 2) {
  const w = Math.max(0, Math.min(2, week));
  if (question.type === 'frequency') return scenario.phq[w];
  if (question.type === 'cards') return scenario.cards[question.id] ?? [];
  if (question.id.startsWith('daily.')) return clamp(scenario.daily[w] + wobble(question.id.length + w));
  const family = PREFIXES.find((p) => question.id.startsWith(`${p}.`));
  return clamp((scenario.sliders[family]?.[w] ?? 50) + wobble(question.id.length * 7 + w));
}

/**
 * Remplit un stockage vide avec 3 semaines d'historique. Renvoie l'identifiant du profil créé.
 * Les bilans ont lieu il y a 16, 9 et 2 jours ; un check-in presque chaque jour jusqu'à hier,
 * pour laisser le bilan de la semaine et le check-in du jour à faire soi-même.
 */
export async function seedDemo(store, scenarioId, { now = new Date() } = {}) {
  const scenario = getScenario(scenarioId);
  let current = new Date(now);
  const service = createCoreService(store, { clock: () => current });
  const at = (daysAgo, hour) => {
    const d = new Date(now.getTime() - daysAgo * DAY_MS);
    d.setUTCHours(hour, 0, 0, 0);
    return d;
  };

  current = at(17, 9);
  const user = await service.createUser();
  await service.setProfile(user.id, { status: scenario.status, adult: true });

  const bilanDays = [16, 9, 2];
  for (let daysAgo = 16; daysAgo >= 1; daysAgo--) {
    const week = bilanDays.filter((d) => d >= daysAgo).length - 1;
    if (bilanDays.includes(daysAgo)) {
      current = at(daysAgo, 9);
      let state = await service.startAssessment(user.id);
      const id = state.id;
      while (state.next) state = await service.answer(id, state.next.id, autoAnswer(state.next, scenario, week));
      await service.complete(id);
    }
    // Un jour sur cinq sans check-in : la semaine a des trous, comme dans la vraie vie.
    if (daysAgo % 5 === 0) continue;
    current = at(daysAgo, 20);
    const day = current.toISOString().slice(0, 10);
    const { plan } = await service.today(user.id, day);
    if (plan.length) {
      await service.checkin(user.id, day, Object.fromEntries(plan.map((q) => [q.id, autoAnswer(q, scenario, week)])));
    }
    if (daysAgo % 3 === 0) {
      await service.logPractice(user.id, daysAgo % 2 ? 'coherence_cardiaque' : 'vider_la_tete', { durationSec: 180 });
    }
  }
  return user.id;
}

