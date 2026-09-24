// Accueil des personnes déjà suivies : le Core au-dessus des dunes, check-in du jour, bilan de la semaine,
// « ta semaine », l'Atlas en miniature, la boîte à outils et le bouclier.

import { h, formatDay, localDay } from '../dom.js';
import { createBlob } from '../components/blob.js';
import { brand } from '../components/brand.js';
import { openExercise } from '../components/exercise.js';
import { carePanel } from '../components/resources.js';
import { weekPanel, todayLevels } from '../components/week.js';
import { atlasStrip, openCardDetail } from '../components/atlas-card.js';
import { emblem } from '../art/emblems.js';
import { dunes } from '../art/landscapes.js';
import { exerciseCard, gameCard } from './library.js';

// Le jour, puis le soir : le Core suit l'heure de la personne.
function hello(now = new Date()) {
  const hour = now.getHours();
  return hour >= 18 || hour < 5 ? 'Bonsoir.' : 'Bonjour.';
}

function greeting(today, onCheckin) {
  const done = Boolean(today.checkin);
  const screening = today.plan.some((q) => q.type === 'frequency');
  return h(
    'div',
    { class: 'greeting' },
    h('span', { class: 'eyebrow', text: formatDay(today.day) }),
    h('h1', { text: hello() }),
    h('p', { class: 'lead', text: done ? 'Ta lumière du jour est notée. Le reste peut attendre.' : 'Comment va ta lumière aujourd’hui ?' }),
    done
      ? null
      : h(
          'div',
          { class: 'actions' },
          h('button', { type: 'button', class: 'btn btn-primary', onClick: () => onCheckin(today.plan) }, 'Faire mon check-in'),
          h('span', { class: 'small muted', text: screening ? 'Quatre cartes et quatre questions de repérage, environ une minute.' : 'Quatre cartes, trente secondes.' }),
        ),
  );
}

function checkinDoneCard(today, openSuggestion) {
  const suggestion = today.checkin.summary.suggestion;
  return h(
    'section',
    { class: 'panel glass hub-card', 'aria-labelledby': 'checkin-title' },
    h('div', { class: 'card-kicker' }, emblem('core'), h('span', { class: 'eyebrow', text: 'Check-in du jour' })),
    h('h2', { id: 'checkin-title', text: 'C’est noté pour aujourd’hui.' }),
    todayLevels(today.checkin.summary),
    suggestion
      ? h(
          'button',
          { type: 'button', class: 'nudge', onClick: () => openSuggestion(suggestion) },
          h('span', { class: 'nudge-meta' }, h('span', { text: suggestion.type === 'game' ? 'Mini-jeu pour ta journée' : 'Pour ta journée' }), h('span', { text: suggestion.duration })),
          h('h3', { text: suggestion.title }),
          h('span', { class: 'small muted', text: suggestion.summary }),
        )
      : h('p', { class: 'muted', text: 'Rien de particulier à ajuster aujourd’hui. À demain.' }),
  );
}

function bilanCard(today, pending, { onBilan, onResume, onOpenResult }) {
  const n = today.nextBilanInDays;
  let title;
  let text;
  let actions;
  if (pending) {
    title = 'Ton bilan est en cours.';
    text = 'Tes réponses sont gardées : reprends là où tu t’étais arrêté·e.';
    actions = [h('button', { type: 'button', class: 'btn btn-primary', onClick: onResume }, 'Reprendre le bilan')];
  } else if (today.bilanDue) {
    title = 'C’est le moment de ton bilan de la semaine.';
    text = 'Environ 4 minutes pour retraverser tes cinq paysages.';
    actions = [h('button', { type: 'button', class: 'btn btn-primary', onClick: onBilan }, 'Commencer le bilan')];
  } else {
    title = `Prochain bilan dans ${n} jour${n > 1 ? 's' : ''}.`;
    text = 'Le bilan complet revient une fois par semaine. D’ici là, le check-in suffit.';
    actions = [h('button', { type: 'button', class: 'btn btn-ghost', onClick: onBilan }, 'Le faire maintenant')];
  }
  if (today.lastBilan) {
    actions.push(h('button', { type: 'button', class: 'btn btn-quiet', onClick: () => onOpenResult(today.lastBilan.id) }, 'Revoir mon dernier bilan'));
  }
  return h(
    'section',
    { class: 'panel glass hub-card', 'aria-labelledby': 'bilan-title' },
    h('div', { class: 'card-kicker' }, emblem('card'), h('span', { class: 'eyebrow', text: 'Bilan complet' })),
    h('div', { class: 'hub-bilan-copy' }, h('h2', { id: 'bilan-title', text: title }), h('p', { class: 'muted', text }), h('div', { class: 'actions' }, actions)),
  );
}

function atlasPanel(meta, today, { onLibrary, onPlay }) {
  const unlocked = new Set(today.atlas);
  const quiet = today.shield.pauseGamification;
  // En relais, seuls les jeux d'apaisement restent proposés.
  const canPlay = (game) => today.shield.level !== 'relais' || meta.relayGames.includes(game.id);
  return h(
    'section',
    { class: 'panel glass', 'aria-labelledby': 'atlas-title' },
    h(
      'div',
      { class: 'panel-head' },
      h('h2', { id: 'atlas-title', text: 'Ton Atlas' }),
      h('span', { class: 'small muted', text: `${unlocked.size} carte${unlocked.size > 1 ? 's' : ''} sur ${meta.games.length}` }),
    ),
    h('p', { class: 'small muted', text: quiet ? 'Tes cartes restent là, à relire quand tu veux.' : 'Chaque mini-jeu te fait découvrir une carte savoir. Touche une carte pour la lire, ou une carte cachée pour jouer.' }),
    atlasStrip(meta.games, unlocked, {
      onOpen: (game) => openCardDetail(game, { onPlay: canPlay(game) ? onPlay : null }),
      onPlay,
      canPlay,
    }),
    h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn btn-quiet', onClick: onLibrary }, 'Ouvrir l’Atlas')),
  );
}

function toolboxPanel(meta, today, onPlay) {
  const byId = Object.fromEntries(meta.exercises.map((e) => [e.id, e]));
  const practiced = new Set(today.practices.map((p) => p.activityId));
  const picks = (today.lastBilan?.recommendations ?? []).map((id) => byId[id]).filter(Boolean).slice(0, 3);
  const games = meta.games
    .filter((g) => g.status === 'ready')
    .filter((g) => today.shield.level !== 'relais' || meta.relayGames.includes(g.id));
  const n = today.practices.length;
  return h(
    'section',
    { class: 'panel glass', 'aria-labelledby': 'toolbox-title' },
    h(
      'div',
      { class: 'panel-head' },
      h('h2', { id: 'toolbox-title', text: 'Ta boîte à outils' }),
      n ? h('span', { class: 'small muted', text: `${n} pratique${n > 1 ? 's' : ''} ces 7 jours` }) : null,
    ),
    h('h3', { class: 'toolbox-sub', text: 'Mini-jeux' }),
    h('div', { class: 'library-grid' }, games.map((g) => gameCard(g, { played: today.atlas.includes(g.id), onPlay: () => onPlay(g) }))),
    picks.length ? h('h3', { class: 'toolbox-sub', text: 'Exercices pour toi' }) : null,
    picks.length ? h('div', { class: 'library-grid' }, picks.map((e) => exerciseCard(e, { practiced: practiced.has(e.id) }))) : null,
  );
}

// Local-first : les données restent sur l'appareil, et la personne peut tout effacer.
function privacyFooter(persistent, onErase) {
  const erase = h('button', { type: 'button', class: 'btn btn-ghost btn-small' }, 'Effacer toutes mes données');
  const confirm = h(
    'span',
    { class: 'erase-confirm', hidden: true },
    h('span', { class: 'small', text: 'Tous tes bilans, check-ins et exercices seront supprimés de cet appareil. ' }),
    h('button', { type: 'button', class: 'btn btn-quiet btn-small', onClick: onErase }, 'Oui, tout effacer'),
    h('button', { type: 'button', class: 'btn btn-ghost btn-small', onClick: () => ((confirm.hidden = true), (erase.hidden = false)) }, 'Annuler'),
  );
  erase.addEventListener('click', () => ((erase.hidden = true), (confirm.hidden = false)));
  return h(
    'div',
    { class: 'privacy' },
    h('p', { class: 'small muted', text: persistent ? 'Tes données restent sur cet appareil : rien n’est envoyé sur internet.' : 'Ton navigateur bloque le stockage local : tes réponses disparaîtront à la fermeture de la page.' }),
    erase,
    confirm,
  );
}

export function renderHome(root, { meta, today, history, pending, persistent, onCheckin, onBilan, onResume, onOpenResult, onLibrary, onErase, onPlay }) {
  const gameById = Object.fromEntries(meta.games.map((g) => [g.id, g]));
  const openSuggestion = (s) => (s.type === 'game' && gameById[s.id] ? onPlay(gameById[s.id]) : openExercise(s));
  const shield = today.shield;
  const stage = h('div');
  const bilanDays = history.map((b) => localDay(new Date(b.completedAt)));

  root.append(
    h(
      'div',
      { class: 'dash' },
      h('header', { class: 'dash-head' }, brand()),
      shield.level === 'relais' ? carePanel(shield) : null,
      h('section', { class: 'home-hero', 'aria-label': 'Aujourd’hui' }, greeting(today, onCheckin), h('div', { class: 'hero-scene' }, dunes(), stage)),
      h(
        'div',
        { class: 'hub' },
        today.checkin ? checkinDoneCard(today, openSuggestion) : null,
        bilanCard(today, pending, { onBilan, onResume, onOpenResult }),
        today.checkin ? null : atlasPanel(meta, today, { onLibrary, onPlay }),
      ),
      weekPanel({ week: today.week, today: today.day, bilanDays }),
      today.checkin ? atlasPanel(meta, today, { onLibrary, onPlay }) : null,
      toolboxPanel(meta, today, onPlay),
      shield.level === 'soutien' ? carePanel(shield) : null,
      h('p', { class: 'disclaimer', text: meta.disclaimer }),
      privacyFooter(persistent, onErase),
    ),
  );

  // Sans bilan encore, le Core flotte en attendant ; sinon il prend la forme du dernier bilan.
  const blob = createBlob(
    stage,
    today.lastBilan
      ? { levels: today.lastBilan.spheres, harmony: today.lastBilan.harmony, calm: shield.pauseGamification, eclats: today.eclats }
      : { harmony: 0.75 },
  );
  return () => blob.destroy();
}
