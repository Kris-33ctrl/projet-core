// Accueil des personnes déjà suivies : check-in du jour, bilan de la semaine, « ta semaine », bouclier.

import { h, formatDay, localDay } from '../dom.js';
import { createBlob } from '../components/blob.js';
import { openExercise } from '../components/exercise.js';
import { carePanel } from '../components/resources.js';
import { weekPanel, todayLevels } from '../components/week.js';
import { exerciseCard } from './library.js';

function toolboxPanel(meta, today, onLibrary) {
  const byId = Object.fromEntries(meta.exercises.map((e) => [e.id, e]));
  const practiced = new Set(today.practices.map((p) => p.exerciseId));
  const picks = (today.lastBilan?.recommendations ?? []).map((id) => byId[id]).filter(Boolean).slice(0, 3);
  const n = today.practices.length;
  return h(
    'section',
    { class: 'panel glass', 'aria-labelledby': 'toolbox-title' },
    h(
      'div',
      { class: 'panel-head' },
      h('h2', { id: 'toolbox-title', text: 'Ta boîte à outils' }),
      h('span', { class: 'small muted', text: n ? `${n} exercice${n > 1 ? 's' : ''} pratiqué${n > 1 ? 's' : ''} ces 7 derniers jours` : 'Des exercices courts, à faire quand tu veux' }),
    ),
    picks.length ? h('div', { class: 'library-grid' }, picks.map((e) => exerciseCard(e, { practiced: practiced.has(e.id) }))) : null,
    h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn btn-quiet', onClick: onLibrary }, `Voir les ${meta.exercises.length} exercices`)),
  );
}

// Local-first : les données restent sur l'appareil, et la personne peut tout effacer.
function privacyFooter(persistent, onErase) {
  const erase = h('button', { type: 'button', class: 'btn btn-ghost btn-small' }, 'Effacer toutes mes données');
  const confirm = h('span', { class: 'erase-confirm', hidden: true },
    h('span', { class: 'small', text: 'Tous tes bilans, check-ins et exercices seront supprimés de cet appareil. ' }),
    h('button', { type: 'button', class: 'btn btn-quiet btn-small', onClick: onErase }, 'Oui, tout effacer'),
    h('button', { type: 'button', class: 'btn btn-ghost btn-small', onClick: () => ((confirm.hidden = true), (erase.hidden = false)) }, 'Annuler'),
  );
  erase.addEventListener('click', () => ((erase.hidden = true), (confirm.hidden = false)));
  return h(
    'div',
    { class: 'privacy' },
    h('p', { class: 'small muted', text: persistent ? 'Tes données restent sur cet appareil : rien n’est envoyé sur internet.' : 'Ton navigateur bloque le stockage local : tes réponses disparaîtront à la fermeture de la page.' }),
    erase,
    confirm,
  );
}

function checkinCard(today, onCheckin) {
  const done = today.checkin;
  if (done) {
    const suggestion = done.summary.suggestion;
    return h(
      'section',
      { class: 'panel glass hub-card', 'aria-labelledby': 'checkin-title' },
      h('span', { class: 'eyebrow', text: 'Check-in du jour' }),
      h('h2', { id: 'checkin-title', text: 'C’est noté pour aujourd’hui.' }),
      todayLevels(done.summary),
      suggestion
        ? h(
            'button',
            { type: 'button', class: 'nudge', onClick: () => openExercise(suggestion) },
            h('span', { class: 'nudge-meta' }, h('span', { text: 'Pour ta journée' }), h('span', { text: suggestion.duration })),
            h('h3', { text: suggestion.title }),
            h('span', { class: 'small muted', text: suggestion.summary }),
          )
        : h('p', { class: 'muted', text: 'Rien de particulier à ajuster aujourd’hui. À demain.' }),
    );
  }

  const screening = today.plan.some((q) => q.type === 'frequency');
  return h(
    'section',
    { class: 'panel glass hub-card', 'aria-labelledby': 'checkin-title' },
    h('span', { class: 'eyebrow', text: 'Check-in du jour · 30 secondes' }),
    h('h2', { id: 'checkin-title', text: 'Comment tu vas aujourd’hui ?' }),
    h('p', { class: 'muted', text: 'Quatre cartes pour suivre ta batterie, ta météo et ton espace de pensée au fil des jours.' }),
    screening ? h('p', { class: 'small muted', text: 'Aujourd’hui s’ajoutent 4 questions de repérage : compte une minute de plus.' }) : null,
    h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn btn-primary', onClick: () => onCheckin(today.plan) }, 'Faire mon check-in')),
  );
}

function bilanCard(today, pending, { onBilan, onResume, onOpenResult }, blobHost) {
  const n = today.nextBilanInDays;
  let title;
  let text;
  let actions;
  if (pending) {
    title = 'Ton bilan est en cours.';
    text = 'Tes réponses sont gardées : reprends là où tu t’étais arrêté·e.';
    actions = [h('button', { type: 'button', class: 'btn btn-primary', onClick: onResume }, 'Reprendre le bilan')];
  } else if (today.bilanDue) {
    title = 'C’est le moment de ton bilan de la semaine.';
    text = 'Environ 4 minutes pour refaire le point sur tes cinq sphères.';
    actions = [h('button', { type: 'button', class: 'btn btn-primary', onClick: onBilan }, 'Commencer le bilan')];
  } else {
    title = `Prochain bilan dans ${n} jour${n > 1 ? 's' : ''}.`;
    text = 'Le bilan complet revient une fois par semaine. D’ici là, le check-in suffit.';
    actions = [h('button', { type: 'button', class: 'btn btn-ghost', onClick: onBilan }, 'Le faire maintenant')];
  }
  if (today.lastBilan) {
    actions.push(h('button', { type: 'button', class: 'btn btn-quiet', onClick: () => onOpenResult(today.lastBilan.id) }, 'Revoir mon dernier bilan'));
  }
  return h(
    'section',
    { class: 'panel glass hub-card hub-bilan', 'aria-labelledby': 'bilan-title' },
    blobHost,
    h(
      'div',
      { class: 'hub-bilan-copy' },
      h('span', { class: 'eyebrow', text: 'Bilan complet' }),
      h('h2', { id: 'bilan-title', text: title }),
      h('p', { class: 'muted', text }),
      h('div', { class: 'actions' }, actions),
    ),
  );
}

export function renderHome(root, { meta, today, history, pending, persistent, onCheckin, onBilan, onResume, onOpenResult, onLibrary, onErase }) {
  const shield = today.shield;
  const blobHost = h('div', { class: 'mini-blob' });
  const bilanDays = history.map((b) => localDay(new Date(b.completedAt)));

  root.append(
    h(
      'div',
      { class: 'dash' },
      h('header', { class: 'dash-head' }, h('span', { class: 'brand', text: 'core' }), h('span', { class: 'small muted', text: formatDay(today.day) })),
      shield.level === 'relais' ? carePanel(shield) : null,
      h('div', { class: 'hub' }, checkinCard(today, onCheckin), bilanCard(today, pending, { onBilan, onResume, onOpenResult }, blobHost)),
      weekPanel({ week: today.week, today: today.day, bilanDays }),
      toolboxPanel(meta, today, onLibrary),
      shield.level === 'soutien' ? carePanel(shield) : null,
      h('p', { class: 'disclaimer', text: meta.disclaimer }),
      privacyFooter(persistent, onErase),
    ),
  );

  const blob = today.lastBilan
    ? createBlob(blobHost, { levels: today.lastBilan.spheres, harmony: today.lastBilan.harmony, calm: shield.pauseGamification })
    : null;
  return () => blob?.destroy();
}
