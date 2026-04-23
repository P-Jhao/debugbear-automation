import { randomUUID } from 'node:crypto'
import type {
  CreatePerfTaskRequest,
  PerfTaskDevice,
  PerfTaskDetailResponse,
  PerfTaskFilters,
  PerfTaskListItem,
  PerfTaskRunItem,
  PerfTaskStatus,
  PerfTaskSummary
} from '~/shared/types/perfTask'
import { getPerfTaskDb } from './db'
import { buildPerfTaskSummary } from './stats'

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
  config_json: string | null
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
  fcp: number | null
  inp: number | null
  tbt: number | null
  cls: number | null
  ttfb: number | null
  lab_score: number | null
  page_weight: number | null
  error_message: string | null
  created_at: string
}

interface SummaryMetricRow {
  status: 'success' | 'failed'
  lcp: number | null
  fcp: number | null
  inp: number | null
  tbt: number | null
  cls: number | null
  ttfb: number | null
  lab_score: number | null
  page_weight: number | null
}

type DeletePerfTaskResult = 'deleted' | 'not_found' | 'running'
type StopPerfTaskResult = 'stopped' | 'not_found' | 'not_stoppable'

const toListItem = (row: PerfTaskRow): PerfTaskListItem => ({
  taskId: row.task_id,
  url: row.url,
  count: row.count,
  version: row.version,
  group: row.task_group,
  device: pickListDevice(row.config_json),
  status: row.status,
  progressCount: row.progress_count,
  successCount: row.success_count,
  failCount: row.fail_count,
  errorMessage: row.error_message,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const pickListDevice = (configJson: string | null): PerfTaskDevice => {
  if (!configJson) {
    return 'unknown'
  }

  try {
    const parsed = JSON.parse(configJson) as {
      device?: unknown
      devices?: unknown
    }

    if (Array.isArray(parsed.devices)) {
      const normalized = parsed.devices.filter(
        (item): item is 'mobile' | 'desktop' => item === 'mobile' || item === 'desktop'
      )

      if (normalized.length === 1) {
        return normalized[0]
      }
      if (normalized.length >= 2) {
        return 'unknown'
      }
    }

    if (parsed.device === 'mobile' || parsed.device === 'desktop') {
      return parsed.device
    }
  } catch {
    return 'unknown'
  }

  return 'unknown'
}

const toRunItem = (row: PerfTaskRunRow): PerfTaskRunItem => ({
  runIndex: row.run_index,
  runId: row.run_id,
  status: row.status,
  debugBearUrl: row.debugbear_url,
  lcp: row.lcp,
  fcp: row.fcp,
  inp: row.inp,
  tbt: row.tbt,
  cls: row.cls,
  ttfb: row.ttfb,
  labScore: row.lab_score,
  pageWeight: row.page_weight,
  errorMessage: row.error_message,
  createdAt: row.created_at
})

const EMPTY_METRIC_SUMMARY = {
  avg: null,
  trimmedAvg: null,
  max: null,
  min: null
} as const

const normalizeMetricSummary = (metric: unknown) => {
  if (!metric || typeof metric !== 'object') {
    return { ...EMPTY_METRIC_SUMMARY }
  }

  const maybe = metric as {
    avg?: number | null
    trimmedAvg?: number | null
    max?: number | null
    min?: number | null
  }

  return {
    avg: typeof maybe.avg === 'number' ? maybe.avg : null,
    trimmedAvg: typeof maybe.trimmedAvg === 'number' ? maybe.trimmedAvg : null,
    max: typeof maybe.max === 'number' ? maybe.max : null,
    min: typeof maybe.min === 'number' ? maybe.min : null
  }
}

const normalizeSummary = (summary: unknown): PerfTaskSummary | null => {
  if (!summary || typeof summary !== 'object') {
    return null
  }

  const maybe = summary as Partial<PerfTaskSummary>
  return {
    lcp: normalizeMetricSummary(maybe.lcp),
    fcp: normalizeMetricSummary(maybe.fcp),
    inp: normalizeMetricSummary(maybe.inp),
    tbt: normalizeMetricSummary(maybe.tbt),
    cls: normalizeMetricSummary(maybe.cls),
    ttfb: normalizeMetricSummary(maybe.ttfb),
    labScore: normalizeMetricSummary(maybe.labScore),
    pageWeight: normalizeMetricSummary(maybe.pageWeight),
    successCount: typeof maybe.successCount === 'number' ? maybe.successCount : 0,
    failCount: typeof maybe.failCount === 'number' ? maybe.failCount : 0
  }
}

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
      ;
    `
    )
    .all(params) as PerfTaskRow[]
  const items = rows.map(toListItem)
  const filtered = filters.device ? items.filter((item) => item.device === filters.device) : items
  return filtered.slice(0, 200)
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
        config_json,
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
        fcp,
        inp,
        tbt,
        cls,
        ttfb,
        lab_score,
        page_weight,
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
    summary = normalizeSummary(JSON.parse(row.summary_json))
  }

  return {
    ...toListItem(row),
    summary,
    runs: runRows.map(toRunItem),
    remark: row.remark
  }
}

export const markPerfTaskRunning = (taskId: string): boolean => {
  const db = getPerfTaskDb()
  const result = db
    .prepare(
    `
      UPDATE perf_tasks
      SET status = 'running', updated_at = @updatedAt
      WHERE task_id = @taskId
        AND status IN ('pending', 'running');
    `
  ).run({
    taskId,
    updatedAt: new Date().toISOString()
  })
  return result.changes > 0
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

export const markPerfTaskCancelled = (taskId: string, message: string) => {
  const db = getPerfTaskDb()
  db.prepare(
    `
      UPDATE perf_tasks
      SET status = 'cancelled', error_message = @message, updated_at = @updatedAt
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
    const updatedAt = new Date().toISOString()
    db.prepare(
      `
      INSERT INTO perf_task_runs (
        task_id,
        run_index,
        run_id,
        debugbear_url,
        status,
        lcp,
        fcp,
        inp,
        tbt,
        cls,
        ttfb,
        lab_score,
        page_weight,
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
        @fcp,
        @inp,
        @tbt,
        @cls,
        @ttfb,
        @labScore,
        @pageWeight,
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
      fcp: run.fcp,
      inp: run.inp,
      tbt: run.tbt,
      cls: run.cls,
      ttfb: run.ttfb,
      labScore: run.labScore,
      pageWeight: run.pageWeight,
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
      updatedAt
    })

    const metricRows = db
      .prepare(
        `
        SELECT
          status,
          lcp,
          fcp,
          inp,
          tbt,
          cls,
          ttfb,
          lab_score,
          page_weight
        FROM perf_task_runs
        WHERE task_id = ?;
        `
      )
      .all(taskId) as SummaryMetricRow[]

    const summary = buildPerfTaskSummary(
      metricRows.map((row) => ({
        status: row.status,
        lcp: row.lcp,
        fcp: row.fcp,
        inp: row.inp,
        tbt: row.tbt,
        cls: row.cls,
        ttfb: row.ttfb,
        labScore: row.lab_score,
        pageWeight: row.page_weight
      }))
    )

    db.prepare(
      `
      UPDATE perf_tasks
      SET summary_json = @summaryJson, updated_at = @updatedAt
      WHERE task_id = @taskId;
      `
    ).run({
      taskId,
      summaryJson: JSON.stringify(summary),
      updatedAt
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
  const row = db
    .prepare(
      `
      SELECT task_id, url, count, config_json
      FROM perf_tasks
      WHERE task_id = ?;
      `
    )
    .get(taskId) as
    | { task_id: string; url: string; count: number; config_json: string | null }
    | undefined

  if (!row) {
    return undefined
  }

  let config: CreatePerfTaskRequest['config'] | undefined
  if (row.config_json) {
    try {
      config = JSON.parse(row.config_json) as CreatePerfTaskRequest['config']
    } catch {
      config = undefined
    }
  }

  return {
    task_id: row.task_id,
    url: row.url,
    count: row.count,
    config
  }
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
        fcp,
        inp,
        tbt,
        cls,
        ttfb,
        lab_score,
        page_weight,
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

export const listDistinctGroups = () => {
  const db = getPerfTaskDb()
  const rows = db
    .prepare(
      `
      SELECT DISTINCT task_group
      FROM perf_tasks
      ORDER BY task_group ASC;
      `
    )
    .all() as Array<{ task_group: string }>
  return rows.map((row) => row.task_group)
}

export const deletePerfTask = (taskId: string): DeletePerfTaskResult => {
  const db = getPerfTaskDb()

  const task = db
    .prepare(
      `
      SELECT status
      FROM perf_tasks
      WHERE task_id = ?;
      `
    )
    .get(taskId) as { status: PerfTaskStatus } | undefined

  if (!task) {
    return 'not_found'
  }

  if (task.status === 'running') {
    return 'running'
  }

  db.exec('BEGIN;')
  try {
    db.prepare(
      `
      DELETE FROM perf_task_runs
      WHERE task_id = ?;
      `
    ).run(taskId)

    db.prepare(
      `
      DELETE FROM perf_tasks
      WHERE task_id = ?;
      `
    ).run(taskId)

    db.exec('COMMIT;')
    return 'deleted'
  } catch (error) {
    db.exec('ROLLBACK;')
    throw error
  }
}

export const stopPerfTask = (taskId: string, message = '任务已手动停止'): StopPerfTaskResult => {
  const db = getPerfTaskDb()
  const now = new Date().toISOString()

  const result = db
    .prepare(
      `
      UPDATE perf_tasks
      SET status = 'cancelled', error_message = @message, updated_at = @updatedAt
      WHERE task_id = @taskId
        AND status IN ('pending', 'running');
      `
    )
    .run({
      taskId,
      message,
      updatedAt: now
    })

  if (result.changes > 0) {
    return 'stopped'
  }

  const exists = db
    .prepare(
      `
      SELECT 1
      FROM perf_tasks
      WHERE task_id = ?;
      `
    )
    .get(taskId) as { 1: number } | undefined

  if (!exists) {
    return 'not_found'
  }

  return 'not_stoppable'
}

export const markStaleRunningTasksAsFailed = (message = '服务重启导致任务中断') => {
  const db = getPerfTaskDb()
  const result = db
    .prepare(
      `
      UPDATE perf_tasks
      SET status = 'failed', error_message = @message, updated_at = @updatedAt
      WHERE status = 'running';
      `
    )
    .run({
      message,
      updatedAt: new Date().toISOString()
    })

  return result.changes
}


