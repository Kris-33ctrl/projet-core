// Banque de questions du bilan adaptatif (Document Maître, sections 1 à 5).
// Chaque curseur renvoie une valeur backend de 0 (état ressource) à 100 (état en tension).
// Les cartes renvoient une liste d'identifiants d'options, traduits en tags.

import { CONDITIONS as C } from './config.js';
import { SCREENING_QUESTIONS, gateOpen } from './screening.js';

export const SPHERE_INTROS = {
  machine: {
    title: 'La Braise',
    text: "On commence par le corps : le sommeil, le mouvement et l'énergie. C'est la braise qui alimente tout le reste du voyage.",
  },
  pilote: {
    title: 'Le Ciel',
    text: 'Ton esprit comme un ciel : sa clarté, les nuages qui passent en arrière-plan, sa météo du moment.',
  },
  reseau: {
    title: 'Les Lanternes',
    text: "Ici, on ne compte pas tes relations. On regarde si la lumière circule bien entre toi et les autres.",
  },
  cadre: {
    title: 'L’Oasis',
    text: 'Le terrain sur lequel tu avances : tes projets, ta sécurité matérielle, ton lieu de vie.',
  },
  soupapes: {
    title: 'Le Souffle',
    text: 'Comment tu relâches la pression au quotidien. Aucun jugement ici, juste une cartographie.',
  },
};

export const QUESTIONS = [
  // ── 1.1 Sommeil (PSQI) ─────────────────────────────────────────────
  {
    id: 'sleep.latency',
    sphere: 'machine',
    section: 'Sommeil',
    foundation: 'PSQI (Buysse et al., 1989)',
    type: 'slider',
    prompt: "Le soir, au moment de t'endormir, ça ressemble plutôt à…",
    poles: ['Un interrupteur immédiat', 'Une longue réflexion nocturne'],
  },
  {
    id: 'sleep.efficiency',
    sphere: 'machine',
    section: 'Sommeil',
    foundation: 'PSQI (Buysse et al., 1989)',
    type: 'slider',
    prompt: 'Au réveil, ta batterie est…',
    poles: ['Totalement rechargée', 'Complètement à plat'],
  },
  {
    id: 'sleep.disturbances',
    sphere: 'machine',
    section: 'Sommeil',
    foundation: 'PSQI (Buysse et al., 1989)',
    type: 'cards',
    prompt: "Qu'est-ce qui vient le plus troubler tes nuits ?",
    options: [
      { id: 'wake', label: 'Des réveils au milieu de la nuit', tag: 'sommeil_reveils' },
      { id: 'dreams', label: 'Des rêves envahissants', tag: 'sommeil_reves' },
      { id: 'noise', label: 'Le bruit ou mon environnement', tag: 'sommeil_bruit' },
      { id: 'unrefreshing', label: "Un sommeil qui ne répare pas, même s'il est long", tag: 'sommeil_non_reparateur' },
    ],
    condition: (a) => a['sleep.efficiency'] > C.sleepDisturbances,
  },
  {
    id: 'sleep.daytime',
    sphere: 'machine',
    section: 'Sommeil',
    foundation: 'PSQI (Buysse et al., 1989)',
    type: 'slider',
    prompt: 'Pendant la journée, ton énergie est…',
    poles: ['Constante et fluide', 'Hachée par des coups de fatigue'],
  },

  // ── 1.2 Dynamique physique & tension corporelle (IPAQ, PHQ-15) ─────
  {
    id: 'body.movement',
    sphere: 'machine',
    section: 'Dynamique corporelle',
    foundation: 'IPAQ',
    type: 'slider',
    prompt: 'Sur une semaine ordinaire, ton corps est plutôt…',
    poles: ['Régulièrement en mouvement', 'Ancré et statique'],
  },
  {
    id: 'body.recovery',
    sphere: 'machine',
    section: 'Dynamique corporelle',
    foundation: 'IPAQ',
    type: 'slider',
    prompt: 'Après un effort physique, même léger, tu te sens…',
    poles: ['Stimulé(e) et plus léger(e)', 'Vidé(e) et épuisé(e)'],
  },
  {
    id: 'body.tension',
    sphere: 'machine',
    section: 'Dynamique corporelle',
    foundation: 'PHQ-15 (Kroenke et al., 2002)',
    type: 'slider',
    prompt: "Si tu prends une seconde pour scanner ton corps, la sensation d'ensemble est…",
    poles: ['Détendue et fluide', 'Lourde, crispée ou douloureuse'],
  },
  {
    id: 'body.location',
    sphere: 'machine',
    section: 'Dynamique corporelle',
    foundation: 'PHQ-15 (Kroenke et al., 2002)',
    type: 'cards',
    prompt: 'Où se loge principalement cette tension ?',
    options: [
      { id: 'neck', label: 'Nuque ou dos', tag: 'tension_nuque_dos' },
      { id: 'belly', label: 'Ventre', tag: 'tension_ventre' },
      { id: 'head', label: 'Tête ou mâchoire', tag: 'tension_tete_machoire' },
      { id: 'muscles', label: 'Muscles, de façon diffuse', tag: 'tension_musculaire' },
    ],
    condition: (a) => a['body.tension'] > C.bodyLocation,
  },

  // ── 1.3 Nutrition & carburant (Intuitive Eating Scale) ─────────────
  {
    id: 'fuel.energy',
    sphere: 'machine',
    section: 'Carburant',
    foundation: 'Intuitive Eating Scale (Tylka, 2006)',
    type: 'slider',
    prompt: "Après tes repas, comment se comporte ton niveau d'énergie globale ?",
    poles: ['Stable et soutenu', 'Gros coup de barre / somnolence'],
  },
  {
    id: 'fuel.rhythm',
    sphere: 'machine',
    section: 'Carburant',
    foundation: 'Intuitive Eating Scale (Tylka, 2006)',
    type: 'slider',
    prompt: "La structure de tes repas (que ce soit sur 2, 3 ou 4 prises) s'adapte-t-elle bien à tes journées ?",
    poles: ["C'est fluide et aligné", "C'est chaotique ou subi"],
  },
  {
    id: 'fuel.deficits',
    sphere: 'machine',
    section: 'Carburant',
    foundation: 'Intuitive Eating Scale (Tylka, 2006)',
    type: 'cards',
    prompt: "As-tu l'impression qu'il te manque des ressources de fond en ce moment ?",
    options: [
      { id: 'hydration', label: "J'oublie souvent de m'hydrater correctement", tag: 'alerte_hydratation' },
      { id: 'micro', label: 'Je manque probablement de certaines vitamines ou minéraux', tag: 'besoin_micronutrition' },
      { id: 'rushed', label: "Mes repas sont souvent expédiés dans l'urgence", tag: 'repas_urgence' },
      { id: 'fine', label: 'Tout est en ordre de ce côté-là', exclusive: true },
    ],
    condition: (a) => a['fuel.energy'] > C.fuelDeficits || a['body.recovery'] > C.fuelDeficits,
  },

  // ── 2.1 Charge mentale (NASA-TLX) ──────────────────────────────────
  {
    id: 'mind.saturation',
    sphere: 'pilote',
    section: 'Charge mentale',
    foundation: 'NASA-TLX (Hart & Staveland, 1988)',
    type: 'slider',
    prompt: "Mentalement, comment perçois-tu ton espace de pensée aujourd'hui ?",
    poles: ['Clair, une seule chose à la fois', 'Saturé, 50 onglets ouverts en même temps'],
  },
  {
    id: 'mind.effort',
    sphere: 'pilote',
    section: 'Charge mentale',
    foundation: 'NASA-TLX (Hart & Staveland, 1988)',
    type: 'slider',
    prompt: "Pour accomplir tes tâches actuelles (études, travail, quotidien), l'effort mental requis te semble…",
    variants: {
      etudiant: { prompt: "Pour accomplir tes tâches actuelles (cours, révisions, quotidien), l'effort mental requis te semble…" },
      actif: { prompt: "Pour accomplir tes tâches actuelles (travail, organisation, quotidien), l'effort mental requis te semble…" },
    },
    poles: ['Naturel et fluide', 'Laborieux et forcé'],
  },

  // ── 2.2 Stress perçu (PSS-10) ──────────────────────────────────────
  {
    id: 'mind.agency',
    sphere: 'pilote',
    section: 'Stress perçu',
    foundation: 'PSS-10 (Cohen et al., 1983)',
    type: 'slider',
    prompt: "Face aux imprévus ou aux contraintes de la journée, tu as l'impression d'être…",
    poles: ['Aux commandes de la situation', 'Submergé(e) et passager(e) des événements'],
  },

  // ── 2.3 Météo émotionnelle (WHO-5, GAD-7) ──────────────────────────
  {
    id: 'mind.mood',
    sphere: 'pilote',
    section: 'Météo émotionnelle',
    foundation: 'WHO-5 / GAD-7 (Spitzer et al., 2006)',
    type: 'slider',
    prompt: 'Si ton humeur actuelle était une météo, elle ressemblerait à…',
    poles: ['Dégagée, sereine ou positive', 'Lourde, grise ou sous tension'],
  },
  {
    id: 'mind.clouds',
    sphere: 'pilote',
    section: 'Météo émotionnelle',
    foundation: 'WHO-5 / GAD-7 (Spitzer et al., 2006)',
    type: 'cards',
    prompt: "Certains nuages prennent plus de place que d'autres. Qu'est-ce qui pèse le plus en ce moment ?",
    options: [
      { id: 'loop', label: 'Un vélo qui tourne en boucle (ruminations)', tag: 'anxiete_rumination' },
      { id: 'urgency', label: "Une sensation d'urgence ou d'angoisse physique", tag: 'anxiete_somatique' },
      { id: 'drive', label: "Un grand manque d'envie ou de motivation globale", tag: 'manque_envie' },
      { id: 'phase', label: "C'est juste une mauvaise passe temporaire", tag: 'passe_temporaire' },
    ],
    condition: (a) => a['mind.mood'] > C.mindTriage.mood || a['mind.agency'] > C.mindTriage.agency,
  },

  // ── 2.4 Repérage validé (PHQ-4) ─────────────────────────────────────
  // Posé sans condition tous les 14 jours, ou plus tôt (7 jours minimum) si la porte d'entrée s'ouvre.
  // Le contexte (dates des derniers repérages) est fixé par le serveur au début du bilan.
  ...SCREENING_QUESTIONS.map((q) => ({
    ...q,
    condition: (a, ctx = {}) => Boolean(ctx.screeningDue || (ctx.screeningAllowed && gateOpen(a))),
  })),

  // ── 3.1 Soutien & isolement (MSPSS, UCLA) ──────────────────────────
  {
    id: 'social.support',
    sphere: 'reseau',
    section: 'Soutien',
    foundation: 'MSPSS (Zimet et al., 1988)',
    type: 'slider',
    prompt: 'En cas de coup dur, ton filet de sécurité (les personnes sur qui tu peux vraiment compter) te semble…',
    poles: ['Solide et présent', 'Fragile ou lointain'],
  },
  {
    id: 'social.connection',
    sphere: 'reseau',
    section: 'Connexion',
    foundation: 'UCLA Loneliness Scale (Russell, 1996)',
    type: 'slider',
    prompt: 'Dans tes interactions quotidiennes, tu te sens globalement…',
    poles: ['En phase et compris(e)', 'En décalage et isolé(e)'],
  },
  {
    id: 'social.map',
    sphere: 'reseau',
    section: 'Cartographie du lien',
    foundation: 'MSPSS (Zimet et al., 1988)',
    type: 'cards',
    prompt: "Où l'énergie circule-t-elle le plus naturellement pour toi en ce moment ?",
    options: [
      { id: 'couple', label: 'Dans mon couple, avec mon ou ma partenaire', tag: 'soutien_couple' },
      { id: 'family', label: 'Avec ma famille proche (parents, frères, sœurs)', tag: 'soutien_famille' },
      { id: 'friends', label: 'Dans mon cercle amical', tag: 'soutien_amis' },
      { id: 'work', label: "Dans mon environnement de travail ou d'études", tag: 'soutien_travail' },
    ],
    condition: (a) => a['social.support'] > C.socialMap,
  },

  // ── 3.2 Anxiété sociale (LSAS) ─────────────────────────────────────
  {
    id: 'social.cost',
    sphere: 'reseau',
    section: 'Confort social',
    foundation: 'LSAS (Liebowitz, 1987)',
    type: 'slider',
    prompt: 'Aller vers les autres ou participer à des événements sociaux te demande actuellement…',
    poles: ["Zéro effort, c'est ressourçant", "Beaucoup d'efforts, c'est épuisant"],
  },

  // ── 4.1 Sens & projets (MLQ) ───────────────────────────────────────
  {
    id: 'env.motivation',
    sphere: 'cadre',
    section: 'Sens & projets',
    foundation: 'MLQ (Steger et al., 2006)',
    type: 'slider',
    prompt: 'Quand tu penses à tes objectifs du moment (un projet perso, un cap à passer, une envie à concrétiser), tu ressens plutôt…',
    variants: {
      etudiant: {
        prompt:
          "Quand tu penses à tes objectifs du moment (un dossier d'admission, un projet de création, une réalisation technique), tu ressens plutôt…",
      },
      actif: {
        prompt:
          'Quand tu penses à tes objectifs du moment (un projet pro, une évolution, une réalisation personnelle), tu ressens plutôt…',
      },
    },
    poles: ['Un moteur qui me tire en avant', 'Une corvée ou un grand flou'],
  },

  // ── 4.2 Sécurité matérielle (WHOQOL-BREF) ──────────────────────────
  {
    id: 'env.finance',
    sphere: 'cadre',
    section: 'Sécurité matérielle',
    foundation: 'WHOQOL-BREF (OMS)',
    type: 'slider',
    prompt:
      'Si une dépense matérielle imprévue tombe demain (une pièce de voiture à changer, un billet à avancer), ta première réaction est…',
    poles: ["Sereine, c'est gérable", 'Panique, ça met tout dans le rouge'],
  },

  // ── 4.3 Cadre de vie (WHOQOL-BREF) ─────────────────────────────────
  {
    id: 'env.living',
    sphere: 'cadre',
    section: 'Cadre de vie',
    foundation: 'WHOQOL-BREF (OMS)',
    type: 'slider',
    prompt: 'Ton espace de vie actuel (ton logement, ta ville, ton environnement direct) agit sur toi comme…',
    poles: ['Une zone de recharge apaisante', "Une source de stress ou d'inconfort"],
  },
  {
    id: 'env.terrain',
    sphere: 'cadre',
    section: 'Analyse du terrain',
    foundation: 'WHOQOL-BREF (OMS)',
    type: 'cards',
    prompt: "Qu'est-ce qui fragilise le plus ton terrain actuellement ?",
    options: [
      { id: 'budget', label: 'Un manque de visibilité sur mon budget mensuel', tag: 'friction_budget' },
      { id: 'place', label: 'Mon espace de vie manque de calme ou de confort', tag: 'friction_lieu' },
      { id: 'commute', label: 'Mes temps de trajet ou mon organisation géographique', tag: 'friction_trajets' },
      { id: 'projects', label: 'Un sentiment de tourner en rond dans mes projets', tag: 'friction_projets' },
    ],
    condition: (a) => a['env.finance'] > C.terrain || a['env.living'] > C.terrain,
  },

  // ── 5.1 Distraction numérique (IAT) ────────────────────────────────
  {
    id: 'reg.screens',
    sphere: 'soupapes',
    section: 'Écrans',
    foundation: 'IAT (Young, 1998)',
    type: 'slider',
    prompt: "Face à ton smartphone ou tes écrans, tu as globalement le sentiment que c'est…",
    poles: ['Un outil que je maîtrise', 'Un gouffre temporel automatique'],
  },

  // ── 5.2 Coping & refuges (Brief-COPE) ──────────────────────────────
  {
    id: 'reg.coping',
    sphere: 'soupapes',
    section: 'Coping',
    foundation: 'Brief-COPE (Carver, 1997)',
    type: 'slider',
    prompt: 'Quand une situation bloquante ou très stressante se présente, ton premier réflexe est de…',
    poles: ['Faire face et adapter le plan', 'Éviter, fuir ou repousser à plus tard'],
  },
  {
    id: 'reg.control',
    sphere: 'soupapes',
    section: 'Contrôle des soupapes',
    foundation: 'Brief-COPE / échelles de craving',
    type: 'slider',
    prompt: "Pour décompresser (achats, substances, jeux, etc.), tu dirais que tes « plaisirs » ou échappatoires sont…",
    poles: ['Choisis et parfaitement contrôlés', "Compulsifs, j'ai du mal à m'arrêter"],
  },
  {
    id: 'reg.refuges',
    sphere: 'soupapes',
    section: 'Cartographie des refuges',
    foundation: 'Brief-COPE / échelles de craving',
    type: 'cards',
    prompt: "Vers quelle(s) zone(s) as-tu l'impression que ton énergie s'échappe le plus sans ton accord ?",
    options: [
      { id: 'food', label: 'Alimentation émotionnelle (sucre, grignotage)', tag: 'compulsion_alimentation' },
      { id: 'substances', label: 'Substances (tabac, alcool, etc.)', tag: 'compulsion_substances' },
      { id: 'screens', label: 'Écrans profonds (pornographie, jeux chronophages)', tag: 'compulsion_ecrans' },
      { id: 'shopping', label: 'Achats compulsifs', tag: 'compulsion_achats' },
    ],
    condition: (a) => a['reg.control'] > C.refuges,
  },
];

export const QUESTIONS_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

// Questions du check-in quotidien : formulées au jour le jour, mêmes pôles que le bilan.
export const DAILY_QUESTIONS = [
  { id: 'daily.battery', sphere: 'machine', section: 'Batterie', prompt: 'Ce matin, au réveil, ta batterie était…', poles: ['Totalement rechargée', 'Complètement à plat'] },
  { id: 'daily.mood', sphere: 'pilote', section: 'Météo', prompt: "Aujourd'hui, ta météo intérieure ressemble à…", poles: ['Dégagée, sereine ou positive', 'Lourde, grise ou sous tension'] },
  { id: 'daily.clarity', sphere: 'pilote', section: 'Espace de pensée', prompt: "Aujourd'hui, ton espace de pensée est…", poles: ['Clair, une seule chose à la fois', 'Saturé, 50 onglets ouverts'] },
  { id: 'daily.tension', sphere: 'machine', section: 'Corps', prompt: "Aujourd'hui, la sensation d'ensemble dans ton corps est…", poles: ['Détendue et fluide', 'Lourde, crispée ou douloureuse'] },
  { id: 'daily.agency', sphere: 'pilote', section: 'Contrôle', prompt: "Face aux imprévus d'aujourd'hui, tu te sens…", poles: ['Aux commandes de la situation', 'Submergé(e) et passager(e)'] },
  { id: 'daily.connection', sphere: 'reseau', section: 'Lien', prompt: "Aujourd'hui, avec les autres, tu t'es senti·e…", poles: ['En phase et compris(e)', 'En décalage et isolé(e)'] },
  { id: 'daily.motivation', sphere: 'cadre', section: 'Projets', prompt: "Aujourd'hui, tes projets t'ont semblé…", poles: ['Un moteur qui me tire en avant', 'Une corvée ou un grand flou'] },
  { id: 'daily.screens', sphere: 'soupapes', section: 'Écrans', prompt: "Aujourd'hui, tes écrans ont été…", poles: ['Un outil que je maîtrise', 'Un gouffre temporel automatique'] },
].map((q) => ({ ...q, type: 'slider', foundation: 'Check-in quotidien Core' }));

const ALL_BY_ID = { ...QUESTIONS_BY_ID, ...Object.fromEntries(DAILY_QUESTIONS.map((q) => [q.id, q])) };

export function findQuestion(id) {
  return ALL_BY_ID[id] ?? null;
}

// Version sérialisable pour l'API : sans la fonction de condition, textes adaptés au profil.
export function publicQuestion(q, profile = null) {
  if (!q) return null;
  const { condition, variants, ...rest } = q;
  return { ...rest, ...(variants?.[profile?.status] ?? {}), conditional: typeof condition === 'function' };
}
