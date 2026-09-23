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
  const close = h('button', { type: 'button', class: 'btn btn-ghost btn-small modal-close', onClick: closeModal }, 'Fermer');
  d.replaceChildren(h('div', { class: 'modal-body' }, close, content));
  cleanup = onClose ?? null;
  if (!d.open) d.showModal();
}

export function closeModal() {
  const d = dialog();
  if (d.open) d.close();
}
