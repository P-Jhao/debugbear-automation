import { z } from 'zod'
import type { CreatePerfTaskRequest } from '~/shared/types/perfTask'
import { getPerfTaskConfig } from '~~/server/utils/perfTask/config'
import { startPerfTaskExecution } from '~~/server/utils/perfTask/executor'
import { createPerfTask } from '~~/server/utils/perfTask/repository'

const requestSchema = z.object({
  url: z.string().url(),
  count: z.number().int(),
  version: z.string().trim().min(1),
  group: z.string().trim().min(1),
  config: z
    .object({
      device: z.string().trim().min(1).optional(),
      region: z.string().trim().min(1).optional(),
      network: z.string().trim().min(1).optional()
    })
    .optional(),
  remark: z.string().trim().max(500).optional()
})

export default defineEventHandler(async (event) => {
  const config = getPerfTaskConfig()
  const body = await readBody(event)
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? '请求参数错误'
    })
  }

  if (parsed.data.count < config.minCount || parsed.data.count > config.maxCount) {
    throw createError({
      statusCode: 400,
      statusMessage: `count 必须在 ${config.minCount} 到 ${config.maxCount} 之间`
    })
  }

  const payload: CreatePerfTaskRequest = {
    ...parsed.data
  }

  const taskId = createPerfTask(payload)
  startPerfTaskExecution(taskId)

  return {
    taskId
  }
})
