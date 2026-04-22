import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

let dbInstance: DatabaseSync | null = null

const ensureSchema = (db: DatabaseSync) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS perf_tasks (
      task_id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      count INTEGER NOT NULL,
      version TEXT NOT NULL,
      task_group TEXT NOT NULL,
      status TEXT NOT NULL,
      progress_count INTEGER NOT NULL DEFAULT 0,
      success_count INTEGER NOT NULL DEFAULT 0,
      fail_count INTEGER NOT NULL DEFAULT 0,
      config_json TEXT,
      remark TEXT,
      summary_json TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS perf_task_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      run_index INTEGER NOT NULL,
      run_id TEXT,
      debugbear_url TEXT,
      status TEXT NOT NULL,
      lcp REAL,
      inp REAL,
      cls REAL,
      ttfb REAL,
      error_message TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(task_id) REFERENCES perf_tasks(task_id)
    );
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_perf_tasks_created_at
    ON perf_tasks(created_at DESC);
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_perf_task_runs_task_id
    ON perf_task_runs(task_id, run_index);
  `)
}

export const getPerfTaskDb = () => {
  if (dbInstance) {
    return dbInstance
  }

  const dbPath = resolve(process.cwd(), '.data', 'perf-tasks.db')
  mkdirSync(dirname(dbPath), { recursive: true })
  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA journal_mode = WAL;')
  ensureSchema(db)
  dbInstance = db
  return dbInstance
}
