import { getPerfTaskDetail } from '~~/server/utils/perfTask/repository'

export default defineEventHandler((event) => {
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

  return detail
})
