// Repérage validé : PHQ-4 = PHQ-2 (humeur) + GAD-2 (anxiété), sur les 2 dernières semaines.
// Traduction adaptée au tutoiement (arbitrage du 23/09) en gardant la sémantique des items d'origine.
// Ces quatre questions ne passent jamais par des curseurs : un outil validé garde ses mots et son échelle.

import { TRIAGE as T } from './config.js';

export const SCREENING_STEM = 'Au cours des 2 dernières semaines, à quelle fréquence as-tu été dérangé·e par ce qui suit ?';

export const FREQUENCY_OPTIONS = [
  { value: 0, label: 'Jamais' },
  { value: 1, label: 'Plusieurs jours' },
  { value: 2, label: 'Plus de la moitié des jours' },
  { value: 3, label: 'Presque tous les jours' },
];

const ITEMS = [
  { id: 'phq.1', scale: 'phq2', prompt: "Peu d'intérêt ou de plaisir à faire les choses" },
  { id: 'phq.2', scale: 'phq2', prompt: 'Te sentir triste, déprimé·e ou désespéré·e' },
  { id: 'gad.1', scale: 'gad2', prompt: 'Te sentir nerveux·se, anxieux·se ou tendu·e' },
  { id: 'gad.2', scale: 'gad2', prompt: "Ne pas arriver à arrêter de t'inquiéter ou à contrôler tes inquiétudes" },
];

export const SCREENING_IDS = ITEMS.map((i) => i.id);

export const SCREENING_QUESTIONS = ITEMS.map((item) => ({
  id: item.id,
  sphere: 'pilote',
  section: 'Repérage',
  foundation: item.scale === 'phq2' ? 'PHQ-2 (Kroenke et al., 2003)' : 'GAD-2 (Kroenke et al., 2007)',
  type: 'frequency',
  lead: SCREENING_STEM,
  prompt: item.prompt,
  options: FREQUENCY_OPTIONS,
}));

export const gateOpen = (answers = {}) => answers['mind.mood'] > T.gate.mood || answers['mind.agency'] > T.gate.agency;

// null tant que les quatre items ne sont pas tous renseignés.
export function scoreScreening(answers = {}) {
  if (!SCREENING_IDS.every((id) => Number.isInteger(answers[id]))) return null;
  const phq2 = answers['phq.1'] + answers['phq.2'];
  const gad2 = answers['gad.1'] + answers['gad.2'];
  return { phq2, gad2, total: phq2 + gad2 };
}
