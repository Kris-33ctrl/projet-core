// Notif : le coût attentionnel d'une notification (Stothart et al., 2015).
// Deux courts textes : le premier pendant que de fausses notifications s'affichent et vibrent, le second au calme.
// Après chaque texte, une petite question. Aucune note : on compare seulement ce que la personne a ressenti.

import { h } from '../dom.js';
import { audio, vibrate } from './feedback.js';
import { layout, choices, timers } from './kit.js';

const TEXTS = [
  {
    text: 'Les loutres de mer dorment souvent sur le dos, à la surface. Pour ne pas dériver loin les unes des autres au gré des courants, certaines se tiennent par la patte. D’autres s’enroulent dans des algues, qui leur servent d’ancre.',
    question: 'Pourquoi certaines loutres se tiennent-elles par la patte ?',
    options: ['Pour ne pas dériver loin les unes des autres', 'Pour se réchauffer', 'Pour attraper des poissons'],
    answer: 0,
  },
  {
    text: 'Les abeilles indiquent où trouver des fleurs grâce à une danse. L’angle de la danse par rapport à la verticale donne la direction à suivre par rapport au soleil. La durée de la danse renseigne sur la distance à parcourir.',
    question: 'Que renseigne la durée de la danse ?',
    options: ['La couleur des fleurs', 'La distance à parcourir', 'L’heure de la journée'],
    answer: 1,
  },
];

const NOTIFICATIONS = [
  'Léa : t’as vu ça ??',
  '−20 % sur ta prochaine commande',
  '3 nouvelles mentions « J’aime »',
  'Rappel : réunion à 14 h',
  'Nouveau message dans « Groupe TD »',
  'Ton colis arrive demain',
  'Maman : tu m’appelles ?',
  'Quelqu’un a commenté ta photo',
];

export function createNotif({ stage, onEnd }) {
  const { cue, scene, controls } = layout(stage, { sceneClass: 'notif-scene' });
  const t = timers();
  const rounds = [];
  let destroyed = false;

  function banner(text) {
    const el = h('div', { class: 'notif-banner', role: 'presentation' }, h('strong', { text: 'Notification' }), h('span', { text }));
    scene.append(el);
    vibrate(30);
    audio.blip('pop');
    t.later(() => el.classList.add('leaving'), 2000);
    t.later(() => el.remove(), 2400);
  }

  function round(index, noisy) {
    const item = TEXTS[index];
    const started = performance.now();
    cue.textContent = noisy ? 'Lis ce texte à ton rythme. Ton téléphone, lui, s’agite.' : 'Même exercice, au calme cette fois.';
    const done = h('button', { type: 'button', class: 'btn btn-primary' }, 'J’ai fini de lire');
    scene.replaceChildren(h('article', { class: 'notif-text' }, h('p', { text: item.text })));
    controls.replaceChildren(h('span', { class: 'small muted', text: `Texte ${index + 1} sur 2` }), done);
    if (noisy) {
      let n = 0;
      t.later(() => banner(NOTIFICATIONS[n++ % NOTIFICATIONS.length]), 900);
      t.every(() => banner(NOTIFICATIONS[n++ % NOTIFICATIONS.length]), 2600);
    }
    done.focus();
    done.addEventListener('click', () => {
      t.clear();
      const readMs = performance.now() - started;
      cue.textContent = item.question;
      scene.replaceChildren(
        choices(item.options, (_, i, button) => {
          button.setAttribute('aria-pressed', 'true');
          rounds.push({ noisy, readMs, correct: i === item.answer });
          scene.querySelectorAll('button').forEach((b) => (b.disabled = true));
          scene.append(h('p', { class: 'small muted', text: `La réponse : ${item.options[item.answer]}.` }));
          t.later(() => (index === 0 ? round(1, false) : finish()), 1600);
        }),
      );
      controls.replaceChildren();
    });
  }

  function finish() {
    if (destroyed) return;
    const [noisy, calm] = rounds;
    const faster = calm.readMs < noisy.readMs * 0.9;
    const recalled = calm.correct && !noisy.correct;
    const message = faster || recalled
      ? `Au calme, ${[faster ? 'ta lecture a été plus rapide' : null, recalled ? 'la réponse est venue plus facilement' : null].filter(Boolean).join(' et ')}.`
      : 'Pas de grande différence cette fois. Les notifications coûtent souvent de l’attention sans qu’on s’en rende compte.';
    onEnd({ message });
  }

  round(0, true);

  return {
    destroy() {
      destroyed = true;
      t.clear();
    },
  };
}
