// Check-in quotidien : quelques cartes, envoyées d'un coup à la fin.

import { api } from '../api.js';
import { h, sphereColor, localDay } from '../dom.js';
import { questionCard, screeningIntro, isScreening } from '../components/question.js';
import { brand } from '../components/brand.js';

export function runCheckin(root, { meta, userId, plan, onDone, onExit }) {
  const labels = Object.fromEntries(meta.spheres.map((s) => [s.id, s.label]));
  const answers = {};
  let index = 0;
  let introShown = false;

  const top = h('div', { class: 'flow-top' });
  const stage = h('div');
  root.append(h('div', { class: 'flow' }, top, stage));

  function renderTop() {
    top.replaceChildren(
      index > 0
        ? h('button', { type: 'button', class: 'btn btn-ghost', onClick: () => ((index -= 1), show()) }, '← Retour')
        : brand(),
      h(
        'div',
        { class: 'progress', 'aria-label': `Carte ${index + 1} sur ${plan.length}` },
        plan.map((q, i) =>
          h('span', { class: 'progress-step', style: { '--c': sphereColor(q.sphere), '--p': i < index ? '1' : i === index ? '0.5' : '0' } }),
        ),
      ),
      h('button', { type: 'button', class: 'btn btn-ghost', onClick: onExit }, 'Plus tard'),
    );
  }

  function show() {
    const question = plan[index];
    renderTop();
    if (isScreening(question) && !introShown) {
      introShown = true;
      const intro = screeningIntro(show);
      stage.replaceChildren(intro.el);
      return intro.focus();
    }
    const card = questionCard({
      question,
      label: question.type === 'frequency' ? labels[question.sphere] : `Check-in · ${labels[question.sphere]}`,
      initial: answers[question.id],
      onSubmit: async (value) => {
        answers[question.id] = value;
        if (index < plan.length - 1) {
          index += 1;
          return show();
        }
        // Une erreur ici s'affiche sur la carte, les réponses restent en mémoire pour réessayer.
        onDone(await api.checkin(userId, localDay(), answers));
      },
    });
    stage.replaceChildren(card.el);
    card.focus();
  }

  show();
}
