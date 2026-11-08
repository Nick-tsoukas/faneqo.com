import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'
import { artistSetupSectionStatus, sectionIndex } from '@/utils/bands/artistSetupSections'

/**
 * Scroll-spy + jump navigation for the one-page artist setup form.
 */
export function useArtistSetupNav({ sections, getState, errorSectionId }) {
  const activeId = ref(sections.value[0]?.id || 'setup-details')
  const jumpOpen = ref(false)
  const motionPreference = usePreferredReducedMotion()
  const reduced = computed(() => motionPreference.value === 'reduce')
  let observer = null

  const items = computed(() => {
    const state = getState()
    const errors = errorSectionId?.value || ''
    return sections.value.map((section) => {
      const status = artistSetupSectionStatus(section.key, state)
      return {
        ...section,
        status,
        current: section.id === activeId.value,
        error: errors === section.id,
      }
    })
  })

  const current = computed(
    () => items.value.find((item) => item.current) || items.value[0] || null
  )

  const currentPosition = computed(() => {
    const list = items.value
    const index = sectionIndex(list, current.value?.id)
    return {
      index: index < 0 ? 0 : index,
      current: index < 0 ? 1 : index + 1,
      total: list.length,
    }
  })

  function headerOffset() {
    if (typeof window === 'undefined') return 88
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-height')
    const header = Number.parseFloat(raw) || 70
    const mobileBar = window.matchMedia('(min-width: 1024px)').matches ? 16 : 56
    return header + mobileBar
  }

  function scrollToSection(id) {
    const el = document.getElementById(id)
    if (!el) return
    jumpOpen.value = false
    activeId.value = id
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset()
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduced.value ? 'auto' : 'smooth',
    })
    const heading = el.querySelector('h2')
    if (heading && typeof heading.focus === 'function') {
      heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
    }
  }

  function markError(sectionId, fieldId) {
    if (errorSectionId) errorSectionId.value = sectionId
    scrollToSection(sectionId)
    if (!fieldId || typeof document === 'undefined') return
    requestAnimationFrame(() => {
      document.getElementById(fieldId)?.focus?.()
    })
  }

  function bindObserver() {
    observer?.disconnect()
    if (typeof IntersectionObserver === 'undefined') return
    const nodes = sections.value
      .map((section) => document.getElementById(section.id))
      .filter(Boolean)
    if (!nodes.length) return
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const next = visible[0]?.target?.id
        if (next) activeId.value = next
      },
      {
        root: null,
        threshold: [0.18, 0.32, 0.5],
        rootMargin: '-22% 0px -52% 0px',
      }
    )
    nodes.forEach((node) => observer.observe(node))
  }

  onMounted(() => {
    bindObserver()
  })

  watch(sections, () => {
    if (typeof window === 'undefined') return
    bindObserver()
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
  })

  return {
    activeId,
    items,
    current,
    currentPosition,
    jumpOpen,
    scrollToSection,
    markError,
  }
}
