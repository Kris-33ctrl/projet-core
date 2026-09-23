// Ressources d'aide : cartes, encarts du bouclier et contenu du bouton « Besoin d'aide ».
// L'interface ne nomme pas le suicide : le 3114 est présenté comme une écoute en cas de grande détresse.

import { h } from '../dom.js';
import { openModal } from './modal.js';

const forProfile = (profile) => (r) => !r.profiles || r.profiles.includes(profile?.status);

export function resourceCard(r) {
  const contact = r.phone
    ? h('a', { class: 'contact', href: `tel:${r.phone.replace(/\s/g, '')}`, text: r.phone })
    : r.url
      ? h('a', { class: 'contact', href: r.url, target: '_blank', rel: 'noopener', text: 'Ouvrir le site ↗' })
      : h('span', { class: 'small muted', text: r.hint ?? '' });
  return h('div', { class: 'resource' }, h('strong', { text: r.name }), h('span', { class: 'small muted', text: r.detail }), contact);
}

const COPY = {
  relais: {
    title: 'On fait une pause.',
    text: "Les données de tes derniers bilans indiquent une zone de surcharge persistante. L'algorithme atteint ses limites ici. Pour faire baisser cette pression, il est fortement conseillé de déléguer à un·e professionnel·le.",
  },
  soutien: {
    title: 'Si tu en ressens le besoin',
    text: "Tes dernières réponses montrent une charge qui mérite d'être partagée. Parler à quelqu'un peut alléger la pression, sans engagement.",
  },
};

export function carePanel(shield) {
  const copy = COPY[shield.level];
  if (!copy) return null;
  return h(
    'section',
    { class: 'panel glass care', 'aria-labelledby': `care-${shield.level}` },
    h('h2', { id: `care-${shield.level}`, text: copy.title }),
    h('p', { class: 'muted', text: copy.text }),
    h('div', { class: 'resources' }, shield.resources.map(resourceCard)),
  );
}

export function specialisedPanel(shield) {
  if (!shield.specialised?.length) return null;
  return h(
    'section',
    { class: 'panel glass', 'aria-labelledby': 'specialised-title' },
    h('h2', { id: 'specialised-title', text: 'Des lignes spécialisées' }),
    h('p', { class: 'small muted', text: 'Anonymes, sans jugement, pour parler des échappatoires qui prennent trop de place.' }),
    h('div', { class: 'resources' }, shield.specialised.map(resourceCard)),
  );
}

// Bouton « Besoin d'aide » : accessible partout, indépendant de tout calcul.
export function openHelp(help, profile) {
  const group = (title, list) =>
    list.length ? h('div', { class: 'help-group' }, h('h3', { text: title }), h('div', { class: 'resources' }, list.map(resourceCard))) : null;
  openModal([
    h('p', { class: 'eyebrow', text: 'Besoin d’aide' }),
    h('h2', { text: 'Tu n’as pas à traverser ça seul·e.' }),
    h('p', { class: 'muted', text: 'En cas de danger immédiat, appelle le 15 ou le 112. Sinon, choisis ce qui te convient, à ton rythme.' }),
    group('Tout de suite', help.urgence),
    group('Parler à quelqu’un', help.ecoute.filter(forProfile(profile))),
    group('Trouver un·e professionnel·le', help.professionnels.filter(forProfile(profile))),
  ]);
}
