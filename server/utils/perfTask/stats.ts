import type { MetricSummary, PerfTaskSummary } from '~/shared/types/perfTask'

interface MetricRun {
  lcp: number | null
  fcp: number | null
  inp: number | null
  tbt: number | null
  cls: number | null
  ttfb: number | null
  labScore: number | null
  pageWeight: number | null
  status: 'success' | 'failed'
}

const normalizeValue = (value: number | null): number | null => {
  if (value === null || Number.isNaN(value)) {
    return null
  }

  return value
}

const computeMetricSummary = (values: number[]): MetricSummary => {
  if (values.length === 0) {
    return {
      avg: null,
      trimmedAvg: null,
      max: null,
      min: null
    }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((acc, item) => acc + item, 0)
  const avg = sum / values.length
  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  let trimmedAvg: number | null = null
  if (sorted.length >= 3) {
    const trimmed = sorted.slice(1, sorted.length - 1)
    const trimmedSum = trimmed.reduce((acc, item) => acc + item, 0)
    trimmedAvg = trimmedSum / trimmed.length
  }

  return {
    avg: normalizeValue(avg),
    trimmedAvg: normalizeValue(trimmedAvg),
    max: normalizeValue(max),
    min: normalizeValue(min)
  }
}

export const buildPerfTaskSummary = (runs: MetricRun[]): PerfTaskSummary => {
  const successfulRuns = runs.filter((run) => run.status === 'success')
  const getValues = (field: keyof Omit<MetricRun, 'status'>) =>
    successfulRuns
      .map((run) => run[field])
      .filter((value): value is number => typeof value === 'number')

  const successCount = successfulRuns.length
  const failCount = runs.length - successCount

  return {
    lcp: computeMetricSummary(getValues('lcp')),
    fcp: computeMetricSummary(getValues('fcp')),
    inp: computeMetricSummary(getValues('inp')),
    tbt: computeMetricSummary(getValues('tbt')),
    cls: computeMetricSummary(getValues('cls')),
    ttfb: computeMetricSummary(getValues('ttfb')),
    labScore: computeMetricSummary(getValues('labScore')),
    pageWeight: computeMetricSummary(getValues('pageWeight')),
    successCount,
    failCount
  }
}
