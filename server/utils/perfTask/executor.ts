import type { PerfTaskRunItem, PerfTaskStatus } from '~/shared/types/perfTask'
import { getPerfTaskConfig } from './config'
import { runDebugBearAnalysis } from './debugbearClient'
import {
  appendPerfTaskRun,
  finalizePerfTask,
  getTaskMeta,
  listTaskRunsByTaskId,
  markPerfTaskFailed,
  markPerfTaskRunning
} from './repository'
import { buildPerfTaskSummary } from './stats'

const runningTaskIds = new Set<string>()

const runWithConcurrency = async (
  size: number,
  limit: number,
  iterator: (index: number) => Promise<void>
) => {
  let cursor = 0

  const workers = Array.from({ length: limit }, async () => {
    while (cursor < size) {
      const current = cursor
      cursor += 1
      await iterator(current)
    }
  })

  await Promise.all(workers)
}

const runSingleWithRetry = async (url: string, retryCount: number) => {
  let attempt = 0
  let lastError: unknown

  while (attempt <= retryCount) {
    try {
      return await runDebugBearAnalysis(url)
    } catch (error) {
      lastError = error
      attempt += 1
      if (attempt > retryCount) {
        throw lastError
      }
    }
  }

  throw lastError
}

export const startPerfTaskExecution = (taskId: string) => {
  if (runningTaskIds.has(taskId)) {
    return
  }

  runningTaskIds.add(taskId)
  void executePerfTask(taskId).finally(() => {
    runningTaskIds.delete(taskId)
  })
}

const executePerfTask = async (taskId: string) => {
  const taskMeta = getTaskMeta(taskId)
  if (!taskMeta) {
    return
  }

  const config = getPerfTaskConfig()
  markPerfTaskRunning(taskId)

  try {
    await runWithConcurrency(taskMeta.count, config.concurrency, async (index) => {
      const createdAt = new Date().toISOString()
      try {
        const result = await runSingleWithRetry(taskMeta.url, config.retryCount)
        const run: PerfTaskRunItem = {
          runIndex: index + 1,
          runId: result.runId,
          status: 'success',
          debugBearUrl: result.debugBearUrl,
          lcp: result.lcp,
          inp: result.inp,
          cls: result.cls,
          ttfb: result.ttfb,
          errorMessage: null,
          createdAt
        }
        appendPerfTaskRun(taskId, run)
      } catch (error) {
        const run: PerfTaskRunItem = {
          runIndex: index + 1,
          runId: null,
          status: 'failed',
          debugBearUrl: null,
          lcp: null,
          inp: null,
          cls: null,
          ttfb: null,
          errorMessage: error instanceof Error ? error.message : '调用 DebugBear 失败',
          createdAt
        }
        appendPerfTaskRun(taskId, run)
      }
    })

    const allRuns = listTaskRunsByTaskId(taskId)
    const summary = buildPerfTaskSummary(
      allRuns.map((run) => ({
        lcp: run.lcp,
        inp: run.inp,
        cls: run.cls,
        ttfb: run.ttfb,
        status: run.status
      }))
    )

    let finalStatus: PerfTaskStatus = 'completed'
    if (summary.successCount === 0) {
      finalStatus = 'failed'
    } else if (summary.failCount > 0) {
      finalStatus = 'partial_failed'
    }

    finalizePerfTask(taskId, finalStatus, summary)
  } catch (error) {
    const message = error instanceof Error ? error.message : '任务执行失败'
    markPerfTaskFailed(taskId, message)
  }
}
