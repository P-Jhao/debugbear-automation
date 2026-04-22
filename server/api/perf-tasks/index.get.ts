import type { PerfTaskFilters, PerfTaskStatus } from '~/shared/types/perfTask'
import { listPerfTasks } from '~/server/utils/perfTask/repository'

const statusSet = new Set<PerfTaskStatus>([
  'pending',
  'running',
  'completed',
  'partial_failed',
  'failed'
])

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const filters: PerfTaskFilters = {}

  if (typeof query.url === 'string' && query.url.trim()) {
    filters.url = query.url.trim()
  }
  if (typeof query.status === 'string' && statusSet.has(query.status as PerfTaskStatus)) {
    filters.status = query.status as PerfTaskStatus
  }
  if (typeof query.version === 'string' && query.version.trim()) {
    filters.version = query.version.trim()
  }
  if (typeof query.group === 'string' && query.group.trim()) {
    filters.group = query.group.trim()
  }
  if (typeof query.dateFrom === 'string' && query.dateFrom.trim()) {
    filters.dateFrom = query.dateFrom.trim()
  }
  if (typeof query.dateTo === 'string' && query.dateTo.trim()) {
    filters.dateTo = query.dateTo.trim()
  }

  return {
    items: listPerfTasks(filters)
  }
})
