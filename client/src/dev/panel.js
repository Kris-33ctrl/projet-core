// Outils de développement : visibles uniquement avec `npm run dev` (import.meta.env.DEV),
// absents de la version compilée. Ils écrivent dans le même stockage local que l'app.

import { DEMO_SCENARIOS, getScenario, autoAnswer, seedDemo } from '@core/engine';
import { h, localDay } from '../dom.js';
import { storage } from '../storage.js';
import { openModal, closeModal } from '../components/modal.js';

export function mountDevPanel({ api, storeReady, getState, actions }) {
  const button = h('button', { type: 'button', class: 'dev-fab', title: 'Outils de développement' }, 'DEV');
  button.addEventListener('click', () => open());
  document.body.append(button);

  const selected = () => getScenario(document.getElementById('dev-scenario')?.value);

  // Un profil prêt à faire un bilan : créé et complété si besoin, avec la situation du scénario.
  async function ensureProfile(scenario) {
    const state = getState();
    let user = state.user;
    if (!user) user = await api.createUser();
    if (!user.profile?.adult) user = await api.setProfile(user.id, { status: scenario.status, adult: true });
    storage.set('userId', user.id);
    state.user = user;
    return user;
  }

  // Chaque action affiche son état dans le panneau ; une erreur y reste lisible.
  function runner(status) {
    return (label, fn) => async () => {
      status.textContent = `${label}…`;
      try {
        await fn();
      } catch (err) {
        status.textContent = `Échec : ${err.message}`;
      }
    };
  }

  function open() {
    const state = getState();
    const status = h('p', { class: 'small muted dev-status', 'aria-live': 'polite' });
    const run = runner(status);

    const loadScenario = (scenario) =>
      run(`Génération du scénario « ${scenario.label} »`, async () => {
        const store = await storeReady;
        await store.clear();
        const userId = await seedDemo(store, scenario.id);
        storage.set('userId', userId);
        storage.set('assessment', null);
        location.reload();
      });

    const express = run('Bilan express', async () => {
      const scenario = selected();
      const user = await ensureProfile(scenario);
      let flow = await api.startAssessment(user.id);
      const id = flow.id;
      while (flow.next) flow = await api.answer(id, flow.next.id, autoAnswer(flow.next, scenario, 2));
      await api.complete(id);
      storage.set('assessment', null);
      await actions.refresh();
      closeModal();
      await actions.openResult(id);
    });

    const checkin = run('Check-in express', async () => {
      const scenario = selected();
      const user = getState().user;
      if (!user) throw new Error('aucun profil : charge un scénario ou fais un bilan express d’abord.');
      const today = await api.today(user.id, localDay());
      if (!today.lastBilan) throw new Error('le check-in démarre après un premier bilan.');
      if (!today.plan.length) throw new Error('le check-in du jour est déjà fait.');
      await api.checkin(user.id, localDay(), Object.fromEntries(today.plan.map((q) => [q.id, autoAnswer(q, scenario, 2)])));
      closeModal();
      await actions.home();
    });

    const lastBilan = run('Ouverture du dernier bilan', async () => {
      await actions.refresh();
      const [last] = getState().history;
      if (!last) throw new Error('aucun bilan pour le moment.');
      closeModal();
      await actions.openResult(last.id);
    });

    const wipe = run('Effacement', async () => {
      await (await storeReady).clear();
      storage.set('userId', null);
      storage.set('assessment', null);
      location.reload();
    });

    const user = state.user;
    openModal([
      h('p', { class: 'eyebrow', text: 'Mode développement' }),
      h('h2', { text: 'Outils de développement' }),
      h('p', {
        class: 'small muted',
        text: user
          ? `Profil ${user.id.slice(0, 8)} · ${user.profile?.status ?? 'sans profil'} · ${state.history.length} bilan${state.history.length > 1 ? 's' : ''}`
          : 'Aucun profil pour le moment.',
      }),

      h('h3', { text: 'Scénarios de démo' }),
      h('p', { class: 'small muted', text: 'Remplace les données de ce navigateur par 3 semaines d’historique : bilans il y a 16, 9 et 2 jours, check-ins quotidiens, exercices.' }),
      h(
        'div',
        { class: 'dev-scenarios' },
        DEMO_SCENARIOS.map((s) =>
          h('button', { type: 'button', class: 'nudge', onClick: loadScenario(s) }, h('h3', { text: s.label }), h('span', { class: 'small muted', text: s.description })),
        ),
      ),

      h('h3', { text: 'Raccourcis' }),
      h(
        'label',
        { class: 'dev-select', for: 'dev-scenario' },
        h('span', { class: 'small', text: 'Réponses automatiques façon' }),
        h('select', { id: 'dev-scenario' }, DEMO_SCENARIOS.map((s) => h('option', { value: s.id, text: s.label }))),
      ),
      h(
        'div',
        { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn-primary btn-small', onClick: express }, 'Bilan express'),
        h('button', { type: 'button', class: 'btn btn-quiet btn-small', onClick: checkin }, 'Check-in express'),
        h('button', { type: 'button', class: 'btn btn-quiet btn-small', onClick: lastBilan }, 'Dernier bilan'),
        h('button', { type: 'button', class: 'btn btn-ghost btn-small', onClick: wipe }, 'Tout effacer'),
      ),
      status,
    ]);
  }
}
