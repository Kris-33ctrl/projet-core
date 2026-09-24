// Illustrations en SVG dessinées dans le code : aucune image à charger.
// Chaque dessin reçoit un préfixe unique pour ses dégradés : deux copies du même dessin
// sur une page ne se volent pas leurs définitions.

let counter = 0;
export const uid = (prefix = 'a') => `${prefix}${(counter += 1).toString(36)}`;

/**
 * Transforme un balisage SVG en élément. Sans `label`, le dessin est décoratif (masqué aux lecteurs d'écran).
 * @param {string} markup
 * @param {{ className?: string, label?: string }} options
 */
export function svgEl(markup, { className, label } = {}) {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  const el = template.content.firstElementChild;
  if (className) el.setAttribute('class', className);
  el.setAttribute('focusable', 'false');
  if (label) {
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', label);
  } else {
    el.setAttribute('aria-hidden', 'true');
  }
  return el;
}

// Pour les dégradés qui suivent le thème (jour / nuit) : une couleur de jeton CSS dans un attribut `style`.
export const stop = (offset, color, opacity = 1) => `<stop offset="${offset}" style="stop-color:${color};stop-opacity:${opacity}"/>`;
