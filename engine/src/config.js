// Paramètres ajustables du moteur.
// Les valeurs marquées « PDF » viennent du Document Maître.
// Les valeurs marquées « À VALIDER » sont des hypothèses de travail
// qui doivent être arbitrées pendant la phase 1 (cadrage scientifique).

export const SPHERES = ['machine', 'pilote', 'reseau', 'cadre', 'soupapes'];

// Public cible (arbitrage du 23/09) : jeunes adultes, étudiant·es et actifs, 18 ans et plus.
export const PROFILE_STATUSES = ['etudiant', 'actif', 'autre'];

// Noms affichés (direction artistique « Le Voyage », 24/09/2026) : chaque sphère est un paysage.
// Les identifiants internes restent ceux du Document Maître (machine, pilote…) : données et formules inchangées.
export const SPHERE_LABELS = {
  machine: 'La Braise',
  pilote: 'Le Ciel',
  reseau: 'Les Lanternes',
  cadre: 'L’Oasis',
  soupapes: 'Le Souffle',
};

export const SPHERE_SUBTITLES = {
  machine: 'Le corps et l’énergie',
  pilote: 'L’esprit et les émotions',
  reseau: 'Les liens qui t’entourent',
  cadre: 'Ton terrain de vie',
  soupapes: 'Relâcher la pression',
};

// Seuils de déclenchement des questions conditionnelles (PDF).
export const CONDITIONS = {
  sleepDisturbances: 60, // sleep.efficiency > 60
  bodyLocation: 50, // body.tension > 50
  fuelDeficits: 60, // fuel.energy > 60 OU body.recovery > 60
  mindTriage: { mood: 70, agency: 75 }, // mind.mood > 70 OU mind.agency > 75
  socialMap: 50, // social.support > 50
  terrain: 60, // env.finance > 60 OU env.living > 60
  refuges: 60, // reg.control > 60
};

// Seuils d'impacts croisés.
export const IMPACTS = {
  sleepLow: 40, // PDF : jauge Sommeil < 40 → multiplicateur d'alerte sur la Charge Mentale
  machineMalus: 50, // PDF : Machine < 50 → malus de résilience sur Pilote et Réseau
  machineBridage: 40, // PDF « tolérance », arbitrée le 23/09 : sous 40, bridage au lieu du malus
  reseauBuffer: 75, // PDF : Réseau > 75 → effet tampon
  vulnerabilityLow: 40, // À VALIDER : seuil « faible » pour Réseau ET Pilote
  financeDrain: 80, // PDF : env.finance > 80 → drain passif sur la Charge Mentale
  soupapesLeak: 40, // À VALIDER : seuil « dans le rouge » des Soupapes

  // Amplitudes arbitrées le 23/09/2026 (feuille de route, questions 1 et 2).
  machineMalusFactor: 0.9, // Machine entre 40 et 50 : Pilote et Réseau perdent 10 %, compensable
  bridageCap: 80, // Machine < 40 : Pilote et Réseau plafonnés à 80, sans aucun retrait de points
  sleepAlertPenalty: 10, // points retirés à la sous-jauge Charge
  financeDrainPenalty: 10, // points retirés à la sous-jauge Charge
  reseauBufferBonus: 10, // points rendus au Pilote : annule exactement un malus sommeil ou finances
  maxCumulativeMalus: 20, // les impacts croisés ne retirent jamais plus de 20 points au Pilote
};

// Pondération du Score Core (usage interne, jamais affiché).
// Poids égaux tant qu'aucune donnée ne justifie une pondération (arbitrage du 23/09) :
// à recalibrer après l'alpha. Les priorités cliniques passent par les règles d'impact, pas par ces poids.
export const CORE_WEIGHTS = {
  machine: 0.2,
  pilote: 0.2,
  reseau: 0.2,
  cadre: 0.2,
  soupapes: 0.2,
};

// Triage v2 (protocole « Protocole de triage Core », arbitré le 23/09/2026).
// Seule la redirection ferme (relais) repose sur des outils validés : PHQ-2, GAD-2, PHQ-4.
// Les signaux maison (curseurs, vulnérabilité, check-ins) ne font qu'avancer le repérage.
export const TRIAGE = {
  gate: CONDITIONS.mindTriage, // porte d'entrée du Document Maître : météo > 70 ou contrôle > 75
  screening: {
    routineDays: 14, // PHQ-4 posé sans condition tous les 14 jours (fenêtre de 2 semaines du PHQ)
    minGapDays: 7, // jamais plus d'une fois tous les 7 jours
    validityDays: 14, // un repérage compte pour le niveau pendant 14 jours
  },
  phq2Positive: 3, // Kroenke 2003
  gad2Positive: 3, // Kroenke 2007
  phq4Relais: 9, // Kroenke 2009 : catégorie « sévère »
  consecutiveWindowDays: 28, // deux PHQ-2 positifs d'affilée dans cette fenêtre → relais
  dailyPersistence: { alertDays: 7, windowDays: 14 }, // 7 jours d'alerte sur 14 → vigilance (PHQ-4 avancé)
};

// Comparaison d'un bilan à l'autre. Choix de conception : sous 5 points d'écart, la variation
// n'est pas interprétée (bruit de mesure d'un curseur continu), la sphère est dite stable.
export const COMPARISON = {
  significant: 5,
  maxHighlights: 3,
};
