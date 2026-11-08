import './styles.css';
import { api, isPersistent, storeReady } from './api.js';
import { h, localDay } from './dom.js';
import { storage } from './storage.js';
import { closeModal } from './components/modal.js';
import { renderWelcome } from './views/welcome.js';
import { runAssessment } from './views/onboarding.js';
import { renderDashboard } from './views/dashboard.js';
import { renderProfile, renderUnderage } from './views/profile.js';
import { renderHome } from './views/home.js';
import { runCheckin } from './views/checkin.js';
import { openHelp } from './components/resources.js';
import { configureExercises } from './components/exercise.js';
import { renderLibrary } from './views/library.js';
import { renderSources } from './views/sources.js';
import { openGame, configureGames } from './games/shell.js';
import { configureEvolution } from './components/evolution.js';
import { brand } from './components/brand.js';
import { emblem } from './art/emblems.js';
import { dunes } from './art/landscapes.js';

// Si le serveur ne répond pas, le bouton « Besoin d'aide » doit quand même fonctionner.
const FALLBACK_HELP = {
  urgence: [
    { id: '3114', name: '3114', detail: 'Écoute professionnelle en cas de grande détresse, 24 h/24, gratuit', phone: '3114' },
    { id: '15', name: 'SAMU (15) ou numéro européen (112)', detail: 'En cas de danger immédiat', phone: '15' },
  ],
  ecoute: [{ id: 'sos-amitie', name: 'SOS Amitié', detail: 'Écoute anonyme, 24 h/24', phone: '09 72 39 40 50' }],
  professionnels: [],
};

const sourcesLink = document.getElementById('sources-link');
const helpFab = document.getElementById('help-fab');
sourcesLink.prepend(emblem('tablet'));
helpFab.prepend(emblem('lantern'));
// L'horizon de fin de page : des dunes sous le lien vers les sources.
document.querySelector('.site-footer').prepend(dunes({ motes: false }));
sourcesLink.addEventListener('click', () => state.meta && showSources());
helpFab.addEventListener('click', () => openHelp(state.meta?.help ?? FALLBACK_HELP, state.user?.profile));

const root = document.getElementById('app');
const state = { meta: null, user: null, history: [], pending: null, persistent: true };

// Seul le fait d'avoir terminé un exercice est noté, jamais ce qui a été écrit pendant.
configureExercises({
  onPractice: (exerciseId, durationSec) => state.user && api.logPractice(state.user.id, exerciseId, { durationSec }).catch(() => {}),
});

// Mini-jeux : la fin d'une partie débloque une carte et un éclat ; l'écran d'accueil se met à jour ensuite.
configureGames({ onPlayed: (gameId, durationSec) => (state.user ? api.logPractice(state.user.id, gameId, { durationSec }) : Promise.resolve(null)) });
configureEvolution({ onPlay: (game) => play(game, { refresh: false }) });

function play(game, { refresh = true } = {}) {
  openGame(game, {
    onClose: refresh ? guard(() => showHome()) : () => {},
    onAtlas: guard(async () => {
      state.today = await api.today(state.user.id, localDay());
      showLibrary();
    }),
  });
}
let teardown = null;

function mount(render) {
  teardown?.();
  closeModal();
  root.replaceChildren();
  teardown = render(root) ?? null;
  window.scrollTo({ top: 0 });
}

function showError(err) {
  mount((el) => {
    el.append(
      h(
        'div',
        { class: 'flow' },
        brand(),
        h('p', { class: 'error-banner', role: 'alert', text: `Quelque chose s’est mal passé : ${err.message}` }),
        h('p', { class: 'small muted', text: 'Tes données restent sur cet appareil. Recharge la page pour réessayer.' }),
        h('button', { type: 'button', class: 'btn btn-primary', onClick: boot }, 'Réessayer'),
      ),
    );
  });
}

async function ensureUser() {
  const known = storage.get('userId');
  if (known) {
    try {
      return await api.getUser(known);
    } catch (err) {
      if (err.status !== 404) throw err;
    }
  }
  const user = await api.createUser();
  storage.set('userId', user.id);
  return { ...user, profile: null };
}

async function loadPending() {
  const id = storage.get('assessment');
  if (!id) return null;
  try {
    const a = await api.getAssessment(id);
    if (!a.completedAt) return a;
  } catch {
    /* bilan introuvable : on repart de zéro */
  }
  storage.set('assessment', null);
  return null;
}

function showWelcome() {
  mount((el) =>
    renderWelcome(el, {
      meta: state.meta,
      history: state.history,
      pending: state.pending,
      onStart: guard(startAssessment),
      onResume: () => showFlow(state.pending),
      onOpenResult: guard(openResult),
      onLibrary: guard(showLibrary),
    }),
  );
}

function showFlow(assessment) {
  mount((el) =>
    runAssessment(el, {
      meta: state.meta,
      assessment,
      onDone: guard(async (result) => {
        storage.set('assessment', null);
        state.pending = null;
        state.history = await api.history(state.user.id);
        showDashboard(result);
      }),
      onExit: guard(async () => {
        state.pending = await loadPending();
        state.history.length ? await showHome() : showWelcome();
      }),
    }),
  );
}

function showDashboard(result) {
  mount((el) =>
    renderDashboard(el, {
      meta: state.meta,
      result,
      history: state.history,
      onRestart: guard(startAssessment),
      onOpenResult: guard(openResult),
      onHome: guard(() => showHome()),
    }),
  );
}

function showProfile() {
  mount((el) =>
    renderProfile(el, {
      profile: state.user.profile,
      onBack: guard(() => (state.history.length ? showHome() : showWelcome())),
      onSubmit: async (answer) => {
        state.user = await api.setProfile(state.user.id, answer);
        if (!answer.adult) return showUnderage();
        await startAssessment();
      },
    }),
  );
}

// Accueil des personnes déjà suivies. `view` évite un aller-retour quand on vient de faire le check-in.
async function showHome(view = null) {
  state.today = view ?? (await api.today(state.user.id, localDay()));
  mount((el) =>
    renderHome(el, {
      meta: state.meta,
      today: state.today,
      history: state.history,
      pending: state.pending,
      persistent: state.persistent,
      onCheckin: (plan) => showCheckin(plan),
      onBilan: guard(startAssessment),
      onResume: () => showFlow(state.pending),
      onOpenResult: guard(openResult),
      onLibrary: guard(showLibrary),
      onErase: guard(eraseEverything),
      onPlay: (game) => play(game),
    }),
  );
}

async function showLibrary() {
  state.today = await api.today(state.user.id, localDay());
  mount((el) =>
    renderLibrary(el, {
      meta: state.meta,
      today: state.today,
      onBack: guard(() => (state.history.length ? showHome() : showWelcome())),
      onPlay: (game) =>
        openGame(game, {
          onClose: guard(async () => {
            state.today = await api.today(state.user.id, localDay());
            showLibrary();
          }),
        }),
    }),
  );
}

function showSources() {
  mount((el) =>
    renderSources(el, {
      meta: state.meta,
      onBack: guard(() => (state.history.length ? showHome() : showWelcome())),
    }),
  );
}

async function eraseEverything() {
  await api.eraseEverything();
  storage.set('userId', null);
  storage.set('assessment', null);
  location.reload();
}

function showCheckin(plan) {
  mount((el) =>
    runCheckin(el, {
      meta: state.meta,
      userId: state.user.id,
      plan,
      onDone: (view) => showHome(view),
      onExit: guard(() => showHome()),
    }),
  );
}

function showUnderage() {
  mount((el) => renderUnderage(el, { onBack: showProfile }));
}

async function startAssessment() {
  // Carte « avant de commencer » au premier bilan : situation et confirmation 18 ans et plus.
  if (!state.user.profile) return showProfile();
  if (!state.user.profile.adult) return showUnderage();
  const a = await api.startAssessment(state.user.id);
  storage.set('assessment', a.id);
  state.pending = null;
  showFlow(a);
}

async function openResult(id) {
  showDashboard(await api.result(id));
}

function guard(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      showError(err);
    }
  };
}

async function boot() {
  try {
    state.meta = await api.meta();
    state.persistent = await isPersistent();
    state.user = await ensureUser();
    state.history = await api.history(state.user.id);
    state.pending = await loadPending();
    state.history.length ? await showHome() : showWelcome();
  } catch (err) {
    showError(err);
  }
}

boot();

// Outils de développement (npm run dev uniquement) : scénarios de démo, bilan et check-in express.
if (import.meta.env.DEV) {
  import('./dev/panel.js').then(({ mountDevPanel }) =>
    mountDevPanel({
      api,
      storeReady,
      getState: () => state,
      actions: {
        refresh: async () => {
          if (state.user) state.history = await api.history(state.user.id);
        },
        openResult: (id) => openResult(id),
        home: () => showHome(),
      },
    }),
  );
}
