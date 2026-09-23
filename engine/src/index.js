export * from './config.js';
export { QUESTIONS, QUESTIONS_BY_ID, DAILY_QUESTIONS, SPHERE_INTROS, publicQuestion, findQuestion } from './questions.js';
export { getNextQuestion, getProgress, normalizeAnswer, pruneAnswers, isApplicable, AnswerError } from './flow.js';
export { computeResult, SUB_LABELS, SPHERE_WEIGHTS } from './scoring.js';
export { SCREENING_QUESTIONS, SCREENING_IDS, FREQUENCY_OPTIONS, scoreScreening, gateOpen } from './screening.js';
export { evaluateShield, screeningContext, vigilanceSignals, helpResources, RESOURCES } from './triage.js';
export { planCheckin, summarizeCheckin, rotatingSphere } from './checkin.js';
export { recommend, getNudge, CATALOG_IDS } from './recommendations.js';

export const DISCLAIMER =
  "Core est un outil de prévention et de connaissance de soi. Il ne pose pas de diagnostic et ne remplace pas un avis médical ou psychologique.";
