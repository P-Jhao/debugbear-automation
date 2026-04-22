import { listDistinctVersions } from '~/server/utils/perfTask/repository'

export default defineEventHandler(() => {
  return {
    items: listDistinctVersions()
  }
})
