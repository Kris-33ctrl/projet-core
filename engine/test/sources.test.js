import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SOURCES, SOURCE_CATEGORIES, GLOSSARY, EXERCISE_SOURCES, EXERCISES, sourceById, shortCite } from '../src/index.js';

test('bibliographie : identifiants uniques, DOI bien formés, catégories connues', () => {
  const ids = SOURCES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiants uniques');
  const categories = new Set(SOURCE_CATEGORIES.map((c) => c.id));
  for (const s of SOURCES) {
    assert.match(s.doi, /^10\.\d{4,}\/\S+$/, `${s.id} : DOI`);
    assert.ok(categories.has(s.category), `${s.id} : catégorie`);
    assert.ok(s.authors && s.year && s.title && s.venue && s.usedFor, `${s.id} : champs complets`);
  }
});

test('chaque exercice cite ses sources, ou explique pourquoi il n’en a pas', () => {
  for (const e of EXERCISES) {
    assert.ok(e.id in EXERCISE_SOURCES, `${e.id} : entrée dans EXERCISE_SOURCES`);
    assert.ok(e.sources.every(Boolean), `${e.id} : sources connues`);
    assert.ok(e.sources.length > 0 || e.sourceNote, `${e.id} : source ou note`);
  }
  for (const id of Object.values(EXERCISE_SOURCES).flat()) assert.ok(sourceById[id], `source inconnue : ${id}`);
});

test('le lexique ne renvoie qu’à des sources existantes', () => {
  for (const entry of GLOSSARY) {
    for (const id of entry.sources ?? []) assert.ok(sourceById[id], `${entry.term} → ${id}`);
  }
});

test('citations courtes', () => {
  assert.equal(shortCite(sourceById.engel1977), 'Engel, 1977');
  assert.equal(shortCite(sourceById.cohen1985), 'Cohen & Wills, 1985');
  assert.equal(shortCite(sourceById.buysse1989), 'Buysse et al., 1989');
  assert.equal(shortCite(sourceById.craig2003), 'Craig et al., 2003');
  assert.equal(shortCite(sourceById.walker2009), 'Walker & van der Helm, 2009');
  assert.equal(shortCite(sourceById.whoqol1998), 'The WHOQOL Group, 1998');
  assert.equal(shortCite(sourceById.neff2003), 'Neff, 2003');
});
