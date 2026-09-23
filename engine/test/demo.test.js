import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCoreService, memoryStore, seedDemo, DEMO_SCENARIOS } from '../src/index.js';

const NOW = new Date('2026-09-23T15:00:00Z');

async function seeded(id) {
  const store = memoryStore();
  const userId = await seedDemo(store, id, { now: NOW });
  const service = createCoreService(store, { clock: () => NOW });
  const history = await service.history(userId);
  const last = await service.result(history[0].id);
  const today = await service.today(userId, '2026-09-23');
  return { history, last, today };
}

test('chaque scénario produit 3 bilans comparables et une semaine de check-ins', async () => {
  for (const scenario of DEMO_SCENARIOS) {
    const { history, last, today } = await seeded(scenario.id);
    assert.equal(history.length, 3, scenario.id);
    assert.ok(last.comparison, `${scenario.id} : comparaison avec le bilan précédent`);
    assert.ok(today.week.length >= 10, `${scenario.id} : check-ins`);
    assert.ok(today.plan.length >= 4, `${scenario.id} : le check-in du jour reste à faire`);
    assert.equal(today.bilanDue, false, `${scenario.id} : dernier bilan il y a 2 jours`);
    assert.ok(today.practices.length > 0, `${scenario.id} : exercices pratiqués`);
  }
});

test('les scénarios illustrent bien leur cas', async () => {
  assert.equal((await seeded('equilibre')).last.triage.level, 'none');
  assert.deepEqual((await seeded('bridage')).last.caps, { pilote: 80, reseau: 80 });
  assert.equal((await seeded('relais')).last.triage.level, 'relais');
  const soupapes = (await seeded('soupapes')).last;
  assert.ok(soupapes.flags.soupapesLeak);
  assert.ok(soupapes.triage.specialised.length > 0);
  assert.ok((await seeded('tampon')).last.flags.buffer);
});
