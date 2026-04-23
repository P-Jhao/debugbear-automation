import { perfTaskLog } from '~~/server/utils/perfTask/logger'
import { markStaleRunningTasksAsFailed } from '~~/server/utils/perfTask/repository'

export default defineNitroPlugin(() => {
  const recoveredCount = markStaleRunningTasksAsFailed()
  if (recoveredCount > 0) {
    perfTaskLog.warn('recovered stale running tasks on startup', {
      recoveredCount
    })
  }
})
