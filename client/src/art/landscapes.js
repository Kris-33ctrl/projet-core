// Paysages des sphères et bandeau de dunes. Les couleurs viennent des jetons CSS (--sky-*, --dune-*, --sun…) :
// le même dessin passe du jour à la nuit avec le thème, et chaque sphère a son heure (classe .scene-<sphère>).

import { svgEl, uid, stop } from './svg.js';

const sky = (id) => `<linearGradient id="${id}-sky" x1="0" x2="0" y1="0" y2="1">${stop(0, 'var(--sky-1)')}${stop(0.62, 'var(--sky-2)')}${stop(1, 'var(--sky-3)')}</linearGradient>`;
const glow = (id, name, color) =>
  `<radialGradient id="${id}-${name}">${stop(0, color, 0.95)}${stop(0.35, color, 0.45)}${stop(1, color, 0)}</radialGradient>`;

function lantern(x, y, s, id) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <circle r="22" fill="url(#${id}-gold)"/>
    <path d="M-3 -10.5 C -3 -14, 3 -14, 3 -10.5" fill="none" style="stroke:var(--reseau)" stroke-width="1.4"/>
    <rect x="-5.5" y="-9" width="11" height="17" rx="5.5" style="fill:var(--reseau)"/>
    <ellipse cy="-0.5" rx="2.6" ry="4.4" fill="#fff4d6"/>
  </g>`;
}

function stars(list) {
  return list.map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" style="fill:var(--star)" opacity="${o}"/>`).join('');
}

const SCENES = {
  // La Braise : une dune au lever du soleil, des rides de vent et une trace de pas lumineux sur la crête.
  machine: (id) => `
    <defs>${sky(id)}${glow(id, 'sun', 'var(--sun-glow)')}</defs>
    <rect width="400" height="220" fill="url(#${id}-sky)"/>
    <circle cx="268" cy="128" r="104" fill="url(#${id}-sun)"/>
    <circle cx="268" cy="128" r="32" style="fill:var(--sun)"/>
    <path d="M0 150 C 70 132, 140 140, 210 150 S 330 138, 400 146 V220 H0 Z" style="fill:var(--dune-1)"/>
    <path d="M-10 222 C 50 184, 140 128, 226 130 C 300 132, 352 170, 410 204 V222 Z" style="fill:color-mix(in srgb, var(--machine) 24%, var(--dune-2))"/>
    <g fill="none" style="stroke:var(--mote)" stroke-width="1.4" stroke-linecap="round" opacity=".55">
      <path d="M100 176 C 142 152, 190 144, 236 148"/><path d="M76 198 C 124 172, 192 162, 262 168"/><path d="M160 214 C 206 196, 272 192, 330 202"/>
    </g>
    <g style="fill:var(--sun)">${[[150, 146], [166, 139], [182, 134], [198, 131], [214, 130], [230, 130]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="1.9" opacity="${0.3 + i * 0.12}"/>`).join('')}</g>
    <path d="M0 222 C 50 204, 120 208, 180 222 Z" style="fill:var(--dune-3)"/>`,

  // Le Ciel : des pierres qui flottent au-dessus d'une mer de nuages, reliées par un fil de lumière.
  pilote: (id) => `
    <defs>${sky(id)}${glow(id, 'moon', 'var(--sun-glow)')}</defs>
    <rect width="400" height="220" fill="url(#${id}-sky)"/>
    ${stars([[40, 30, 1.2, 0.7], [96, 18, 1, 0.5], [362, 96, 1.2, 0.6], [240, 22, 0.9, 0.5]])}
    <circle cx="322" cy="54" r="46" fill="url(#${id}-moon)"/>
    <circle cx="322" cy="54" r="15" style="fill:var(--sun)"/>
    <path d="M120 98 C 150 70, 182 64, 210 72 S 270 98, 292 110" fill="none" style="stroke:var(--gold)" stroke-width="1.3" stroke-linecap="round"/>
    <g style="fill:color-mix(in srgb, var(--pilote) 30%, var(--rock))">
      <path d="M104 102 C 99 90, 111 81, 124 83 C 139 85, 143 98, 134 106 C 125 113, 108 112, 104 102 Z"/>
      <path d="M190 78 C 184 62, 200 50, 216 53 C 236 56, 240 74, 228 84 C 216 93, 196 91, 190 78 Z"/>
      <path d="M281 112 C 278 104, 286 98, 294 100 C 303 102, 305 111, 299 116 C 293 120, 284 119, 281 112 Z"/>
    </g>
    <g fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2" stroke-linecap="round">
      <path d="M112 92 C 117 88, 124 88, 128 91"/><path d="M200 64 C 206 59, 215 59, 221 63"/>
    </g>
    <path d="M0 168 C 18 150, 46 152, 58 162 C 72 146, 102 146, 114 160 C 128 144, 162 146, 170 162 C 186 150, 214 150, 226 162 C 240 146, 276 148, 284 164 C 298 152, 330 152, 340 164 C 356 150, 390 154, 400 166 V220 H0 Z" style="fill:color-mix(in srgb, var(--pilote) 22%, var(--cloud))"/>
    <path d="M-10 196 C 10 176, 44 176, 58 190 C 76 170, 116 172, 128 190 C 146 172, 188 174, 198 192 C 216 174, 258 174, 270 192 C 288 174, 330 176, 340 192 C 358 176, 394 180, 410 194 V220 H-10 Z" style="fill:var(--cloud)"/>`,

  // Les Lanternes : de petites lanternes posées sur les dunes, reliées par des fils d'or.
  reseau: (id) => `
    <defs>${sky(id)}${glow(id, 'gold', 'var(--gold)')}</defs>
    <rect width="400" height="220" fill="url(#${id}-sky)"/>
    ${stars([[36, 26, 1.2, 0.8], [120, 40, 1, 0.6], [208, 18, 1.3, 0.8], [312, 34, 1, 0.6], [380, 60, 1.2, 0.7]])}
    <path d="M0 150 C 90 130, 170 146, 260 138 S 360 128, 400 136 V220 H0 Z" style="fill:var(--dune-1)"/>
    <path d="M0 182 C 80 162, 180 176, 260 170 S 360 160, 400 168 V220 H0 Z" style="fill:var(--dune-2)"/>
    <g fill="none" style="stroke:var(--gold)" stroke-width="1.1" stroke-linecap="round" opacity=".85">
      <path d="M70 142 Q 104 112 140 120"/><path d="M140 120 Q 176 150 214 152"/><path d="M214 152 Q 250 110 286 114"/>
      <path d="M286 114 Q 318 146 344 148"/><path d="M214 152 Q 230 176 250 184"/><path d="M140 120 Q 214 90 286 114" opacity=".5"/>
    </g>
    ${lantern(70, 142, 0.9, id)}${lantern(140, 120, 1.1, id)}${lantern(214, 152, 1, id)}${lantern(286, 114, 1.2, id)}${lantern(344, 148, 0.85, id)}${lantern(250, 184, 0.8, id)}
    <path d="M0 208 C 100 194, 220 212, 400 198 V220 H0 Z" style="fill:var(--dune-3)"/>`,

  // L'Oasis : une arche de pierre douce au-dessus d'un bassin turquoise.
  cadre: (id) => `
    <defs>${sky(id)}${glow(id, 'sun', 'var(--sun-glow)')}</defs>
    <rect width="400" height="220" fill="url(#${id}-sky)"/>
    <circle cx="86" cy="58" r="80" fill="url(#${id}-sun)"/>
    <circle cx="86" cy="58" r="22" style="fill:var(--sun)"/>
    <path d="M0 158 C 80 140, 160 150, 240 146 S 360 136, 400 144 V220 H0 Z" style="fill:var(--dune-1)"/>
    <path d="M148 190 V110 A52 52 0 0 1 252 110 V190 H234 V112 A34 34 0 0 0 166 112 V190 Z" style="fill:color-mix(in srgb, var(--dune-2) 82%, var(--ink) 6%)"/>
    <path d="M160 98 A42 42 0 0 1 206 66" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>
    <path d="M0 196 C 60 184, 110 190, 128 200 L 272 200 C 292 190, 340 184, 400 192 V220 H0 Z" style="fill:var(--dune-3)"/>
    <ellipse cx="200" cy="202" rx="96" ry="12" style="fill:color-mix(in srgb, var(--cadre) 62%, var(--sky-1))"/>
    <ellipse cx="200" cy="202" rx="58" ry="6.5" style="fill:var(--cadre)" opacity=".55"/>
    <g fill="none" style="stroke:var(--mote)" stroke-opacity=".7" stroke-width="1.2"><ellipse cx="200" cy="202" rx="24" ry="2.4"/><ellipse cx="200" cy="202" rx="42" ry="4.2" stroke-opacity=".4"/></g>
    <g style="fill:color-mix(in srgb, var(--cadre) 60%, var(--dune-3))"><circle cx="118" cy="192" r="9"/><circle cx="130" cy="195" r="6"/><circle cx="288" cy="193" r="7"/></g>`,

  // Le Souffle : des pierres tièdes relâchent des rubans de brume lumineuse dans un ciel étoilé.
  soupapes: (id) => `
    <defs>${sky(id)}
      <linearGradient id="${id}-mist" x1="0" x2="0" y1="1" y2="0">${stop(0, 'var(--mist)', 0.9)}${stop(1, 'var(--mist)', 0)}</linearGradient>
      ${glow(id, 'gold', 'var(--gold)')}</defs>
    <rect width="400" height="220" fill="url(#${id}-sky)"/>
    ${stars([[30, 24, 1.3, 0.9], [72, 60, 0.9, 0.6], [118, 20, 1.1, 0.8], [176, 48, 0.8, 0.5], [236, 16, 1.2, 0.8], [292, 44, 1, 0.7], [340, 20, 1.4, 0.9], [376, 70, 0.9, 0.6], [206, 84, 0.8, 0.5], [54, 100, 0.8, 0.5]])}
    <g fill="none" stroke="url(#${id}-mist)" stroke-linecap="round">
      <path d="M150 168 C 136 140, 170 120, 156 92 S 144 52, 170 26" stroke-width="7"/>
      <path d="M214 164 C 226 136, 196 118, 214 90 S 232 54, 214 30" stroke-width="5"/>
      <path d="M270 170 C 262 148, 284 132, 276 112 S 268 84, 286 66" stroke-width="4"/>
    </g>
    <path d="M0 176 C 80 160, 170 170, 250 164 S 360 154, 400 162 V220 H0 Z" style="fill:var(--dune-2)"/>
    <g style="fill:color-mix(in srgb, var(--soupapes) 40%, var(--rock))">
      <path d="M134 176 C 130 164, 142 156, 154 158 C 168 160, 172 172, 162 179 C 152 185, 138 184, 134 176 Z"/>
      <path d="M200 172 C 197 162, 208 155, 218 157 C 229 159, 232 169, 225 175 C 217 181, 204 180, 200 172 Z"/>
      <path d="M262 178 C 260 171, 267 166, 274 167 C 282 168, 284 176, 279 180 C 273 184, 265 184, 262 178 Z"/>
    </g>
    <circle cx="152" cy="160" r="12" fill="url(#${id}-gold)"/><circle cx="216" cy="158" r="10" fill="url(#${id}-gold)"/>
    <path d="M0 204 C 110 190, 230 208, 400 194 V220 H0 Z" style="fill:var(--dune-3)"/>`,
};

/**
 * Paysage d'une sphère, en 400 × 220, recadré pour remplir son conteneur.
 * @param {string} sphere
 * @param {{ className?: string, label?: string }} options
 */
export function landscape(sphere, { className = '', label } = {}) {
  const id = uid('ls');
  const draw = SCENES[sphere] ?? SCENES.machine;
  return svgEl(`<svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">${draw(id)}</svg>`, {
    className: `landscape scene-${sphere} ${className}`.trim(),
    label,
  });
}

// Bandeau de dunes pour le bas d'une scène (accueil, bilan, pied de page). Le ruban est facultatif.
export function dunes({ ribbon = false, motes = true, className = '' } = {}) {
  const id = uid('du');
  return svgEl(
    `<svg viewBox="0 0 1200 240" preserveAspectRatio="none">
      <defs>
        <linearGradient id="${id}-near" x1="0" x2="0" y1="0" y2="1">${stop(0, 'var(--dune-3)')}${stop(1, 'var(--dune-fade)')}</linearGradient>
      </defs>
      ${ribbon ? `<path class="ribbon" pathLength="1" d="M-20 70 C 180 10, 320 130, 520 60 S 820 -10, 1220 50" fill="none" style="stroke:var(--machine)" stroke-width="3" stroke-linecap="round" opacity=".7"/>` : ''}
      <path d="M0 120 C 200 72, 360 100, 520 110 S 840 70, 1200 104 V240 H0 Z" style="fill:var(--dune-1)"/>
      <path d="M0 170 C 240 120, 420 170, 640 160 S 980 120, 1200 150 V240 H0 Z" style="fill:var(--dune-2)"/>
      <path d="M0 210 C 300 170, 520 222, 760 200 S 1060 180, 1200 200 V240 H0 Z" fill="url(#${id}-near)"/>
      ${motes ? `<g class="motes" style="fill:var(--mote)"><circle cx="160" cy="60" r="2.4"/><circle cx="420" cy="34" r="1.6"/><circle cx="700" cy="70" r="2"/><circle cx="960" cy="30" r="1.6"/><circle cx="1110" cy="84" r="2.4"/></g>` : ''}
    </svg>`,
    { className: `dunes ${className}`.trim() },
  );
}
