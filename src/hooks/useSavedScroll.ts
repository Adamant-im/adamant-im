import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'
import { computed, inject, Ref } from 'vue'
import { sidebarLayoutKey } from '@/lib/constants'

const SAVED_TOP_ATTRIBUTE_PREFIX = 'data-saved-top'

export const useSavedScroll = () => {
  const route = useRoute()

  const sidebarLayoutRef = inject<Ref>(sidebarLayoutKey)

  const hasView = computed(() => route.matched.length > 2)

  onBeforeRouteUpdate(() => {
    if (sidebarLayoutRef?.value) {
      if (!hasView.value) {
        const { scrollTop } = sidebarLayoutRef.value
        sidebarLayoutRef.value.setAttribute(SAVED_TOP_ATTRIBUTE_PREFIX, scrollTop)

        sidebarLayoutRef.value.scrollTo({ top: 0 })
        return
      }
      // some routes don't have scrollbar, need delay for scroll render
      setTimeout(() => {
        sidebarLayoutRef.value.scrollTo({
          top: sidebarLayoutRef.value?.getAttribute(SAVED_TOP_ATTRIBUTE_PREFIX)
        })
      })
    }
  })

  onBeforeRouteLeave(() => {
    if (sidebarLayoutRef?.value) {
      sidebarLayoutRef.value?.removeAttribute(SAVED_TOP_ATTRIBUTE_PREFIX)
    }
  })

  return {
    hasView,
    sidebarLayoutRef
  }
}
