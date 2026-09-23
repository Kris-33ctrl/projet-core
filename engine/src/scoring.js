// Calcul des jauges, impacts croisés et Score Core (Document Maître, sections « Logique algorithmique »).
// Convention : une jauge va de 0 à 100 et plus elle est haute, plus la ressource est disponible.

import { SPHERES, IMPACTS as I, CORE_WEIGHTS } from './config.js';
import { QUESTIONS } from './questions.js';
import { pruneAnswers } from './flow.js';

// Chaque sous-jauge = 100 − moyenne pondérée des curseurs qui la composent.
const SUB_GAUGES = {
  machine: {
    sommeil: { 'sleep.latency': 0.25, 'sleep.efficiency': 0.5, 'sleep.daytime': 0.25 },
    dynamique: { 'body.movement': 0.3, 'body.recovery': 0.3, 'body.tension': 0.4 },
    carburant: { 'fuel.energy': 0.5, 'fuel.rhythm': 0.5 },
  },
  pilote: {
    charge: { 'mind.saturation': 0.5, 'mind.effort': 0.5 },
    stress: { 'mind.agency': 1 },
    humeur: { 'mind.mood': 1 },
  },
  reseau: {
    soutien: { 'social.support': 1 },
    connexion: { 'social.connection': 1 },
    confort: { 'social.cost': 1 },
  },
  cadre: {
    projets: { 'env.motivation': 1 },
    finances: { 'env.finance': 1 },
    environnement: { 'env.living': 1 },
  },
  soupapes: {
    ecrans: { 'reg.screens': 1 },
    coping: { 'reg.coping': 1 },
    controle: { 'reg.control': 1 },
  },
};

// Poids des sous-jauges dans la jauge de sphère. Ils reproduisent exactement les formules du PDF,
// ex. Cognition = 100 − (Q1·0,2 + Q2·0,2 + Q3·0,3 + Q4·0,3) = 0,4·Charge + 0,3·Stress + 0,3·Humeur.
export const SPHERE_WEIGHTS = {
  machine: { sommeil: 1 / 3, dynamique: 1 / 3, carburant: 1 / 3 },
  pilote: { charge: 0.4, stress: 0.3, humeur: 0.3 },
  reseau: { soutien: 0.4, connexion: 0.3, confort: 0.3 },
  cadre: { projets: 0.4, finances: 0.4, environnement: 0.2 },
  soupapes: { ecrans: 0.3, coping: 0.3, controle: 0.4 },
};

// Libellés orientés « ressource » : on nomme ce qui est disponible, pas ce qui manque.
export const SUB_LABELS = {
  sommeil: 'Sommeil',
  dynamique: 'Dynamique corporelle',
  carburant: 'Carburant',
  charge: 'Bande passante mentale',
  stress: 'Sentiment de contrôle',
  humeur: 'Météo émotionnelle',
  soutien: 'Filet de sécurité',
  connexion: 'Connexion aux autres',
  confort: 'Confort social',
  projets: 'Sens & projets',
  finances: 'Sécurité matérielle',
  environnement: 'Cadre de vie',
  ecrans: 'Maîtrise des écrans',
  coping: "Capacité d'ajustement",
  controle: 'Contrôle des soupapes',
};

const clamp = (v) => (v === null ? null : Math.min(100, Math.max(0, v)));
const round = (v) => (v === null ? null : Math.round(v * 10) / 10);

function weightedMean(pairs) {
  let sum = 0;
  let weights = 0;
  for (const [value, weight] of pairs) {
    if (value === null || value === undefined) continue;
    sum += value * weight;
    weights += weight;
  }
  return weights > 0 ? sum / weights : null;
}

function computeSubs(answers) {
  const subs = {};
  for (const sphere of SPHERES) {
    subs[sphere] = {};
    for (const [name, items] of Object.entries(SUB_GAUGES[sphere])) {
      const load = weightedMean(Object.entries(items).map(([qid, w]) => [answers[qid], w]));
      subs[sphere][name] = load === null ? null : 100 - load;
    }
  }
  return subs;
}

function computeSpheres(subs) {
  const spheres = {};
  for (const sphere of SPHERES) {
    spheres[sphere] = weightedMean(Object.entries(SPHERE_WEIGHTS[sphere]).map(([name, w]) => [subs[sphere][name], w]));
  }
  return spheres;
}

function collectTags(answers) {
  const tags = new Set();
  for (const q of QUESTIONS) {
    if (q.type !== 'cards' || !Array.isArray(answers[q.id])) continue;
    for (const optionId of answers[q.id]) {
      const option = q.options.find((o) => o.id === optionId);
      if (option?.tag) tags.add(option.tag);
    }
  }
  return tags;
}

function roundTree(tree) {
  return Object.fromEntries(
    Object.entries(tree).map(([k, v]) => [k, v !== null && typeof v === 'object' ? roundTree(v) : round(clamp(v))]),
  );
}

export function computeResult(rawAnswers) {
  const answers = pruneAnswers(rawAnswers);
  const tags = collectTags(answers);
  const insights = [];
  const flags = {};

  const rawSubs = computeSubs(answers);
  const rawSpheres = computeSpheres(rawSubs);

  // Les ajustements partent d'une copie des sous-jauges brutes.
  const subs = structuredClone(rawSubs);
  const caps = {};

  // Machine < 40 : bridage au lieu de malus (arbitrage du 23/09, « pas de double peine »).
  // Les retraits de points d'origine corporelle (malus Machine, amplification par le sommeil) sont
  // remplacés par un plafond de capacité. Le drain financier, lui, ne vient pas du corps et s'applique.
  const machine = rawSpheres.machine;
  const bridage = machine !== null && machine < I.machineBridage;

  // 1.1 : un sommeil très bas amplifie la charge mentale.
  if (rawSubs.machine.sommeil !== null && rawSubs.machine.sommeil < I.sleepLow) {
    tags.add('sommeil_mauvais');
    flags.sleepAlert = true;
    if (!bridage && subs.pilote.charge !== null) {
      subs.pilote.charge -= I.sleepAlertPenalty;
      insights.push({
        id: 'sleep_alert',
        sphere: 'pilote',
        kind: 'impact',
        message:
          'Ton sommeil recharge mal ta batterie en ce moment, et ça réduit la bande passante disponible pour ton mental. Ta jauge de charge mentale en tient compte.',
      });
    }
  }

  // 4.2 : l'anxiété financière aiguë draine la charge mentale en arrière-plan.
  if (answers['env.finance'] > I.financeDrain && subs.pilote.charge !== null) {
    flags.financeDrain = true;
    subs.pilote.charge -= I.financeDrainPenalty;
    insights.push({
      id: 'finance_drain',
      sphere: 'pilote',
      kind: 'impact',
      message:
        "L'inquiétude financière tourne en arrière-plan, comme un processus qui consomme de la bande passante. C'est un effet bien documenté, pas un manque de volonté.",
    });
  }

  const spheres = computeSpheres(subs);

  // 1.3 : Machine entre 40 et 50 → malus de résilience, compensable par les autres sphères.
  if (machine !== null && !bridage && machine < I.machineMalus) {
    flags.machineMalus = true;
    if (spheres.pilote !== null) spheres.pilote *= I.machineMalusFactor;
    if (spheres.reseau !== null) spheres.reseau *= I.machineMalusFactor;
    insights.push({
      id: 'machine_malus',
      sphere: 'machine',
      kind: 'impact',
      message:
        "Ton corps a moins de réserves en ce moment : le stress et les relations te demandent plus d'énergie que d'habitude.",
    });
  }

  // Plafond de malus : l'empilement des impacts croisés ne retire jamais plus de N points au Pilote.
  if (rawSpheres.pilote !== null && spheres.pilote < rawSpheres.pilote - I.maxCumulativeMalus) {
    spheres.pilote = rawSpheres.pilote - I.maxCumulativeMalus;
    flags.malusCapped = true;
  }

  // 3 : effet tampon d'un réseau solide.
  if (spheres.reseau !== null && spheres.reseau > I.reseauBuffer) {
    flags.buffer = true;
    if (spheres.pilote !== null) spheres.pilote += I.reseauBufferBonus;
    const turbulent = spheres.pilote !== null && spheres.pilote < 50;
    insights.push({
      id: 'reseau_buffer',
      sphere: 'reseau',
      kind: 'buffer',
      message: turbulent
        ? "Tu traverses une zone de turbulences, mais ton ancrage relationnel est solide. Pense à t'appuyer sur tes proches pour décharger ce stress."
        : 'Ton réseau agit comme un amortisseur : il protège le reste de ton équilibre.',
    });
  }

  // 2 : bridage. La capacité maximale baisse, le score n'est pas amputé : la baisse est attribuée
  // au matériel (la Machine), pas à la volonté (le Pilote).
  if (bridage) {
    flags.bodyFirst = true;
    flags.bridage = true;
    for (const sphere of ['pilote', 'reseau']) {
      if (spheres[sphere] === null) continue;
      caps[sphere] = I.bridageCap;
      spheres[sphere] = Math.min(spheres[sphere], I.bridageCap);
    }
    insights.push({
      id: 'body_first',
      sphere: 'pilote',
      kind: 'reframe',
      message:
        "Ta Machine est en mode économie d'énergie : ta capacité de concentration et ton énergie sociale sont temporairement bridées (zone hachurée). Ce n'est pas ton mental qui flanche, c'est ta batterie physique qu'il faut recharger d'abord.",
    });
  }

  // 3 : tempête sans filet → vulnérabilité haute.
  if (
    spheres.reseau !== null &&
    spheres.pilote !== null &&
    spheres.reseau < I.vulnerabilityLow &&
    spheres.pilote < I.vulnerabilityLow
  ) {
    flags.vulnerability = true;
    insights.push({
      id: 'vulnerability',
      sphere: 'reseau',
      kind: 'care',
      message:
        "Tu fais face à beaucoup de choses en ce moment, avec un filet de sécurité qui paraît fragile. Tu n'as pas à porter ça seul(e) : en parler à un·e professionnel·le peut vraiment alléger la charge.",
    });
  }

  // 1.2 : sommeil mauvais + tension tête/mâchoire → surcharge cognitive.
  if (tags.has('sommeil_mauvais') && tags.has('tension_tete_machoire')) {
    flags.cognitiveOverload = true;
    insights.push({
      id: 'cognitive_overload',
      sphere: 'machine',
      kind: 'alert',
      message:
        'Sommeil léger et tensions dans la tête ou la mâchoire vont souvent ensemble : c\'est un signal classique de surcharge cognitive.',
    });
  }

  // 5 : soupapes « dans le rouge » → on bloque les objectifs de performance.
  if (spheres.soupapes !== null && spheres.soupapes < I.soupapesLeak) {
    flags.soupapesLeak = true;
    insights.push({
      id: 'soupapes_leak',
      sphere: 'soupapes',
      kind: 'impact',
      message:
        'Tes soupapes sont très sollicitées. Pour le moment, on met de côté les objectifs de performance et on privilégie de petites actions pour te reconnecter à toi.',
    });
  }

  const finalSpheres = roundTree(spheres);
  const finalSubs = roundTree(subs);

  // Score Core : pondéré, interne, jamais affiché sous forme de note.
  const core = round(
    weightedMean(SPHERES.map((s) => [finalSpheres[s], CORE_WEIGHTS[s]])),
  );

  const values = SPHERES.map((s) => finalSpheres[s]).filter((v) => v !== null);
  const mean = values.reduce((a, b) => a + b, 0) / (values.length || 1);
  const sd = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / (values.length || 1));
  const harmony = Math.round(Math.max(0, 1 - sd / 50) * 100) / 100;

  return {
    answers,
    raw: { spheres: roundTree(rawSpheres), subs: roundTree(rawSubs) },
    spheres: finalSpheres,
    subs: finalSubs,
    tags: [...tags].sort(),
    caps,
    flags,
    insights,
    core,
    harmony,
  };
}
