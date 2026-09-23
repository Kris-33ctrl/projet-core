// Nudges contextuels : le moteur choisit au plus 3 micro-aides selon les jauges, les tags et les drapeaux.
// Chaque déclencheur renvoie une priorité (0 = non pertinent). Contenus à relire et valider (phase 3).

const CATALOG = [
  {
    id: 'coherence_cardiaque',
    title: 'Cohérence cardiaque',
    kind: 'exercice',
    category: 'regulation',
    duration: '3 min',
    tool: 'coherence',
    summary: 'Six respirations par minute pendant trois minutes pour faire redescendre la pression.',
    body: [
      'Inspire pendant 5 secondes, expire pendant 5 secondes, en suivant la forme qui respire.',
      'Ce rythme stimule le nerf vague et active le système nerveux du repos.',
    ],
    trigger: ({ tags, subs, spheres }) =>
      tags.has('anxiete_somatique') ? 90 : lt(subs.pilote.stress, 40) ? 70 : lt(spheres.pilote, 50) ? 50 : 0,
  },
  {
    id: 'ancrage_54321',
    title: 'Ancrage 5-4-3-2-1',
    kind: 'exercice',
    category: 'regulation',
    duration: '2 min',
    summary: 'Sortir de la boucle en revenant à tes sens.',
    body: [
      'Nomme 5 choses que tu vois.',
      'Puis 4 choses que tu peux toucher.',
      'Puis 3 sons que tu entends.',
      'Puis 2 odeurs autour de toi.',
      'Et enfin 1 goût dans ta bouche.',
    ],
    trigger: ({ tags, subs }) => (tags.has('anxiete_rumination') ? 85 : lt(subs.pilote.humeur, 35) ? 40 : 0),
  },
  {
    id: 'restructuration',
    title: 'Mettre une pensée à l’épreuve',
    kind: 'outil',
    category: 'regulation',
    duration: '5 min',
    summary: 'Un exercice issu des TCC pour desserrer une pensée qui tourne en boucle.',
    body: [
      'Écris la pensée qui revient le plus souvent.',
      'Quels faits la soutiennent ? Lesquels la contredisent ?',
      'Que dirais-tu à un·e ami·e qui aurait cette pensée ?',
      'Reformule une version plus juste. Elle n’a pas besoin d’être positive.',
    ],
    trigger: ({ tags, subs }) => (tags.has('anxiete_rumination') ? 75 : lt(subs.pilote.stress, 40) ? 45 : 0),
  },
  {
    id: 'body_first',
    title: 'Recharger la batterie physique d’abord',
    kind: 'article',
    category: 'recharge',
    duration: '2 min de lecture',
    summary: 'Quand le corps est à plat, chaque tâche mentale coûte plus cher.',
    body: [
      'Ce n’est pas un manque de volonté : un corps fatigué dispose de moins de ressources pour gérer le stress et la concentration.',
      'Cette semaine, trois priorités seulement : une heure de lever stable, un repas pris au calme par jour, dix minutes dehors à la lumière du jour.',
    ],
    trigger: ({ flags }) => (flags.bodyFirst ? 95 : 0),
  },
  {
    id: 'sommeil_batterie',
    title: 'Le sommeil, première batterie',
    kind: 'article',
    category: 'recharge',
    duration: '3 min de lecture',
    summary: 'La qualité du sommeil compte plus que sa durée. Trois leviers simples.',
    body: [
      'Une heure de lever régulière, même le week-end, stabilise l’horloge interne plus sûrement qu’une heure de coucher.',
      'La lumière naturelle dans l’heure qui suit le réveil aide à s’endormir le soir.',
      'Garde trente minutes de décompression sans écran avant de dormir.',
    ],
    trigger: ({ subs }) => (lt(subs.machine.sommeil, 50) ? 60 + (50 - subs.machine.sommeil) / 2 : 0),
  },
  {
    id: 'micro_mouvement',
    title: 'Dix minutes de mouvement doux',
    kind: 'exercice',
    category: 'mouvement_doux',
    duration: '10 min',
    summary: 'Faire circuler, pas performer.',
    body: [
      'Une marche, quelques étirements de la nuque et du dos, ou des escaliers.',
      'L’objectif est de relancer la circulation et de relâcher les tensions, pas de se dépasser.',
    ],
    trigger: ({ subs }) => (lt(subs.machine.dynamique, 50) ? 55 : 0),
  },
  {
    id: 'objectif_activite',
    title: 'Un objectif d’activité pour la semaine',
    kind: 'outil',
    category: 'performance',
    duration: '2 créneaux',
    summary: 'Deux créneaux fixes d’activité modérée cette semaine.',
    body: [
      'L’OMS recommande 150 minutes d’activité modérée par semaine.',
      'Commence par deux créneaux de 30 minutes, planifiés comme des rendez-vous.',
    ],
    trigger: ({ subs, spheres }) =>
      between(subs.machine.dynamique, 40, 75) && !lt(spheres.machine, 50) ? 35 : 0,
  },
  {
    id: 'hydratation',
    title: 'Le plein d’eau',
    kind: 'exercice',
    category: 'recharge',
    duration: 'Au fil de la journée',
    summary: 'Une légère déshydratation suffit à faire baisser la concentration.',
    body: ['Garde une bouteille visible sur ton espace de travail et bois un verre à chaque pause.'],
    trigger: ({ tags }) => (tags.has('alerte_hydratation') ? 50 : 0),
  },
  {
    id: 'repas_poses',
    title: 'Un repas posé par jour',
    kind: 'exercice',
    category: 'recharge',
    duration: '20 min',
    summary: 'Un repas pris sans écran ni urgence, quel que soit ton rythme alimentaire.',
    body: [
      'Choisis le repas le plus facile à protéger dans ta journée.',
      'Assieds-toi, pose ton téléphone et remarque comment ton énergie évolue dans l’heure qui suit.',
    ],
    trigger: ({ tags, subs }) => (tags.has('repas_urgence') ? 50 : lt(subs.machine.carburant, 40) ? 45 : 0),
  },
  {
    id: 'exteriorisation',
    title: 'Partager la charge',
    kind: 'exercice',
    category: 'lien',
    duration: '15 min',
    summary: 'Ton réseau est solide : c’est le moment de t’appuyer dessus.',
    body: [
      'Choisis une personne de ton filet de sécurité et raconte-lui ce qui pèse, sans chercher de solution.',
      'Mettre des mots sur une émotion en diminue souvent l’intensité.',
    ],
    trigger: ({ flags, spheres }) => (flags.buffer && lt(spheres.pilote, 55) ? 80 : 0),
  },
  {
    id: 'auto_compassion',
    title: 'Se parler comme à un·e ami·e',
    kind: 'exercice',
    category: 'lien',
    duration: '2 min',
    summary: 'Une pause d’auto-compassion en trois temps.',
    body: [
      'Pose une main sur ta poitrine et reconnais simplement : « C’est un moment difficile. »',
      'Rappelle-toi que la difficulté fait partie de l’expérience humaine. Tu n’es pas seul(e) à traverser ça.',
      'Demande-toi : « De quoi ai-je besoin, là, maintenant ? »',
    ],
    trigger: ({ flags, spheres }) => (flags.vulnerability ? 90 : lt(spheres.reseau, 40) ? 50 : 0),
  },
  {
    id: 'lien_leger',
    title: 'Un contact à faible coût',
    kind: 'exercice',
    category: 'lien',
    duration: '2 min',
    summary: 'Un message court, sans attente de réponse.',
    body: ['Envoie un mot à quelqu’un que tu apprécies. Les petites interactions nourrissent aussi le lien.'],
    trigger: ({ subs, flags }) => (!flags.vulnerability && lt(subs.reseau.connexion, 45) ? 45 : 0),
  },
  {
    id: 'charge_mentale',
    title: 'La charge mentale, c’est quoi ?',
    kind: 'article',
    category: 'comprendre',
    duration: '3 min de lecture',
    summary: 'Le travail invisible de planifier, d’anticiper et de se souvenir.',
    body: [
      'La charge mentale occupe la mémoire de travail même quand on ne fait « rien ».',
      'La rendre visible (sur papier, dans un outil) est le premier moyen de l’alléger.',
    ],
    trigger: ({ subs }) => (lt(subs.pilote.charge, 50) ? 50 : 0),
  },
  {
    id: 'vider_la_tete',
    title: 'Fermer des onglets mentaux',
    kind: 'exercice',
    category: 'regulation',
    duration: '5 min',
    summary: 'Vider ta tête sur papier, puis ne garder que trois choses.',
    body: [
      'Pendant cinq minutes, écris tout ce qui occupe ton esprit, sans trier.',
      'Entoure les trois seules choses à traiter aujourd’hui. Le reste attendra sur la feuille.',
    ],
    trigger: ({ answers }) => (answers['mind.saturation'] > 60 ? 65 : 0),
  },
  {
    id: 'budget_visuel',
    title: 'Rendre ton budget visible',
    kind: 'outil',
    category: 'cadre',
    duration: '15 min',
    summary: 'Mettre des chiffres sur le flou le rend souvent moins menaçant.',
    body: [
      'Trois enveloppes : les charges fixes, le quotidien, les imprévus.',
      'Même une petite somme dans l’enveloppe « imprévus » change la façon dont on accueille une dépense surprise.',
    ],
    trigger: ({ tags, subs }) => (tags.has('friction_budget') ? 60 : lt(subs.cadre.finances, 30) ? 45 : 0),
  },
  {
    id: 'sens_projets',
    title: 'Retrouver le fil',
    kind: 'exercice',
    category: 'cadre',
    duration: '10 min',
    summary: 'Reconnecter un projet à ce qui te motivait au départ.',
    body: [
      'Écris en une phrase pourquoi ce projet comptait pour toi au départ.',
      'Puis définis la plus petite prochaine action, faisable en quinze minutes.',
    ],
    trigger: ({ tags, subs }) => (tags.has('friction_projets') ? 55 : lt(subs.cadre.projets, 40) ? 50 : 0),
  },
  {
    id: 'reconnexion',
    title: 'Une soupape à la fois',
    kind: 'exercice',
    category: 'reconnexion',
    duration: '2 min',
    summary: 'Créer un espace entre l’envie et l’action, sans interdiction.',
    body: [
      'Choisis un seul moment de la journée où l’échappatoire arrive en automatique.',
      'À ce moment-là, offre-toi d’abord deux minutes : respirer, boire un verre d’eau, sortir. Ensuite, tu choisis.',
    ],
    trigger: ({ flags, tags }) =>
      flags.soupapesLeak ? 85 : [...tags].some((t) => t.startsWith('compulsion_')) ? 60 : 0,
  },
  {
    id: 'ecrans_choisis',
    title: 'Des écrans choisis',
    kind: 'exercice',
    category: 'reconnexion',
    duration: '5 min',
    summary: 'Reprendre la main sur ce qui capte ton attention.',
    body: [
      'Désactive les notifications non essentielles.',
      'La nuit, laisse ton téléphone hors de la chambre.',
    ],
    trigger: ({ subs }) => (lt(subs.soupapes.ecrans, 40) ? 55 : 0),
  },
];

function lt(value, threshold) {
  return value !== null && value !== undefined && value < threshold;
}

function between(value, min, max) {
  return value !== null && value !== undefined && value >= min && value < max;
}

export function recommend(result, triage = { level: 'none' }, limit = 3) {
  const ctx = {
    answers: result.answers ?? {},
    spheres: result.spheres,
    subs: result.subs,
    flags: result.flags ?? {},
    tags: new Set(result.tags),
  };

  const blocked = new Set();
  // Soupapes dans le rouge : pas d'objectif de performance (PDF, sphère 5).
  if (ctx.flags.soupapesLeak) blocked.add('performance');
  // Relais : la gamification se met en pause, on ne garde que l'apaisement et le lien.
  const allowedInRelay = new Set(['regulation', 'lien']);

  const scored = [];
  for (const item of CATALOG) {
    if (blocked.has(item.category)) continue;
    if (triage.level === 'relais' && !allowedInRelay.has(item.category)) continue;
    let priority = item.trigger(ctx);
    if (!priority) continue;
    // Corps épuisé : on recharge la batterie physique avant tout.
    if (ctx.flags.bodyFirst && ['recharge', 'mouvement_doux'].includes(item.category)) priority += 20;
    const { trigger, ...rest } = item;
    scored.push({ ...rest, priority });
  }

  scored.sort((a, b) => b.priority - a.priority);
  return scored.slice(0, triage.level === 'relais' ? 2 : limit);
}

export const CATALOG_IDS = CATALOG.map((c) => c.id);

export function getNudge(id) {
  const item = CATALOG.find((c) => c.id === id);
  if (!item) return null;
  const { trigger, ...rest } = item;
  return rest;
}
