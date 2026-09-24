// Coque commune des mini-jeux : plein écran, consigne et durée, partie, puis carte savoir dévoilée.
// Aucun score n'est affiché : la fin d'une partie débloque une carte (Atlas) et un éclat pour le Core.

import { h } from '../dom.js';
import { shortCite, doiUrl, MAX_GAME_SECONDS } from '@core/engine';
import { settings, canVibrate, audio } from './feedback.js';
import { createVague } from './vague.js';
import { createOnglets } from './onglets.js';
import { createSurf } from './surf.js';
import { createNotif } from './notif.js';
import { createTribunal } from './tribunal.js';
import { createSens } from './sens.js';
import { createFilet } from './filet.js';
import { createBatterie } from './batterie.js';
import { createEnveloppes } from './enveloppes.js';
import { createMiroir } from './miroir.js';

const GAMES = {
  vague: createVague,
  onglets: createOnglets,
  surf: createSurf,
  notif: createNotif,
  tribunal: createTribunal,
  sens: createSens,
  filet: createFilet,
  batterie: createBatterie,
  enveloppes: createEnveloppes,
  miroir: createMiroir,
};

let onPlayed = async () => null;
export function configureGames({ onPlayed: fn }) {
  onPlayed = fn;
}

export function knowledgeCard(game, { unlocked = true } = {}) {
  const card = game.card;
  return h(
    'article',
    { class: `knowledge-card${unlocked ? '' : ' locked'}`, style: { '--c': `var(--${game.sphere})` } },
    h('span', { class: 'eyebrow', text: unlocked ? `Carte savoir · ${game.title}` : `À découvrir · ${game.title}` }),
    h('h3', { text: card.title }),
    unlocked && card.notion ? h('p', { class: 'kc-notion', text: card.notion }) : null,
    unlocked && card.fact ? h('p', { class: 'muted', text: card.fact }) : null,
    unlocked && card.takeaway ? h('p', { class: 'kc-takeaway', text: card.takeaway }) : null,
    unlocked && card.sources?.length
      ? h(
          'p',
          { class: 'small muted' },
          'Source : ',
          card.sources.map((s, i) => [i ? ' · ' : '', h('a', { href: doiUrl(s.doi), target: '_blank', rel: 'noopener', text: shortCite(s) })]),
        )
      : null,
  );
}

function toggle(label, get, set) {
  const btn = h('button', { type: 'button', class: 'chip', 'aria-pressed': String(get()) });
  const render = () => {
    btn.textContent = `${label} : ${get() ? 'oui' : 'non'}`;
    btn.setAttribute('aria-pressed', String(get()));
  };
  btn.addEventListener('click', () => {
    set(!get());
    render();
  });
  render();
  return btn;
}

/**
 * @param {object} game  jeu public (meta.games)
 * @param {{ onClose?: () => void, onAtlas?: () => void }} options
 */
export function openGame(game, { onClose, onAtlas } = {}) {
  const previousFocus = document.activeElement;
  let running = null;
  let minutes = game.minutes[Math.floor(game.minutes.length / 2)] ?? game.minutes[0];
  const startedAt = Date.now();

  const stage = h('div', { class: 'game-stage' });
  const close = h('button', { type: 'button', class: 'btn btn-ghost btn-small' }, 'Fermer');
  const header = h(
    'header',
    { class: 'game-head' },
    h('div', {}, h('span', { class: 'eyebrow', text: 'Mini-jeu' }), h('h2', { text: game.title })),
    h(
      'div',
      { class: 'game-tools' },
      toggle('Son', () => settings.sound, (v) => (settings.sound = v)),
      canVibrate() ? toggle('Vibrations', () => settings.vibration, (v) => (settings.vibration = v)) : null,
      close,
    ),
  );
  const root = h('div', { class: 'game', role: 'dialog', 'aria-modal': 'true', 'aria-label': `Mini-jeu : ${game.title}` }, header, stage);

  function teardown() {
    running?.destroy();
    running = null;
    audio.stopAll();
  }

  function exit() {
    teardown();
    root.remove();
    document.removeEventListener('keydown', onKey);
    previousFocus?.focus?.();
    onClose?.();
  }

  function onKey(e) {
    if (e.key === 'Escape') exit();
  }

  close.addEventListener('click', exit);
  document.addEventListener('keydown', onKey);

  function intro() {
    const durations =
      game.minutes.length > 1
        ? h(
            'div',
            { class: 'segmented', role: 'radiogroup', 'aria-label': 'Durée' },
            game.minutes.map((m) => {
              const b = h('button', { type: 'button', role: 'radio', class: 'segment', 'aria-checked': String(m === minutes) }, `${m} min`);
              b.addEventListener('click', () => {
                minutes = m;
                durations.querySelectorAll('.segment').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
              });
              return b;
            }),
          )
        : h('span', { class: 'small muted', text: `${game.minutes[0]} minutes environ` });
    const play = h('button', { type: 'button', class: 'btn btn-primary' }, 'Jouer');
    play.addEventListener('click', start);
    stage.replaceChildren(
      h(
        'div',
        { class: 'game-intro' },
        h('p', { class: 'lead', text: game.summary }),
        h('p', { class: 'muted', text: game.howTo }),
        durations,
        h('div', { class: 'actions' }, play),
      ),
    );
    play.focus();
  }

  function start() {
    stage.replaceChildren();
    const seconds = Math.min(minutes * 60, MAX_GAME_SECONDS);
    running = GAMES[game.id]({ stage, seconds, onEnd: finish });
  }

  async function finish(outcome = {}) {
    teardown();
    audio.blip('chime');
    const progression = await onPlayed(game.id, Math.round((Date.now() - startedAt) / 1000)).catch(() => null);
    const quiet = progression?.quiet;
    const atlasCount = progression?.atlas?.length;
    const cardLine = progression?.newCard ? `Nouvelle carte dans ton Atlas (${atlasCount} sur 10)` : 'Cette carte est déjà dans ton Atlas';
    stage.replaceChildren(
      h(
        'div',
        { class: 'game-end' },
        h('p', { class: 'lead', text: outcome.message ?? 'C’est fait.' }),
        outcome.details?.length ? h('ul', { class: 'game-details' }, outcome.details.map((d) => h('li', { text: d }))) : null,
        knowledgeCard(game),
        quiet
          ? null
          : h('p', { class: 'small muted', text: `${cardLine} · un éclat de plus pour ton Core.` }),
        h(
          'div',
          { class: 'actions' },
          onAtlas ? h('button', { type: 'button', class: 'btn btn-quiet', onClick: () => (exit(), onAtlas()) }, 'Voir mon Atlas') : null,
          h('button', { type: 'button', class: 'btn btn-primary', onClick: exit }, 'Fermer'),
        ),
      ),
    );
  }

  document.body.append(root);
  intro();
}
