// Micro-aides : chaque exercice s'explique (pourquoi, quand) et se pratique directement, étape par étape.
// Le moteur de recommandation en choisit au plus 3 selon les jauges, les tags et les drapeaux.
// Contenus à relire et valider (phase 3).
//
// Types d'étapes jouées par le lecteur d'exercices côté interface :
//   read    : paragraphes à lire
//   breath  : respiration guidée (inspiration / expiration, durée au choix)
//   senses  : compter des éléments perçus, sens par sens
//   timer   : consigne minutée (visuel « wave » pour surfer sur une envie)
//   text    : champ libre (jamais enregistré)
//   list    : lister plusieurs éléments, avec un minuteur facultatif
//   pick    : choisir N éléments d'une liste saisie plus tôt
//   choice  : choisir une option
//   check   : cases à cocher
//   summary : relire ce qu'on a écrit (reste à l'écran, jamais enregistré)

import { EXERCISE_SOURCES, NO_SOURCE_NOTE, sourceById } from './sources.js';

const CATALOG = [
  {
    id: 'coherence_cardiaque',
    title: 'Cohérence cardiaque',
    kind: 'exercice',
    category: 'apaiser',
    duration: '1 à 5 min',
    summary: 'Six respirations par minute pour faire redescendre la pression.',
    why: 'Respirer à six cycles par minute accorde le rythme cardiaque à la respiration. Ce rythme active le système nerveux du repos et fait souvent baisser la tension en quelques minutes.',
    when: 'Quand la pression monte, avant un moment stressant, ou pour te poser le soir.',
    steps: [{ type: 'breath', inhale: 5, exhale: 5, minutes: [1, 3, 5], defaultMinutes: 3 }],
    trigger: ({ tags, subs, spheres }) =>
      tags.has('anxiete_somatique') ? 90 : lt(subs.pilote.stress, 40) ? 70 : lt(spheres.pilote, 50) ? 50 : 0,
  },
  {
    id: 'ancrage_54321',
    title: 'Ancrage 5-4-3-2-1',
    kind: 'exercice',
    category: 'apaiser',
    duration: '2 min',
    summary: 'Sortir de la boucle en revenant à tes sens.',
    why: "Quand les pensées tournent en boucle, ramener l'attention sur ce que perçoivent tes sens occupe l'esprit avec le présent. La boucle perd un peu de sa prise.",
    when: "Pendant une rumination ou une montée d'angoisse.",
    steps: [
      {
        type: 'senses',
        items: [
          { count: 5, label: 'choses que tu vois' },
          { count: 4, label: 'choses que tu peux toucher' },
          { count: 3, label: 'sons que tu entends' },
          { count: 2, label: 'odeurs autour de toi' },
          { count: 1, label: 'goût dans ta bouche' },
        ],
      },
    ],
    trigger: ({ tags, subs }) => (tags.has('anxiete_rumination') ? 85 : lt(subs.pilote.humeur, 35) ? 40 : 0),
  },
  {
    id: 'restructuration',
    title: 'Mettre une pensée à l’épreuve',
    kind: 'outil',
    category: 'apaiser',
    duration: '5 min',
    summary: 'Examiner une pensée qui tourne en boucle comme une hypothèse, pas comme un fait.',
    why: 'Issu des thérapies cognitives et comportementales : une pensée n’est pas un fait. La mettre à l’épreuve aide à trouver une version plus juste, qui n’a pas besoin d’être positive.',
    when: 'Quand une pensée revient sans cesse et pèse sur ton humeur.',
    steps: [
      { type: 'text', id: 'thought', prompt: 'Quelle pensée revient le plus souvent ?', placeholder: 'Ex. : « Je vais tout rater »' },
      { type: 'text', id: 'for', prompt: 'Quels faits la soutiennent ?', multiline: true },
      { type: 'text', id: 'against', prompt: 'Quels faits la contredisent, même un peu ?', multiline: true },
      { type: 'text', id: 'friend', prompt: 'Que dirais-tu à un·e ami·e qui aurait cette pensée ?', multiline: true },
      { type: 'text', id: 'reframe', prompt: 'Reformule une version plus juste. Elle n’a pas besoin d’être positive.', multiline: true },
      {
        type: 'summary',
        items: [
          { id: 'thought', label: 'Ta pensée de départ' },
          { id: 'reframe', label: 'Ta version plus juste' },
        ],
      },
    ],
    trigger: ({ tags, subs }) => (tags.has('anxiete_rumination') ? 75 : lt(subs.pilote.stress, 40) ? 45 : 0),
  },
  {
    id: 'vider_la_tete',
    title: 'Fermer des onglets mentaux',
    kind: 'exercice',
    category: 'organiser',
    duration: '5 min',
    summary: 'Vider ta tête par écrit, puis ne garder que trois choses pour aujourd’hui.',
    why: 'Écrire ce qui tourne en arrière-plan libère de la mémoire de travail. Choisir trois priorités réduit la sensation d’avoir cinquante onglets ouverts.',
    when: 'Quand ton espace de pensée est saturé ou que tu ne sais plus par où commencer.',
    steps: [
      { type: 'list', id: 'dump', prompt: 'Écris tout ce qui occupe ton esprit, sans trier.', placeholder: 'Une chose, puis Entrée', minutes: 5 },
      { type: 'pick', id: 'picked', from: 'dump', count: 3, prompt: 'Choisis les trois seules choses à traiter aujourd’hui.' },
      { type: 'summary', items: [{ id: 'picked', label: 'Tes trois priorités du jour' }], note: 'Le reste attendra.' },
    ],
    trigger: ({ answers }) => (answers['mind.saturation'] > 60 ? 65 : 0),
  },
  {
    id: 'body_first',
    title: 'Recharger la batterie physique d’abord',
    kind: 'article',
    category: 'recharger',
    duration: '2 min',
    summary: 'Quand le corps est à plat, chaque tâche mentale coûte plus cher.',
    why: 'Un corps fatigué dispose de moins de ressources pour gérer le stress et la concentration. Ce n’est pas un manque de volonté.',
    when: 'Quand ta Braise est bridée ou que la fatigue s’accumule.',
    steps: [
      { type: 'read', paragraphs: ['Recharger la batterie physique d’abord rend tout le reste plus facile. Pas besoin de tout changer : trois leviers suffisent.'] },
      { type: 'check', prompt: 'Ce que tu tentes cette semaine', items: ['Une heure de lever stable', 'Un repas pris au calme par jour', 'Dix minutes dehors à la lumière du jour'] },
    ],
    trigger: ({ flags }) => (flags.bodyFirst ? 95 : 0),
  },
  {
    id: 'sommeil_batterie',
    title: 'Le sommeil, première batterie',
    kind: 'article',
    category: 'recharger',
    duration: '3 min',
    summary: 'La qualité du sommeil compte plus que sa durée. Trois leviers simples.',
    why: 'Le sommeil recharge les ressources physiques et mentales. Sa régularité pèse souvent plus que sa durée.',
    when: 'Quand ta batterie est à plat au réveil.',
    steps: [
      {
        type: 'read',
        paragraphs: [
          'Une heure de lever régulière, même le week-end, stabilise l’horloge interne plus sûrement qu’une heure de coucher.',
          'La lumière naturelle dans l’heure qui suit le réveil aide à s’endormir le soir.',
          'Trente minutes de décompression sans écran avant de dormir facilitent l’endormissement.',
        ],
      },
      { type: 'check', prompt: 'Ce que tu tentes cette semaine', items: ['Une heure de lever fixe', 'Dix minutes de lumière le matin', 'Trente minutes sans écran avant de dormir'] },
    ],
    trigger: ({ subs }) => (lt(subs.machine.sommeil, 50) ? 60 + (50 - subs.machine.sommeil) / 2 : 0),
  },
  {
    id: 'micro_mouvement',
    title: 'Dix minutes de mouvement doux',
    kind: 'exercice',
    category: 'recharger',
    duration: '10 min',
    summary: 'Faire circuler, pas performer.',
    why: 'Bouger quelques minutes relance la circulation et relâche les tensions accumulées. L’objectif n’est pas de se dépasser.',
    when: 'Après une longue période assise, ou quand ton corps se crispe.',
    steps: [
      { type: 'timer', seconds: 60, label: 'Nuque', cue: 'Incline doucement la tête d’un côté, puis de l’autre. Respire lentement.' },
      { type: 'timer', seconds: 60, label: 'Épaules', cue: 'Roule les épaules vers l’arrière, lentement, puis vers l’avant.' },
      { type: 'timer', seconds: 60, label: 'Dos', cue: 'Debout, étire les bras vers le haut, puis penche-toi légèrement en avant.' },
      { type: 'timer', seconds: 420, label: 'Marche', cue: 'Marche à ton rythme, dehors si tu peux. Observe ce qui t’entoure.' },
    ],
    trigger: ({ subs }) => (lt(subs.machine.dynamique, 50) ? 55 : 0),
  },
  {
    id: 'objectif_activite',
    title: 'Un objectif d’activité pour la semaine',
    kind: 'outil',
    category: 'performance',
    duration: '2 min',
    summary: 'Deux créneaux fixes d’activité modérée cette semaine.',
    why: 'L’OMS recommande 150 minutes d’activité modérée par semaine. Décider à l’avance quand et où agir augmente nettement les chances de passer à l’action.',
    when: 'Quand ton énergie le permet et que tu veux relancer ton activité.',
    steps: [
      { type: 'text', id: 'slot1', prompt: 'Premier créneau : quel jour, à quelle heure, pour faire quoi ?', placeholder: 'Ex. : mardi, 18 h, marche rapide' },
      { type: 'text', id: 'slot2', prompt: 'Deuxième créneau', placeholder: 'Ex. : samedi, 10 h, vélo' },
      { type: 'summary', items: [{ id: 'slot1', label: 'Créneau 1' }, { id: 'slot2', label: 'Créneau 2' }], note: 'Note-les dans ton agenda comme des rendez-vous.' },
    ],
    trigger: ({ subs, spheres }) => (between(subs.machine.dynamique, 40, 75) && !lt(spheres.machine, 50) ? 35 : 0),
  },
  {
    id: 'hydratation',
    title: 'Le plein d’eau',
    kind: 'article',
    category: 'recharger',
    duration: '1 min',
    summary: 'Une légère déshydratation suffit à faire baisser la concentration.',
    why: 'Même une déshydratation légère peut réduire la concentration et augmenter la sensation de fatigue.',
    when: 'Quand tu oublies de boire pendant la journée.',
    steps: [{ type: 'check', prompt: 'Ce que tu mets en place aujourd’hui', items: ['Une bouteille visible sur mon espace de travail', 'Un verre d’eau à chaque pause', 'Un verre d’eau au réveil'] }],
    trigger: ({ tags }) => (tags.has('alerte_hydratation') ? 50 : 0),
  },
  {
    id: 'repas_poses',
    title: 'Un repas posé par jour',
    kind: 'exercice',
    category: 'recharger',
    duration: '20 min',
    summary: 'Un repas pris sans écran ni urgence, quel que soit ton rythme alimentaire.',
    why: 'Manger au calme aide à repérer la faim, la satiété et l’effet des repas sur ton énergie.',
    when: 'Quand tes repas sont souvent expédiés dans l’urgence.',
    steps: [
      { type: 'read', paragraphs: ['Choisis le repas le plus facile à protéger dans ta journée. Assieds-toi et pose ton téléphone.'] },
      { type: 'check', prompt: 'Pendant ce repas', items: ['Pas d’écran', 'Assis·e', 'Je remarque mon énergie dans l’heure qui suit'] },
    ],
    trigger: ({ tags, subs }) => (tags.has('repas_urgence') ? 50 : lt(subs.machine.carburant, 40) ? 45 : 0),
  },
  {
    id: 'exteriorisation',
    title: 'Partager la charge',
    kind: 'exercice',
    category: 'relier',
    duration: '15 min',
    summary: 'Tes liens sont solides : c’est le moment de t’appuyer dessus.',
    why: 'Mettre des mots sur une émotion en diminue souvent l’intensité. Partager ce qui pèse avec une personne de confiance rend la charge plus légère.',
    when: 'Quand tu traverses une zone de turbulences et que ton entourage est présent.',
    steps: [
      { type: 'text', id: 'who', prompt: 'À qui pourrais-tu en parler cette semaine ?', placeholder: 'Un prénom suffit' },
      { type: 'text', id: 'what', prompt: 'Ce que tu aimerais lui dire, en une phrase', multiline: true },
      { type: 'summary', items: [{ id: 'who', label: 'À qui' }, { id: 'what', label: 'Ta phrase de départ' }], note: 'Pas besoin de solution : raconter suffit.' },
    ],
    trigger: ({ flags, spheres }) => (flags.buffer && lt(spheres.pilote, 55) ? 80 : 0),
  },
  {
    id: 'auto_compassion',
    title: 'Se parler comme à un·e ami·e',
    kind: 'exercice',
    category: 'apaiser',
    duration: '2 min',
    summary: 'Une pause d’auto-compassion en trois temps.',
    why: 'La pause d’auto-compassion (Kristin Neff) remplace la critique intérieure par le ton qu’on prendrait avec un·e ami·e. Elle aide à traverser un moment difficile sans l’aggraver.',
    when: 'Quand tu te juges durement ou que tout semble peser en même temps.',
    steps: [
      { type: 'timer', seconds: 30, label: 'Reconnaître', cue: 'Pose une main sur ta poitrine. Dis-toi : « C’est un moment difficile. »' },
      { type: 'timer', seconds: 30, label: 'Relier', cue: 'La difficulté fait partie de l’expérience humaine. D’autres traversent la même chose.' },
      { type: 'timer', seconds: 30, label: 'Soutenir', cue: 'Demande-toi : « De quoi ai-je besoin, là, maintenant ? »' },
      { type: 'text', id: 'need', prompt: 'Ce dont tu as besoin, en quelques mots', optional: true },
    ],
    trigger: ({ flags, spheres }) => (flags.vulnerability ? 90 : lt(spheres.reseau, 40) ? 50 : 0),
  },
  {
    id: 'lien_leger',
    title: 'Un contact à faible coût',
    kind: 'exercice',
    category: 'relier',
    duration: '2 min',
    summary: 'Un message court, sans attente de réponse.',
    why: 'Les petites interactions nourrissent le sentiment de connexion, même sans longue conversation.',
    when: 'Quand tu te sens en décalage ou isolé·e.',
    steps: [
      { type: 'text', id: 'who', prompt: 'À qui aimerais-tu faire signe ?', placeholder: 'Un prénom suffit' },
      {
        type: 'choice',
        id: 'message',
        prompt: 'Choisis un message, ou inspire-t’en',
        options: ['Je pensais à toi, j’espère que ta semaine se passe bien.', 'Ça m’a fait penser à toi, tu vas bien ?', 'On se prend un café bientôt ?'],
      },
      { type: 'summary', items: [{ id: 'who', label: 'Pour' }, { id: 'message', label: 'Ton message' }], copy: 'message', note: 'Copie-le, puis envoie-le quand tu veux.' },
    ],
    trigger: ({ subs, flags }) => (!flags.vulnerability && lt(subs.reseau.connexion, 45) ? 45 : 0),
  },
  {
    id: 'charge_mentale',
    title: 'La charge mentale, c’est quoi ?',
    kind: 'article',
    category: 'organiser',
    duration: '3 min',
    summary: 'Le travail invisible de planifier, d’anticiper et de se souvenir.',
    why: 'Comprendre ce qui occupe ta mémoire de travail aide à l’alléger.',
    when: 'Quand ta bande passante mentale est basse sans raison évidente.',
    steps: [
      {
        type: 'read',
        paragraphs: [
          'La charge mentale, c’est tout ce que tu gardes en tête pour ne rien oublier : rendez-vous, courses, échéances, messages à envoyer.',
          'Elle occupe la mémoire de travail même quand tu ne fais « rien ». C’est pour ça qu’elle fatigue autant.',
          'La rendre visible, sur papier ou dans un outil, est le premier moyen de l’alléger. L’exercice « Fermer des onglets mentaux » t’y aide.',
        ],
      },
    ],
    trigger: ({ subs }) => (lt(subs.pilote.charge, 50) ? 50 : 0),
  },
  {
    id: 'budget_visuel',
    title: 'Rendre ton budget visible',
    kind: 'outil',
    category: 'organiser',
    duration: '15 min',
    summary: 'Mettre des chiffres sur le flou le rend souvent moins menaçant.',
    why: 'L’inquiétude financière occupe de la bande passante en arrière-plan. Voir clairement où va l’argent réduit souvent cette pression.',
    when: 'Quand une dépense imprévue te met dans le rouge, même en pensée.',
    steps: [
      { type: 'read', paragraphs: ['Trois enveloppes suffisent : les charges fixes, le quotidien, les imprévus. Même une petite somme dans l’enveloppe « imprévus » change la façon d’accueillir une dépense surprise.'] },
      { type: 'check', prompt: 'Cette semaine', items: ['Lister mes charges fixes', 'Estimer mon budget du quotidien', 'Mettre une petite somme de côté pour les imprévus'] },
    ],
    trigger: ({ tags, subs }) => (tags.has('friction_budget') ? 60 : lt(subs.cadre.finances, 30) ? 45 : 0),
  },
  {
    id: 'sens_projets',
    title: 'Retrouver le fil',
    kind: 'exercice',
    category: 'organiser',
    duration: '5 min',
    summary: 'Reconnecter un projet à ce qui te motivait au départ.',
    why: 'Se rappeler pourquoi un projet compte relance la motivation. Une toute petite action rend le premier pas possible.',
    when: 'Quand un projet ressemble à une corvée ou à un grand flou.',
    steps: [
      { type: 'text', id: 'why', prompt: 'Pourquoi ce projet comptait-il pour toi au départ ?', multiline: true },
      { type: 'text', id: 'next', prompt: 'La plus petite prochaine action, faisable en quinze minutes', placeholder: 'Ex. : ouvrir le document et écrire le titre' },
      { type: 'summary', items: [{ id: 'why', label: 'Ce qui compte' }, { id: 'next', label: 'Ta prochaine action' }] },
    ],
    trigger: ({ tags, subs }) => (tags.has('friction_projets') ? 55 : lt(subs.cadre.projets, 40) ? 50 : 0),
  },
  {
    id: 'reconnexion',
    title: 'Surfer sur l’envie',
    kind: 'exercice',
    category: 'reconnexion',
    duration: '2 min',
    summary: 'Créer un espace entre l’envie et l’action, sans interdiction.',
    why: 'Une envie monte, atteint un pic, puis redescend, souvent en quelques minutes. L’observer sans y répondre tout de suite, c’est le « surf sur l’envie », une technique utilisée en prévention de la rechute.',
    when: 'Quand une échappatoire arrive en automatique : écran, grignotage, achat, cigarette.',
    steps: [
      { type: 'timer', seconds: 120, label: 'Observer la vague', cue: 'Remarque où l’envie se loge dans ton corps. Respire. Regarde-la monter, puis redescendre.', visual: 'wave' },
      { type: 'choice', id: 'after', prompt: 'Et maintenant ?', options: ['L’envie a baissé', 'Elle est toujours là, et c’est ok'] },
      { type: 'read', paragraphs: ['Quoi que tu choisisses ensuite, tu as créé un espace entre l’envie et l’action. C’est ce muscle qui se renforce.'] },
    ],
    trigger: ({ flags, tags }) => (flags.soupapesLeak ? 85 : [...tags].some((t) => t.startsWith('compulsion_')) ? 60 : 0),
  },
  {
    id: 'ecrans_choisis',
    title: 'Des écrans choisis',
    kind: 'exercice',
    category: 'reconnexion',
    duration: '5 min',
    summary: 'Reprendre la main sur ce qui capte ton attention.',
    why: 'Chaque notification interrompt l’attention, qui met du temps à revenir. Réduire les sollicitations rend l’usage des écrans plus choisi.',
    when: 'Quand ton téléphone ressemble à un gouffre temporel automatique.',
    steps: [{ type: 'check', prompt: 'Ce que tu fais maintenant', items: ['Désactiver les notifications non essentielles', 'Retirer une appli de l’écran d’accueil', 'Laisser mon téléphone hors de la chambre ce soir'] }],
    trigger: ({ subs }) => (lt(subs.soupapes.ecrans, 40) ? 55 : 0),
  },
];

// Catégories de la boîte à outils, dans l'ordre d'affichage.
export const EXERCISE_CATEGORIES = [
  { id: 'apaiser', label: 'Apaiser' },
  { id: 'recharger', label: 'Recharger' },
  { id: 'relier', label: 'Relier' },
  { id: 'organiser', label: 'Organiser' },
  { id: 'reconnexion', label: 'Reprendre la main' },
  { id: 'performance', label: 'Passer à l’action' },
];

function lt(value, threshold) {
  return value !== null && value !== undefined && value < threshold;
}

function between(value, min, max) {
  return value !== null && value !== undefined && value >= min && value < max;
}

// Chaque exercice expose ses sources (voir sources.js), ou une note quand il n'en a pas.
const publicExercise = ({ trigger, ...rest }) => ({
  ...rest,
  sources: (EXERCISE_SOURCES[rest.id] ?? []).map((id) => sourceById[id]),
  sourceNote: NO_SOURCE_NOTE[rest.id] ?? null,
});

export const EXERCISES = CATALOG.map(publicExercise);
export const CATALOG_IDS = CATALOG.map((c) => c.id);

export function getNudge(id) {
  const item = CATALOG.find((c) => c.id === id);
  return item ? publicExercise(item) : null;
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
  const allowedInRelay = new Set(['apaiser', 'relier']);

  const scored = [];
  for (const item of CATALOG) {
    if (blocked.has(item.category)) continue;
    if (triage.level === 'relais' && !allowedInRelay.has(item.category)) continue;
    let priority = item.trigger(ctx);
    if (!priority) continue;
    // Corps épuisé : on recharge la batterie physique avant tout.
    if (ctx.flags.bodyFirst && item.category === 'recharger') priority += 20;
    scored.push({ ...publicExercise(item), priority });
  }

  scored.sort((a, b) => b.priority - a.priority);
  return scored.slice(0, triage.level === 'relais' ? 2 : limit);
}
