// Illustrations des cartes de l'Atlas : une scène unique par carte, un symbole central et beaucoup d'air.
// Les cartes sont des objets à collectionner : leurs couleurs sont peintes une fois pour toutes
// et ne suivent pas le thème jour / nuit. Format de la fenêtre d'illustration : 200 × 250.

import { svgEl, uid } from './svg.js';

const lin = (id, stops, [x1, y1, x2, y2] = [0, 0, 0, 1]) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
const rad = (id, color, spread = 0.4) =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity=".95"/><stop offset="${spread}" stop-color="${color}" stop-opacity=".4"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
const dots = (list, color) => list.map(([x, y, r, o = 1]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${o}"/>`).join('');

const ART = {
  // I · La cohérence cardiaque : un voilier de lumière sur une longue vague lisse, au lever du jour.
  vague: (i) => `
    <defs>${lin(`${i}s`, [[0, '#fde2c6'], [0.55, '#f6c3ae'], [1, '#e7a9b6']])}${rad(`${i}g`, '#ffe7a8')}${lin(`${i}w`, [[0, '#8397e0'], [1, '#3a5fc2']])}</defs>
    <rect width="200" height="250" fill="url(#${i}s)"/>
    <circle cx="134" cy="96" r="74" fill="url(#${i}g)"/>
    <circle cx="134" cy="96" r="25" fill="#fff4e2"/>
    <path d="M-4 124 C 21 104, 46 104, 71 124 S 121 144, 146 124 S 196 104, 221 124" fill="none" stroke="#e9a23b" stroke-width="1.8" stroke-dasharray="0.5 6" stroke-linecap="round"/>
    <path d="M0 152 C 40 142, 80 158, 120 149 S 180 141, 200 147 V250 H0 Z" fill="#b3bbe8"/>
    <g fill="#fff6e6" opacity=".7"><ellipse cx="134" cy="156" rx="20" ry="1.6"/><ellipse cx="134" cy="163" rx="13" ry="1.3"/></g>
    <path d="M0 176 C 46 152, 92 152, 132 168 S 186 182, 200 172 V250 H0 Z" fill="url(#${i}w)"/>
    <circle cx="62" cy="146" r="26" fill="url(#${i}g)"/>
    <path d="M47 158 Q 62 167 77 158 Z" fill="#2a2342"/>
    <path d="M61 156 V 126 Q 76 142 76 156 Z" fill="#fff8ec"/>
    <path d="M59 156 V 134 Q 50 146 51 156 Z" fill="#fde2c6"/>
    <path d="M0 212 C 46 198, 100 222, 150 208 S 192 198, 200 204 V250 H0 Z" fill="#2f4a9e"/>
    <g fill="none" stroke="#fff6e6" stroke-opacity=".45" stroke-width="1.4" stroke-linecap="round"><path d="M18 190 C 40 182, 60 184, 80 190"/><path d="M110 226 C 130 218, 150 220, 170 226"/></g>`,

  // II · La charge mentale : des feuilles s'envolent d'une table de pierre et deviennent des oiseaux.
  onglets: (i) => `
    <defs>${lin(`${i}s`, [[0, '#ece4f4'], [0.6, '#f8d8c6'], [1, '#f2bfae']])}${rad(`${i}g`, '#fff0c9')}</defs>
    <rect width="200" height="250" fill="url(#${i}s)"/>
    <circle cx="150" cy="58" r="50" fill="url(#${i}g)"/>
    <circle cx="150" cy="58" r="15" fill="#fff6e6"/>
    <path d="M0 204 C 60 188, 140 192, 200 200 V250 H0 Z" fill="#e9bc92"/>
    <path d="M0 228 C 70 214, 130 230, 200 218 V250 H0 Z" fill="#d99a6c"/>
    <rect x="52" y="182" width="96" height="13" rx="6.5" fill="#8a7f9e"/>
    <rect x="66" y="193" width="11" height="16" rx="4" fill="#7a6f8e"/><rect x="123" y="193" width="11" height="16" rx="4" fill="#7a6f8e"/>
    <path d="M60 184 C 80 180, 120 180, 140 184" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round"/>
    <g fill="#fff8ee" stroke="#d6b9a6" stroke-width=".8">
      <rect x="72" y="172" width="22" height="11" rx="2" transform="rotate(-4 83 177)"/>
      <rect x="84" y="150" width="18" height="13" rx="2" transform="rotate(-16 93 156)"/>
      <rect x="102" y="128" width="16" height="12" rx="2" transform="rotate(12 110 134)"/>
    </g>
    <path d="M118 112 L 126 104 L 134 112 L 126 108 Z" fill="#fff8ee" stroke="#d6b9a6" stroke-width=".8" stroke-linejoin="round"/>
    <g fill="none" stroke="#5b4f6e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M134 92 Q 140 85 146 91 Q 152 85 158 91"/>
      <path d="M152 70 Q 157 64 162 69 Q 167 64 172 69" stroke-width="1.5"/>
      <path d="M168 50 Q 172 46 176 49 Q 180 46 184 49" stroke-width="1.2"/>
    </g>
    ${dots([[40, 60, 1.4, 0.6], [70, 36, 1, 0.5], [22, 112, 1.2, 0.5]], '#fff6e6')}`,

  // III · Le surf de l'envie : une haute vague douce qui s'enroule, une planche de lumière sur la crête.
  surf: (i) => `
    <defs>${lin(`${i}s`, [[0, '#fbe0d4'], [0.5, '#ebb8cc'], [1, '#b995d2']])}${lin(`${i}w`, [[0, '#9a5fd0'], [1, '#3a4fa8']])}${rad(`${i}g`, '#fff2c8')}</defs>
    <rect width="200" height="250" fill="url(#${i}s)"/>
    <circle cx="156" cy="46" r="11" fill="#fff6ea"/>
    ${dots([[30, 30, 1.2, 0.7], [110, 22, 1, 0.6], [182, 90, 1.1, 0.6]], '#fff6ea')}
    <path d="M0 250 V 168 C 18 148, 40 110, 78 88 C 108 72, 140 76, 152 98 C 160 114, 150 128, 136 124 C 124 120, 126 106, 136 104 C 122 96, 106 108, 106 132 C 106 170, 150 194, 200 198 V250 Z" fill="url(#${i}w)"/>
    <path d="M38 120 C 58 96, 88 80, 118 80 C 140 81, 152 94, 148 110" fill="none" stroke="#fff6ea" stroke-width="3" stroke-linecap="round" stroke-opacity=".85"/>
    <path d="M112 132 C 116 150, 138 168, 170 176" fill="none" stroke="#fff6ea" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".4"/>
    <circle cx="86" cy="84" r="24" fill="url(#${i}g)"/>
    <ellipse cx="86" cy="84" rx="17" ry="3.6" transform="rotate(-20 86 84)" fill="#fff8ea"/>
    <path d="M118 250 C 140 222, 172 212, 200 216 V250 Z" fill="#ebbd92"/>
    ${dots([[128, 214, 1.6, 0.8], [138, 206, 1.2, 0.7], [150, 200, 1.4, 0.6], [112, 222, 1.1, 0.7]], '#fff6ea')}`,

  // IV · Le coût d'une notification : une petite cloche immobile, des ondes de son qui s'éteignent.
  notif: (i) => `
    <defs>${lin(`${i}s`, [[0, '#fdebd9'], [0.6, '#f6d4c0'], [1, '#eebfb4']])}${lin(`${i}b`, [[0, '#e0a94c'], [1, '#a8701e']], [0, 0, 1, 1])}</defs>
    <rect width="200" height="250" fill="url(#${i}s)"/>
    <circle cx="152" cy="50" r="10" fill="#fff6e8"/>
    <g fill="none" stroke="#a0760c" stroke-dasharray="2 6" stroke-linecap="round" stroke-width="1.4">
      <circle cx="122" cy="102" r="24" stroke-opacity=".45"/><circle cx="122" cy="102" r="38" stroke-opacity=".28"/><circle cx="122" cy="102" r="54" stroke-opacity=".14"/>
    </g>
    <path d="M0 208 C 60 196, 140 200, 200 206 V250 H0 Z" fill="#e9bc92"/>
    <path d="M0 228 C 70 218, 130 234, 200 222 V250 H0 Z" fill="#d99a6c"/>
    <rect x="96" y="66" width="5" height="146" rx="2.5" fill="#5b4f6e"/>
    <path d="M98 68 H 124" stroke="#5b4f6e" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M122 68 V 82" stroke="#5b4f6e" stroke-width="1.6"/>
    <path d="M109 104 C 109 91, 115 84, 122 84 C 129 84, 135 91, 135 104 L 139 113 H 105 Z" fill="url(#${i}b)"/>
    <path d="M114 100 C 114 93, 117 89, 121 88" fill="none" stroke="#fff3d8" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>
    <circle cx="122" cy="116" r="3" fill="#7a5010"/>
    <ellipse cx="99" cy="212" rx="14" ry="3" fill="#b27b62" opacity=".5"/>`,

  // V · Une pensée n'est pas un fait : une balance de pierre qui trouve doucement son équilibre.
  tribunal: (i) => `
    <defs>${lin(`${i}s`, [[0, '#fde6cf'], [0.55, '#f5d2bc'], [1, '#cfd5ee']])}${rad(`${i}g`, '#ffd98e', 0.35)}</defs>
    <rect width="200" height="250" fill="url(#${i}s)"/>
    <path d="M0 212 C 60 200, 140 204, 200 210 V250 H0 Z" fill="#e2b48f"/>
    <path d="M0 232 C 70 222, 130 238, 200 226 V250 H0 Z" fill="#cf9676"/>
    <ellipse cx="100" cy="208" rx="30" ry="6" fill="#6d6290"/>
    <rect x="95" y="70" width="10" height="138" rx="5" fill="#8a7f9e"/>
    <circle cx="100" cy="64" r="7" fill="#efb44a"/>
    <g transform="rotate(-3 100 76)">
      <rect x="34" y="73" width="132" height="6" rx="3" fill="#8a7f9e"/>
      <g stroke="#5b4f6e" stroke-width="1.1"><path d="M38 78 L 26 124 M38 78 L 50 124"/><path d="M162 78 L 150 124 M162 78 L 174 124"/></g>
      <path d="M20 124 Q 38 142 56 124 Z" fill="#6d6290"/>
      <path d="M144 124 Q 162 142 180 124 Z" fill="#6d6290"/>
      <circle cx="30" cy="122" r="12" fill="url(#${i}g)"/><circle cx="170" cy="122" r="14" fill="url(#${i}g)"/>
      ${dots([[31, 122, 3.2], [39, 121, 2.6], [158, 122, 2.6], [166, 121, 3.4], [174, 122, 2.8]], '#f6c863')}
    </g>
    <path d="M97 76 C 98 110, 98 150, 97 200" stroke="#fff" stroke-opacity=".25" stroke-width="2" fill="none"/>`,

  // VI · Revenir dans le présent : des lucioles montent des herbes et forment cinq petites constellations.
  sens: (i) => {
    const groups = [
      [[34, 54], [48, 44], [60, 58], [46, 68], [30, 70]],
      [[132, 40], [146, 50], [160, 42], [150, 30]],
      [[88, 98], [102, 90], [110, 104]],
      [[40, 132], [56, 124]],
      [[150, 128]],
    ];
    const lines = groups.map((g) => `<path d="M${g.map((p) => p.join(' ')).join(' L ')}" />`).join('');
    const flies = groups.flat().map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="url(#${i}g)"/><circle cx="${x}" cy="${y}" r="1.8" fill="#fff6d0"/>`).join('');
    return `
    <defs>${lin(`${i}s`, [[0, '#2b2a5e'], [0.55, '#5c4a80'], [1, '#e2a39e']])}${rad(`${i}g`, '#ffe27a', 0.3)}</defs>
    <rect width="200" height="250" fill="url(#${i}s)"/>
    ${dots([[18, 20, 0.9, 0.7], [90, 16, 1.1, 0.8], [182, 70, 0.8, 0.6], [118, 64, 0.8, 0.5]], '#fff6e0')}
    <g fill="none" stroke="#ffe7a8" stroke-opacity=".35" stroke-width=".9">${lines}</g>
    ${flies}
    <path d="M0 206 C 60 192, 140 200, 200 192 V250 H0 Z" fill="#2a2342"/>
    <g fill="none" stroke="#2a2342" stroke-width="2" stroke-linecap="round">
      ${[[6, 5, 170], [14, -4, 180], [22, 6, 164], [30, -3, 184], [40, 4, 174], [52, -5, 186], [64, 3, 178], [136, -4, 180], [146, 5, 168], [156, -3, 182], [166, 4, 172], [178, -5, 164], [190, 3, 178]].map(([x, b, top]) => `<path d="M${x} 214 Q ${x + b * 0.2} ${(214 + top) / 2} ${x + b} ${top}"/>`).join('')}
    </g>
    <circle cx="176" cy="170" r="7" fill="url(#${i}g)"/><circle cx="176" cy="170" r="1.4" fill="#fff6d0"/>`;
  },

  // VII · La force des petits liens : des lanternes reliées par des fils d'or, dans la nuit.
  filet: (i) => {
    const L = [[100, 128, 1.35], [42, 88, 0.9], [160, 80, 1], [34, 170, 0.95], [168, 170, 0.9], [100, 60, 0.8], [98, 198, 0.85]];
    const links = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 5], [2, 5], [1, 3], [2, 4], [3, 6], [4, 6]];
    const lantern = ([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})">
      <circle r="20" fill="url(#${i}g)"/>
      <path d="M-3 -10 C -3 -13.5, 3 -13.5, 3 -10" fill="none" stroke="#b3862a" stroke-width="1.4"/>
      <rect x="-5.5" y="-8.5" width="11" height="17" rx="5.5" fill="#d8a23c"/>
      <ellipse cy="0" rx="2.6" ry="4.4" fill="#fff4d6"/></g>`;
    return `
    <defs>${lin(`${i}s`, [[0, '#1d1942'], [0.6, '#3a2b63'], [1, '#6e4c80']])}${rad(`${i}g`, '#ffd27a', 0.3)}</defs>
    <rect width="200" height="250" fill="url(#${i}s)"/>
    ${dots([[16, 22, 1, 0.8], [70, 14, 1.2, 0.9], [130, 24, 0.9, 0.7], [186, 40, 1.2, 0.8], [14, 130, 0.8, 0.5], [190, 120, 0.9, 0.6]], '#fff1d0')}
    <g fill="none" stroke="#f2c46d" stroke-width="1" stroke-opacity=".75">${links.map(([a, b]) => `<path d="M${L[a][0]} ${L[a][1]} Q ${(L[a][0] + L[b][0]) / 2} ${(L[a][1] + L[b][1]) / 2 + 10} ${L[b][0]} ${L[b][1]}"/>`).join('')}</g>
    <path d="M0 214 C 60 202, 140 208, 200 200 V250 H0 Z" fill="#2a2350"/>
    <path d="M0 234 C 70 224, 130 240, 200 228 V250 H0 Z" fill="#221c45"/>
    ${L.map(lantern).join('')}`;
  },

  // VIII · Ce qui recharge : une lanterne de verre posée sur une dune, où un croissant de lune se remplit de lumière.
  batterie: (i) => `
    <defs>${lin(`${i}s`, [[0, '#fbd9c0'], [0.5, '#e8a99a'], [1, '#7d5a8e']])}${rad(`${i}g`, '#ffd98e', 0.35)}
      ${lin(`${i}m`, [[0, '#fff3da'], [0.45, '#fff3da'], [0.46, '#f2c46d'], [1, '#e9a23b']])}</defs>
    <rect width="200" height="250" fill="url(#${i}s)"/>
    ${dots([[24, 24, 1.1, 0.8], [168, 30, 1.3, 0.9], [60, 56, 0.8, 0.6], [150, 76, 0.9, 0.6]], '#fff6e6')}
    <path d="M0 200 C 50 178, 150 178, 200 200 V250 H0 Z" fill="#d99a6c"/>
    <path d="M0 226 C 60 214, 140 230, 200 218 V250 H0 Z" fill="#c4836a"/>
    <circle cx="100" cy="134" r="60" fill="url(#${i}g)"/>
    <path d="M84 90 C 84 66, 116 66, 116 90" fill="none" stroke="#5b4f6e" stroke-width="3" stroke-linecap="round"/>
    <rect x="80" y="86" width="40" height="8" rx="4" fill="#5b4f6e"/>
    <rect x="70" y="92" width="60" height="86" rx="28" fill="#fff8f0" fill-opacity=".22" stroke="#5b4f6e" stroke-width="3"/>
    <path d="M110 116 A 22 22 0 1 0 110 156 A 17 17 0 1 1 110 116 Z" fill="url(#${i}m)"/>
    <path d="M78 110 C 76 124, 76 144, 80 160" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="66" y="176" width="68" height="9" rx="4.5" fill="#5b4f6e"/>`,

  // IX · La bande passante mentale : trois enveloppes dans une oasis, la troisième garde une pierre de lumière.
  enveloppes: (i) => {
    const env = (x, y, r, glow = false) => `<g transform="rotate(${r} ${x + 16} ${y + 11})">
      <rect x="${x}" y="${y}" width="32" height="22" rx="2.5" fill="#fbf0e2" stroke="#c9a27a" stroke-width="1"/>
      <path d="M${x + 1} ${y + 1} L ${x + 16} ${y + 12} L ${x + 31} ${y + 1}" fill="none" stroke="#c9a27a" stroke-width="1"/>
      ${glow ? `<circle cx="${x + 16}" cy="${y - 2}" r="14" fill="url(#${i}g)"/><circle cx="${x + 16}" cy="${y - 1}" r="4" fill="#fff0b8"/>` : ''}</g>`;
    return `
    <defs>${lin(`${i}s`, [[0, '#fdeede'], [0.6, '#f8dcc2'], [1, '#f0c9a8']])}${rad(`${i}g`, '#ffe08a', 0.3)}${rad(`${i}u`, '#fff0c9')}</defs>
    <rect width="200" height="250" fill="url(#${i}s)"/>
    <circle cx="48" cy="46" r="42" fill="url(#${i}u)"/><circle cx="48" cy="46" r="13" fill="#fff6e6"/>
    <path d="M0 160 C 70 144, 140 152, 200 146 V250 H0 Z" fill="#ecc39c"/>
    <path d="M44 196 V 114 A 56 56 0 0 1 156 114 V 196 H 138 V 116 A 38 38 0 0 0 62 116 V 196 Z" fill="#dcaa84"/>
    <path d="M56 100 A 46 46 0 0 1 104 64" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>
    <path d="M0 200 C 50 190, 80 196, 96 204 L 200 204 V250 H0 Z" fill="#e2ad86"/>
    <ellipse cx="112" cy="222" rx="84" ry="12" fill="#57b9ab"/>
    <ellipse cx="112" cy="222" rx="50" ry="6" fill="#008a7c" opacity=".55"/>
    <g fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1"><ellipse cx="112" cy="222" rx="22" ry="2.2"/><ellipse cx="112" cy="222" rx="38" ry="3.6" stroke-opacity=".35"/></g>
    ${env(52, 176, -8)}${env(86, 172, 3)}${env(120, 176, 9, true)}`;
  },

  // X · L'auto-compassion : un miroir ovale dans le sable ; la brume se lève et laisse voir un soleil levant.
  miroir: (i) => `
    <defs>${lin(`${i}s`, [[0, '#fde3d6'], [0.6, '#f4c4c8'], [1, '#d9a6c4']])}${lin(`${i}in`, [[0, '#fbd6a8'], [0.62, '#f6b99a'], [0.63, '#e8a07a'], [1, '#d88a6c']])}
      <clipPath id="${i}c"><ellipse cx="100" cy="116" rx="40" ry="58"/></clipPath>${rad(`${i}g`, '#fff2c8')}</defs>
    <rect width="200" height="250" fill="url(#${i}s)"/>
    ${dots([[26, 40, 1.2, 0.7], [170, 30, 1, 0.6], [178, 110, 1.1, 0.6]], '#fff6ea')}
    <path d="M0 204 C 60 192, 140 196, 200 202 V250 H0 Z" fill="#e7b99a"/>
    <path d="M0 226 C 70 216, 130 232, 200 220 V250 H0 Z" fill="#d49a84"/>
    <ellipse cx="100" cy="206" rx="40" ry="6" fill="#b47d7a" opacity=".35"/>
    <path d="M86 170 L 76 206 M114 170 L 124 206" stroke="#a8701e" stroke-width="3.4" stroke-linecap="round"/>
    <g clip-path="url(#${i}c)">
      <rect x="56" y="54" width="88" height="126" fill="url(#${i}in)"/>
      <circle cx="100" cy="132" r="30" fill="url(#${i}g)"/>
      <circle cx="100" cy="132" r="12" fill="#fff6e6"/>
      <path d="M56 140 C 76 132, 120 132, 144 140 V180 H56 Z" fill="#e39b78"/>
      <g fill="#fff" opacity=".55"><ellipse cx="86" cy="76" rx="34" ry="11"/><ellipse cx="120" cy="92" rx="26" ry="8" opacity=".7"/><ellipse cx="80" cy="102" rx="20" ry="5" opacity=".5"/></g>
    </g>
    <ellipse cx="100" cy="116" rx="40" ry="58" fill="none" stroke="#c9923a" stroke-width="5"/>
    <ellipse cx="100" cy="116" rx="45" ry="63" fill="none" stroke="#e9c27a" stroke-width="1.2" stroke-opacity=".8"/>
    <circle cx="100" cy="52" r="3.4" fill="#e9c27a"/>`,
};

// Dos commun à toutes les cartes : une carte céleste dorée sur fond indigo.
function back(i) {
  return `
    <defs><radialGradient id="${i}b" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#3f3372"/><stop offset="1" stop-color="#1b1834"/></radialGradient></defs>
    <rect width="200" height="250" fill="url(#${i}b)"/>
    <g fill="none" stroke="#e9c27a" stroke-width="1.1">
      <circle cx="100" cy="125" r="26" stroke-opacity=".9"/><circle cx="100" cy="125" r="48" stroke-opacity=".5"/><circle cx="100" cy="125" r="72" stroke-opacity=".25"/>
      <path d="M100 46 V 80 M100 170 V 204 M18 125 H 70 M130 125 H 182" stroke-linecap="round" stroke-opacity=".85"/>
      <path d="M64 92 C 82 74, 118 74, 136 92" stroke-opacity=".7"/><path d="M64 158 C 82 176, 118 176, 136 158" stroke-opacity=".7"/>
      <path d="M52 52 L 60 60 M148 52 L 140 60 M52 198 L 60 190 M148 198 L 140 190" stroke-opacity=".5" stroke-linecap="round"/>
    </g>
    <circle cx="100" cy="125" r="9" fill="#fff3da"/>
    <circle cx="100" cy="125" r="16" fill="#fff3da" fill-opacity=".18"/>
    ${dots([[100, 46, 2.4], [100, 204, 2.4], [18, 125, 2.4], [182, 125, 2.4], [30, 30, 1.2, 0.7], [170, 32, 1, 0.6], [26, 214, 1, 0.6], [172, 218, 1.2, 0.7], [140, 60, 0.9, 0.5], [62, 190, 0.9, 0.5]], '#ffe2a8')}`;
}

/** Illustration d'une carte (face visible). */
export function atlasArt(gameId, { className = 'atlas-art' } = {}) {
  const i = uid('at');
  const draw = ART[gameId];
  return svgEl(`<svg viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice">${draw ? draw(i) : back(i)}</svg>`, { className });
}

/** Dos de carte (carte encore à découvrir). */
export function atlasBack({ className = 'atlas-art' } = {}) {
  return svgEl(`<svg viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice">${back(uid('bk'))}</svg>`, { className });
}

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
