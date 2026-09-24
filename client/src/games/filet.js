// Le filet : la force des petits liens (Sandstrom & Dunn, 2014) et l'effet tampon (Cohen & Wills, 1985).
// On place des proches et des liens légers autour de soi, puis un petit geste allume chaque fil.
// Les prénoms restent en mémoire le temps de la partie, jamais enregistrés.

import { h } from '../dom.js';
import { audio, vibrate } from './feedback.js';
import { layout, timers } from './kit.js';

const KINDS = [
  { id: 'proche', label: 'Proche', hint: 'famille, ami·e, partenaire' },
  { id: 'leger', label: 'Lien léger', hint: 'camarade, collègue, voisin·e, commerçant·e' },
];
const GESTURES = ['Un message', 'Un merci', 'Un bonjour', 'Un café', 'Un sourire'];
const MAX_PEOPLE = 8;
const SVG_NS = 'http://www.w3.org/2000/svg';

function svg(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

export function createFilet({ stage, onEnd }) {
  const { cue, scene, controls } = layout(stage, { sceneClass: 'filet-scene' });
  const t = timers();
  const people = [];
  const net = svg('svg', { viewBox: '-100 -100 200 200', class: 'filet-net', role: 'img', 'aria-label': 'Ton filet de liens' });

  // Proches sur le cercle intérieur, liens légers sur le cercle extérieur.
  function position(person, index) {
    const same = people.filter((p) => p.kind === person.kind);
    const k = same.indexOf(person);
    const radius = person.kind === 'proche' ? 48 : 80;
    const offset = person.kind === 'proche' ? 0 : Math.PI / Math.max(2, same.length);
    const angle = offset + (k * 2 * Math.PI) / Math.max(1, same.length) - Math.PI / 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, index };
  }

  function drawNet() {
    net.replaceChildren();
    people.forEach((p, i) => {
      const { x, y } = position(p, i);
      net.append(svg('line', { x1: 0, y1: 0, x2: x, y2: y, class: `filet-thread${p.gesture ? ' lit' : ''}` }));
    });
    net.append(svg('circle', { cx: 0, cy: 0, r: 13, class: 'filet-me' }));
    const me = svg('text', { x: 0, y: 4, 'text-anchor': 'middle', class: 'filet-label me' });
    me.textContent = 'toi';
    net.append(me);
    people.forEach((p, i) => {
      const { x, y } = position(p, i);
      net.append(svg('circle', { cx: x, cy: y, r: p.kind === 'proche' ? 8 : 6, class: `filet-node ${p.kind}${p.gesture ? ' lit' : ''}` }));
      const label = svg('text', { x, y: y + (y < 0 ? -12 : 18), 'text-anchor': 'middle', class: 'filet-label' });
      label.textContent = p.name;
      net.append(label);
    });
  }

  function addPhase() {
    cue.textContent = 'Qui fait partie de ton filet ? Ajoute des proches, et aussi des liens plus légers.';
    const name = h('input', { type: 'text', id: 'filet-name', placeholder: 'Prénom ou surnom', maxlength: '18', autocomplete: 'off' });
    let kind = 'proche';
    const kindButtons = KINDS.map((k) => {
      const b = h('button', { type: 'button', class: 'segment', role: 'radio', 'aria-checked': String(k.id === kind), title: k.hint }, k.label);
      b.addEventListener('click', () => {
        kind = k.id;
        kindButtons.forEach((x, i) => x.setAttribute('aria-checked', String(KINDS[i].id === kind)));
      });
      return b;
    });
    const add = h('button', { type: 'button', class: 'btn btn-quiet' }, 'Ajouter');
    const next = h('button', { type: 'button', class: 'btn btn-primary', disabled: true }, 'Tisser les fils');
    const hint = h('p', { class: 'small muted' });

    const refreshHint = () => {
      const light = people.filter((p) => p.kind === 'leger').length;
      hint.textContent = !people.length
        ? 'Un·e voisin·e, un·e camarade de cours, la personne de la boulangerie : les liens légers comptent aussi.'
        : light
          ? `${people.length} personne${people.length > 1 ? 's' : ''}, dont ${light} lien${light > 1 ? 's' : ''} léger${light > 1 ? 's' : ''}.`
          : 'Pense aussi à un lien léger : quelqu’un que tu croises sans être proche.';
      next.disabled = people.length < 2;
    };

    function push() {
      const value = name.value.trim();
      if (!value || people.length >= MAX_PEOPLE) return;
      people.push({ name: value, kind, gesture: null });
      name.value = '';
      name.focus();
      audio.blip('pop');
      drawNet();
      refreshHint();
    }
    add.addEventListener('click', push);
    name.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        push();
      }
    });
    next.addEventListener('click', gesturePhase);

    scene.replaceChildren(
      net,
      h('div', { class: 'filet-form' }, h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': 'Type de lien' }, kindButtons), h('div', { class: 'ex-add' }, name, add)),
      hint,
    );
    controls.replaceChildren(h('span', { class: 'small muted', text: `${MAX_PEOPLE} personnes au plus` }), next);
    drawNet();
    refreshHint();
    name.focus();
  }

  function gesturePhase() {
    let i = 0;
    const box = h('div', { class: 'filet-gesture' });
    function ask() {
      const person = people[i];
      cue.textContent = `Un petit geste pour ${person.name} cette semaine ?`;
      box.replaceChildren(
        h(
          'div',
          { class: 'tab-moments' },
          GESTURES.map((g) =>
            h(
              'button',
              {
                type: 'button',
                class: 'chip',
                onClick: () => {
                  person.gesture = g;
                  audio.blip('pop');
                  vibrate(15);
                  drawNet();
                  i += 1;
                  if (i < people.length) ask();
                  else t.later(finish, 900);
                },
              },
              g,
            ),
          ),
        ),
      );
      box.querySelector('.chip')?.focus();
    }
    scene.replaceChildren(net, box);
    controls.replaceChildren(h('span', { class: 'small muted', text: 'Chaque geste allume un fil.' }));
    ask();
  }

  function finish() {
    const light = people.filter((p) => p.kind === 'leger').length;
    onEnd({
      message: `Ton filet compte ${people.length} fils${light ? `, dont ${light} lien${light > 1 ? 's' : ''} léger${light > 1 ? 's' : ''}` : ''}. Chacun compte.`,
      details: ['Tes petits gestes de la semaine :', ...people.map((p) => `${p.name} : ${p.gesture.toLowerCase()}`)],
    });
  }

  addPhase();
  return { destroy: () => t.clear() };
}
