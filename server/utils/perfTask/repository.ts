import { randomUUID } from 'node:crypto'
import type {
  CreatePerfTaskRequest,
  PerfTaskDetailResponse,
  PerfTaskFilters,
  PerfTaskListItem,
  PerfTaskRunItem,
  PerfTaskStatus,
  PerfTaskSummary
} from '~/shared/types/perfTask'
import { getPerfTaskDb } from './db'

interface PerfTaskRow {
  task_id: string
  url: string
  count: number
  version: string
  task_group: string
  status: PerfTaskStatus
  progress_count: number
  success_count: number
  fail_count: number
  error_message: string | null
  summary_json: string | null
  remark: string | null
  created_at: string
  updated_at: string
}

interface PerfTaskRunRow {
  run_index: number
  run_id: string | null
  status: 'success' | 'failed'
  debugbear_url: string | null
  lcp: number | null
  inp: number | null
  cls: number | null
  ttfb: number | null
  error_message: string | null
  created_at: string
}

const toListItem = (row: PerfTaskRow): PerfTaskListItem => ({
  taskId: row.task_id,
  url: row.url,
  count: row.count,
  version: row.version,
  group: row.task_group,
  status: row.status,
  progressCount: row.progress_count,
  successCount: row.success_count,
  failCount: row.fail_count,
  errorMessage: row.error_message,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const toRunItem = (row: PerfTaskRunRow): PerfTaskRunItem => ({
  runIndex: row.run_index,
  runId: row.run_id,
  status: row.status,
  debugBearUrl: row.debugbear_url,
  lcp: row.lcp,
  inp: row.inp,
  cls: row.cls,
  ttfb: row.ttfb,
  errorMessage: row.error_message,
  createdAt: row.created_at
})

export const createPerfTask = (payload: CreatePerfTaskRequest) => {
  const db = getPerfTaskDb()
  const taskId = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `
      INSERT INTO perf_tasks (
        task_id,
        url,
        count,
        version,
        task_group,
        status,
        progress_count,
        success_count,
        fail_count,
        config_json,
        remark,
        created_at,
        updated_at
      )
      VALUES (
        @taskId,
        @url,
        @count,
        @version,
        @group,
        'pending',
        0,
        0,
        0,
        @configJson,
        @remark,
        @createdAt,
        @updatedAt
      );
    `
  ).run({
    taskId,
    url: payload.url,
    count: payload.count,
    version: payload.version,
    group: payload.group,
    configJson: payload.config ? JSON.stringify(payload.config) : null,
    remark: payload.remark ?? null,
    createdAt: now,
    updatedAt: now
  })

  return taskId
}

export const listPerfTasks = (filters: PerfTaskFilters): PerfTaskListItem[] => {
  const db = getPerfTaskDb()
  const clauses: string[] = []
  const params: Record<string, unknown> = {}

  if (filters.url) {
    clauses.push('url LIKE @url')
    params.url = `%${filters.url.trim()}%`
  }
  if (filters.status) {
    clauses.push('status = @status')
    params.status = filters.status
  }
  if (filters.version) {
    clauses.push('version = @version')
    params.version = filters.version
  }
  if (filters.group) {
    clauses.push('task_group = @group')
    params.group = filters.group
  }
  if (filters.dateFrom) {
    clauses.push('created_at >= @dateFrom')
    params.dateFrom = filters.dateFrom
  }
  if (filters.dateTo) {
    clauses.push('created_at <= @dateTo')
    params.dateTo = filters.dateTo
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `
      SELECT
        task_id,
        url,
        count,
        version,
        task_group,
        status,
        progress_count,
        success_count,
        fail_count,
        error_message,
        summary_json,
        remark,
        created_at,
        updated_at
      FROM perf_tasks
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 200;
    `
    )
    .all(params) as PerfTaskRow[]

  return rows.map(toListItem)
}

export const getPerfTaskDetail = (taskId: string): PerfTaskDetailResponse | null => {
  const db = getPerfTaskDb()
  const row = db
    .prepare(
      `
      SELECT
        task_id,
        url,
        count,
        version,
        task_group,
        status,
        progress_count,
        success_count,
        fail_count,
        error_message,
        summary_json,
        remark,
        created_at,
        updated_at
      FROM perf_tasks
      WHERE task_id = ?;
      `
    )
    .get(taskId) as PerfTaskRow | undefined

  if (!row) {
    return null
  }

  const runRows = db
    .prepare(
      `
      SELECT
        run_index,
        run_id,
        status,
        debugbear_url,
        lcp,
        inp,
        cls,
        ttfb,
        error_message,
        created_at
      FROM perf_task_runs
      WHERE task_id = ?
      ORDER BY run_index ASC;
      `
    )
    .all(taskId) as PerfTaskRunRow[]

  let summary: PerfTaskSummary | null = null
  if (row.summary_json) {
    summary = JSON.parse(row.summary_json) as PerfTaskSummary
  }

  return {
    ...toListItem(row),
    summary,
    runs: runRows.map(toRunItem),
    remark: row.remark
  }
}

export const markPerfTaskRunning = (taskId: string) => {
  const db = getPerfTaskDb()
  db.prepare(
    `
      UPDATE perf_tasks
      SET status = 'running', updated_at = @updatedAt
      WHERE task_id = @taskId;
    `
  ).run({
    taskId,
    updatedAt: new Date().toISOString()
  })
}

export const markPerfTaskFailed = (taskId: string, message: string) => {
  const db = getPerfTaskDb()
  db.prepare(
    `
      UPDATE perf_tasks
      SET status = 'failed', error_message = @message, updated_at = @updatedAt
      WHERE task_id = @taskId;
    `
  ).run({
    taskId,
    message,
    updatedAt: new Date().toISOString()
  })
}

export const appendPerfTaskRun = (taskId: string, run: PerfTaskRunItem) => {
  const db = getPerfTaskDb()
  db.exec('BEGIN;')
  try {
    db.prepare(
      `
      INSERT INTO perf_task_runs (
        task_id,
        run_index,
        run_id,
        debugbear_url,
        status,
        lcp,
        inp,
        cls,
        ttfb,
        error_message,
        created_at
      )
      VALUES (
        @taskId,
        @runIndex,
        @runId,
        @debugbearUrl,
        @status,
        @lcp,
        @inp,
        @cls,
        @ttfb,
        @errorMessage,
        @createdAt
      );
      `
    ).run({
      taskId,
      runIndex: run.runIndex,
      runId: run.runId,
      debugbearUrl: run.debugBearUrl,
      status: run.status,
      lcp: run.lcp,
      inp: run.inp,
      cls: run.cls,
      ttfb: run.ttfb,
      errorMessage: run.errorMessage,
      createdAt: run.createdAt
    })

    db.prepare(
      `
      UPDATE perf_tasks
      SET
        progress_count = progress_count + 1,
        success_count = success_count + @successDelta,
        fail_count = fail_count + @failDelta,
        updated_at = @updatedAt
      WHERE task_id = @taskId;
      `
    ).run({
      taskId,
      successDelta: run.status === 'success' ? 1 : 0,
      failDelta: run.status === 'failed' ? 1 : 0,
      updatedAt: new Date().toISOString()
    })
    db.exec('COMMIT;')
  } catch (error) {
    db.exec('ROLLBACK;')
    throw error
  }
}

export const finalizePerfTask = (
  taskId: string,
  status: PerfTaskStatus,
  summary: PerfTaskSummary
) => {
  const db = getPerfTaskDb()
  db.prepare(
    `
      UPDATE perf_tasks
      SET
        status = @status,
        summary_json = @summaryJson,
        updated_at = @updatedAt
      WHERE task_id = @taskId;
    `
  ).run({
    taskId,
    status,
    summaryJson: JSON.stringify(summary),
    updatedAt: new Date().toISOString()
  })
}

export const getTaskMeta = (taskId: string) => {
  const db = getPerfTaskDb()
  return db
    .prepare(
      `
      SELECT task_id, url, count
      FROM perf_tasks
      WHERE task_id = ?;
      `
    )
    .get(taskId) as { task_id: string; url: string; count: number } | undefined
}

export const listTaskRunsByTaskId = (taskId: string) => {
  const db = getPerfTaskDb()
  return db
    .prepare(
      `
      SELECT
        run_index,
        run_id,
        status,
        debugbear_url,
        lcp,
        inp,
        cls,
        ttfb,
        error_message,
        created_at
      FROM perf_task_runs
      WHERE task_id = ?
      ORDER BY run_index ASC;
      `
    )
    .all(taskId) as PerfTaskRunRow[]
}

export const listDistinctVersions = () => {
  const db = getPerfTaskDb()
  const rows = db
    .prepare(
      `
      SELECT DISTINCT version
      FROM perf_tasks
      ORDER BY version DESC;
      `
    )
    .all() as Array<{ version: string }>
  return rows.map((row) => row.version)
}

export const listDistinctGroupsByVersion = (version: string) => {
  const db = getPerfTaskDb()
  const rows = db
    .prepare(
      `
      SELECT DISTINCT task_group
      FROM perf_tasks
      WHERE version = ?
      ORDER BY task_group ASC;
      `
    )
    .all(version) as Array<{ task_group: string }>
  return rows.map((row) => row.task_group)
}
