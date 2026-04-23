import { DebugBear } from 'debugbear'
import { getPerfTaskConfig } from './config'
import { perfTaskLog } from './logger'

interface DebugBearMetricResult {
  runId: string | null
  debugBearUrl: string | null
  lcp: number | null
  fcp: number | null
  inp: number | null
  tbt: number | null
  cls: number | null
  ttfb: number | null
  labScore: number | null
  pageWeight: number | null
}

let debugBearClient: DebugBear | null = null
const pageIdCacheByUrl = new Map<string, number>()

const toDebugBearDeviceName = (device?: 'mobile' | 'desktop') => {
  if (device === 'mobile') {
    return 'Mobile'
  }
  if (device === 'desktop') {
    return 'Desktop'
  }
  return undefined
}

const getClient = () => {
  if (debugBearClient) {
    return debugBearClient
  }

  const config = getPerfTaskConfig()
  debugBearClient = new DebugBear(config.debugBearApiKey)
  perfTaskLog.info('debugbear client initialized')
  return debugBearClient
}

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return null
}

const flattenObject = (value: unknown, prefix = '', out: Record<string, unknown> = {}) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return out
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const next = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      flattenObject(child, next, out)
    } else {
      out[next] = child
    }
  }

  return out
}

const normalizeMetricKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '')

const pickMetric = (metrics: Record<string, unknown>, aliases: string[]) => {
  for (const key of aliases) {
    const direct = toFiniteNumber(metrics[key])
    if (direct !== null) {
      return direct
    }
  }

  const aliasesNormalized = aliases.map(normalizeMetricKey)
  const entries = Object.entries(metrics)

  for (const alias of aliasesNormalized) {
    for (const [key, raw] of entries) {
      const value = toFiniteNumber(raw)
      if (value === null) {
        continue
      }
      const normalizedKey = normalizeMetricKey(key)
      if (normalizedKey === alias || normalizedKey.endsWith(alias)) {
        return value
      }
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

export const runDebugBearAnalysis = async (
  url: string,
  device?: 'mobile' | 'desktop'
): Promise<DebugBearMetricResult> => {
  const pageId = await resolveDebugBearPageId(url, device)
  const client = getClient()
  perfTaskLog.debug('start debugbear analyze', { url, pageId })

  const analysis = await client.pages.analyze(pageId, { url })
  const result = await analysis.waitForResult()
  const metrics = {
    ...flattenObject(result?.build ?? {}),
    ...flattenObject(result?.build?.metrics ?? {})
  }
  const debugBearUrl = result?.url ?? null

  return {
    runId: parseRunIdFromUrl(debugBearUrl),
    debugBearUrl,
    lcp: pickMetric(metrics, ['performance.largestContentfulPaint', 'crux.lcp.p75', 'lcp']),
    fcp: pickMetric(metrics, ['performance.firstContentfulPaint', 'crux.fcp.p75', 'fcp']),
    inp: pickMetric(metrics, ['performance.interactionToNextPaint', 'crux.inp.p75', 'inp']),
    tbt: pickMetric(metrics, ['performance.totalBlockingTime', 'crux.tbt.p75', 'tbt']),
    cls: pickMetric(metrics, ['performance.cumulativeLayoutShift', 'crux.cls.p75', 'cls']),
    ttfb: pickMetric(metrics, ['performance.serverResponseTime', 'performance.timeToFirstByte', 'ttfb']),
    labScore: pickMetric(metrics, ['performance.score', 'lighthouse.performance', 'labScore']),
    pageWeight: pickMetric(metrics, ['pageWeight.total', 'performance.pageWeight', 'pageWeight', 'pageweight'])
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
  return await $fetch<{
    pages?: Array<{
      id: number | string
      url?: string
      device?: {
        formFactor?: 'mobile' | 'desktop'
      }
    }>
  }>(
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
  url: string,
  device?: 'mobile' | 'desktop'
) => {
  const deviceName = toDebugBearDeviceName(device)
  return await $fetch<{ id: number | string }>(`${apiBaseUrl}/projects/${projectId}/pages`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey
    },
    body: {
      name: createPageName(url),
      url,
      ...(deviceName ? { deviceName } : {})
    }
  })
}

export const resolveDebugBearPageId = async (
  url: string,
  device?: 'mobile' | 'desktop'
): Promise<number> => {
  const config = getPerfTaskConfig()
  if (config.debugBearPageId) {
    perfTaskLog.debug('use fixed page id from env', { pageId: config.debugBearPageId })
    return config.debugBearPageId
  }

  const normalizedUrl = normalizeUrl(url)
  const pageCacheKey = `${normalizedUrl}::${device ?? 'all'}`
  const cached = pageIdCacheByUrl.get(pageCacheKey)
  if (cached) {
    perfTaskLog.debug('reuse cached page id', { normalizedUrl, device, pageId: cached })
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
  perfTaskLog.debug('loaded project pages', {
    projectId: config.debugBearProjectId,
    count: project.pages?.length ?? 0
  })
  const existing = (project.pages ?? []).find((item) => {
    if (!item.url) {
      return false
    }
    if (device && item.device?.formFactor && item.device.formFactor !== device) {
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
      pageIdCacheByUrl.set(pageCacheKey, parsed)
      perfTaskLog.info('found existing page for url', {
        normalizedUrl,
        device,
        pageId: parsed
      })
      return parsed
    }
  }

  const created = await createProjectPage(
    config.debugBearProjectId,
    config.debugBearApiKey,
    config.debugBearApiBaseUrl,
    url,
    device
  )

  const pageId = Number(created.id)
  if (!Number.isInteger(pageId) || pageId <= 0) {
    throw new Error('自动创建 DebugBear 页面失败：返回的 page id 非法。')
  }

  pageIdCacheByUrl.set(pageCacheKey, pageId)
  perfTaskLog.info('created new debugbear page', {
    normalizedUrl,
    device,
    pageId,
    projectId: config.debugBearProjectId
  })
  return pageId
}
