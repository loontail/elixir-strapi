'use strict'

const memCache = require('memory-cache');

module.exports = async (ctx, next) => {
    const { request: { url }, response, originalUrl } = ctx
    if (url.includes('metadata/m')) {
      const memKey = '__strapiDownloadsCache__' + url || originalUrl
      const cachedBody = memCache.get(memKey)

      if (cachedBody) {
          ctx.body = cachedBody
      } else {
          await next()
          memCache.put(memKey, response.body, 1000 * 60 * 60 * 24)
      }
    } else {
      await next()
    }
}
