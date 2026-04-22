import { listDistinctGroupsByVersion } from '~~/server/utils/perfTask/repository'

export default defineEventHandler((event) => {
  const version = getRouterParam(event, 'version')
  if (!version) {
    throw createError({
      statusCode: 400,
      statusMessage: 'version 不能为空'
    })
  }

  return {
    items: listDistinctGroupsByVersion(version)
  }
})
