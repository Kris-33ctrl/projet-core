// Le tribunal des pensées : restructuration cognitive (TCC, Hofmann et al., 2012).
// Une pensée automatique, des pièces à ranger « pour » ou « contre » sur une balance, puis un verdict plus juste.
// Aucun mauvais choix : un verdict trop sombre ou trop rose reçoit un retour doux et on peut rechoisir.

import { h } from '../dom.js';
import { audio } from './feedback.js';
import { layout, choices, shuffle, timers } from './kit.js';

const THOUGHTS = [
  {
    text: 'Je vais tout rater.',
    pieces: [
      'J’ai eu du mal sur le dernier devoir.',
      'Je me sens mal préparé·e aujourd’hui.',
      'J’ai déjà réussi des choses qui me faisaient peur.',
      'J’ai préparé une partie, même si ce n’est pas tout.',
      'Rater une étape ne veut pas dire tout rater.',
      'Je ne sais pas encore comment ça va se passer.',
    ],
    verdicts: [
      { text: 'Je vais tout rater, c’est certain.', kind: 'sombre' },
      { text: 'Tout va parfaitement bien se passer.', kind: 'rose' },
      { text: 'C’est difficile et je ne suis pas prêt·e sur tout, mais j’ai déjà traversé des épreuves comme celle-ci.', kind: 'juste' },
    ],
  },
  {
    text: 'Personne ne m’apprécie vraiment.',
    pieces: [
      'Personne ne m’a écrit ce week-end.',
      'Je me suis senti·e à l’écart hier soir.',
      'Un·e ami·e m’a demandé de mes nouvelles la semaine dernière.',
      'On m’a proposé une sortie récemment.',
      'Les autres sont souvent pris par leurs propres soucis.',
      'Un silence n’est pas forcément un rejet.',
    ],
    verdicts: [
      { text: 'Personne ne m’apprécie, c’est comme ça.', kind: 'sombre' },
      { text: 'Tout le monde m’adore.', kind: 'rose' },
      { text: 'Je me suis senti·e seul·e ce week-end, et des personnes tiennent à moi, même si elles ne l’ont pas montré cette fois.', kind: 'juste' },
    ],
  },
  {
    text: 'Je n’y arriverai jamais.',
    pieces: [
      'Ça fait longtemps que j’essaie.',
      'Je compare souvent mes débuts aux réussites des autres.',
      'J’ai progressé depuis le début, même lentement.',
      'Je n’ai pas encore essayé toutes les façons de m’y prendre.',
      'Des personnes ont réussi après plusieurs échecs.',
      '« Jamais » est un mot très définitif pour une situation qui bouge.',
    ],
    verdicts: [
      { text: 'Je n’y arriverai jamais, inutile d’essayer.', kind: 'sombre' },
      { text: 'Je vais y arriver sans effort.', kind: 'rose' },
      { text: 'Pour l’instant, c’est dur et lent, et j’ai déjà progressé : je peux essayer autrement.', kind: 'juste' },
    ],
  },
];

const FEEDBACK = {
  sombre: 'La pensée de départ est toujours là. Relis les pièces « contre » : que disent-elles ?',
  rose: 'Tentant ! Mais une version plus juste n’a pas besoin d’être positive : elle tient compte de toutes les pièces.',
  juste: 'Verdict rendu : une version plus juste, qui tient compte de tous les faits.',
};

export function createTribunal({ stage, onEnd }) {
  const { cue, scene, controls } = layout(stage, { sceneClass: 'tribunal-scene' });
  const t = timers();
  let tally = { pour: 0, contre: 0 };

  const beam = h('div', { class: 'scale-beam' }, h('span', { class: 'scale-pan pour', text: 'Pour' }), h('span', { class: 'scale-pan contre', text: 'Contre' }));
  const scale = h('div', { class: 'scale', 'aria-hidden': 'true' }, beam, h('div', { class: 'scale-post' }));
  const tilt = () => beam.style.setProperty('--tilt', `${Math.max(-14, Math.min(14, (tally.contre - tally.pour) * 4))}deg`);

  function pickThought() {
    cue.textContent = 'Quelle pensée veux-tu mettre à l’épreuve ?';
    scene.replaceChildren(
      choices(
        THOUGHTS.map((th) => ({ label: `« ${th.text} »`, thought: th })),
        (option) => examine(option.thought),
      ),
    );
    controls.replaceChildren(h('span', { class: 'small muted', text: 'Tu pourras rejouer avec une autre pensée.' }));
  }

  function examine(thought) {
    tally = { pour: 0, contre: 0 };
    tilt();
    const pieces = shuffle(thought.pieces);
    let i = 0;
    const pieceBox = h('p', { class: 'tribunal-piece', 'aria-live': 'polite' });
    const counter = h('span', { class: 'small muted' });
    const pour = h('button', { type: 'button', class: 'btn btn-quiet' }, 'Pour');
    const contre = h('button', { type: 'button', class: 'btn btn-quiet' }, 'Contre');

    function show() {
      pieceBox.textContent = pieces[i];
      counter.textContent = `Pièce ${i + 1} sur ${pieces.length}`;
    }
    function place(side) {
      tally[side] += 1;
      tilt();
      audio.blip('pop');
      i += 1;
      if (i < pieces.length) show();
      else t.later(() => verdict(thought), 500);
    }
    pour.addEventListener('click', () => place('pour'));
    contre.addEventListener('click', () => place('contre'));

    cue.textContent = `« ${thought.text} » : cette pièce plaide pour ou contre ?`;
    scene.replaceChildren(scale, pieceBox);
    controls.replaceChildren(counter, h('span', { class: 'actions' }, pour, contre));
    show();
    pour.focus();
  }

  function verdict(thought) {
    cue.textContent = 'Le verdict : quelle version est la plus juste ?';
    const note = h('p', { class: 'tribunal-note', 'aria-live': 'polite' });
    const own = h('input', { type: 'text', id: 'tribunal-own', placeholder: 'Ou écris ta propre version…' });
    const ownBtn = h('button', { type: 'button', class: 'btn btn-quiet btn-small' }, 'Rendre ce verdict');
    ownBtn.addEventListener('click', () => {
      if (own.value.trim()) done(own.value.trim());
    });
    scene.replaceChildren(
      scale,
      choices(
        shuffle(thought.verdicts).map((v) => ({ label: v.text, verdict: v })),
        (option) => {
          note.textContent = FEEDBACK[option.verdict.kind];
          if (option.verdict.kind === 'juste') t.later(() => done(option.verdict.text), 1800);
        },
      ),
      note,
      h('div', { class: 'ex-add' }, own, ownBtn),
    );
    controls.replaceChildren(h('span', { class: 'small muted', text: `Pièces pour : ${tally.pour} · pièces contre : ${tally.contre}` }));
  }

  let finished = false;
  function done(text) {
    if (finished) return;
    finished = true;
    onEnd({ message: 'Verdict rendu.', details: [`Ta version plus juste : « ${text} »`] });
  }

  pickThought();
  return { destroy: () => t.clear() };
}
