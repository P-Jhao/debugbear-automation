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
  const config = getPerfTaskConfig()
  const client = getClient()

  const analysis = await client.pages.analyze(config.debugBearPageId, { url })
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
