// Bouclier éthique, v2 (doc « Protocole de triage Core », arbitré le 23/09/2026).
// Niveaux :
//   none    → veille, expérience normale
//   soutien → PHQ-2 ≥ 3 ou GAD-2 ≥ 3 : ressources proposées, le jeu continue
//   relais  → PHQ-4 ≥ 9, ou PHQ-2 ≥ 3 sur deux repérages d'affilée : gamification en pause
// Seuls les outils validés font monter le niveau. Les signaux maison (porte d'entrée, vulnérabilité,
// « manque d'envie », jours d'alerte au check-in) déclenchent la vigilance : le PHQ-4 est avancé.
// L'interface ne nomme jamais le suicide : le 3114 est présenté comme une écoute en cas de grande détresse.

import { TRIAGE as T } from './config.js';
import { gateOpen } from './screening.js';

const DAY = 24 * 60 * 60 * 1000;
const ageInDays = (iso, now) => (now - new Date(iso)) / DAY;

export const RESOURCES = {
  urgence: [
    { id: '3114', name: '3114', detail: 'Écoute professionnelle en cas de grande détresse, 24 h/24, gratuit', phone: '3114' },
    { id: '15', name: 'SAMU (15) ou numéro européen (112)', detail: 'En cas de danger immédiat', phone: '15' },
  ],
  ecoute: [
    { id: 'nightline', name: 'Nightline', detail: 'Écoute par et pour les étudiant·es, le soir et la nuit', url: 'https://www.nightline.fr', profiles: ['etudiant'] },
    { id: 'sos-amitie', name: 'SOS Amitié', detail: 'Écoute anonyme, 24 h/24', phone: '09 72 39 40 50' },
    { id: 'fil-sante-jeunes', name: 'Fil Santé Jeunes', detail: '12-25 ans, anonyme et gratuit', phone: '0 800 235 236' },
  ],
  professionnels: [
    { id: 'sante-psy-etudiant', name: 'Santé Psy Étudiant', detail: 'Séances gratuites avec un·e psychologue', url: 'https://santepsy.etudiant.gouv.fr', profiles: ['etudiant'] },
    { id: 'sse', name: 'Service de santé étudiante', detail: 'Consultations gratuites dans ton établissement, dont des psychologues', hint: 'Renseigne-toi auprès de ton université ou de ton école', profiles: ['etudiant'] },
    { id: 'bapu', name: "BAPU (bureau d'aide psychologique universitaire)", detail: 'Consultations gratuites, dans les villes universitaires', hint: 'Ton service de santé étudiante peut t’orienter', profiles: ['etudiant'] },
    { id: 'medecine-travail', name: 'Médecine du travail', detail: 'Gratuite et soumise au secret médical : tu peux demander un rendez-vous toi-même', hint: 'Via le service de santé au travail de ton employeur', profiles: ['actif'] },
    { id: 'mon-soutien-psy', name: 'Mon soutien psy', detail: "Séances avec un·e psychologue, remboursées par l'Assurance Maladie", url: 'https://monsoutienpsy.ameli.fr' },
    { id: 'cmp', name: 'CMP (centre médico-psychologique)', detail: 'Consultations publiques et gratuites près de chez toi. Les délais peuvent être longs : appelle tôt.', hint: 'Ton médecin traitant ou ta mairie peut t’indiquer le tien' },
    { id: 'doctolib', name: 'Doctolib', detail: 'Rendez-vous avec un·e psychologue ou ton médecin traitant', url: 'https://www.doctolib.fr/psychologue' },
  ],
  addictions: [
    { id: 'drogues-info', name: 'Drogues Info Service', detail: 'Gratuit et anonyme', phone: '0 800 23 13 13', tags: ['compulsion_substances'] },
    { id: 'alcool-info', name: 'Alcool Info Service', detail: 'Anonyme', phone: '0 980 980 930', tags: ['compulsion_substances'] },
    { id: 'tabac-info', name: 'Tabac Info Service', detail: 'Accompagnement par des tabacologues', phone: '39 89', tags: ['compulsion_substances'] },
    { id: 'joueurs-info', name: 'Joueurs Info Service', detail: "Jeux d'argent et jeux vidéo", phone: '09 74 75 13 13', tags: ['compulsion_ecrans'] },
  ],
};

export const forProfile = (profile) => (r) => !r.profiles || r.profiles.includes(profile?.status);

// Ressources du bouton « Besoin d'aide », accessible partout, hors de tout calcul.
export function helpResources(profile = null) {
  return {
    urgence: RESOURCES.urgence,
    ecoute: RESOURCES.ecoute.filter(forProfile(profile)),
    professionnels: RESOURCES.professionnels.filter(forProfile(profile)),
  };
}

const newestFirst = (list) => [...list].sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt));

// Signaux maison : ils n'orientent pas, ils avancent le repérage validé.
export function vigilanceSignals({ lastResult = null, checkins = [], now = new Date() }) {
  const signals = [];
  if (lastResult?.flags?.vulnerability) signals.push('vulnerability');
  if (lastResult?.tags?.includes('manque_envie')) signals.push('low_drive');
  if (lastResult && gateOpen(lastResult.answers)) signals.push('gate');
  const { alertDays, windowDays } = T.dailyPersistence;
  const recentAlerts = checkins.filter((c) => c.summary?.alert && ageInDays(c.day, now) < windowDays).length;
  if (recentAlerts >= alertDays) signals.push('daily_persistence');
  return signals;
}

// Faut-il poser le PHQ-4 maintenant ? Tous les 14 jours sans condition, dès 7 jours si vigilance.
export function screeningContext({ screenings = [], vigilance = [], now = new Date() }) {
  const [last] = newestFirst(screenings);
  const age = last ? ageInDays(last.takenAt, now) : Infinity;
  return {
    screeningAllowed: age >= T.screening.minGapDays,
    screeningDue: age >= T.screening.routineDays || (vigilance.length > 0 && age >= T.screening.minGapDays),
  };
}

/**
 * @param {object} p
 * @param {object|null} p.lastResult  dernier bilan complet (computeResult)
 * @param {{takenAt: string, phq2: number, gad2: number, total: number}[]} p.screenings
 * @param {{day: string, summary: {alert: boolean}}[]} p.checkins
 */
export function evaluateShield({ lastResult = null, screenings = [], checkins = [], profile = null, now = new Date() }) {
  const sorted = newestFirst(screenings);
  const current = sorted[0] && ageInDays(sorted[0].takenAt, now) <= T.screening.validityDays ? sorted[0] : null;
  const reasons = [];

  if (current) {
    if (current.total >= T.phq4Relais) reasons.push({ id: 'phq4_severe', level: 'relais' });
    const previous = sorted[1];
    const consecutive =
      previous && (new Date(current.takenAt) - new Date(previous.takenAt)) / DAY <= T.consecutiveWindowDays;
    if (current.phq2 >= T.phq2Positive && consecutive && previous.phq2 >= T.phq2Positive) {
      reasons.push({ id: 'phq2_persistent', level: 'relais' });
    }
    if (current.phq2 >= T.phq2Positive) reasons.push({ id: 'phq2_positive', level: 'soutien' });
    if (current.gad2 >= T.gad2Positive) reasons.push({ id: 'gad2_positive', level: 'soutien' });
  }

  const level = reasons.some((r) => r.level === 'relais') ? 'relais' : reasons.length ? 'soutien' : 'none';
  const vigilance = vigilanceSignals({ lastResult, checkins, now });
  const tags = new Set(lastResult?.tags ?? []);

  return {
    level,
    reasons: reasons.map((r) => r.id),
    vigilance,
    ...screeningContext({ screenings, vigilance, now }),
    pauseGamification: level === 'relais',
    resources:
      level === 'none'
        ? []
        : [...(level === 'relais' ? RESOURCES.urgence : []), ...RESOURCES.professionnels, ...RESOURCES.ecoute].filter(
            forProfile(profile),
          ),
    // Les lignes spécialisées sont proposées dès qu'un refuge est identifié, quel que soit le niveau.
    specialised: RESOURCES.addictions.filter((r) => r.tags.some((t) => tags.has(t))),
  };
}
