import { listDistinctGroups } from '~~/server/utils/perfTask/repository'

export default defineEventHandler(() => {
  return {
    items: listDistinctGroups()
  }
})
