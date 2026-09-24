// Cartes de l'Atlas : un objet à collectionner par mini-jeu.
// Obtenue, la carte montre son illustration et se lit en grand ; à découvrir, elle reste face cachée.

import { h } from '../dom.js';
import { shortCite, doiUrl } from '@core/engine';
import { emblem } from '../art/emblems.js';
import { atlasArt, atlasBack, ROMAN } from '../art/atlas.js';
import { openModal, closeModal } from './modal.js';

const numeral = (game) => ROMAN[(game.number ?? 1) - 1] ?? String(game.number);

/**
 * @param {object} game  jeu public (meta.games), avec `number` et `card`
 * @param {{ unlocked?: boolean, onClick?: () => void, static?: boolean }} options
 *   `static` : un simple visuel (pas un bouton), pour la lecture en grand ou la révélation.
 */
export function atlasCard(game, { unlocked = true, onClick, static: isStatic = false } = {}) {
  const n = numeral(game);
  const tag = isStatic ? 'div' : 'button';
  const props = {
    type: isStatic ? null : 'button',
    class: `acard${unlocked ? '' : ' facedown'}`,
    style: { '--c': `var(--${game.sphere})` },
    onClick: isStatic ? null : onClick,
    'aria-label': isStatic ? null : unlocked ? `Carte ${n}, ${game.card.title} : la lire` : `Carte ${n}, à découvrir en jouant à ${game.title}`,
    'aria-hidden': isStatic ? 'true' : null,
  };
  if (!unlocked) {
    return h(tag, props, h('span', { class: 'acard-frame' }, h('span', { class: 'acard-num', text: n }), h('span', { class: 'acard-window' }, atlasBack())));
  }
  return h(
    tag,
    props,
    h(
      'span',
      { class: 'acard-frame' },
      h('span', { class: 'acard-top' }, h('span', { text: n }), emblem(game.sphere)),
      h('span', { class: 'acard-window' }, atlasArt(game.id)),
      h('span', { class: 'acard-title', text: game.card.title }),
      h('span', { class: 'acard-sub', text: game.title }),
    ),
  );
}

// Ce que la carte raconte : la notion, le fait qui l'appuie, ce qu'on peut en faire, et la source.
export function knowledge(game) {
  const card = game.card;
  return h(
    'div',
    { class: 'knowledge', style: { '--c': `var(--${game.sphere})` } },
    h('span', { class: 'eyebrow', text: `Atlas · carte ${numeral(game)} · ${game.title}` }),
    h('h3', { text: card.title }),
    card.notion ? h('p', { class: 'kc-notion', text: card.notion }) : null,
    card.fact ? h('p', { class: 'muted', text: card.fact }) : null,
    card.takeaway ? h('p', { class: 'kc-takeaway', text: card.takeaway }) : null,
    card.sources?.length
      ? h(
          'p',
          { class: 'small muted' },
          'Source : ',
          card.sources.map((s, i) => [i ? ' · ' : '', h('a', { href: doiUrl(s.doi), target: '_blank', rel: 'noopener', text: shortCite(s) })]),
        )
      : null,
  );
}

// Lire une carte obtenue en grand, avec de quoi rejouer.
export function openCardDetail(game, { onPlay } = {}) {
  openModal(
    [
      h(
        'div',
        { class: 'card-detail' },
        atlasCard(game, { static: true }),
        h(
          'div',
          { class: 'card-detail-text' },
          knowledge(game),
          onPlay
            ? h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn btn-quiet btn-small', onClick: () => (closeModal(), onPlay(game)) }, `Rejouer à ${game.title}`))
            : null,
        ),
      ),
    ],
    null,
    { wide: true },
  );
}

// Fin de partie : la carte apparaît face cachée puis se retourne quand elle est nouvelle.
export function revealCard(game, { isNew = true } = {}) {
  const front = atlasCard(game, { static: true });
  const wrap = h(
    'div',
    { class: `acard-flip${isNew ? '' : ' shown'}` },
    h('div', { class: 'acard-flip-inner' }, front, atlasCard(game, { unlocked: false, static: true })),
  );
  if (isNew) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => wrap.classList.add('shown'), reduced ? 0 : 500);
    setTimeout(() => front.classList.add('shine'), reduced ? 0 : 1400);
  }
  return wrap;
}

// La collection en miniature, pour l'accueil. Une carte cachée lance son jeu quand il est jouable (`canPlay`).
export function atlasStrip(games, unlocked, { onOpen, onPlay, canPlay = () => true }) {
  return h(
    'div',
    { class: 'atlas-strip' },
    games.map((game) =>
      unlocked.has(game.id)
        ? atlasCard(game, { onClick: () => onOpen(game) })
        : atlasCard(game, game.status === 'ready' && canPlay(game) ? { unlocked: false, onClick: () => onPlay(game) } : { unlocked: false, static: true }),
    ),
  );
}
