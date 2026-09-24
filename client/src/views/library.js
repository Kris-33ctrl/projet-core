// Boîte à outils : l'Atlas complet, les mini-jeux et tous les exercices, accessibles à tout moment.

import { h } from '../dom.js';
import { openExercise } from '../components/exercise.js';
import { atlasCard, openCardDetail } from '../components/atlas-card.js';
import { emblem } from '../art/emblems.js';

const KIND = { exercice: 'Exercice', outil: 'Outil', article: 'À lire' };

export function exerciseCard(exercise, { practiced = false } = {}) {
  return h(
    'button',
    { type: 'button', class: 'nudge', onClick: () => openExercise(exercise) },
    h(
      'span',
      { class: 'nudge-meta' },
      h('span', { text: KIND[exercise.kind] ?? exercise.kind }),
      h('span', { text: exercise.duration }),
      practiced ? h('span', { class: 'done-chip', text: 'fait cette semaine' }) : null,
    ),
    h('h3', { text: exercise.title }),
    h('span', { class: 'small muted', text: exercise.summary }),
  );
}

export function gameCard(game, { played = false, onPlay }) {
  return h(
    'button',
    { type: 'button', class: 'nudge game-tile', style: { '--c': `var(--${game.sphere})` }, onClick: onPlay },
    h(
      'span',
      { class: 'nudge-meta' },
      emblem(game.sphere),
      h('span', { text: 'Mini-jeu' }),
      h('span', { text: `${Math.max(...game.minutes)} min max` }),
      played ? h('span', { class: 'done-chip', text: 'carte obtenue' }) : null,
    ),
    h('h3', { text: game.title }),
    h('span', { class: 'small muted', text: game.summary }),
  );
}

// L'Atlas : une carte par mini-jeu. Obtenue, elle se lit en grand ; à découvrir, elle reste face cachée.
export function atlasPanel(meta, today, { onPlay, canPlay = () => true }) {
  const unlocked = new Set(today?.atlas ?? []);
  return h(
    'section',
    { class: 'panel glass', 'aria-labelledby': 'atlas-title' },
    h(
      'div',
      { class: 'panel-head' },
      h('h2', { id: 'atlas-title', text: 'Ton Atlas' }),
      h('span', { class: 'small muted', text: `${unlocked.size} carte${unlocked.size > 1 ? 's' : ''} sur ${meta.games.length}` }),
    ),
    h('p', { class: 'small muted', text: 'Chaque mini-jeu dévoile une carte savoir : la notion qu’il fait ressentir, et sa source. Touche une carte obtenue pour la lire.' }),
    h(
      'div',
      { class: 'atlas-grid' },
      meta.games.map((game) => {
        if (unlocked.has(game.id)) {
          return h('div', { class: 'atlas-slot' }, atlasCard(game, { onClick: () => openCardDetail(game, { onPlay: canPlay(game) ? onPlay : null }) }));
        }
        const playable = game.status === 'ready' && canPlay(game);
        return h(
          'div',
          { class: 'atlas-slot' },
          atlasCard(game, playable ? { unlocked: false, onClick: () => onPlay(game) } : { unlocked: false, static: true }),
          h('span', { class: 'small', text: playable ? `À découvrir avec « ${game.title} »` : 'À découvrir plus tard' }),
        );
      }),
    ),
  );
}

export function renderLibrary(root, { meta, today, onBack, onPlay }) {
  const practiced = new Set((today?.practices ?? []).map((p) => p.activityId));
  const byId = Object.fromEntries(meta.exercises.map((e) => [e.id, e]));
  const recommended = (today?.lastBilan?.recommendations ?? []).map((id) => byId[id]).filter(Boolean);
  const card = (e) => exerciseCard(e, { practiced: practiced.has(e.id) });
  const canPlay = (g) => today?.shield?.level !== 'relais' || meta.relayGames.includes(g.id);

  root.append(
    h(
      'div',
      { class: 'dash' },
      h('header', { class: 'dash-head' }, h('button', { type: 'button', class: 'btn btn-ghost', onClick: onBack }, '← Accueil')),
      h(
        'div',
        { class: 'hero-copy page-title' },
        emblem('card'),
        h('span', { class: 'eyebrow', text: `${meta.games.filter((g) => g.status === 'ready').length} mini-jeux · ${meta.exercises.length} exercices` }),
        h('h1', { text: 'L’Atlas et ta boîte à outils' }),
        h('p', { class: 'lead', text: 'Des mini-jeux et des exercices courts, à pratiquer quand tu veux. Chacun explique pourquoi il aide. Ce que tu écris ou joues n’est jamais enregistré : seulement le fait de l’avoir fait.' }),
      ),
      atlasPanel(meta, today, { onPlay, canPlay }),
      h(
        'section',
        { class: 'panel glass', 'aria-labelledby': 'lib-games' },
        h('h2', { id: 'lib-games', text: 'Mini-jeux' }),
        h(
          'div',
          { class: 'library-grid' },
          meta.games
            .filter((g) => g.status === 'ready')
            .filter(canPlay)
            .map((g) => gameCard(g, { played: (today?.atlas ?? []).includes(g.id), onPlay: () => onPlay(g) })),
        ),
      ),
      recommended.length
        ? h('section', { class: 'panel glass', 'aria-labelledby': 'lib-reco' }, h('h2', { id: 'lib-reco', text: 'Pour toi en ce moment' }), h('div', { class: 'library-grid' }, recommended.map(card)))
        : null,
      meta.exerciseCategories.map((category) => {
        const items = meta.exercises.filter((e) => e.category === category.id);
        if (!items.length) return null;
        return h(
          'section',
          { class: 'panel glass', 'aria-labelledby': `lib-${category.id}` },
          h('h2', { id: `lib-${category.id}`, text: category.label }),
          h('div', { class: 'library-grid' }, items.map(card)),
        );
      }),
    ),
  );
}
