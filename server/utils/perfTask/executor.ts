import type { PerfTaskRunItem, PerfTaskStatus } from '~/shared/types/perfTask'
import { getPerfTaskConfig } from './config'
import { runDebugBearAnalysis } from './debugbearClient'
import { perfTaskLog, toTaskErrorMessage } from './logger'
import {
  appendPerfTaskRun,
  finalizePerfTask,
  getTaskMeta,
  listTaskRunsByTaskId,
  markPerfTaskCancelled,
  markPerfTaskFailed,
  markPerfTaskRunning
} from './repository'
import { buildPerfTaskSummary } from './stats'

const runningTaskIds = new Set<string>()
const cancelRequestedTaskIds = new Set<string>()

class TaskCancelledError extends Error {
  constructor() {
    super('任务已手动停止')
    this.name = 'TaskCancelledError'
  }
}

const isTaskCancelledError = (error: unknown) => error instanceof TaskCancelledError

const throwIfTaskCancelled = (taskId: string) => {
  if (cancelRequestedTaskIds.has(taskId)) {
    throw new TaskCancelledError()
  }
}

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
      perfTaskLog.debug('run attempt start', { attempt: attempt + 1, url })
      return await runDebugBearAnalysis(url)
    } catch (error) {
      lastError = error
      attempt += 1
      perfTaskLog.warn('run attempt failed', {
        attempt,
        retryCount,
        url,
        error: toTaskErrorMessage(error, '调用 DebugBear 失败')
      })
      if (attempt > retryCount) {
        throw lastError
      }
    }
  }

  throw lastError
}

export const startPerfTaskExecution = (taskId: string) => {
  if (cancelRequestedTaskIds.has(taskId)) {
    perfTaskLog.warn('skip start: task cancelled before execution', { taskId })
    cancelRequestedTaskIds.delete(taskId)
    return
  }

  if (runningTaskIds.has(taskId)) {
    perfTaskLog.warn('skip start: task already running', { taskId })
    return
  }

  runningTaskIds.add(taskId)
  perfTaskLog.info('task execution scheduled', { taskId })
  void executePerfTask(taskId).finally(() => {
    runningTaskIds.delete(taskId)
    cancelRequestedTaskIds.delete(taskId)
    perfTaskLog.info('task execution released lock', { taskId })
  })
}

export const requestCancelPerfTaskExecution = (taskId: string) => {
  cancelRequestedTaskIds.add(taskId)
}

const executePerfTask = async (taskId: string) => {
  const taskMeta = getTaskMeta(taskId)
  if (!taskMeta) {
    perfTaskLog.error('task meta not found', undefined, { taskId })
    return
  }

  const config = getPerfTaskConfig()
  perfTaskLog.info('task execution start', {
    taskId,
    url: taskMeta.url,
    count: taskMeta.count,
    concurrency: config.concurrency,
    retryCount: config.retryCount
  })
  const marked = markPerfTaskRunning(taskId)
  if (!marked) {
    perfTaskLog.warn('skip execution: task is not pending/running', { taskId })
    return
  }

  try {
    await runWithConcurrency(taskMeta.count, config.concurrency, async (index) => {
      throwIfTaskCancelled(taskId)
      const createdAt = new Date().toISOString()
      try {
        const result = await runSingleWithRetry(taskMeta.url, config.retryCount)
        throwIfTaskCancelled(taskId)
        const run: PerfTaskRunItem = {
          runIndex: index + 1,
          runId: result.runId,
          status: 'success',
          debugBearUrl: result.debugBearUrl,
          lcp: result.lcp,
          fcp: result.fcp,
          inp: result.inp,
          tbt: result.tbt,
          cls: result.cls,
          ttfb: result.ttfb,
          errorMessage: null,
          createdAt
        }
        appendPerfTaskRun(taskId, run)
        perfTaskLog.info('task run success', {
          taskId,
          runIndex: run.runIndex,
          runId: run.runId,
          debugBearUrl: run.debugBearUrl
        })
      } catch (error) {
        if (isTaskCancelledError(error)) {
          throw error
        }
        const run: PerfTaskRunItem = {
          runIndex: index + 1,
          runId: null,
          status: 'failed',
          debugBearUrl: null,
          lcp: null,
          fcp: null,
          inp: null,
          tbt: null,
          cls: null,
          ttfb: null,
          errorMessage: error instanceof Error ? error.message : '调用 DebugBear 失败',
          createdAt
        }
        appendPerfTaskRun(taskId, run)
        perfTaskLog.error('task run failed', error, {
          taskId,
          runIndex: run.runIndex
        })
      }
    })

    const allRuns = listTaskRunsByTaskId(taskId)
    const summary = buildPerfTaskSummary(
      allRuns.map((run) => ({
        lcp: run.lcp,
        fcp: run.fcp,
        inp: run.inp,
        tbt: run.tbt,
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
    perfTaskLog.info('task execution finished', {
      taskId,
      finalStatus,
      successCount: summary.successCount,
      failCount: summary.failCount
    })
  } catch (error) {
    const message = isTaskCancelledError(error)
      ? '任务已中止'
      : toTaskErrorMessage(error, '任务执行失败')
    if (isTaskCancelledError(error)) {
      markPerfTaskCancelled(taskId, message)
      perfTaskLog.warn('task execution cancelled', { taskId })
      return
    }
    markPerfTaskFailed(taskId, message)
    perfTaskLog.error('task execution aborted', error, { taskId })
  }
}

