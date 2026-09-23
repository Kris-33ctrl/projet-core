// Typographie française : espace insécable avant « : ; ! ? » et à l'intérieur des guillemets.
export function fr(text) {
  return String(text)
    .replace(/ ([:;!?»])/g, '\u00A0$1')
    .replace(/« /g, '«\u00A0');
}

// Petit utilitaire de création d'éléments : h('div', { class: 'x', onClick }, enfant…).
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = fr(value);
    else if (key === 'style' && typeof value === 'object') {
      for (const [prop, v] of Object.entries(value)) el.style.setProperty(prop, v);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, value);
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(fr(child)));
  }
  return el;
}

export const sphereColor = (sphere) => `var(--${sphere})`;

export function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  );
}

// Jour de l'appareil au format AAAA-MM-JJ (le check-in suit la journée de la personne, pas celle du serveur).
export function localDay(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDay(day, options = { weekday: 'long', day: 'numeric', month: 'long' }) {
  return new Intl.DateTimeFormat('fr-FR', options).format(new Date(`${day}T12:00:00`));
}

// Pour les lecteurs d'écran : une description qualitative, jamais une note.
export function qualitative(v) {
  if (v === null || v === undefined) return 'non renseignée';
  if (v >= 70) return 'ressources bien disponibles';
  if (v >= 45) return 'en mouvement';
  return 'à recharger en priorité';
}
