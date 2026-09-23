import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCoreService, memoryStore, EXERCISES } from '../src/index.js';

// Horloge simulée : les bilans et check-ins s'étalent sur plusieurs jours sans attendre.
function setup(start = '2026-09-23T09:00:00Z') {
  let now = new Date(start);
  const service = createCoreService(memoryStore(), { clock: () => now });
  const advance = (days) => (now = new Date(now.getTime() + days * 86400000));
  const day = () => now.toISOString().slice(0, 10);
  return { service, advance, day };
}

const calm = (q) => (q.type === 'slider' ? 25 : q.type === 'frequency' ? 0 : []);

async function newUser(service, status = 'etudiant') {
  const user = await service.createUser();
  await service.setProfile(user.id, { status, adult: true });
  return user;
}

async function runBilan(service, userId, pick = calm) {
  let state = await service.startAssessment(userId);
  const id = state.id;
  const seen = [];
  while (state.next) {
    seen.push(state.next.id);
    state = await service.answer(id, state.next.id, pick(state.next));
  }
  return { result: await service.complete(id), seen };
}

test('parcours complet : profil → bilan adaptatif → résultat', async () => {
  const { service } = setup();
  const user = await service.createUser();
  await assert.rejects(service.startAssessment(user.id), { status: 409 }, 'profil requis');
  const updated = await service.setProfile(user.id, { status: 'actif', adult: true });
  assert.deepEqual(updated.profile, { status: 'actif', adult: true });

  const start = await service.startAssessment(user.id);
  assert.equal(start.next.id, 'sleep.latency');
  assert.equal(start.next.condition, undefined, 'la fonction de condition ne fuit pas');
  await assert.rejects(service.complete(start.id), { status: 409 });

  const { result } = await runBilan(service, user.id);
  assert.equal(result.spheres.machine, 75);
  assert.equal(result.triage.level, 'none');
  assert.equal(result.comparison, null, 'pas de comparaison au premier bilan');
  assert.equal((await service.history(user.id)).length, 1);
});

test('Core est réservé aux 18 ans et plus', async () => {
  const { service } = setup();
  const user = await service.createUser();
  await assert.rejects(service.setProfile(user.id, { status: 'autre', adult: 'oui' }), { status: 400 });
  await service.setProfile(user.id, { status: 'autre', adult: false });
  await assert.rejects(service.startAssessment(user.id), { status: 403 });
});

test('réponses invalides refusées avec un message clair', async () => {
  const { service } = setup();
  const user = await newUser(service);
  const { id } = await service.startAssessment(user.id);
  await assert.rejects(service.answer(id, 'sleep.latency', 300), /entre 0 et 100/);
  await assert.rejects(service.answer(id, 'nope', 3), { status: 400 });
});

test('premier bilan : PHQ-4 inclus ; un score sévère déclenche le relais', async () => {
  const { service } = setup();
  const user = await newUser(service, 'etudiant');
  const { result, seen } = await runBilan(service, user.id, (q) => (q.type === 'frequency' ? 3 : calm(q)));
  assert.ok(seen.includes('phq.1') && seen.includes('gad.2'), 'jamais repéré → PHQ-4 dû');
  assert.equal(result.triage.level, 'relais');
  assert.ok(result.triage.resources.some((r) => r.id === 'sante-psy-etudiant'));
  const again = await runBilan(service, user.id);
  assert.ok(!again.seen.includes('phq.1'), 'pas de nouveau repérage avant 7 jours');
});

test('check-in du jour : plan, enregistrement, semaine', async () => {
  const { service, day } = setup();
  const user = await newUser(service, 'actif');
  assert.equal((await service.today(user.id, day())).plan.length, 0, 'pas de check-in avant le premier bilan');
  await assert.rejects(service.checkin(user.id, day(), {}), { status: 409 });

  await runBilan(service, user.id);
  const view = await service.today(user.id, day());
  assert.equal(view.plan.length, 4);
  assert.equal(view.bilanDue, false);
  await assert.rejects(service.checkin(user.id, day(), { 'daily.battery': 30 }), { status: 400 });

  const done = await service.checkin(user.id, day(), Object.fromEntries(view.plan.map((q) => [q.id, 85])));
  assert.ok(done.checkin.summary.alert);
  assert.equal(done.week.length, 1);
  assert.equal(done.plan.length, 0);
  await assert.rejects(service.today(user.id, '1999-01-01'), { status: 400 });
});

test('le bilan suivant se compare au précédent', async () => {
  const { service, advance } = setup();
  const user = await newUser(service);
  await runBilan(service, user.id, (q) => (q.type === 'slider' ? 50 : calm(q)));
  advance(7);
  const { result } = await runBilan(service, user.id, (q) => (q.id.startsWith('sleep.') ? 20 : q.type === 'slider' ? 50 : calm(q)));
  assert.ok(result.comparison);
  assert.equal(result.comparison.improvements[0].id, 'sommeil');
  assert.match(result.comparison.summary, /Sommeil progresse|sommeil en tête/);
  assert.equal((await service.result(result.id)).comparison.since.slice(0, 10), '2026-09-23');
  const machine = result.comparison.spheres.find((s) => s.id === 'machine');
  assert.equal(machine.trend, 'up');
});

test('une semaine de check-ins en alerte avance le repérage', async () => {
  const { service, advance, day } = setup();
  const user = await newUser(service);
  await runBilan(service, user.id);
  let screenedOn = null;
  for (let i = 1; i <= 8; i++) {
    advance(1);
    const { plan } = await service.today(user.id, day());
    if (!screenedOn && plan.some((q) => q.type === 'frequency')) screenedOn = i;
    await service.checkin(user.id, day(), Object.fromEntries(plan.map((q) => [q.id, q.type === 'frequency' ? 0 : 85])));
  }
  // Jours 1 à 7 en alerte → vigilance ; le PHQ-4 du bilan a 8 jours → repérage avancé au 8e jour.
  assert.equal(screenedOn, 8, 'PHQ-4 proposé au check-in dès que vigilance et délai de 7 jours sont réunis');
  assert.ok((await service.today(user.id, day())).shield.vigilance.includes('daily_persistence'));
});

test('exercices : pratique enregistrée sans son contenu, effacement complet', async () => {
  const { service, day } = setup();
  const user = await newUser(service);
  await runBilan(service, user.id);
  const practice = await service.logPractice(user.id, 'coherence_cardiaque', { durationSec: 180 });
  assert.deepEqual(Object.keys(practice).sort(), ['completedAt', 'durationSec', 'exerciseId', 'id', 'userId']);
  await assert.rejects(service.logPractice(user.id, 'inconnu'), { status: 400 });
  assert.equal((await service.today(user.id, day())).practices.length, 1);
  await service.eraseEverything();
  await assert.rejects(service.getUser(user.id), { status: 404 });
});

test('chaque exercice explique pourquoi et se pratique en étapes connues', () => {
  const types = new Set(['read', 'breath', 'senses', 'timer', 'text', 'list', 'pick', 'choice', 'check', 'summary']);
  for (const e of EXERCISES) {
    assert.ok(e.why && e.when && e.summary, `${e.id} : pourquoi, quand, résumé`);
    assert.ok(e.steps.length > 0, `${e.id} : au moins une étape`);
    for (const step of e.steps) assert.ok(types.has(step.type), `${e.id} : étape ${step.type}`);
    const ids = new Set(e.steps.filter((s) => s.id).map((s) => s.id));
    for (const step of e.steps.filter((s) => s.type === 'summary')) {
      for (const item of step.items) assert.ok(ids.has(item.id), `${e.id} : le résumé cite ${item.id}`);
    }
    for (const step of e.steps.filter((s) => s.type === 'pick')) assert.ok(ids.has(step.from), `${e.id} : ${step.from}`);
  }
});
