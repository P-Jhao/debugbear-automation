import { getPerfTaskDetail } from '~~/server/utils/perfTask/repository'
import { getPerfTaskConfig } from '~~/server/utils/perfTask/config'
import { resolveDebugBearPageId } from '~~/server/utils/perfTask/debugbearClient'

const stripQueryAndHash = (input: string): string | null => {
  try {
    const parsed = new URL(input)
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return null
  }
}

const resolveOverviewUrl = async (input: string | null): Promise<string | null> => {
  if (!input) {
    return null
  }

  const normalizedDirect = stripQueryAndHash(input)
  if (!normalizedDirect) {
    return null
  }

  if (!normalizedDirect.includes('/viewResult/')) {
    return normalizedDirect
  }

  try {
    const response = await fetch(input, {
      redirect: 'follow'
    })
    return stripQueryAndHash(response.url) ?? normalizedDirect
  } catch {
    return normalizedDirect
  }
}

export default defineEventHandler(async (event) => {
  const taskId = getRouterParam(event, 'taskId')

  if (!taskId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'taskId 不能为空'
    })
  }

  const detail = getPerfTaskDetail(taskId)
  if (!detail) {
    throw createError({
      statusCode: 404,
      statusMessage: '任务不存在'
    })
  }

  const fallbackRunUrl = detail.runs.find((run) => Boolean(run.debugBearUrl))?.debugBearUrl ?? null
  let resolvedOverviewUrl: string | null = null

  try {
    const config = getPerfTaskConfig()
    if (config.debugBearProjectId) {
      const device = detail.device === 'mobile' || detail.device === 'desktop' ? detail.device : undefined
      const pageId = await resolveDebugBearPageId(detail.url, device)
      resolvedOverviewUrl = `https://www.debugbear.com/project/${config.debugBearProjectId}/pageLoad/${pageId}/overview`
    }
  } catch {
    resolvedOverviewUrl = null
  }

  if (!resolvedOverviewUrl) {
    resolvedOverviewUrl = await resolveOverviewUrl(detail.debugBearOverviewUrl ?? fallbackRunUrl)
  }

  if (resolvedOverviewUrl) {
    detail.debugBearOverviewUrl = resolvedOverviewUrl
  }

  return detail
})
