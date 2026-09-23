import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.js';
import { createApp } from '../src/app.js';

let server;
let base;

before(async () => {
  const app = createApp(openDatabase(':memory:'));
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://localhost:${server.address().port}/api`;
});

after(() => server.close());

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function newUser(status = 'etudiant') {
  const { body: user } = await call('POST', '/users');
  await call('PUT', `/users/${user.id}/profile`, { status, adult: true });
  return user;
}

const calm = (q) => (q.type === 'slider' ? 25 : q.type === 'frequency' ? 0 : []);
const today = () => new Date().toISOString().slice(0, 10);

async function completeAssessment(userId, pick) {
  let { body } = await call('POST', '/assessments', { userId });
  const id = body.id;
  let guard = 0;
  while (body.next && guard++ < 50) {
    const q = body.next;
    ({ body } = await call('PUT', `/assessments/${id}/answers/${q.id}`, { value: pick(q) }));
  }
  return (await call('POST', `/assessments/${id}/complete`)).body;
}

test('parcours complet : profil → bilan adaptatif → résultat', async () => {
  const { status, body: user } = await call('POST', '/users');
  assert.equal(status, 201);
  assert.equal((await call('POST', '/assessments', { userId: user.id })).status, 409, 'profil requis');
  const profile = await call('PUT', `/users/${user.id}/profile`, { status: 'actif', adult: true });
  assert.deepEqual(profile.body.profile, { status: 'actif', adult: true });

  const start = await call('POST', '/assessments', { userId: user.id });
  assert.equal(start.status, 201);
  assert.equal(start.body.next.id, 'sleep.latency');
  assert.equal(start.body.next.condition, undefined, 'la fonction de condition ne fuit pas dans l’API');

  const early = await call('POST', `/assessments/${start.body.id}/complete`);
  assert.equal(early.status, 409);

  const result = await completeAssessment(user.id, calm);
  assert.equal(result.spheres.machine, 75);
  assert.equal(result.triage.level, 'none');
  assert.ok(Array.isArray(result.recommendations));

  const history = await call('GET', `/users/${user.id}/assessments`);
  assert.equal(history.body.length, 1);
});

test('Core est réservé aux 18 ans et plus', async () => {
  const { body: user } = await call('POST', '/users');
  assert.equal((await call('PUT', `/users/${user.id}/profile`, { status: 'autre', adult: 'oui' })).status, 400);
  await call('PUT', `/users/${user.id}/profile`, { status: 'autre', adult: false });
  const res = await call('POST', '/assessments', { userId: user.id });
  assert.equal(res.status, 403);
});

test('réponses invalides refusées avec un message clair', async () => {
  const user = await newUser();
  const { body: a } = await call('POST', '/assessments', { userId: user.id });
  const bad = await call('PUT', `/assessments/${a.id}/answers/sleep.latency`, { value: 300 });
  assert.equal(bad.status, 400);
  assert.match(bad.body.error, /entre 0 et 100/);
  const unknown = await call('PUT', `/assessments/${a.id}/answers/nope`, { value: 3 });
  assert.equal(unknown.status, 400);
});

test('premier bilan : repérage PHQ-4 inclus ; un score sévère déclenche le relais', async () => {
  const user = await newUser('etudiant');
  const seen = [];
  const result = await completeAssessment(user.id, (q) => {
    seen.push(q.id);
    return q.type === 'frequency' ? 3 : calm(q);
  });
  assert.ok(seen.includes('phq.1') && seen.includes('gad.2'), 'jamais repéré → PHQ-4 dû');
  assert.equal(result.triage.level, 'relais');
  assert.ok(result.triage.pauseGamification);
  assert.ok(result.triage.resources.some((r) => r.id === 'sante-psy-etudiant'), 'ressources étudiantes');

  const second = [];
  await completeAssessment(user.id, (q) => (second.push(q.id), calm(q)));
  assert.ok(!second.includes('phq.1'), 'pas de nouveau repérage avant 7 jours');
});

test('check-in du jour : plan, enregistrement et semaine', async () => {
  const user = await newUser('actif');
  const before = await call('GET', `/users/${user.id}/today?day=${today()}`);
  assert.equal(before.body.plan.length, 0, 'pas de check-in avant le premier bilan');
  assert.equal((await call('PUT', `/users/${user.id}/checkins/${today()}`, { answers: {} })).status, 409);

  await completeAssessment(user.id, calm);
  const view = await call('GET', `/users/${user.id}/today?day=${today()}`);
  assert.equal(view.body.plan.length, 4, 'PHQ-4 déjà fait au bilan : 4 cartes seulement');
  assert.equal(view.body.bilanDue, false);

  const partial = await call('PUT', `/users/${user.id}/checkins/${today()}`, { answers: { 'daily.battery': 30 } });
  assert.equal(partial.status, 400);

  const answers = Object.fromEntries(view.body.plan.map((q) => [q.id, 85]));
  const done = await call('PUT', `/users/${user.id}/checkins/${today()}`, { answers });
  assert.equal(done.status, 200);
  assert.ok(done.body.checkin.summary.alert);
  assert.equal(done.body.week.length, 1);
  assert.equal(done.body.plan.length, 0, 'check-in fait pour aujourd’hui');
  assert.equal((await call('GET', `/users/${user.id}/today?day=1999-01-01`)).status, 400);
});
