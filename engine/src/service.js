// Service Core : toute la logique applicative, indépendante du stockage.
// Local-first : dans le navigateur, le stockage est IndexedDB et aucune donnée ne quitte l'appareil.
// Dans les tests, c'est un stockage en mémoire. Un futur serveur de synchronisation réutilisera ce service.
//
// Stockage attendu (asynchrone) : get(collection, id), put(collection, record), list(collection, userId), clear().
// Collections : users, assessments, screenings, checkins, practices. Chaque enregistrement a un `id`,
// et tous sauf users portent un `userId`.

import {
  SPHERES,
  SPHERE_LABELS,
  SPHERE_SUBTITLES,
  PROFILE_STATUSES,
} from './config.js';
import { QUESTIONS, SPHERE_INTROS, publicQuestion } from './questions.js';
import { getNextQuestion, getProgress, normalizeAnswer, pruneAnswers, AnswerError } from './flow.js';
import { computeResult, SUB_LABELS, SPHERE_WEIGHTS } from './scoring.js';
import { scoreScreening } from './screening.js';
import { evaluateShield, screeningContext, vigilanceSignals, RESOURCES } from './triage.js';
import { planCheckin, summarizeCheckin } from './checkin.js';
import { recommend, EXERCISES, EXERCISE_CATEGORIES } from './recommendations.js';
import { compareResults } from './comparison.js';
import { SOURCES, SOURCE_CATEGORIES, GLOSSARY, SOURCES_CHECKED_ON, sourceById } from './sources.js';
import { GAMES, READY_GAMES, RELAY_GAMES } from './games.js';

export const DISCLAIMER =
  "Core est un outil de prévention et de connaissance de soi. Il ne pose pas de diagnostic et ne remplace pas un avis médical ou psychologique.";

export class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const BILAN_EVERY_DAYS = 7;

const uuid = () => globalThis.crypto.randomUUID();
const newestFirst = (key) => (a, b) => String(b[key]).localeCompare(String(a[key]));
const valuesOf = (assessment) => Object.fromEntries(Object.entries(assessment.answers).map(([id, a]) => [id, a.value]));

export function createCoreService(store, { clock = () => new Date() } = {}) {
  const nowIso = () => clock().toISOString();

  // ── Lecture ─────────────────────────────────────────────────────────
  async function requireUser(id) {
    const user = id ? await store.get('users', id) : null;
    if (!user) throw new ServiceError(404, 'Profil introuvable.');
    return user;
  }

  async function requireAssessment(id) {
    const a = id ? await store.get('assessments', id) : null;
    if (!a) throw new ServiceError(404, 'Bilan introuvable.');
    return a;
  }

  async function completedBilans(userId) {
    return (await store.list('assessments', userId)).filter((a) => a.completedAt).sort(newestFirst('completedAt'));
  }

  const resultView = (a) => ({ id: a.id, completedAt: a.completedAt, ...a.result });

  async function screenings(userId) {
    return (await store.list('screenings', userId)).sort(newestFirst('takenAt'));
  }

  async function recentCheckins(userId, sinceDays = 21) {
    const since = new Date(clock().getTime() - sinceDays * DAY_MS).toISOString().slice(0, 10);
    return (await store.list('checkins', userId))
      .filter((c) => c.day >= since)
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((c) => ({ day: c.day, summary: c.summary }));
  }

  // Éclats et Atlas : ce qui est acquis ne se perd jamais. Les pratiques faites en relais restent discrètes.
  async function progression(userId) {
    const counted = (await store.list('practices', userId)).filter((p) => !p.quiet);
    return {
      eclats: counted.length,
      atlas: [...new Set(counted.filter((p) => p.kind === 'game').map((p) => p.activityId))],
    };
  }

  async function recentPractices(userId, sinceDays = 14) {
    const since = new Date(clock().getTime() - sinceDays * DAY_MS).toISOString();
    return (await store.list('practices', userId)).filter((p) => p.completedAt >= since).sort(newestFirst('completedAt'));
  }

  async function shieldFor(user, lastResult) {
    return evaluateShield({
      lastResult,
      screenings: await screenings(user.id),
      checkins: await recentCheckins(user.id),
      profile: user.profile,
      now: clock(),
    });
  }

  async function saveScreening(userId, answers, source) {
    const score = scoreScreening(answers);
    if (score) await store.put('screenings', { id: uuid(), userId, takenAt: nowIso(), source, ...score });
    return score;
  }

  function flowState(assessment, profile = null) {
    const answers = pruneAnswers(valuesOf(assessment), assessment.context);
    const next = getNextQuestion(answers, assessment.context);
    return { answers, next: publicQuestion(next, profile), progress: getProgress(answers, assessment.context) };
  }

  function requireDay(day) {
    if (!DAY_PATTERN.test(day ?? '')) throw new ServiceError(400, 'Jour attendu au format AAAA-MM-JJ.');
    const offset = Math.abs(new Date(`${day}T12:00:00Z`) - clock());
    if (!Number.isFinite(offset) || offset > 2 * DAY_MS) throw new ServiceError(400, 'Le check-in ne concerne que la journée en cours.');
    return day;
  }

  // Bilan terminé + comparaison avec le bilan précédent (calculée à la lecture, jamais figée).
  async function bilanWithComparison(assessment) {
    const bilans = await completedBilans(assessment.userId);
    const previous = bilans.find((b) => b.completedAt < assessment.completedAt);
    return {
      ...resultView(assessment),
      comparison: previous ? compareResults(assessment.result, previous.result, { since: previous.completedAt }) : null,
    };
  }

  // ── API ─────────────────────────────────────────────────────────────
  const service = {
    async meta() {
      return {
        spheres: SPHERES.map((id) => ({
          id,
          label: SPHERE_LABELS[id],
          subtitle: SPHERE_SUBTITLES[id],
          intro: SPHERE_INTROS[id],
          baseQuestions: QUESTIONS.filter((q) => q.sphere === id && !q.condition).length,
          subs: Object.keys(SPHERE_WEIGHTS[id]).map((sub) => ({ id: sub, label: SUB_LABELS[sub] })),
        })),
        help: { urgence: RESOURCES.urgence, ecoute: RESOURCES.ecoute, professionnels: RESOURCES.professionnels },
        exercises: EXERCISES,
        exerciseCategories: EXERCISE_CATEGORIES,
        games: GAMES.map((g) => ({ ...g, card: { ...g.card, sources: g.card.sources.map((id) => sourceById[id]) } })),
        relayGames: RELAY_GAMES,
        sources: { list: SOURCES, categories: SOURCE_CATEGORIES, glossary: GLOSSARY, checkedOn: SOURCES_CHECKED_ON },
        disclaimer: DISCLAIMER,
      };
    },

    async createUser() {
      const user = { id: uuid(), createdAt: nowIso(), profile: null };
      await store.put('users', user);
      return user;
    },

    getUser: requireUser,

    // Carte « avant de commencer » : situation et confirmation 18 ans et plus.
    async setProfile(id, { status, adult } = {}) {
      const user = await requireUser(id);
      if (!PROFILE_STATUSES.includes(status)) throw new ServiceError(400, `Situation attendue : ${PROFILE_STATUSES.join(', ')}.`);
      if (typeof adult !== 'boolean') throw new ServiceError(400, 'Indique si tu as 18 ans ou plus.');
      const updated = { ...user, profile: { status, adult } };
      await store.put('users', updated);
      return updated;
    },

    async history(userId) {
      await requireUser(userId);
      return (await completedBilans(userId)).slice(0, 30).map((a) => ({
        id: a.id,
        completedAt: a.completedAt,
        spheres: a.result.spheres,
        subs: a.result.subs,
        harmony: a.result.harmony,
        triageLevel: a.result.triage?.level ?? 'none',
      }));
    },

    // Vue « aujourd'hui » : check-in du jour, semaine, prochain bilan, bouclier, exercices récents.
    async today(userId, day) {
      const user = await requireUser(userId);
      requireDay(day);
      const [last] = await completedBilans(user.id);
      const lastResult = last ? resultView(last) : null;
      const week = await recentCheckins(user.id);
      const shield = await shieldFor(user, lastResult);
      const todayCheckin = week.find((c) => c.day === day) ?? null;
      const daysSinceBilan = last ? (clock() - new Date(last.completedAt)) / DAY_MS : null;
      return {
        day,
        checkin: todayCheckin,
        plan: last && !todayCheckin ? planCheckin({ lastResult, screeningDue: shield.screeningDue, profile: user.profile }) : [],
        week,
        practices: (await recentPractices(user.id, 7)).map((p) => ({ activityId: p.activityId, kind: p.kind, completedAt: p.completedAt })),
        ...(await progression(user.id)),
        shield,
        lastBilan: last
          ? {
              id: last.id,
              completedAt: last.completedAt,
              spheres: last.result.spheres,
              harmony: last.result.harmony,
              recommendations: (last.result.recommendations ?? []).map((r) => r.id),
            }
          : null,
        bilanDue: daysSinceBilan === null || daysSinceBilan >= BILAN_EVERY_DAYS,
        nextBilanInDays: daysSinceBilan === null ? 0 : Math.max(0, Math.ceil(BILAN_EVERY_DAYS - daysSinceBilan)),
      };
    },

    // Check-in du jour : toutes les cartes du plan d'un coup ; le refaire le même jour remplace le précédent.
    async checkin(userId, day, rawAnswers = {}) {
      const user = await requireUser(userId);
      requireDay(day);
      const [last] = await completedBilans(user.id);
      if (!last) throw new ServiceError(409, 'Le check-in démarre après ton premier bilan complet.');
      const lastResult = resultView(last);
      const plan = planCheckin({ lastResult, screeningDue: (await shieldFor(user, lastResult)).screeningDue });

      const answers = {};
      try {
        for (const question of plan) {
          if (!(question.id in rawAnswers)) throw new AnswerError(`Il manque la réponse à « ${question.prompt} »`);
          answers[question.id] = normalizeAnswer(question.id, rawAnswers[question.id]);
        }
      } catch (err) {
        if (err instanceof AnswerError) throw new ServiceError(400, err.message);
        throw err;
      }

      await store.put('checkins', { id: `${user.id}:${day}`, userId: user.id, day, answers, summary: summarizeCheckin(answers), createdAt: nowIso() });
      await saveScreening(user.id, answers, 'checkin');
      return service.today(userId, day);
    },

    // Un exercice ou un mini-jeu terminé. Rien de ce qui a été écrit ou joué n'est gardé, seulement le fait.
    // En relais, la pratique est notée discrètement : pas d'éclat ni de carte nouvelle, l'enjeu est ailleurs.
    async logPractice(userId, activityId, { durationSec = null } = {}) {
      const user = await requireUser(userId);
      const kind = EXERCISES.some((e) => e.id === activityId) ? 'exercise' : READY_GAMES.some((g) => g.id === activityId) ? 'game' : null;
      if (!kind) throw new ServiceError(400, `Activité inconnue : ${activityId}`);
      const [last] = await completedBilans(user.id);
      const shield = await shieldFor(user, last ? resultView(last) : null);
      const before = await progression(user.id);
      const record = { id: uuid(), userId, activityId, kind, durationSec, quiet: shield.level === 'relais', completedAt: nowIso() };
      await store.put('practices', record);
      const after = await progression(user.id);
      return { ...record, ...after, newCard: after.atlas.length > before.atlas.length };
    },

    async startAssessment(userId) {
      const user = await requireUser(userId);
      if (!user.profile) throw new ServiceError(409, 'Complète la carte « avant de commencer » d’abord.');
      if (!user.profile.adult) throw new ServiceError(403, 'Core est pensé pour les personnes de 18 ans et plus.');

      // Le PHQ-4 est-il dû ? Figé maintenant pour que le déroulé ne change pas en cours de bilan.
      const [last] = await completedBilans(user.id);
      const vigilance = vigilanceSignals({ lastResult: last ? resultView(last) : null, checkins: await recentCheckins(user.id), now: clock() });
      const context = screeningContext({ screenings: await screenings(user.id), vigilance, now: clock() });

      const assessment = { id: uuid(), userId: user.id, startedAt: nowIso(), completedAt: null, context, answers: {}, result: null };
      await store.put('assessments', assessment);
      return { id: assessment.id, ...flowState(assessment, user.profile) };
    },

    async getAssessment(id) {
      const a = await requireAssessment(id);
      const user = await store.get('users', a.userId);
      return { id: a.id, startedAt: a.startedAt, completedAt: a.completedAt, ...flowState(a, user?.profile) };
    },

    async answer(id, questionId, value) {
      const a = await requireAssessment(id);
      if (a.completedAt) throw new ServiceError(409, 'Ce bilan est déjà terminé.');
      let normalized;
      try {
        normalized = normalizeAnswer(questionId, value);
      } catch (err) {
        if (err instanceof AnswerError) throw new ServiceError(400, err.message);
        throw err;
      }
      // Réponses horodatées : elles serviront aux mesures IHM (temps par carte, abandons).
      const updated = { ...a, answers: { ...a.answers, [questionId]: { value: normalized, answeredAt: nowIso() } } };
      await store.put('assessments', updated);
      const user = await store.get('users', a.userId);
      return flowState(updated, user?.profile);
    },

    async complete(id) {
      const a = await requireAssessment(id);
      if (a.completedAt) return bilanWithComparison(a);
      const { answers, next } = flowState(a);
      if (next) throw new ServiceError(409, 'Le bilan n’est pas terminé.');

      const user = await requireUser(a.userId);
      await saveScreening(user.id, answers, 'bilan');
      const result = computeResult(answers);
      const triage = await shieldFor(user, result);
      const completed = { ...a, completedAt: nowIso(), result: { ...result, triage, recommendations: recommend(result, triage) } };
      await store.put('assessments', completed);
      return bilanWithComparison(completed);
    },

    async result(id) {
      const a = await requireAssessment(id);
      if (!a.completedAt) throw new ServiceError(409, 'Le bilan n’est pas terminé.');
      return bilanWithComparison(a);
    },

    // Droit à l'effacement : tout ce qui est sur cet appareil disparaît.
    async eraseEverything() {
      await store.clear();
    },
  };
  return service;
}

export function memoryStore() {
  const collections = new Map();
  const col = (name) => collections.get(name) ?? collections.set(name, new Map()).get(name);
  return {
    async get(name, id) {
      const record = col(name).get(id);
      return record ? structuredClone(record) : null;
    },
    async put(name, record) {
      col(name).set(record.id, structuredClone(record));
      return record;
    },
    async list(name, userId) {
      return [...col(name).values()].filter((r) => r.userId === userId).map((r) => structuredClone(r));
    },
    async clear() {
      collections.clear();
    },
  };
}
