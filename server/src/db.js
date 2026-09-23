import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../data/core.db');

export function openDatabase(path = process.env.CORE_DB_PATH ?? DEFAULT_PATH) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      started_at    TEXT NOT NULL,
      completed_at  TEXT,
      result_json   TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_assessments_user ON assessments(user_id, completed_at);

    -- Check-in quotidien : un par personne et par jour (le jour est celui de l'appareil).
    CREATE TABLE IF NOT EXISTS checkins (
      user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day           TEXT NOT NULL,
      answers_json  TEXT NOT NULL,
      summary_json  TEXT NOT NULL,
      created_at    TEXT NOT NULL,
      PRIMARY KEY (user_id, day)
    );

    -- Repérages validés (PHQ-4), posés pendant un bilan ou un check-in.
    CREATE TABLE IF NOT EXISTS screenings (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      taken_at   TEXT NOT NULL,
      source     TEXT NOT NULL,
      phq2       INTEGER NOT NULL,
      gad2       INTEGER NOT NULL,
      total      INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_screenings_user ON screenings(user_id, taken_at);

    -- Une ligne par réponse, horodatée : sert aussi aux mesures IHM (temps par carte, abandons).
    CREATE TABLE IF NOT EXISTS answers (
      assessment_id  TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      question_id    TEXT NOT NULL,
      value_json     TEXT NOT NULL,
      answered_at    TEXT NOT NULL,
      PRIMARY KEY (assessment_id, question_id)
    );
  `);

  // Migrations légères : colonnes ajoutées après la première version du schéma.
  const userColumns = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (!userColumns.includes('profile_json')) db.exec('ALTER TABLE users ADD COLUMN profile_json TEXT');
  const assessmentColumns = db.prepare('PRAGMA table_info(assessments)').all().map((c) => c.name);
  // Contexte de repérage figé au début du bilan (PHQ-4 dû ou non) pour que le déroulé reste stable.
  if (!assessmentColumns.includes('context_json')) db.exec('ALTER TABLE assessments ADD COLUMN context_json TEXT');

  return db;
}
