// Bilan adaptatif : une carte à la fois, le serveur décide de la suivante.

import { api } from '../api.js';
import { h, sphereColor } from '../dom.js';
import { createBlob } from '../components/blob.js';
import { brand } from '../components/brand.js';
import { emblem } from '../art/emblems.js';
import { landscape } from '../art/landscapes.js';
import { questionCard, screeningIntro, isScreening } from '../components/question.js';

const PREFIX_TO_SPHERE = { sleep: 'machine', body: 'machine', fuel: 'machine', mind: 'pilote', phq: 'pilote', gad: 'pilote', social: 'reseau', env: 'cadre', reg: 'soupapes' };

export function runAssessment(root, { meta, assessment, onDone, onExit }) {
  const spheres = Object.fromEntries(meta.spheres.map((s, i) => [s.id, { ...s, index: i }]));
  const seen = new Map(); // questions déjà affichées, pour pouvoir revenir en arrière
  const trail = []; // ordre des réponses données pendant cette session
  let state = assessment; // { id, answers, next, progress }
  let lastSphere = Object.keys(state.answers).length ? state.next?.sphere : null;
  let screeningIntroShown = Object.keys(state.answers).some((id) => id.startsWith('phq.'));
  let blob = null;

  const top = h('div', { class: 'flow-top' });
  const stage = h('div');
  root.append(h('div', { class: 'flow' }, top, stage));

  function progressBar(currentSphere) {
    const answered = Object.keys(state.answers);
    return h(
      'div',
      { class: 'progress', 'aria-label': `Sphère ${spheres[currentSphere].index + 1} sur ${meta.spheres.length}` },
      meta.spheres.map((s) => {
        const count = answered.filter((id) => PREFIX_TO_SPHERE[id.split('.')[0]] === s.id).length;
        const p = s.index < spheres[currentSphere].index ? 1 : Math.min(0.92, count / s.baseQuestions);
        return h('span', { class: 'progress-step', title: s.label, style: { '--c': sphereColor(s.id), '--p': String(p) } });
      }),
    );
  }

  function renderTop(currentSphere) {
    top.replaceChildren(
      trail.length
        ? h('button', { type: 'button', class: 'btn btn-ghost', onClick: goBack }, '← Retour')
        : brand(),
      progressBar(currentSphere),
      h('button', { type: 'button', class: 'btn btn-ghost', onClick: onExit, title: 'Tes réponses sont gardées, tu pourras reprendre plus tard.' }, 'Reprendre plus tard'),
    );
  }

  function showIntro(question) {
    const sphere = spheres[question.sphere];
    lastSphere = question.sphere;
    renderTop(question.sphere);
    const go = h('button', { type: 'button', class: 'btn btn-primary', onClick: () => showQuestion(question) }, "C'est parti");
    stage.replaceChildren(
      h(
        'section',
        { class: 'intro-card glass', style: { '--c': sphereColor(sphere.id) } },
        landscape(sphere.id),
        h(
          'div',
          { class: 'intro-body' },
          h('span', { class: 'eyebrow', text: `Paysage ${sphere.index + 1} sur ${meta.spheres.length} · ${sphere.subtitle}` }),
          h('h2', {}, emblem(sphere.id), sphere.label),
          h('p', { class: 'lead', text: sphere.intro.text }),
          h('div', { class: 'actions' }, go),
        ),
      ),
    );
    go.focus({ preventScroll: true });
  }

  function showQuestion(question, isRevisit = false) {
    seen.set(question.id, question);
    renderTop(question.sphere);
    const card = questionCard({
      question,
      label: spheres[question.sphere].label,
      initial: state.answers[question.id],
      onSubmit: async (value) => {
        state = { ...state, ...(await api.answer(state.id, question.id, value)) };
        trail.push(question.id);
        advance();
      },
    });
    stage.replaceChildren(card.el);
    card.focus();
    if (isRevisit) window.scrollTo({ top: 0 });
  }

  function goBack() {
    const id = trail.pop();
    if (id && seen.has(id)) showQuestion(seen.get(id), true);
  }

  async function finish() {
    top.replaceChildren();
    const holder = h('div');
    stage.replaceChildren(
      h('section', { class: 'computing' }, holder, h('h2', { text: 'Core assemble ton équilibre…' }), h('p', { class: 'muted', text: 'Tes réponses sont croisées entre les cinq paysages.' })),
    );
    holder.style.width = 'min(260px, 70vw)';
    blob?.destroy();
    blob = createBlob(holder, { harmony: 0.7 });
    try {
      const [result] = await Promise.all([api.complete(state.id), new Promise((r) => setTimeout(r, 1400))]);
      onDone(result);
    } catch (err) {
      stage.replaceChildren(
        h('p', { class: 'error-banner', role: 'alert', text: `Le calcul n'a pas abouti : ${err.message}` }),
        h('button', { type: 'button', class: 'btn btn-primary', onClick: finish }, 'Relancer le calcul'),
      );
    }
  }

  function advance() {
    const next = state.next;
    if (!next) return finish();
    if (next.sphere !== lastSphere) return showIntro(next);
    if (isScreening(next) && !screeningIntroShown) {
      screeningIntroShown = true;
      const intro = screeningIntro(() => showQuestion(next));
      stage.replaceChildren(intro.el);
      return intro.focus();
    }
    showQuestion(next);
  }

  advance();
  return () => blob?.destroy();
}
