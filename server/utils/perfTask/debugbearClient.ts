import { DebugBear } from 'debugbear'
import { getPerfTaskConfig } from './config'

interface DebugBearMetricResult {
  runId: string | null
  debugBearUrl: string | null
  lcp: number | null
  inp: number | null
  cls: number | null
  ttfb: number | null
}

let debugBearClient: DebugBear | null = null
const pageIdCacheByUrl = new Map<string, number>()

const getClient = () => {
  if (debugBearClient) {
    return debugBearClient
  }

  const config = getPerfTaskConfig()
  debugBearClient = new DebugBear(config.debugBearApiKey)
  return debugBearClient
}

const pickNumber = (
  metrics: Record<string, number | string | null | undefined>,
  candidates: string[]
) => {
  for (const key of candidates) {
    const value = metrics[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
  }
  return null
}

const parseRunIdFromUrl = (url: string | null): string | null => {
  if (!url) {
    return null
  }

  const matched = url.match(/\/(\d+)(?:\/)?$/)
  return matched?.[1] ?? null
}

export const runDebugBearAnalysis = async (url: string): Promise<DebugBearMetricResult> => {
  const pageId = await resolveDebugBearPageId(url)
  const client = getClient()

  const analysis = await client.pages.analyze(pageId, { url })
  const result = await analysis.waitForResult()
  const metrics = (result?.build?.metrics ?? {}) as Record<
    string,
    number | string | null | undefined
  >
  const debugBearUrl = result?.url ?? null

  return {
    runId: parseRunIdFromUrl(debugBearUrl),
    debugBearUrl,
    lcp: pickNumber(metrics, ['performance.largestContentfulPaint', 'crux.lcp.p75']),
    inp: pickNumber(metrics, ['performance.interactionToNextPaint', 'crux.inp.p75']),
    cls: pickNumber(metrics, ['performance.cumulativeLayoutShift', 'crux.cls.p75']),
    ttfb: pickNumber(metrics, ['performance.serverResponseTime', 'performance.timeToFirstByte'])
  }
}

const normalizeUrl = (input: string) => {
  const url = new URL(input)
  const pathname = url.pathname.endsWith('/') && url.pathname !== '/' ? url.pathname.slice(0, -1) : url.pathname
  return `${url.protocol}//${url.host}${pathname}${url.search}`
}

const createPageName = (url: string) => {
  const parsed = new URL(url)
  const path = parsed.pathname === '/' ? 'root' : parsed.pathname.replace(/[^\w-]/g, '-')
  return `${parsed.hostname}-${path}`.slice(0, 80)
}

const loadProjectPages = async (projectId: number, apiKey: string, apiBaseUrl: string) => {
  return await $fetch<{ pages?: Array<{ id: number | string; url?: string }> }>(
    `${apiBaseUrl}/projects/${projectId}`,
    {
      headers: {
        'x-api-key': apiKey
      }
    }
  )
}

const createProjectPage = async (
  projectId: number,
  apiKey: string,
  apiBaseUrl: string,
  url: string
) => {
  return await $fetch<{ id: number | string }>(`${apiBaseUrl}/projects/${projectId}/pages`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey
    },
    body: {
      name: createPageName(url),
      url
    }
  })
}

export const resolveDebugBearPageId = async (url: string): Promise<number> => {
  const config = getPerfTaskConfig()
  if (config.debugBearPageId) {
    return config.debugBearPageId
  }

  const normalizedUrl = normalizeUrl(url)
  const cached = pageIdCacheByUrl.get(normalizedUrl)
  if (cached) {
    return cached
  }

  if (!config.debugBearProjectId) {
    throw new Error(
      '未配置 DEBUGBEAR_PROJECT_ID，无法自动创建页面。请设置 DEBUGBEAR_PROJECT_ID 或直接设置 DEBUGBEAR_PAGE_ID。'
    )
  }

  const project = await loadProjectPages(
    config.debugBearProjectId,
    config.debugBearApiKey,
    config.debugBearApiBaseUrl
  )
  const existing = (project.pages ?? []).find((item) => {
    if (!item.url) {
      return false
    }
    try {
      return normalizeUrl(item.url) === normalizedUrl
    } catch {
      return false
    }
  })

  if (existing) {
    const parsed = Number(existing.id)
    if (Number.isInteger(parsed) && parsed > 0) {
      pageIdCacheByUrl.set(normalizedUrl, parsed)
      return parsed
    }
  }

  const created = await createProjectPage(
    config.debugBearProjectId,
    config.debugBearApiKey,
    config.debugBearApiBaseUrl,
    url
  )

  const pageId = Number(created.id)
  if (!Number.isInteger(pageId) || pageId <= 0) {
    throw new Error('自动创建 DebugBear 页面失败：返回的 page id 非法。')
  }

  pageIdCacheByUrl.set(normalizedUrl, pageId)
  return pageId
}
