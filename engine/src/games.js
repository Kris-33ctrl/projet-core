// Mini-jeux et Atlas (doc « Gamification Core : les pistes », choix du 23/09/2026 :
// cadre A + B, premiers jeux La vague, Onglets et Surf, 3 minutes maximum, sons et vibrations doux).
// Chaque jeu fait ressentir une notion, puis dévoile une « carte savoir » qui l'explique avec sa source.
// Chasse aux sens n'a pas de source dédiée : sa carte le dit, plutôt que d'en inventer une.

export const MAX_GAME_SECONDS = 180;

export const GAMES = [
  {
    id: 'vague',
    title: 'La vague',
    status: 'ready',
    sphere: 'pilote',
    minutes: [1, 2, 3],
    summary: 'Guide un bateau en respirant : la mer se calme quand ton souffle ralentit.',
    howTo: 'Maintiens appuyé pour inspirer, relâche pour expirer. Suis la vague guide, sans forcer.',
    exercise: 'coherence_cardiaque',
    card: {
      title: 'La cohérence cardiaque',
      notion: 'Respirer lentement, autour de 6 cycles par minute, accorde le cœur et la respiration.',
      fact: 'À ce rythme, la variabilité de ta fréquence cardiaque augmente : c’est un signe que ton corps s’adapte et revient plus facilement au calme.',
      takeaway: 'Trois minutes suffisent, n’importe où : avant un examen, un appel difficile, ou pour t’endormir.',
      sources: ['lehrer2014'],
    },
  },
  {
    id: 'onglets',
    title: 'Onglets',
    status: 'ready',
    sphere: 'pilote',
    minutes: [2],
    summary: 'Cueille des bulles pendant que des onglets s’ouvrent, puis ferme-les en décidant quand t’en occuper.',
    howTo: 'Touche les bulles dès qu’elles apparaissent. Quand les onglets s’accumulent, range-les en choisissant un moment.',
    exercise: 'vider_la_tete',
    card: {
      title: 'La charge mentale',
      notion: 'Une tâche en suspens continue d’occuper ton esprit, même quand tu fais autre chose.',
      fact: 'Dans les expériences de Masicampo et Baumeister, il suffisait de décider quand et comment s’occuper d’une tâche pour qu’elle cesse de parasiter l’attention, avant même de l’avoir faite.',
      takeaway: 'Quand ta tête déborde, ne cherche pas à tout faire : note chaque chose avec un moment pour t’en occuper.',
      sources: ['masicampo2011', 'hart1988'],
    },
  },
  {
    id: 'surf',
    title: 'Surf',
    status: 'ready',
    sphere: 'soupapes',
    minutes: [2],
    summary: 'Reste sur la crête pendant que la vague de l’envie monte, culmine, puis retombe.',
    howTo: 'Glisse doucement pour garder le surfeur sur la crête. Inutile de lutter : la vague redescend d’elle-même.',
    exercise: 'reconnexion',
    card: {
      title: 'Le surf de l’envie',
      notion: 'Une envie monte, culmine, puis redescend, même si tu n’y réponds pas.',
      fact: 'Dans l’étude de Bowen et Marlatt, les envies de fumer n’ont pas diminué tout de suite. Mais les personnes qui avaient appris à les observer ont fumé moins de cigarettes la semaine suivante : c’est la réponse à l’envie qui change.',
      takeaway: 'La prochaine fois qu’une échappatoire t’appelle, laisse passer la vague deux minutes. Ensuite, tu choisis.',
      sources: ['bowen2009'],
    },
  },
  {
    id: 'notif',
    title: 'Notif',
    status: 'ready',
    sphere: 'soupapes',
    minutes: [2],
    summary: 'Lis deux courts textes : l’un pendant que le téléphone s’agite, l’autre au calme.',
    howTo: 'Lis chaque texte à ton rythme, puis réponds à une petite question. Rien n’est noté : observe juste ce que tu ressens.',
    exercise: 'ecrans_choisis',
    card: {
      title: 'Le coût d’une notification',
      notion: 'Une notification suffit à détourner l’attention, même sans y répondre.',
      fact: 'Dans l’étude de Stothart et ses collègues, recevoir une notification sans toucher au téléphone perturbait une tâche d’attention presque autant qu’un appel ou un SMS.',
      takeaway: 'Pour une tâche qui compte, coupe les notifications plutôt que de compter sur ta volonté pour les ignorer.',
      sources: ['stothart2015'],
    },
  },
  {
    id: 'tribunal',
    title: 'Le tribunal des pensées',
    status: 'ready',
    sphere: 'pilote',
    minutes: [3],
    summary: 'Mets une pensée automatique à l’épreuve : les pièces pour, les pièces contre, puis un verdict plus juste.',
    howTo: 'Choisis une pensée, range chaque pièce du côté « pour » ou « contre », puis choisis la version la plus juste.',
    exercise: 'restructuration',
    card: {
      title: 'Une pensée n’est pas un fait',
      notion: 'Une pensée automatique est une hypothèse, pas une vérité : on peut l’examiner.',
      fact: 'Examiner ses pensées est au cœur des thérapies cognitives et comportementales, dont l’efficacité est parmi les mieux établies, notamment pour l’anxiété et le stress (Hofmann et al., 2012).',
      takeaway: 'Une version plus juste n’a pas besoin d’être positive : elle tient simplement compte de tous les faits.',
      sources: ['hofmann2012'],
    },
  },
  {
    id: 'sens',
    title: 'Chasse aux sens',
    status: 'ready',
    sphere: 'pilote',
    minutes: [2],
    summary: 'Allume des lucioles en repérant ce que tes sens perçoivent autour de toi, là, maintenant.',
    howTo: 'Pour chaque sens, repère autour de toi ce qui est demandé et touche la scène à chaque fois : une luciole s’allume.',
    exercise: 'ancrage_54321',
    card: {
      title: 'Revenir dans le présent',
      notion: 'Nommer ce que tes sens perçoivent ramène l’attention dans l’instant présent.',
      fact: 'C’est une technique d’ancrage courante en clinique, souvent proposée pendant une montée d’angoisse. Elle n’a pas d’étude dédiée à ce format précis : Core le dit plutôt que d’inventer une source.',
      takeaway: 'Cinq, quatre, trois, deux, un : utilisable partout, sans que personne ne le remarque.',
      sources: [],
    },
  },
  {
    id: 'filet',
    title: 'Le filet',
    status: 'ready',
    sphere: 'reseau',
    minutes: [2],
    summary: 'Tisse ton filet : tes proches, mais aussi les liens légers du quotidien, et un petit geste pour chacun.',
    howTo: 'Ajoute des personnes de ton entourage, proches ou plus lointaines, puis choisis un petit geste pour allumer chaque fil. Les prénoms ne sont jamais enregistrés.',
    exercise: 'lien_leger',
    card: {
      title: 'La force des petits liens',
      notion: 'Les liens légers comptent aussi : un·e camarade, un·e voisin·e, la personne de la boulangerie.',
      fact: 'Dans les études de Sandstrom et Dunn, des étudiant·es se sentaient plus heureux·ses et plus intégré·es les jours où ils et elles échangeaient avec plus de camarades que d’habitude. Et un soutien perçu solide amortit l’effet du stress (Cohen & Wills, 1985).',
      takeaway: 'Pas besoin d’une longue conversation : un bonjour, un merci ou un message court nourrissent le lien.',
      sources: ['sandstrom2014', 'cohen1985'],
    },
  },
  {
    id: 'batterie',
    title: 'La batterie',
    status: 'ready',
    sphere: 'machine',
    minutes: [2],
    summary: 'Range des habitudes du côté « recharge » ou « vide », découvre pourquoi, puis choisis un levier pour ta semaine.',
    howTo: 'Pour chaque habitude, devine si elle recharge ou vide ta batterie. L’explication s’affiche : il n’y a pas de mauvaise réponse, seulement des découvertes.',
    exercise: 'sommeil_batterie',
    card: {
      title: 'Ce qui recharge, ce qui vide',
      notion: 'La régularité recharge autant que la durée : ton horloge interne aime les habitudes.',
      fact: 'Chez des étudiant·es suivi·es pendant 30 jours, un sommeil irrégulier allait avec une horloge interne décalée et de moins bons résultats, surtout à cause d’une exposition à la lumière moins régulière (Phillips et al., 2017). Le sommeil participe aussi au traitement des émotions de la veille (Walker & van der Helm, 2009).',
      takeaway: 'Commence par un seul levier : une heure de lever fixe, même le week-end.',
      sources: ['phillips2017', 'walker2009'],
    },
  },
  {
    id: 'enveloppes',
    title: 'Trois enveloppes',
    status: 'ready',
    sphere: 'cadre',
    minutes: [2],
    summary: 'Répartis tes jetons du mois en trois enveloppes, puis vois ce qui se passe quand les imprévus tombent.',
    howTo: 'Règle les trois enveloppes, puis traverse le mois. Tu peux réajuster et rejouer : ce sont des jetons, pas ton argent.',
    exercise: 'budget_visuel',
    card: {
      title: 'La bande passante mentale',
      notion: 'Les soucis d’argent occupent de la place dans ta tête, même quand tu penses à autre chose.',
      fact: 'Mani et ses collègues ont observé que penser à des difficultés financières faisait baisser les performances à des tests cognitifs, et que des agriculteurs réussissaient moins bien les mêmes tests avant la récolte, quand l’argent manque, qu’après.',
      takeaway: 'Mettre des chiffres sur le flou et garder une petite réserve pour les imprévus limite les mauvaises surprises qui nourrissent ce bruit de fond.',
      sources: ['mani2013'],
    },
  },
  {
    id: 'miroir',
    title: 'Le miroir bienveillant',
    status: 'ready',
    sphere: 'reseau',
    minutes: [2],
    summary: 'Une phrase dure envers toi-même embue le miroir : réécris-la comme le ferait un·e ami·e.',
    howTo: 'Choisis la phrase qui te parle, puis compose une réponse en trois temps. Le miroir s’éclaircit à chaque étape. Rien n’est enregistré.',
    exercise: 'auto_compassion',
    card: {
      title: 'L’auto-compassion',
      notion: 'Se parler comme à un·e ami·e : bienveillance, humanité partagée, pleine conscience.',
      fact: 'Ce sont les trois composantes de l’auto-compassion décrites par Kristin Neff. Dans un essai contrôlé, un programme de 8 semaines pour les cultiver a augmenté l’auto-compassion et le bien-être, avec des effets encore présents un an après (Neff & Germer, 2013).',
      takeaway: 'La prochaine fois que ta voix intérieure est dure, demande-toi ce que tu dirais à un·e ami·e dans la même situation.',
      sources: ['neff2003', 'neff2013'],
    },
  },
];

export const READY_GAMES = GAMES.filter((g) => g.status === 'ready');
export const gameById = Object.fromEntries(GAMES.map((g) => [g.id, g]));

// En relais, la gamification se met en pause : seul l'apaisement reste proposé.
export const RELAY_GAMES = ['vague', 'miroir'];

// Jeu proposé quand une carte du check-in ou une sous-jauge du bilan demande de l'attention.
export const GAME_FOR_DAILY = {
  'daily.battery': 'batterie',
  'daily.mood': 'vague',
  'daily.agency': 'vague',
  'daily.clarity': 'onglets',
  'daily.tension': 'sens',
  'daily.connection': 'filet',
  'daily.screens': 'notif',
};
export const GAME_FOR_SUB = {
  sommeil: 'batterie',
  dynamique: 'batterie',
  charge: 'onglets',
  stress: 'vague',
  humeur: 'miroir',
  soutien: 'filet',
  connexion: 'filet',
  confort: 'filet',
  finances: 'enveloppes',
  ecrans: 'notif',
  coping: 'tribunal',
  controle: 'surf',
};

export const gameSummary = (id) => {
  const g = gameById[id];
  return g ? { type: 'game', id: g.id, title: g.title, summary: g.summary, duration: `${Math.max(...g.minutes)} min max` } : null;
};
