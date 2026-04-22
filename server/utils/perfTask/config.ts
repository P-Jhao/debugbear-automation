const parsePositiveNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return Math.floor(parsed)
}

export interface PerfTaskRuntimeConfig {
  debugBearApiKey: string
  debugBearApiBaseUrl: string
  debugBearPageId: number | null
  debugBearProjectId: number | null
  defaultCount: number
  minCount: number
  maxCount: number
  concurrency: number
  retryCount: number
  pollIntervalMs: number
}

let cachedConfig: PerfTaskRuntimeConfig | null = null

export const getPerfTaskConfig = (): PerfTaskRuntimeConfig => {
  if (cachedConfig) {
    return cachedConfig
  }

  const debugBearApiKey = process.env.DEBUGBEAR_API_KEY ?? ''
  const pageIdRaw = process.env.DEBUGBEAR_PAGE_ID
  const projectIdRaw = process.env.DEBUGBEAR_PROJECT_ID
  const pageIdParsed = Number(pageIdRaw)
  const projectIdParsed = Number(projectIdRaw)
  const debugBearPageId =
    Number.isInteger(pageIdParsed) && pageIdParsed > 0 ? pageIdParsed : null
  const debugBearProjectId =
    Number.isInteger(projectIdParsed) && projectIdParsed > 0 ? projectIdParsed : null

  if (!debugBearApiKey) {
    throw new Error('缺少 DEBUGBEAR_API_KEY 环境变量。')
  }

  if (!debugBearPageId && !debugBearProjectId) {
    throw new Error(
      '请配置 DEBUGBEAR_PAGE_ID（固定页面）或 DEBUGBEAR_PROJECT_ID（自动创建页面）中的任意一个。'
    )
  }

  cachedConfig = {
    debugBearApiKey,
    debugBearApiBaseUrl:
      process.env.DEBUGBEAR_API_BASE_URL ?? 'https://www.debugbear.com/api/v1',
    debugBearPageId,
    debugBearProjectId,
    defaultCount: parsePositiveNumber(process.env.PERF_TASK_DEFAULT_COUNT, 12),
    minCount: parsePositiveNumber(process.env.PERF_TASK_MIN_COUNT, 3),
    maxCount: parsePositiveNumber(process.env.PERF_TASK_MAX_COUNT, 30),
    concurrency: parsePositiveNumber(process.env.PERF_TASK_CONCURRENCY, 2),
    retryCount: parsePositiveNumber(process.env.PERF_TASK_RETRY_COUNT, 1),
    pollIntervalMs: parsePositiveNumber(process.env.PERF_TASK_POLL_INTERVAL_MS, 3000)
  }

  return cachedConfig
}
