// Lecteur d'exercices : présentation (pourquoi, quand), puis pratique étape par étape dans la modale.
// Ce qui est écrit pendant un exercice reste à l'écran et disparaît à la fermeture : rien n'est enregistré.
// Seul le fait d'avoir terminé l'exercice est noté (pour « ta semaine »).

import { h } from '../dom.js';
import { shortCite, doiUrl } from '@core/engine';
import { openModal, closeModal } from './modal.js';
import { emblem } from '../art/emblems.js';

const KIND = { exercice: 'Exercice', outil: 'Outil', article: 'À lire' };
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let onPractice = () => {};
export function configureExercises({ onPractice: fn }) {
  onPractice = fn;
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.round(s)) % 60).padStart(2, '0')}`;

// Chaque renderer reçoit le contexte de l'étape et renvoie { el, ready?: () => bool, cleanup?: () => void }.
const RENDERERS = {
  read(step) {
    return { el: h('div', { class: 'ex-read' }, step.paragraphs.map((p) => h('p', { text: p }))) };
  },

  breath(step, ctx) {
    let minutes = step.defaultMinutes;
    let elapsed = 0;
    let interval = null;
    const cycle = step.inhale + step.exhale;
    const orb = h('div', { class: 'breath-orb', 'aria-hidden': 'true' });
    const label = h('p', { class: 'breath-label', 'aria-live': 'polite', text: 'Choisis une durée, puis lance la respiration.' });
    const timer = h('div', { class: 'timer', 'aria-hidden': 'true' }, h('span'));
    const clock = h('span', { class: 'ex-clock', text: mmss(minutes * 60) });
    const toggle = h('button', { type: 'button', class: 'btn btn-primary' }, 'Commencer');
    const durations = h(
      'div',
      { class: 'segmented', role: 'radiogroup', 'aria-label': 'Durée' },
      step.minutes.map((m) =>
        h('button', { type: 'button', role: 'radio', 'aria-checked': String(m === minutes), class: 'segment', onClick: (e) => pick(m, e.currentTarget) }, `${m} min`),
      ),
    );

    function pick(m, btn) {
      if (interval) return;
      minutes = m;
      elapsed = 0;
      durations.querySelectorAll('.segment').forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
      clock.textContent = mmss(minutes * 60);
      timer.style.setProperty('--p', '0');
    }

    function tick() {
      const total = minutes * 60;
      const inCycle = elapsed % cycle;
      const inhaling = inCycle < step.inhale;
      orb.classList.toggle('inhale', inhaling);
      const remaining = inhaling ? step.inhale - inCycle : cycle - inCycle;
      label.textContent = `${inhaling ? 'Inspire' : 'Expire'}… ${reducedMotion() ? remaining : ''}`.trim();
      clock.textContent = mmss(total - elapsed);
      timer.style.setProperty('--p', String(elapsed / total));
      if (elapsed >= total) {
        stop();
        label.textContent = 'Terminé. Remarque comment tu te sens maintenant.';
        toggle.hidden = true;
        ctx.done();
        return;
      }
      elapsed += 1;
    }
    function start() {
      toggle.textContent = 'Pause';
      durations.hidden = true;
      tick();
      interval = setInterval(tick, 1000);
    }
    function stop() {
      clearInterval(interval);
      interval = null;
      toggle.textContent = 'Reprendre';
    }
    toggle.addEventListener('click', () => (interval ? stop() : start()));

    return {
      el: h('div', { class: 'breath' }, durations, orb, label, clock, timer, h('div', { class: 'actions' }, toggle)),
      ready: () => elapsed > 0,
      cleanup: () => clearInterval(interval),
    };
  },

  senses(step, ctx) {
    let index = 0;
    let count = 0;
    const title = h('h3', { class: 'ex-senses-title', 'aria-live': 'polite' });
    const dots = h('div', { class: 'ex-dots', 'aria-hidden': 'true' });
    const button = h('button', { type: 'button', class: 'btn btn-primary' }, 'J’en ai une');
    const box = h('div', { class: 'ex-senses' }, title, dots, button);

    function render() {
      const item = step.items[index];
      title.textContent = `Nomme ${item.count} ${item.label}`;
      dots.replaceChildren(...Array.from({ length: item.count }, (_, i) => h('span', { class: i < count ? 'on' : '' })));
    }
    button.addEventListener('click', () => {
      count += 1;
      if (count < step.items[index].count) return render();
      index += 1;
      count = 0;
      if (index < step.items.length) return render();
      title.textContent = 'Tu es revenu·e dans le présent.';
      dots.replaceChildren();
      button.hidden = true;
      ctx.done();
    });
    render();
    return { el: box, ready: () => index >= step.items.length };
  },

  timer(step, ctx) {
    let left = step.seconds;
    let interval = null;
    const clock = h('span', { class: 'ex-clock', text: mmss(left) });
    const bar = h('div', { class: 'timer', 'aria-hidden': 'true' }, h('span'));
    const toggle = h('button', { type: 'button', class: 'btn btn-quiet' }, 'Lancer le minuteur');
    const visual = step.visual === 'wave' ? h('div', { class: 'ex-wave', 'aria-hidden': 'true' }, h('span')) : null;

    function tick() {
      left -= 1;
      clock.textContent = mmss(left);
      bar.style.setProperty('--p', String(1 - left / step.seconds));
      if (left <= 0) {
        clearInterval(interval);
        interval = null;
        toggle.hidden = true;
        visual?.classList.remove('running');
        ctx.done();
      }
    }
    toggle.addEventListener('click', () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
        toggle.textContent = 'Reprendre';
        visual?.classList.remove('running');
        return;
      }
      interval = setInterval(tick, 1000);
      toggle.textContent = 'Pause';
      visual?.classList.add('running');
    });

    return {
      el: h('div', { class: 'ex-timer' }, h('span', { class: 'eyebrow', text: step.label }), h('p', { class: 'ex-cue', text: step.cue }), visual, clock, bar, h('div', { class: 'actions' }, toggle)),
      // On peut toujours passer à la suite : le minuteur accompagne, il n'oblige pas.
      ready: () => true,
      cleanup: () => clearInterval(interval),
    };
  },

  text(step, ctx) {
    const field = step.multiline
      ? h('textarea', { id: `ex-${step.id}`, rows: '3', placeholder: step.placeholder ?? '' })
      : h('input', { id: `ex-${step.id}`, type: 'text', placeholder: step.placeholder ?? '' });
    field.value = ctx.values[step.id] ?? '';
    field.addEventListener('input', () => {
      ctx.values[step.id] = field.value.trim();
      ctx.refresh();
    });
    setTimeout(() => field.focus(), 0);
    return {
      el: h('label', { class: 'ex-field', for: `ex-${step.id}` }, h('span', { text: step.prompt }), field, step.optional ? h('span', { class: 'small muted', text: 'Facultatif' }) : null),
      ready: () => step.optional || Boolean(ctx.values[step.id]),
    };
  },

  list(step, ctx) {
    const items = (ctx.values[step.id] ??= []);
    const input = h('input', { id: `ex-${step.id}`, type: 'text', placeholder: step.placeholder ?? '' });
    const add = h('button', { type: 'button', class: 'btn btn-quiet' }, 'Ajouter');
    const list = h('ul', { class: 'ex-list' });
    let left = (step.minutes ?? 0) * 60;
    const clock = step.minutes ? h('span', { class: 'small muted', text: `${step.minutes} minutes pour tout sortir de ta tête` }) : null;
    const interval = step.minutes
      ? setInterval(() => {
          left -= 1;
          clock.textContent = left > 0 ? `Encore ${mmss(left)}` : 'Le temps est écoulé : tu peux continuer ou passer à la suite.';
          if (left <= 0) clearInterval(interval);
        }, 1000)
      : null;

    function render() {
      list.replaceChildren(
        ...items.map((text, i) =>
          h('li', {}, h('span', { text }), h('button', { type: 'button', class: 'del', 'aria-label': `Retirer « ${text} »`, onClick: () => (items.splice(i, 1), render(), ctx.refresh()) }, '×')),
        ),
      );
    }
    function push() {
      const text = input.value.trim();
      if (!text) return;
      items.push(text);
      input.value = '';
      input.focus();
      render();
      ctx.refresh();
    }
    add.addEventListener('click', push);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        push();
      }
    });
    render();
    setTimeout(() => input.focus(), 0);
    return {
      el: h('div', { class: 'ex-field' }, h('label', { for: `ex-${step.id}`, text: step.prompt }), clock, h('div', { class: 'ex-add' }, input, add), list),
      ready: () => items.length > 0,
      cleanup: () => clearInterval(interval),
    };
  },

  pick(step, ctx) {
    const source = ctx.values[step.from] ?? [];
    const target = Math.min(step.count, source.length);
    const chosen = new Set(ctx.values[step.id] ?? []);
    const buttons = source.map((text) => {
      const btn = h('button', { type: 'button', class: 'card-option', 'aria-pressed': String(chosen.has(text)) }, h('span', { class: 'check', 'aria-hidden': 'true' }), h('span', { text }));
      btn.addEventListener('click', () => {
        if (chosen.has(text)) chosen.delete(text);
        else if (chosen.size < target) chosen.add(text);
        buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(chosen.has(source[i]))));
        ctx.values[step.id] = [...chosen];
        ctx.refresh();
      });
      return btn;
    });
    return {
      el: h('div', { class: 'ex-field' }, h('span', { text: step.prompt }), h('div', { class: 'card-grid', role: 'group' }, buttons)),
      ready: () => chosen.size === target,
    };
  },

  choice(step, ctx) {
    const buttons = step.options.map((option) =>
      h('button', { type: 'button', class: 'card-option', role: 'radio', 'aria-checked': String(ctx.values[step.id] === option) }, h('span', { class: 'check', 'aria-hidden': 'true' }), h('span', { text: option })),
    );
    buttons.forEach((btn, i) =>
      btn.addEventListener('click', () => {
        ctx.values[step.id] = step.options[i];
        buttons.forEach((b, j) => b.setAttribute('aria-checked', String(i === j)));
        ctx.refresh();
      }),
    );
    return {
      el: h('div', { class: 'ex-field' }, h('span', { text: step.prompt }), h('div', { class: 'card-grid frequency', role: 'radiogroup', 'aria-label': step.prompt }, buttons)),
      ready: () => Boolean(ctx.values[step.id]),
    };
  },

  check(step) {
    const buttons = step.items.map((item) => {
      const btn = h('button', { type: 'button', class: 'card-option', 'aria-pressed': 'false' }, h('span', { class: 'check', 'aria-hidden': 'true' }), h('span', { text: item }));
      btn.addEventListener('click', () => btn.setAttribute('aria-pressed', String(btn.getAttribute('aria-pressed') !== 'true')));
      return btn;
    });
    return { el: h('div', { class: 'ex-field' }, h('span', { text: step.prompt }), h('div', { class: 'card-grid frequency' }, buttons)) };
  },

  summary(step, ctx) {
    const value = (id) => {
      const v = ctx.values[id];
      return Array.isArray(v) ? v : v ? [v] : [];
    };
    const rows = step.items.map((item) =>
      h('div', { class: 'ex-summary-row' }, h('span', { class: 'eyebrow', text: item.label }), ...value(item.id).map((v) => h('p', { class: 'ex-summary-value', text: v }))),
    );
    let copy = null;
    if (step.copy && value(step.copy).length) {
      const text = value(step.copy).join('\n');
      copy = h('button', { type: 'button', class: 'btn btn-quiet' }, 'Copier le message');
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(text);
          copy.textContent = 'Copié';
        } catch {
          copy.textContent = 'Sélectionne le texte pour le copier';
        }
      });
    }
    return {
      el: h(
        'div',
        { class: 'ex-summary' },
        rows,
        step.note ? h('p', { class: 'muted', text: step.note }) : null,
        copy,
        h('p', { class: 'small muted', text: 'Rien de ce que tu as écrit n’est enregistré : ça disparaît quand tu fermes.' }),
      ),
    };
  },
};

export function openExercise(exercise) {
  const values = {};
  const startedAt = Date.now();
  let index = -1;
  let current = null;
  const body = h('div', { class: 'ex-body' });
  const footer = h('div', { class: 'actions ex-actions' });

  function cleanup() {
    current?.cleanup?.();
    current = null;
  }

  function intro() {
    body.replaceChildren(
      h('p', { class: 'eyebrow', text: `${KIND[exercise.kind] ?? exercise.kind} · ${exercise.duration}` }),
      h('h2', { text: exercise.title }),
      h('p', { class: 'lead', text: exercise.summary }),
      h('div', { class: 'ex-why' }, h('h3', {}, emblem('core'), 'Pourquoi ça aide'), h('p', { class: 'muted', text: exercise.why })),
      h('div', { class: 'ex-why' }, h('h3', {}, emblem('machine'), 'Quand l’utiliser'), h('p', { class: 'muted', text: exercise.when })),
      exercise.sources?.length
        ? h(
            'p',
            { class: 'small muted ex-sources' },
            'Sources : ',
            exercise.sources.map((s, i) => [
              i ? ' · ' : '',
              h('a', { href: doiUrl(s.doi), target: '_blank', rel: 'noopener', title: s.title, text: shortCite(s) }),
            ]),
          )
        : exercise.sourceNote
          ? h('p', { class: 'small muted ex-sources', text: exercise.sourceNote })
          : null,
    );
    footer.replaceChildren(h('button', { type: 'button', class: 'btn btn-primary', onClick: () => go(0) }, exercise.kind === 'article' ? 'Lire' : 'Commencer'));
  }

  function finish() {
    cleanup();
    index = exercise.steps.length;
    onPractice(exercise.id, Math.round((Date.now() - startedAt) / 1000));
    body.replaceChildren(
      h('p', { class: 'eyebrow', text: exercise.title }),
      h('h2', { text: 'C’est fait.' }),
      h('p', { class: 'muted', text: 'Prendre ce temps pour toi compte, quel que soit le résultat. Tu retrouveras cet exercice dans ta boîte à outils.' }),
    );
    footer.replaceChildren(h('button', { type: 'button', class: 'btn btn-primary', onClick: closeModal }, 'Fermer'));
  }

  function go(i) {
    cleanup();
    index = i;
    const step = exercise.steps[i];
    const next = h('button', { type: 'button', class: 'btn btn-primary' }, i === exercise.steps.length - 1 ? 'Terminer' : 'Suivant');
    const ctx = {
      values,
      refresh: () => (next.disabled = current?.ready ? !current.ready() : false),
      // Étape terminée d'elle-même (respiration, minuteur, sens) : on débloque la suite.
      done: () => ctx.refresh(),
    };
    current = RENDERERS[step.type](step, ctx);
    next.addEventListener('click', () => (i === exercise.steps.length - 1 ? finish() : go(i + 1)));
    body.replaceChildren(
      h('p', { class: 'eyebrow', text: exercise.steps.length > 1 ? `${exercise.title} · étape ${i + 1} sur ${exercise.steps.length}` : exercise.title }),
      current.el,
    );
    footer.replaceChildren(h('button', { type: 'button', class: 'btn btn-ghost', onClick: () => (i === 0 ? intro() : go(i - 1)) }, '← Retour'), next);
    ctx.refresh();
  }

  intro();
  openModal([body, footer], cleanup);
}
