// Mini-jeux et Atlas (doc « Gamification Core : les pistes », choix du 23/09/2026 :
// cadre A + B, premiers jeux La vague, Onglets et Surf, 3 minutes maximum, sons et vibrations doux).
// Chaque jeu fait ressentir une notion, puis dévoile une « carte savoir » qui l'explique avec sa source.
// Les cartes des jeux à venir apparaissent dans l'Atlas comme « bientôt », pour nourrir la curiosité.

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
  // Jeux à venir : leurs cartes apparaissent déjà dans l'Atlas, verrouillées.
  { id: 'notif', title: 'Notif', status: 'soon', sphere: 'soupapes', card: { title: 'Le coût d’une notification', sources: ['stothart2015'] } },
  { id: 'tribunal', title: 'Le tribunal des pensées', status: 'soon', sphere: 'pilote', card: { title: 'Une pensée n’est pas un fait', sources: ['hofmann2012'] } },
  { id: 'sens', title: 'Chasse aux sens', status: 'soon', sphere: 'pilote', card: { title: 'Revenir dans le présent', sources: [] } },
  { id: 'filet', title: 'Le filet', status: 'soon', sphere: 'reseau', card: { title: 'La force des petits liens', sources: ['sandstrom2014', 'cohen1985'] } },
  { id: 'batterie', title: 'La batterie', status: 'soon', sphere: 'machine', card: { title: 'Ce qui recharge, ce qui vide', sources: ['walker2009', 'phillips2017'] } },
  { id: 'enveloppes', title: 'Trois enveloppes', status: 'soon', sphere: 'cadre', card: { title: 'La bande passante mentale', sources: ['mani2013'] } },
  { id: 'miroir', title: 'Le miroir bienveillant', status: 'soon', sphere: 'reseau', card: { title: 'L’auto-compassion', sources: ['neff2003'] } },
];

export const READY_GAMES = GAMES.filter((g) => g.status === 'ready');
export const gameById = Object.fromEntries(GAMES.map((g) => [g.id, g]));

// En relais, la gamification se met en pause : seul l'apaisement reste proposé.
export const RELAY_GAMES = ['vague'];

// Jeu proposé quand une carte du check-in ou une sous-jauge du bilan demande de l'attention.
export const GAME_FOR_DAILY = { 'daily.mood': 'vague', 'daily.agency': 'vague', 'daily.clarity': 'onglets', 'daily.screens': 'surf' };
export const GAME_FOR_SUB = { stress: 'vague', humeur: 'vague', charge: 'onglets', controle: 'surf', ecrans: 'surf' };

export const gameSummary = (id) => {
  const g = gameById[id];
  return g ? { type: 'game', id: g.id, title: g.title, summary: g.summary, duration: `${Math.max(...g.minutes)} min max` } : null;
};
