import type { PerfTaskFilters, PerfTaskStatus } from '~/shared/types/perfTask'
import { listPerfTasks } from '~~/server/utils/perfTask/repository'

const statusSet = new Set<PerfTaskStatus>([
  'pending',
  'running',
  'cancelled',
  'completed',
  'partial_failed',
  'failed'
])
const deviceSet = new Set(['mobile', 'desktop'])

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const filters: PerfTaskFilters = {}
  let page = 1
  let pageSize = 10

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
  if (typeof query.device === 'string' && deviceSet.has(query.device)) {
    filters.device = query.device as 'mobile' | 'desktop'
  }
  if (typeof query.dateFrom === 'string' && query.dateFrom.trim()) {
    filters.dateFrom = query.dateFrom.trim()
  }
  if (typeof query.dateTo === 'string' && query.dateTo.trim()) {
    filters.dateTo = query.dateTo.trim()
  }
  if (typeof query.page === 'string') {
    const parsedPage = Number.parseInt(query.page, 10)
    if (Number.isInteger(parsedPage) && parsedPage > 0) {
      page = parsedPage
    }
  }
  if (typeof query.pageSize === 'string') {
    const parsedPageSize = Number.parseInt(query.pageSize, 10)
    if (Number.isInteger(parsedPageSize) && parsedPageSize > 0) {
      pageSize = Math.min(parsedPageSize, 100)
    }
  }

  filters.page = page
  filters.pageSize = pageSize
  const { items, total } = listPerfTasks(filters, page, pageSize)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    items,
    total,
    page,
    pageSize,
    totalPages
  }
})
