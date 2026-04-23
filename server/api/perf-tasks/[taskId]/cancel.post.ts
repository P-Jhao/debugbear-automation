import { requestCancelPerfTaskExecution } from '~~/server/utils/perfTask/executor'
import { stopPerfTask } from '~~/server/utils/perfTask/repository'

export default defineEventHandler((event) => {
  const taskId = getRouterParam(event, 'taskId')

  if (!taskId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'taskId 不能为空'
    })
  }

  requestCancelPerfTaskExecution(taskId)
  const result = stopPerfTask(taskId, '任务已中止')

  if (result === 'not_found') {
    throw createError({
      statusCode: 404,
      statusMessage: '任务不存在'
    })
  }

  if (result === 'not_stoppable') {
    throw createError({
      statusCode: 409,
      statusMessage: '任务已结束，无需停止'
    })
  }

  return {
    success: true
  }
})
