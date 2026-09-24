// Emblèmes : les formes-mères de la direction artistique « Le Voyage ».
// La Braise est une dune au soleil levant, le Ciel un nuage sous la lune, les Lanternes une lanterne,
// l'Oasis une arche au-dessus de l'eau, le Souffle un ruban de vent. Le Core est un astre.
// Ils prennent la couleur du texte (`currentColor`) : le CSS choisit la teinte de la sphère.

import { svgEl } from './svg.js';

const EMBLEMS = {
  machine: `
    <circle cx="30" cy="19" r="13" fill="currentColor" fill-opacity=".16"/>
    <circle cx="30" cy="19" r="7" fill="currentColor"/>
    <path d="M3 38 C 13 24, 29 22, 45 38 Z" fill="currentColor" fill-opacity=".55"/>
    <path d="M12 38 C 20 31, 30 30, 38 38" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".9"/>`,
  pilote: `
    <circle cx="31" cy="16" r="8" fill="currentColor" fill-opacity=".45"/>
    <path d="M11 36 C 4.5 36, 4 27, 11 26.5 C 12 19.5, 21.5 17.5, 25 23 C 28.5 19, 36.5 21, 35.5 28 C 41.5 28, 42 36, 36 36 Z" fill="currentColor"/>
    <circle cx="10" cy="12" r="1.6" fill="currentColor"/>`,
  reseau: `
    <circle cx="24" cy="26" r="17" fill="currentColor" fill-opacity=".14"/>
    <path d="M19 10 H 29" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="16" y="13" width="16" height="23" rx="8" fill="currentColor"/>
    <ellipse cx="24" cy="25" rx="3.4" ry="5" fill="#fff6e0" fill-opacity=".9"/>
    <path d="M18 39 H 30" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
  cadre: `
    <path d="M11 33 V 21 A 13 13 0 0 1 37 21 V 33" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="24" cy="38" rx="17" ry="3.6" fill="currentColor" fill-opacity=".55"/>
    <ellipse cx="24" cy="38" rx="7" ry="1.5" fill="currentColor"/>`,
  soupapes: `
    <path d="M4 31 C 12 15, 20 41, 29 25 S 40 12, 44 19" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    <path d="M8 40 C 15 32, 22 44, 30 36 S 40 32, 43 35" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-opacity=".5"/>`,
  core: `
    <circle cx="24" cy="24" r="17" fill="currentColor" fill-opacity=".18"/>
    <circle cx="24" cy="24" r="9" fill="currentColor"/>
    <circle cx="8" cy="10" r="1.6" fill="currentColor"/><circle cx="40" cy="14" r="1.3" fill="currentColor"/><circle cx="38" cy="40" r="1.6" fill="currentColor"/>`,
  lantern: `
    <circle cx="24" cy="25" r="18" fill="currentColor" fill-opacity=".16"/>
    <path d="M19 9 C 19 5, 29 5, 29 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <rect x="15" y="11" width="18" height="26" rx="9" fill="currentColor"/>
    <ellipse cx="24" cy="25" rx="4" ry="6" fill="#fff6e0" fill-opacity=".92"/>
    <path d="M18 40 H 30" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
  tablet: `
    <path d="M12 8 H 36 A 4 4 0 0 1 40 12 V 38 A 4 4 0 0 1 36 42 H 10 A 2 2 0 0 1 8 40 V 12 A 4 4 0 0 1 12 8 Z" fill="currentColor" fill-opacity=".2"/>
    <path d="M15 17 H 33 M15 24 H 33 M15 31 H 26" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
  card: `
    <rect x="11" y="6" width="26" height="36" rx="5" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="2"/>
    <circle cx="24" cy="22" r="5" fill="currentColor"/>
    <path d="M17 33 C 21 29, 27 29, 31 33" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
};

export const EMBLEM_NAMES = Object.keys(EMBLEMS);

/**
 * @param {string} name  identifiant de sphère (machine, pilote…) ou forme (core, lantern, tablet, card)
 * @param {{ className?: string, label?: string }} options
 */
export function emblem(name, { className = 'emblem', label } = {}) {
  return svgEl(`<svg viewBox="0 0 48 48">${EMBLEMS[name] ?? EMBLEMS.core}</svg>`, { className, label });
}
