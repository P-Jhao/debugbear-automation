const isDebugEnabled = () => {
  const flag = process.env.PERF_TASK_DEBUG
  if (!flag) {
    return process.env.NODE_ENV !== 'production'
  }
  return flag === '1' || flag.toLowerCase() === 'true'
}

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  try {
    return JSON.stringify(error)
  } catch {
    return 'unknown_error'
  }
}

const now = () => new Date().toISOString()

export const perfTaskLog = {
  info(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      console.info(`[PerfTask][${now()}] ${message}`, meta)
      return
    }
    console.info(`[PerfTask][${now()}] ${message}`)
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      console.warn(`[PerfTask][${now()}] ${message}`, meta)
      return
    }
    console.warn(`[PerfTask][${now()}] ${message}`)
  },
  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    const payload = {
      ...(meta ?? {}),
      error: error ? toErrorMessage(error) : undefined
    }
    console.error(`[PerfTask][${now()}] ${message}`, payload)
  },
  debug(message: string, meta?: Record<string, unknown>) {
    if (!isDebugEnabled()) {
      return
    }
    if (meta) {
      console.debug(`[PerfTask][${now()}] ${message}`, meta)
      return
    }
    console.debug(`[PerfTask][${now()}] ${message}`)
  }
}

export const toTaskErrorMessage = (error: unknown, fallback = '任务执行失败') => {
  const message = toErrorMessage(error)
  return message && message !== 'unknown_error' ? message : fallback
}
