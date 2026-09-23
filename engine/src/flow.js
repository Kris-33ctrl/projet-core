// Déroulé adaptatif du bilan : quelle carte afficher ensuite, et validation des réponses.

import { SPHERES } from './config.js';
import { QUESTIONS, findQuestion } from './questions.js';

// ctx : contexte fixé au début du bilan ({ screeningDue, screeningAllowed }), voir triage.js.
export function isApplicable(question, answers, ctx = {}) {
  return typeof question.condition !== 'function' || Boolean(question.condition(answers, ctx));
}

// Ne garde que les réponses encore pertinentes : si l'utilisateur revient en arrière
// et modifie un curseur, une question conditionnelle peut ne plus s'appliquer.
export function pruneAnswers(answers, ctx = {}) {
  const kept = {};
  for (const q of QUESTIONS) {
    if (!(q.id in answers)) continue;
    if (isApplicable(q, kept, ctx)) kept[q.id] = answers[q.id];
  }
  return kept;
}

export function getNextQuestion(answers, ctx = {}) {
  const current = pruneAnswers(answers, ctx);
  for (const q of QUESTIONS) {
    if (q.id in current) continue;
    if (isApplicable(q, current, ctx)) return q;
  }
  return null;
}

export function getProgress(answers, ctx = {}) {
  const next = getNextQuestion(answers, ctx);
  const sphereIndex = next ? SPHERES.indexOf(next.sphere) : SPHERES.length;
  return {
    sphere: next ? next.sphere : null,
    sphereIndex,
    spheresTotal: SPHERES.length,
    answered: Object.keys(pruneAnswers(answers, ctx)).length,
    done: next === null,
  };
}

export class AnswerError extends Error {}

// Number(null) vaut 0 : une réponse vide ne doit jamais devenir silencieusement « 0 ».
function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
}

export function normalizeAnswer(questionId, value) {
  const q = findQuestion(questionId);
  if (!q) throw new AnswerError(`Question inconnue : ${questionId}`);

  if (q.type === 'frequency') {
    const n = toNumber(value);
    if (!Number.isInteger(n) || !q.options.some((o) => o.value === n)) {
      throw new AnswerError(`La réponse à ${questionId} doit être l'une des 4 fréquences proposées.`);
    }
    return n;
  }

  if (q.type === 'slider') {
    const n = toNumber(value);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      throw new AnswerError(`La valeur de ${questionId} doit être comprise entre 0 et 100.`);
    }
    return Math.round(n * 10) / 10;
  }

  if (!Array.isArray(value)) throw new AnswerError(`${questionId} attend une liste de cartes.`);
  const valid = new Set(q.options.map((o) => o.id));
  const picked = [...new Set(value)];
  for (const id of picked) {
    if (!valid.has(id)) throw new AnswerError(`Carte inconnue pour ${questionId} : ${id}`);
  }
  const exclusive = q.options.filter((o) => o.exclusive).map((o) => o.id);
  if (picked.some((id) => exclusive.includes(id)) && picked.length > 1) {
    throw new AnswerError(`« ${q.options.find((o) => o.exclusive).label} » ne se combine pas avec d'autres cartes.`);
  }
  return picked;
}
