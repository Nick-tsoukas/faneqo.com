import type { RouterConfig } from '@nuxt/schema'
import { useNuxtApp } from '#app'
import { isGalleryArchivePath, recalledArchiveScroll } from '../utils/galleries/stackBrowseMemory'
import { resolveAppScrollPosition } from '../utils/ui/appScrollBehavior'
import { pageScrollElement, setPageScrollTop } from '../utils/ui/pageScroll'

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    const archiveY = isGalleryArchivePath(to.path) ? recalledArchiveScroll(to.path) : 0
    const position = resolveAppScrollPosition(to, from, savedPosition, archiveY)
    if (!position || import.meta.server) return position
    if ('el' in position) return position

    /*
     * On most Faneqo routes `<body>` is the scroll container, not the document
     * (see `utils/ui/pageScroll.js`). vue-router only ever calls
     * `window.scrollTo`, which is a no-op there: a band scrolled halfway down
     * `/galleries` would open a gallery and land halfway down that page too.
     * Apply the decision ourselves, on whichever element really scrolls,
     * once the new page has rendered so a restored position has something to
     * scroll to.
     */
    const nuxtApp = useNuxtApp()
    return new Promise((resolve) => {
      const apply = () => {
        const scroller = pageScrollElement()
        const documentScrolls = !scroller || scroller === document.documentElement
        if (documentScrolls) {
          resolve(position)
          return
        }
        setPageScrollTop(position.top || 0)
        resolve(false)
      }
      if (to.path === from.path) {
        apply()
        return
      }
      nuxtApp.hooks.hookOnce('page:finish', () => {
        setTimeout(apply, 0)
      })
    })
  }
}
