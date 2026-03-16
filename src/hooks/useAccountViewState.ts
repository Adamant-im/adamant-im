import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
  type Ref
} from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { sidebarLayoutKey } from '@/lib/constants'
import { isAccountPath } from '@/router/accountRoutes'

export const useAccountViewState = () => {
  const store = useStore()
  const route = useRoute()
  const sidebarLayoutRef = inject<Ref | undefined>(sidebarLayoutKey)

  const activeAccountScrollPath = ref(route.path)
  const isRestoringAccountScroll = ref(false)
  const isScrollListenerAttached = ref(false)
  let accountRestoreFrame = 0
  let accountRestoreObserver: ResizeObserver | null = null
  let skipInitialActivationRestore = true

  const getCurrentScrollTop = () => sidebarLayoutRef?.value?.scrollTop || 0
  const getSavedAccountScrollTop = (path: string) => {
    return store.getters['options/accountScrollPosition'](path)
  }
  const applyAccountScrollTop = (top: number) => {
    if (!sidebarLayoutRef?.value) {
      return
    }

    sidebarLayoutRef.value.scrollTop = top
    sidebarLayoutRef.value.scrollTo({ top })
  }
  const stopAccountRestore = () => {
    if (accountRestoreFrame) {
      window.cancelAnimationFrame(accountRestoreFrame)
      accountRestoreFrame = 0
    }

    accountRestoreObserver?.disconnect()
    accountRestoreObserver = null
  }
  const waitForAccountViewFrame = async () => {
    await nextTick()
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
  }
  const saveAccountViewState = (path = route.path) => {
    if (route.query.fromChat) {
      return
    }

    if (!isAccountPath(path) || !sidebarLayoutRef?.value) {
      return
    }

    store.commit('options/setAccountLastRoute', path)
    store.commit('options/setAccountScrollPosition', {
      path,
      top: getCurrentScrollTop()
    })
  }
  const restoreAccountViewState = async (path = route.path) => {
    if (route.query.fromChat) {
      return
    }

    if (!isAccountPath(path) || !sidebarLayoutRef?.value) {
      return
    }

    stopAccountRestore()
    isRestoringAccountScroll.value = true
    await waitForAccountViewFrame()

    const top = getSavedAccountScrollTop(path)

    applyAccountScrollTop(top)
    await waitForAccountViewFrame()
    applyAccountScrollTop(top)

    const finalizeRestore = (restoredTop: number) => {
      stopAccountRestore()
      activeAccountScrollPath.value = path
      store.commit('options/setAccountScrollPosition', {
        path,
        top: restoredTop
      })
      store.commit('options/setAccountLastRoute', path)
      isRestoringAccountScroll.value = false
    }

    if (top <= 0) {
      finalizeRestore(0)
      return
    }

    const restoreDeadline = window.performance.now() + 1500
    let stableFrames = 0
    let lastTop = -1

    const continueRestore = () => {
      if (!sidebarLayoutRef?.value || route.path !== path) {
        stopAccountRestore()
        isRestoringAccountScroll.value = false
        return
      }

      applyAccountScrollTop(top)

      const currentTop = getCurrentScrollTop()
      const canReachTop =
        sidebarLayoutRef.value.scrollHeight - sidebarLayoutRef.value.clientHeight >= top - 1
      const reachedTop = Math.abs(currentTop - top) <= 1 && canReachTop

      if (reachedTop) {
        stableFrames = currentTop === lastTop ? stableFrames + 1 : 1
        lastTop = currentTop

        if (stableFrames >= 2) {
          finalizeRestore(currentTop)
          return
        }
      } else {
        stableFrames = 0
        lastTop = currentTop
      }

      if (window.performance.now() >= restoreDeadline) {
        finalizeRestore(currentTop)
        return
      }

      accountRestoreFrame = window.requestAnimationFrame(continueRestore)
    }

    accountRestoreObserver = new ResizeObserver(() => {
      applyAccountScrollTop(top)
    })
    accountRestoreObserver.observe(sidebarLayoutRef.value)
    accountRestoreFrame = window.requestAnimationFrame(continueRestore)
  }

  const onSidebarScroll = () => {
    if (isRestoringAccountScroll.value) {
      return
    }

    saveAccountViewState(activeAccountScrollPath.value)
  }
  const attachSidebarScrollListener = () => {
    if (!sidebarLayoutRef?.value || isScrollListenerAttached.value) {
      return
    }

    sidebarLayoutRef.value.addEventListener('scroll', onSidebarScroll, { passive: true })
    isScrollListenerAttached.value = true
  }
  const detachSidebarScrollListener = () => {
    if (!sidebarLayoutRef?.value || !isScrollListenerAttached.value) {
      return
    }

    sidebarLayoutRef.value.removeEventListener('scroll', onSidebarScroll)
    isScrollListenerAttached.value = false
  }
  const activateAccountViewState = async () => {
    attachSidebarScrollListener()
    await restoreAccountViewState()
  }
  const deactivateAccountViewState = () => {
    stopAccountRestore()
    detachSidebarScrollListener()

    if (!isRestoringAccountScroll.value && isAccountPath(route.path)) {
      saveAccountViewState(activeAccountScrollPath.value)
    }
  }

  const accountRoutePath = computed(() => {
    return route.path
  })

  onMounted(() => {
    void activateAccountViewState()
  })

  onActivated(() => {
    if (skipInitialActivationRestore) {
      skipInitialActivationRestore = false
      return
    }

    void activateAccountViewState()
  })

  onDeactivated(() => {
    deactivateAccountViewState()
  })

  onBeforeUnmount(() => {
    deactivateAccountViewState()
  })

  onBeforeRouteUpdate((to, from) => {
    if (from.query.fromChat || to.query.fromChat) {
      return
    }

    if (isAccountPath(from.path)) {
      saveAccountViewState(from.path)
    }

    if (isAccountPath(to.path)) {
      store.commit('options/setAccountLastRoute', to.path)
    }
  })

  onBeforeRouteLeave((to, from) => {
    if (from.query.fromChat || to.query.fromChat) {
      return
    }

    if (isAccountPath(from.path)) {
      saveAccountViewState(from.path)
    }

    if (isAccountPath(to.path)) {
      store.commit('options/setAccountLastRoute', to.path)
    }
  })

  watch(accountRoutePath, async (nextPath) => {
    await restoreAccountViewState(nextPath)
  })

  return {
    sidebarLayoutRef,
    saveAccountViewState,
    restoreAccountViewState,
    isRestoringAccountScroll
  }
}
