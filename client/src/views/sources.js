// Sources et méthode : lexique des notions et bibliographie vérifiée, avec ce que chaque référence justifie.

import { h, formatDay } from '../dom.js';
import { shortCite, doiUrl } from '@core/engine';
import { emblem } from '../art/emblems.js';

function citation(source) {
  return h(
    'li',
    { id: `src-${source.id}`, class: 'source' },
    h(
      'p',
      { class: 'cite' },
      h('strong', { text: `${source.authors} (${source.year}).` }),
      ` ${source.title}. `,
      h('em', { text: source.venue }),
      '. ',
      h('a', { href: doiUrl(source.doi), target: '_blank', rel: 'noopener', text: `doi:${source.doi}` }),
    ),
    h('p', { class: 'small muted', text: `Dans Core : ${source.usedFor}` }),
  );
}

export function renderSources(root, { meta, onBack }) {
  const { list, categories, glossary, checkedOn } = meta.sources;
  const byId = Object.fromEntries(list.map((s) => [s.id, s]));

  const goTo = (id) => (event) => {
    event.preventDefault();
    const target = document.getElementById(`src-${id}`);
    target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    target?.classList.add('flash');
    setTimeout(() => target?.classList.remove('flash'), 1600);
  };

  root.append(
    h(
      'div',
      { class: 'dash sources-page' },
      h('header', { class: 'dash-head' }, h('button', { type: 'button', class: 'btn btn-ghost', onClick: onBack }, '← Retour')),
      h(
        'div',
        { class: 'hero-copy page-title' },
        emblem('tablet'),
        h('span', { class: 'eyebrow', text: 'Transparence' }),
        h('h1', { text: 'Sources et méthode' }),
        h('p', {
          class: 'lead',
          text: 'Core s’appuie sur des outils et des travaux publiés. Voici les notions clés pour comprendre son raisonnement, puis chaque référence avec ce qu’elle justifie dans l’app.',
        }),
      ),
      h(
        'p',
        { class: 'notice-card' },
        'Les cartes du bilan s’inspirent d’échelles validées sans en reprendre les versions complètes : les jauges de Core ne remplacent pas ces outils. Seul le repérage (PHQ-2, GAD-2, PHQ-4) utilise des questions validées, adaptées au tutoiement.',
      ),
      h(
        'section',
        { class: 'panel glass', 'aria-labelledby': 'lexique' },
        h('h2', { id: 'lexique', text: 'Lexique' }),
        h(
          'dl',
          { class: 'glossary' },
          glossary.map((entry) => [
            h('dt', { text: entry.term }),
            h(
              'dd',
              {},
              h('span', { text: entry.definition }),
              entry.sources?.length
                ? h(
                    'span',
                    { class: 'refs' },
                    entry.sources.map((id) => h('a', { href: `#src-${id}`, onClick: goTo(id), text: shortCite(byId[id]) })),
                  )
                : null,
            ),
          ]),
        ),
      ),
      categories.map((category) =>
        h(
          'section',
          { class: 'panel glass', 'aria-labelledby': `cat-${category.id}` },
          h('h2', { id: `cat-${category.id}`, text: category.label }),
          h('p', { class: 'muted', text: category.intro }),
          h('ul', { class: 'sources' }, list.filter((s) => s.category === category.id).map(citation)),
        ),
      ),
      h('p', { class: 'small muted', text: `${list.length} références, vérifiées le ${formatDay(checkedOn, { day: 'numeric', month: 'long', year: 'numeric' })} dans Crossref et Europe PMC. Le document de départ reste le Document Maître du projet.` }),
    ),
  );
}
