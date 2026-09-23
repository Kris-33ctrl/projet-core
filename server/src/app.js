import express from 'express';
import { randomUUID } from 'node:crypto';
import {
  SPHERES,
  SPHERE_LABELS,
  SPHERE_SUBTITLES,
  SPHERE_INTROS,
  QUESTIONS,
  SUB_LABELS,
  SPHERE_WEIGHTS,
  DISCLAIMER,
  PROFILE_STATUSES,
  RESOURCES,
  publicQuestion,
  getNextQuestion,
  getProgress,
  normalizeAnswer,
  pruneAnswers,
  computeResult,
  scoreScreening,
  evaluateShield,
  screeningContext,
  vigilanceSignals,
  planCheckin,
  summarizeCheckin,
  recommend,
  AnswerError,
} from '@core/engine';

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const BILAN_EVERY_DAYS = 7;

export function createApp(db) {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  const q = {
    insertUser: db.prepare('INSERT INTO users (id, created_at) VALUES (?, ?)'),
    getUser: db.prepare('SELECT id, created_at, profile_json FROM users WHERE id = ?'),
    setProfile: db.prepare('UPDATE users SET profile_json = ? WHERE id = ?'),
    insertAssessment: db.prepare('INSERT INTO assessments (id, user_id, started_at, context_json) VALUES (?, ?, ?, ?)'),
    getAssessment: db.prepare('SELECT * FROM assessments WHERE id = ?'),
    completeAssessment: db.prepare('UPDATE assessments SET completed_at = ?, result_json = ? WHERE id = ?'),
    history: db.prepare(
      `SELECT id, completed_at, result_json FROM assessments
       WHERE user_id = ? AND completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT ?`,
    ),
    upsertAnswer: db.prepare(
      `INSERT INTO answers (assessment_id, question_id, value_json, answered_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (assessment_id, question_id) DO UPDATE SET value_json = excluded.value_json, answered_at = excluded.answered_at`,
    ),
    answers: db.prepare('SELECT question_id, value_json FROM answers WHERE assessment_id = ?'),
    insertScreening: db.prepare(
      'INSERT INTO screenings (id, user_id, taken_at, source, phq2, gad2, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ),
    screenings: db.prepare(
      'SELECT taken_at, source, phq2, gad2, total FROM screenings WHERE user_id = ? ORDER BY taken_at DESC LIMIT 10',
    ),
    upsertCheckin: db.prepare(
      `INSERT INTO checkins (user_id, day, answers_json, summary_json, created_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (user_id, day) DO UPDATE SET answers_json = excluded.answers_json, summary_json = excluded.summary_json, created_at = excluded.created_at`,
    ),
    checkins: db.prepare('SELECT day, summary_json FROM checkins WHERE user_id = ? AND day >= ? ORDER BY day'),
  };

  const now = () => new Date().toISOString();

  // ── Chargement ─────────────────────────────────────────────────────
  function loadUser(id) {
    const row = q.getUser.get(id);
    if (!row) return null;
    return { id: row.id, created_at: row.created_at, profile: row.profile_json ? JSON.parse(row.profile_json) : null };
  }

  function requireUser(id) {
    const user = loadUser(id);
    if (!user) throw new HttpError(404, 'Profil introuvable.');
    return user;
  }

  function loadAssessment(id) {
    const row = q.getAssessment.get(id);
    if (!row) throw new HttpError(404, 'Bilan introuvable.');
    return { ...row, context: row.context_json ? JSON.parse(row.context_json) : {} };
  }

  function loadAnswers(assessmentId) {
    return Object.fromEntries(q.answers.all(assessmentId).map((r) => [r.question_id, JSON.parse(r.value_json)]));
  }

  function previousResults(userId, excludeId, limit = 10) {
    return q
      .history.all(userId, limit + 1)
      .filter((r) => r.id !== excludeId)
      .slice(0, limit)
      .map((r) => ({ id: r.id, completedAt: r.completed_at, ...JSON.parse(r.result_json) }));
  }

  const loadScreenings = (userId) =>
    q.screenings.all(userId).map((r) => ({ takenAt: r.taken_at, source: r.source, phq2: r.phq2, gad2: r.gad2, total: r.total }));

  function loadCheckins(userId, sinceDays = 21) {
    const since = new Date(Date.now() - sinceDays * DAY_MS).toISOString().slice(0, 10);
    return q.checkins.all(userId, since).map((r) => ({ day: r.day, summary: JSON.parse(r.summary_json) }));
  }

  function saveScreening(userId, answers, source) {
    const score = scoreScreening(answers);
    if (score) q.insertScreening.run(randomUUID(), userId, now(), source, score.phq2, score.gad2, score.total);
    return score;
  }

  // ── Bouclier ───────────────────────────────────────────────────────
  function shieldFor(user, lastResult = previousResults(user.id, null, 1)[0] ?? null) {
    return evaluateShield({
      lastResult,
      screenings: loadScreenings(user.id),
      checkins: loadCheckins(user.id),
      profile: user.profile,
    });
  }

  function flowState(assessment, profile = null) {
    const answers = pruneAnswers(loadAnswers(assessment.id), assessment.context);
    const next = getNextQuestion(answers, assessment.context);
    return {
      answers,
      next: publicQuestion(next, profile),
      progress: getProgress(answers, assessment.context),
    };
  }

  // Vue « aujourd'hui » : check-in du jour, semaine, prochain bilan, bouclier.
  function todayView(user, day) {
    const [last] = previousResults(user.id, null, 1);
    const checkins = loadCheckins(user.id);
    const shield = shieldFor(user, last ?? null);
    const today = checkins.find((c) => c.day === day) ?? null;
    const daysSinceBilan = last ? (Date.now() - new Date(last.completedAt)) / DAY_MS : null;
    return {
      day,
      checkin: today,
      plan: last && !today ? planCheckin({ lastResult: last, screeningDue: shield.screeningDue, profile: user.profile }) : [],
      week: checkins,
      shield,
      lastBilan: last
        ? { id: last.id, completedAt: last.completedAt, spheres: last.spheres, harmony: last.harmony, caps: last.caps }
        : null,
      bilanDue: daysSinceBilan === null || daysSinceBilan >= BILAN_EVERY_DAYS,
      nextBilanInDays: daysSinceBilan === null ? 0 : Math.max(0, Math.ceil(BILAN_EVERY_DAYS - daysSinceBilan)),
    };
  }

  function requireDay(day) {
    if (!DAY_PATTERN.test(day ?? '')) throw new HttpError(400, 'Jour attendu au format AAAA-MM-JJ.');
    const offset = Math.abs(new Date(`${day}T12:00:00Z`) - Date.now());
    if (!Number.isFinite(offset) || offset > 2 * DAY_MS) throw new HttpError(400, 'Le check-in ne concerne que la journée en cours.');
    return day;
  }

  // ── Méta ───────────────────────────────────────────────────────────
  app.get('/api/meta', (_req, res) => {
    res.json({
      spheres: SPHERES.map((id) => ({
        id,
        label: SPHERE_LABELS[id],
        subtitle: SPHERE_SUBTITLES[id],
        intro: SPHERE_INTROS[id],
        baseQuestions: QUESTIONS.filter((qq) => qq.sphere === id && !qq.condition).length,
        subs: Object.keys(SPHERE_WEIGHTS[id]).map((sub) => ({ id: sub, label: SUB_LABELS[sub] })),
      })),
      // Pour le bouton « Besoin d'aide », disponible partout, hors de tout calcul.
      help: { urgence: RESOURCES.urgence, ecoute: RESOURCES.ecoute, professionnels: RESOURCES.professionnels },
      disclaimer: DISCLAIMER,
    });
  });

  // ── Utilisateurs (profil anonyme pour le MVP) ─────────────────────
  app.post('/api/users', (_req, res) => {
    const user = { id: randomUUID(), created_at: now() };
    q.insertUser.run(user.id, user.created_at);
    res.status(201).json({ ...user, profile: null });
  });

  app.get('/api/users/:id', (req, res) => {
    res.json(requireUser(req.params.id));
  });

  // Carte « avant de commencer » : situation (adapte exemples et ressources) et confirmation 18 ans et plus.
  app.put('/api/users/:id/profile', (req, res) => {
    requireUser(req.params.id);
    const { status, adult } = req.body ?? {};
    if (!PROFILE_STATUSES.includes(status)) throw new HttpError(400, `Situation attendue : ${PROFILE_STATUSES.join(', ')}.`);
    if (typeof adult !== 'boolean') throw new HttpError(400, 'Indique si tu as 18 ans ou plus.');
    q.setProfile.run(JSON.stringify({ status, adult }), req.params.id);
    res.json(loadUser(req.params.id));
  });

  app.get('/api/users/:id/assessments', (req, res) => {
    requireUser(req.params.id);
    const history = previousResults(req.params.id, null, 30).map((h) => ({
      id: h.id,
      completedAt: h.completedAt,
      spheres: h.spheres,
      harmony: h.harmony,
      triageLevel: h.triage?.level ?? 'none',
    }));
    res.json(history);
  });

  app.get('/api/users/:id/today', (req, res) => {
    const user = requireUser(req.params.id);
    res.json(todayView(user, requireDay(req.query.day)));
  });

  // Check-in du jour : toutes les cartes du plan en une fois. Le refaire le même jour remplace le précédent.
  app.put('/api/users/:id/checkins/:day', (req, res) => {
    const user = requireUser(req.params.id);
    const day = requireDay(req.params.day);
    const [last] = previousResults(user.id, null, 1);
    if (!last) throw new HttpError(409, 'Le check-in démarre après ton premier bilan complet.');
    const plan = planCheckin({ lastResult: last, screeningDue: shieldFor(user, last).screeningDue });

    const raw = req.body?.answers ?? {};
    const answers = {};
    try {
      for (const question of plan) {
        if (!(question.id in raw)) throw new AnswerError(`Il manque la réponse à « ${question.prompt} »`);
        answers[question.id] = normalizeAnswer(question.id, raw[question.id]);
      }
    } catch (err) {
      if (err instanceof AnswerError) throw new HttpError(400, err.message);
      throw err;
    }

    const summary = summarizeCheckin(answers);
    q.upsertCheckin.run(user.id, day, JSON.stringify(answers), JSON.stringify(summary), now());
    saveScreening(user.id, answers, 'checkin');
    res.json(todayView(user, day));
  });

  // ── Bilans ────────────────────────────────────────────────────────
  app.post('/api/assessments', (req, res) => {
    const user = req.body?.userId ? loadUser(req.body.userId) : null;
    if (!user) throw new HttpError(400, 'userId manquant ou inconnu.');
    if (!user.profile) throw new HttpError(409, 'Complète la carte « avant de commencer » d’abord.');
    if (!user.profile.adult) throw new HttpError(403, 'Core est pensé pour les personnes de 18 ans et plus.');

    // Le PHQ-4 est-il dû ? Figé maintenant pour que le déroulé ne change pas en cours de bilan.
    const [last] = previousResults(user.id, null, 1);
    const vigilance = vigilanceSignals({ lastResult: last ?? null, checkins: loadCheckins(user.id) });
    const context = screeningContext({ screenings: loadScreenings(user.id), vigilance });

    const id = randomUUID();
    q.insertAssessment.run(id, user.id, now(), JSON.stringify(context));
    res.status(201).json({ id, ...flowState({ id, context }, user.profile) });
  });

  app.get('/api/assessments/:id', (req, res) => {
    const a = loadAssessment(req.params.id);
    res.json({ id: a.id, startedAt: a.started_at, completedAt: a.completed_at, ...flowState(a, loadUser(a.user_id)?.profile) });
  });

  app.put('/api/assessments/:id/answers/:questionId', (req, res) => {
    const a = loadAssessment(req.params.id);
    if (a.completed_at) throw new HttpError(409, 'Ce bilan est déjà terminé.');
    let value;
    try {
      value = normalizeAnswer(req.params.questionId, req.body?.value);
    } catch (err) {
      if (err instanceof AnswerError) throw new HttpError(400, err.message);
      throw err;
    }
    q.upsertAnswer.run(a.id, req.params.questionId, JSON.stringify(value), now());
    res.json(flowState(a, loadUser(a.user_id)?.profile));
  });

  app.post('/api/assessments/:id/complete', (req, res) => {
    const a = loadAssessment(req.params.id);
    if (a.completed_at) return res.json({ id: a.id, completedAt: a.completed_at, ...JSON.parse(a.result_json) });
    const { answers, next } = flowState(a);
    if (next) throw new HttpError(409, 'Le bilan n’est pas terminé.');

    const user = loadUser(a.user_id);
    saveScreening(user.id, answers, 'bilan');
    const result = computeResult(answers);
    const triage = shieldFor(user, result);
    const view = { ...result, triage, recommendations: recommend(result, triage) };
    const completedAt = now();
    q.completeAssessment.run(completedAt, JSON.stringify(view), a.id);
    res.json({ id: a.id, completedAt, ...view });
  });

  app.get('/api/assessments/:id/result', (req, res) => {
    const a = loadAssessment(req.params.id);
    if (!a.completed_at) throw new HttpError(409, 'Le bilan n’est pas terminé.');
    res.json({ id: a.id, completedAt: a.completed_at, ...JSON.parse(a.result_json) });
  });

  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Route inconnue.')));

  app.use((err, _req, res, _next) => {
    const status = err.status ?? (err.type === 'entity.parse.failed' ? 400 : 500);
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Erreur interne.' : err.message });
  });

  return app;
}
