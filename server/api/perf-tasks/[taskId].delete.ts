import { deletePerfTask } from '~~/server/utils/perfTask/repository'

export default defineEventHandler((event) => {
  const taskId = getRouterParam(event, 'taskId')

  if (!taskId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'taskId 不能为空'
    })
  }

  const result = deletePerfTask(taskId)

  if (result === 'not_found') {
    throw createError({
      statusCode: 404,
      statusMessage: '任务不存在'
    })
  }

  if (result === 'running') {
    throw createError({
      statusCode: 409,
      statusMessage: '任务执行中，暂不支持删除'
    })
  }

  return {
    success: true as const
  }
})
