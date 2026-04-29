import { listDistinctUrls } from '~~/server/utils/perfTask/repository'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : undefined
  let limit = 100

  if (typeof query.limit === 'string') {
    const parsedLimit = Number.parseInt(query.limit, 10)
    if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
      limit = Math.min(parsedLimit, 500)
    }
  }

  return {
    items: listDistinctUrls(keyword, limit)
  }
})
