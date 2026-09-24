// Signature de l'app : le mot « core » précédé de son astre. Cliquable quand elle ramène à l'accueil.

import { h } from '../dom.js';
import { emblem } from '../art/emblems.js';

export function brand({ onClick } = {}) {
  const content = [emblem('core'), h('span', { text: 'core' })];
  return onClick
    ? h('button', { type: 'button', class: 'brand', onClick, 'aria-label': 'Core, retour à l’accueil' }, content)
    : h('span', { class: 'brand' }, content);
}
