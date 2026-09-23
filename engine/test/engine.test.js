import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  QUESTIONS,
  QUESTIONS_BY_ID,
  publicQuestion,
  SPHERES,
  getNextQuestion,
  pruneAnswers,
  normalizeAnswer,
  computeResult,
  evaluateShield,
  helpResources,
  scoreScreening,
  planCheckin,
  summarizeCheckin,
  recommend,
} from '../src/index.js';

const SLIDERS = QUESTIONS.filter((q) => q.type === 'slider').map((q) => q.id);

// Toutes les réponses curseur à la même valeur, puis surcharges ponctuelles.
function answersWith(base, overrides = {}) {
  return { ...Object.fromEntries(SLIDERS.map((id) => [id, base])), ...overrides };
}

function runFlow(pick) {
  const answers = {};
  let q;
  let guard = 0;
  while ((q = getNextQuestion(answers)) && guard++ < 100) answers[q.id] = pick(q);
  return answers;
}

test('jauge Sommeil = 100 − (Q1·0,25 + Q2·0,5 + Q4·0,25)', () => {
  const r = computeResult(answersWith(30, { 'sleep.latency': 20, 'sleep.efficiency': 40, 'sleep.daytime': 60 }));
  assert.equal(r.raw.subs.machine.sommeil, 60);
});

test('jauge Cognition = 100 − (Q1·0,2 + Q2·0,2 + Q3·0,3 + Q4·0,3)', () => {
  const r = computeResult(
    answersWith(30, { 'mind.saturation': 50, 'mind.effort': 30, 'mind.agency': 40, 'mind.mood': 20 }),
  );
  assert.equal(r.raw.spheres.pilote, 66);
  assert.equal(r.spheres.pilote, 66, 'aucun impact croisé ne doit s’appliquer ici');
});

test('jauges Réseau, Cadre et Régulation suivent les pondérations du PDF', () => {
  const r = computeResult(
    answersWith(30, {
      'social.support': 10, 'social.connection': 20, 'social.cost': 40,
      'env.motivation': 50, 'env.finance': 20, 'env.living': 10,
      'reg.screens': 10, 'reg.coping': 20, 'reg.control': 30,
    }),
  );
  assert.equal(r.raw.spheres.reseau, 100 - (10 * 0.4 + 20 * 0.3 + 40 * 0.3));
  assert.equal(r.raw.spheres.cadre, 100 - (50 * 0.4 + 20 * 0.4 + 10 * 0.2));
  assert.equal(r.raw.spheres.soupapes, 100 - (10 * 0.3 + 20 * 0.3 + 30 * 0.4));
});

test('les perturbations du sommeil ne sont demandées que si Q2 > 60', () => {
  const low = runFlow((q) => (q.type === 'slider' ? 30 : []));
  assert.ok(!('sleep.disturbances' in low));
  const high = runFlow((q) => (q.id === 'sleep.efficiency' ? 70 : q.type === 'slider' ? 30 : []));
  assert.ok('sleep.disturbances' in high);
});

test('les carences sont demandées si la récupération corporelle (1.2 Q2) > 60', () => {
  const a = runFlow((q) => (q.id === 'body.recovery' ? 65 : q.type === 'slider' ? 20 : []));
  assert.ok('fuel.deficits' in a);
});

test('un bilan « tout va bien » tient en 21 cartes, un bilan chargé en 28 au plus', () => {
  const calm = runFlow((q) => (q.type === 'slider' ? 10 : []));
  const heavy = runFlow((q) => (q.type === 'slider' ? 95 : [q.options[0].id]));
  assert.equal(Object.keys(calm).length, 21);
  assert.ok(Object.keys(heavy).length <= 28);
});

test('revenir en arrière retire les réponses conditionnelles devenues hors sujet', () => {
  const pruned = pruneAnswers({ 'sleep.efficiency': 40, 'sleep.disturbances': ['wake'] });
  assert.deepEqual(pruned, { 'sleep.efficiency': 40 });
});

test('validation des réponses', () => {
  assert.equal(normalizeAnswer('mind.mood', '42.37'), 42.4);
  assert.throws(() => normalizeAnswer('mind.mood', 120));
  assert.throws(() => normalizeAnswer('fuel.deficits', ['fine', 'hydration']));
  assert.throws(() => normalizeAnswer('fuel.deficits', ['unknown']));
  assert.deepEqual(normalizeAnswer('fuel.deficits', ['hydration', 'hydration']), ['hydration']);
});

test('Machine < 50 → malus de résilience sur Pilote et Réseau', () => {
  const r = computeResult(
    answersWith(30, {
      'sleep.latency': 60, 'sleep.efficiency': 60, 'sleep.daytime': 60,
      'body.movement': 60, 'body.recovery': 60, 'body.tension': 60,
      'fuel.energy': 60, 'fuel.rhythm': 60,
    }),
  );
  assert.equal(r.spheres.machine, 40);
  assert.ok(r.flags.machineMalus);
  assert.equal(r.spheres.pilote, 63); // 70 × 0,9
  assert.equal(r.spheres.reseau, 63);
  assert.ok(!r.flags.bodyFirst);
});

const EXHAUSTED_BODY = Object.fromEntries(SLIDERS.filter((id) => /^(sleep|body|fuel)\./.test(id)).map((id) => [id, 75]));

test('Machine < 40 → bridage : plafond à 80, aucun point retiré (pas de double peine)', () => {
  const r = computeResult(answersWith(30, EXHAUSTED_BODY));
  assert.equal(r.spheres.machine, 25);
  assert.ok(r.flags.bridage && r.flags.bodyFirst);
  assert.ok(!r.flags.machineMalus, 'le malus −10 % ne s’applique plus sous 40');
  assert.deepEqual(r.caps, { pilote: 80, reseau: 80 });
  assert.equal(r.subs.pilote.charge, r.raw.subs.pilote.charge, 'le sommeil n’ampute plus la charge mentale');
  assert.equal(r.spheres.pilote, r.raw.spheres.pilote);
  assert.match(r.insights.find((i) => i.id === 'body_first').message, /économie d'énergie/);

  const rested = computeResult(answersWith(5, EXHAUSTED_BODY));
  assert.equal(rested.raw.spheres.pilote, 95);
  assert.equal(rested.spheres.pilote, 80, 'au-dessus du plafond, la jauge est bridée à 80');
});

test('les impacts croisés ne retirent jamais plus de 20 points au Pilote', () => {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 100;
  for (let i = 0; i < 500; i++) {
    const r = computeResult(Object.fromEntries(SLIDERS.map((id) => [id, rand()])));
    assert.ok(r.raw.spheres.pilote - r.spheres.pilote <= 20 + 1e-6, `écart de ${r.raw.spheres.pilote - r.spheres.pilote}`);
    for (const s of SPHERES) assert.ok(r.spheres[s] >= 0 && r.spheres[s] <= 100);
  }
});

test('Sommeil < 40 → la charge mentale est amplifiée', () => {
  const r = computeResult(answersWith(30, { 'sleep.latency': 80, 'sleep.efficiency': 80, 'sleep.daytime': 80 }));
  assert.ok(r.tags.includes('sommeil_mauvais'));
  assert.equal(r.subs.pilote.charge, r.raw.subs.pilote.charge - 10);
});

test('anxiété financière > 80 → drain passif sur la charge mentale', () => {
  const r = computeResult(answersWith(30, { 'env.finance': 85 }));
  assert.ok(r.flags.financeDrain);
  assert.equal(r.subs.pilote.charge, 60);
});

test('Réseau > 75 → effet tampon et message d’extériorisation', () => {
  const r = computeResult(
    answersWith(10, { 'mind.saturation': 80, 'mind.effort': 80, 'mind.agency': 70, 'mind.mood': 70 }),
  );
  assert.ok(r.flags.buffer);
  assert.equal(r.spheres.pilote, r.raw.spheres.pilote + 10);
  assert.match(r.insights.find((i) => i.id === 'reseau_buffer').message, /zone de turbulences/);
});

test('sommeil mauvais + tension tête/mâchoire → alerte surcharge cognitive', () => {
  const r = computeResult({
    ...answersWith(30, { 'sleep.latency': 80, 'sleep.efficiency': 80, 'sleep.daytime': 80, 'body.tension': 70 }),
    'body.location': ['head'],
  });
  assert.ok(r.flags.cognitiveOverload);
});

const NOW = new Date('2026-09-23T12:00:00Z');
const daysAgo = (n) => new Date(NOW - n * 86400000).toISOString();
const screening = (n, phq2, gad2) => ({ takenAt: daysAgo(n), phq2, gad2, total: phq2 + gad2 });

test('Réseau et Pilote faibles → vigilance (repérage avancé), pas de redirection', () => {
  const r = computeResult(answersWith(20, {
    'mind.saturation': 80, 'mind.effort': 80, 'mind.agency': 70, 'mind.mood': 70,
    'social.support': 80, 'social.connection': 80, 'social.cost': 80,
  }));
  assert.ok(r.flags.vulnerability);
  const s = evaluateShield({ lastResult: r, screenings: [screening(8, 1, 1)], now: NOW });
  assert.equal(s.level, 'none', 'un signal maison ne redirige pas');
  assert.ok(s.vigilance.includes('vulnerability'));
  assert.ok(s.screeningDue, 'le PHQ-4 est avancé dès 7 jours');
  assert.ok(!evaluateShield({ lastResult: r, screenings: [screening(3, 1, 1)], now: NOW }).screeningDue, 'jamais avant 7 jours');
  assert.equal(recommend(r, s)[0].id, 'auto_compassion');
});

test('PHQ-4 : cotation des deux sous-échelles', () => {
  assert.equal(scoreScreening({ 'phq.1': 1, 'phq.2': 2 }), null, 'incomplet');
  assert.deepEqual(scoreScreening({ 'phq.1': 1, 'phq.2': 2, 'gad.1': 3, 'gad.2': 0 }), { phq2: 3, gad2: 3, total: 6 });
  assert.equal(normalizeAnswer('phq.1', 2), 2);
  assert.throws(() => normalizeAnswer('phq.1', 4));
  assert.throws(() => normalizeAnswer('phq.1', null), 'une réponse vide ne devient pas 0');
  assert.throws(() => normalizeAnswer('mind.mood', null));
});

test('le PHQ-4 s’insère dans le bilan quand il est dû, ou si la porte s’ouvre', () => {
  const ids = (ctx, pick) => {
    const answers = {};
    let q;
    while ((q = getNextQuestion(answers, ctx))) answers[q.id] = pick(q);
    return Object.keys(answers);
  };
  const calm = (q) => (q.type === 'slider' ? 20 : q.type === 'frequency' ? 0 : []);
  const heavy = (q) => (q.id === 'mind.mood' ? 85 : calm(q));
  assert.ok(ids({ screeningDue: true }, calm).includes('phq.1'), 'routine des 14 jours');
  assert.ok(!ids({}, heavy).includes('phq.1'), 'pas avant 7 jours, même si la porte s’ouvre');
  assert.ok(ids({ screeningAllowed: true }, heavy).includes('gad.2'), 'porte ouverte et 7 jours passés');
  assert.ok(!ids({ screeningAllowed: true }, calm).includes('phq.1'), 'porte fermée : pas de repérage anticipé');
});

test('niveaux du bouclier : seuls les outils validés font monter le niveau', () => {
  const at = (screenings) => evaluateShield({ screenings, now: NOW });
  assert.equal(at([screening(2, 1, 1)]).level, 'none');
  assert.equal(at([screening(2, 3, 0)]).level, 'soutien');
  assert.equal(at([screening(2, 0, 3)]).level, 'soutien');
  assert.equal(at([screening(2, 4, 5)]).level, 'relais', 'PHQ-4 ≥ 9');
  assert.equal(at([screening(2, 3, 0), screening(16, 4, 1)]).level, 'relais', 'deux PHQ-2 positifs d’affilée');
  assert.equal(at([screening(2, 3, 0), screening(40, 4, 1)]).level, 'soutien', 'hors fenêtre de 28 jours');
  const stale = at([screening(20, 6, 6)]);
  assert.equal(stale.level, 'none', 'un repérage de plus de 14 jours ne compte plus');
  assert.ok(stale.screeningDue);
  assert.ok(at([screening(2, 4, 5)]).pauseGamification);
  assert.equal(at([screening(2, 4, 5)]).resources[0].id, '3114');
});

test('7 jours d’alerte sur 14 au check-in → vigilance', () => {
  const checkins = Array.from({ length: 7 }, (_, i) => ({ day: daysAgo(i + 1).slice(0, 10), summary: { alert: true } }));
  const s = evaluateShield({ checkins, screenings: [screening(9, 0, 0)], now: NOW });
  assert.ok(s.vigilance.includes('daily_persistence'));
  assert.equal(s.level, 'none');
  assert.ok(s.screeningDue);
  const fewer = evaluateShield({ checkins: checkins.slice(1), screenings: [screening(9, 0, 0)], now: NOW });
  assert.ok(!fewer.vigilance.includes('daily_persistence'));
});

test('check-in : 3 cartes fixes, 1 carte de la sphère la plus basse, PHQ-4 si dû', () => {
  const lastResult = { spheres: { machine: 60, pilote: 55, reseau: 30, cadre: 70, soupapes: 80 } };
  assert.deepEqual(planCheckin({ lastResult }).map((q) => q.id), ['daily.battery', 'daily.mood', 'daily.clarity', 'daily.connection']);
  assert.equal(planCheckin({ lastResult, screeningDue: true }).length, 8);
  const summary = summarizeCheckin({ 'daily.battery': 20, 'daily.mood': 80, 'daily.clarity': 30, 'daily.connection': 40 });
  assert.equal(summary.levels.mood, 20);
  assert.ok(summary.alert, 'météo > 70 = jour d’alerte');
  assert.equal(summary.suggestion.id, 'vague', 'la météo la plus basse propose La vague');
  assert.equal(summary.suggestion.type, 'game');
  assert.equal(summarizeCheckin({ 'daily.battery': 90, 'daily.mood': 20, 'daily.clarity': 20, 'daily.connection': 20 }).suggestion.type, 'exercise');
  assert.equal(summarizeCheckin({ 'daily.battery': 10, 'daily.mood': 10, 'daily.clarity': 10, 'daily.connection': 10 }).suggestion, null);
});

test('Soupapes dans le rouge → aucun objectif de performance recommandé', () => {
  const base = answersWith(30, { 'body.movement': 55, 'body.recovery': 55, 'body.tension': 55 });
  const calm = computeResult(base);
  assert.ok(recommend(calm, { level: 'none' }, 20).some((r) => r.category === 'performance'));
  const leak = computeResult({ ...base, 'reg.screens': 90, 'reg.coping': 90, 'reg.control': 90 });
  assert.ok(leak.flags.soupapesLeak);
  const recos = recommend(leak, { level: 'none' }, 20);
  assert.ok(!recos.some((r) => r.category === 'performance'));
  assert.equal(recos[0].id, 'reconnexion');
});

test('le Score Core pondère les 5 sphères à parts égales', () => {
  const r = computeResult(answersWith(30, { 'env.living': 90, 'reg.screens': 70 }));
  const mean = SPHERES.reduce((sum, s) => sum + r.spheres[s], 0) / SPHERES.length;
  assert.ok(Math.abs(r.core - mean) < 0.06);
  assert.ok(r.harmony >= 0 && r.harmony <= 1);
});

test('les exemples des questions s’adaptent au profil', () => {
  const q = QUESTIONS_BY_ID['env.motivation'];
  assert.match(publicQuestion(q, { status: 'etudiant' }).prompt, /dossier d'admission/);
  assert.match(publicQuestion(q, { status: 'actif' }).prompt, /projet pro/);
  assert.match(publicQuestion(q, null).prompt, /projet perso/);
  assert.equal(publicQuestion(q, { status: 'actif' }).variants, undefined);
});

test('les ressources d’aide s’adaptent au profil, sans nommer le suicide', () => {
  const ids = (profile) => evaluateShield({ screenings: [screening(1, 3, 0)], profile, now: NOW }).resources.map((x) => x.id);
  assert.ok(ids({ status: 'etudiant' }).includes('sante-psy-etudiant'));
  assert.ok(ids({ status: 'etudiant' }).includes('bapu'));
  assert.ok(ids({ status: 'etudiant' }).includes('nightline'));
  assert.ok(!ids({ status: 'actif' }).includes('sante-psy-etudiant'));
  assert.ok(ids({ status: 'actif' }).includes('medecine-travail'));
  assert.ok(ids({ status: 'actif' }).includes('cmp'));
  const help = helpResources({ status: 'actif' });
  assert.equal(help.urgence[0].phone, '3114');
  const text = JSON.stringify(helpResources({ status: 'etudiant' })).toLowerCase();
  assert.ok(!text.includes('suicid'), 'l’interface ne nomme pas le suicide');
});
