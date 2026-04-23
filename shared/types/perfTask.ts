export type PerfTaskStatus =
  | 'pending'
  | 'running'
  | 'cancelled'
  | 'completed'
  | 'partial_failed'
  | 'failed'

export interface PerfTaskConfig {
  device?: string
  region?: string
  network?: string
}

export interface CreatePerfTaskRequest {
  url: string
  count: number
  version: string
  group: string
  config?: PerfTaskConfig
  remark?: string
}

export interface PerfTaskRunItem {
  runIndex: number
  runId: string | null
  status: 'success' | 'failed'
  debugBearUrl: string | null
  lcp: number | null
  fcp: number | null
  inp: number | null
  tbt: number | null
  cls: number | null
  ttfb: number | null
  labScore: number | null
  pageWeight: number | null
  errorMessage: string | null
  createdAt: string
}

export interface MetricSummary {
  avg: number | null
  trimmedAvg: number | null
  max: number | null
  min: number | null
}

export interface PerfTaskSummary {
  lcp: MetricSummary
  fcp: MetricSummary
  inp: MetricSummary
  tbt: MetricSummary
  cls: MetricSummary
  ttfb: MetricSummary
  labScore: MetricSummary
  pageWeight: MetricSummary
  successCount: number
  failCount: number
}

export interface PerfTaskListItem {
  taskId: string
  url: string
  count: number
  version: string
  group: string
  status: PerfTaskStatus
  progressCount: number
  successCount: number
  failCount: number
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface PerfTaskListResponse {
  items: PerfTaskListItem[]
}

export interface PerfTaskDetailResponse extends PerfTaskListItem {
  summary: PerfTaskSummary | null
  runs: PerfTaskRunItem[]
  remark: string | null
}

export interface PerfTaskFilters {
  url?: string
  status?: PerfTaskStatus
  version?: string
  group?: string
  dateFrom?: string
  dateTo?: string
}
