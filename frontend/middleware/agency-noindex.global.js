/**
 * Agency Portal Noindex Middleware
 * Prevents search engines from indexing /agency pages
 */
export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith('/agency')) {
    useHead({
      meta: [
        { name: 'robots', content: 'noindex,nofollow' },
        { name: 'googlebot', content: 'noindex,nofollow' }
      ]
    })
  }
})
