import { h } from '../dom.js';

// Curseur continu sans aucun repère numérique. Valeur backend 0 → 100 (pôle gauche → pôle droit).
export function slider(question, initial, onChange) {
  const [left, right] = question.poles;
  const touched = initial !== undefined;
  const describe = (v) =>
    v < 20 ? `Tout près de « ${left} »` : v < 45 ? `Plutôt « ${left} »` : v <= 55 ? 'Entre les deux' : v <= 80 ? `Plutôt « ${right} »` : `Tout près de « ${right} »`;

  const input = h('input', {
    type: 'range',
    id: `q-${question.id}`,
    min: 0,
    max: 100,
    step: 0.1,
    value: initial ?? 50,
    'aria-label': question.prompt,
  });
  input.setAttribute('aria-valuetext', describe(Number(input.value)));

  const wrap = h('div', { class: `slider${touched ? ' touched' : ''}` }, input, h('div', { class: 'poles', 'aria-hidden': 'true' }, h('span', { text: left }), h('span', { text: right })));

  input.addEventListener('input', () => {
    wrap.classList.add('touched');
    const v = Number(input.value);
    input.setAttribute('aria-valuetext', describe(v));
    onChange(v);
  });

  return { el: wrap, value: () => Number(input.value), focus: () => input.focus() };
}

// Cartes à sélection multiple. Une carte « exclusive » (« Tout est en ordre ») désélectionne les autres.
export function cards(question, initial = [], onChange) {
  const selected = new Set(initial);
  const buttons = question.options.map((option) => {
    const btn = h(
      'button',
      { type: 'button', class: 'card-option', 'aria-pressed': String(selected.has(option.id)) },
      h('span', { class: 'check', 'aria-hidden': 'true' }),
      h('span', { text: option.label }),
    );
    btn.addEventListener('click', () => {
      if (selected.has(option.id)) selected.delete(option.id);
      else {
        if (option.exclusive) selected.clear();
        else question.options.filter((o) => o.exclusive).forEach((o) => selected.delete(o.id));
        selected.add(option.id);
      }
      question.options.forEach((o, i) => buttons[i].setAttribute('aria-pressed', String(selected.has(o.id))));
      onChange([...selected]);
    });
    return btn;
  });

  return {
    el: h('div', { class: 'card-grid', role: 'group', 'aria-label': question.prompt }, buttons),
    value: () => [...selected],
    focus: () => buttons[0]?.focus(),
  };
}

// Fréquence (outil validé) : quatre choix exclusifs, jamais de curseur.
export function frequency(question, initial, onChange) {
  let value = Number.isInteger(initial) ? initial : null;
  const buttons = question.options.map((option) =>
    h(
      'button',
      { type: 'button', class: 'card-option', role: 'radio', 'aria-checked': String(option.value === value) },
      h('span', { class: 'check', 'aria-hidden': 'true' }),
      h('span', { text: option.label }),
    ),
  );
  buttons.forEach((btn, i) =>
    btn.addEventListener('click', () => {
      value = question.options[i].value;
      buttons.forEach((b, j) => b.setAttribute('aria-checked', String(j === i)));
      onChange(value);
    }),
  );
  return {
    el: h('div', { class: 'card-grid frequency', role: 'radiogroup', 'aria-label': question.prompt }, buttons),
    value: () => value,
    focus: () => buttons[0]?.focus(),
  };
}
