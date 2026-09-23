import { h } from '../dom.js';

let cleanup = null;
let listening = false;

function dialog() {
  const d = document.getElementById('modal');
  if (!listening) {
    // Un seul écouteur : Échap, « Fermer » ou un clic ailleurs déclenchent tous le nettoyage.
    d.addEventListener('close', runCleanup);
    listening = true;
  }
  return d;
}

function runCleanup() {
  const fn = cleanup;
  cleanup = null;
  fn?.();
}

// Remplace le contenu sans refermer la fenêtre : on nettoie l'ancien contenu (minuteurs…) d'abord.
export function openModal(content, onClose) {
  const d = dialog();
  runCleanup();
  const close = h('button', { type: 'button', class: 'btn btn-ghost', onClick: closeModal }, 'Fermer');
  d.replaceChildren(h('div', { class: 'modal-body' }, content, h('div', { class: 'actions' }, close)));
  cleanup = onClose ?? null;
  if (!d.open) d.showModal();
}

export function closeModal() {
  const d = dialog();
  if (d.open) d.close();
}

// Détail d'une micro-aide.
export function openNudge(nudge) {
  const list = nudge.body.length > 2 ? 'ol' : 'ul';
  openModal([
    h('p', { class: 'eyebrow', text: `${nudge.kind} · ${nudge.duration}` }),
    h('h2', { text: nudge.title }),
    h('p', { class: 'muted', text: nudge.summary }),
    h(list, {}, nudge.body.map((line) => h('li', { text: line }))),
    nudge.tool === 'coherence'
      ? h('button', { type: 'button', class: 'btn btn-primary', onClick: () => openBreathing() }, "Lancer l'exercice")
      : null,
  ]);
}

// Mini-jeu de cohérence cardiaque : 5 s d'inspiration, 5 s d'expiration, pendant 3 minutes.
export function openBreathing() {
  const TOTAL = 180;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const orb = h('div', { class: 'breath-orb', 'aria-hidden': 'true' });
  const label = h('p', { class: 'breath-label', 'aria-live': 'polite', text: 'Installe-toi confortablement.' });
  const bar = h('span');
  const timer = h('div', { class: 'timer', 'aria-hidden': 'true' }, bar);
  const toggle = h('button', { type: 'button', class: 'btn btn-primary' }, 'Commencer');

  let elapsed = 0;
  let interval = null;

  function tick() {
    const phase = Math.floor(elapsed / 5) % 2 === 0 ? 'inhale' : 'exhale';
    const remaining = 5 - (elapsed % 5);
    orb.classList.toggle('inhale', phase === 'inhale');
    label.textContent = `${phase === 'inhale' ? 'Inspire' : 'Expire'}… ${reduced ? remaining : ''}`.trim();
    timer.style.setProperty('--p', String(elapsed / TOTAL));
    if (elapsed >= TOTAL) {
      stop();
      label.textContent = 'Trois minutes. Remarque comment tu te sens maintenant.';
      toggle.textContent = 'Recommencer';
      elapsed = 0;
      return;
    }
    elapsed += 1;
  }

  function start() {
    toggle.textContent = 'Pause';
    tick();
    interval = setInterval(tick, 1000);
  }

  function stop() {
    clearInterval(interval);
    interval = null;
    toggle.textContent = 'Reprendre';
  }

  toggle.addEventListener('click', () => (interval ? stop() : start()));

  openModal(
    [
      h('p', { class: 'eyebrow', text: 'Exercice · 3 min' }),
      h('h2', { text: 'Cohérence cardiaque' }),
      h('div', { class: 'breath' }, orb, label, timer),
      h('div', { class: 'actions' }, toggle),
    ],
    () => clearInterval(interval),
  );
}
