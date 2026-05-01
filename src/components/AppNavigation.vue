<template>
  <v-bottom-navigation
    v-model="currentPageIndex"
    app
    :height="APP_NAVIGATION_HEIGHT"
    class="app-navigation"
    :elevation="0"
    :absolute="absolute"
  >
    <!-- Wallet -->
    <v-btn
      v-if="walletShouldBeVisible"
      :value="0"
      :class="[`${className}__button`, { 'v-btn--active': isActivePage(0) }]"
      draggable="false"
      @click.capture="persistCurrentTabState"
    >
      <v-icon :icon="mdiWallet" />
      <span :class="`${className}__label`">{{ t('bottom.wallet_button') }}</span>
    </v-btn>

    <!-- Chat -->
    <v-btn
      :value="1"
      :class="[`${className}__button`, { 'v-btn--active': isActivePage(1) }]"
      draggable="false"
      @click.capture="persistCurrentTabState"
    >
      <v-badge
        v-if="numOfNewMessages > 0"
        :class="`${className}__badge`"
        :value="numOfNewMessages"
        overlap
        color="primary"
        :content="numOfNewMessages > 99 ? '99+' : numOfNewMessages"
      >
        <v-icon :icon="mdiForum" />
      </v-badge>
      <v-icon v-else :icon="mdiForum" />

      <span :class="`${className}__label`">{{ t('bottom.chats_button') }}</span>
    </v-btn>

    <!-- Settings -->
    <v-btn
      :value="2"
      :class="[`${className}__button`, { 'v-btn--active': isActivePage(2) }]"
      draggable="false"
      @click.capture="persistCurrentTabState"
    >
      <v-icon :icon="mdiCog" />
      <span :class="`${className}__label`">{{ t('bottom.settings_button') }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>
<script lang="ts" setup>
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { watch, onMounted, ref, computed, nextTick } from 'vue'
import { mdiWallet, mdiForum, mdiCog } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { isAccountPath, resolveAccountRouteTarget } from '@/router/accountRoutes'

defineProps({
  absolute: Boolean
})

const className = 'app-navigation'
const APP_NAVIGATION_HEIGHT = 50

const pages = [
  {
    title: 'wallet',
    link: '/home'
  },
  {
    title: 'chats',
    link: '/chats'
  },
  {
    title: 'settings',
    link: '/options'
  }
]
const currentPageIndex = ref(0)
const isSyncingPageFromRoute = ref(false)
const store = useStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const SETTINGS_EXTRA_PATHS = ['/votes']

const getCurrentPageIndex = () => {
  if (route.query?.fromChat) {
    return 1
  }

  if (SETTINGS_EXTRA_PATHS.some((p) => route.path.startsWith(p))) {
    return 2
  }

  const currentPage = pages.find((page) => {
    // eslint-disable-next-line security/detect-non-literal-regexp -- Safe: page.link is a static route path from internal navigation config, not user input
    const pattern = new RegExp(`^${page.link}`)
    return route.path.match(pattern)
  })

  return (currentPage && pages.indexOf(currentPage)) || 0
}
const numOfNewMessages = computed(() => store.getters['chat/totalNumOfNewMessages'])

const walletShouldBeVisible = computed(() => {
  return !!store.getters['wallets/getVisibleSymbolsCount']
})
const accountRouteTarget = computed(() => store.getters['options/accountLastRoute'] || '/home')
const settingsRouteTarget = computed(() => store.getters['options/settingsLastRoute'] || '/options')
const isActivePage = (index: number) => currentPageIndex.value === index
const getSidebarLayout = () => {
  return document.querySelector('.sidebar__layout') as HTMLElement | null
}
const saveCurrentAccountScroll = (path: string) => {
  if (!isAccountPath(path)) {
    return
  }

  const sidebarLayout = getSidebarLayout()

  if (!sidebarLayout) {
    return
  }

  store.commit('options/setAccountScrollPosition', {
    path,
    top: Math.ceil(sidebarLayout.scrollTop)
  })
}
const restoreAccountScroll = async (path: string) => {
  if (!isAccountPath(path)) {
    return
  }

  const targetTop = store.getters['options/accountScrollPosition'](path)

  await nextTick()

  if (targetTop <= 0) {
    getSidebarLayout()?.scrollTo({ top: 0 })
    return
  }

  await new Promise<void>((resolve) => {
    const deadline = window.performance.now() + 1500

    const continueRestore = () => {
      const sidebarLayout = getSidebarLayout()

      if (!sidebarLayout) {
        resolve()
        return
      }

      sidebarLayout.scrollTo({ top: targetTop })

      const currentTop = Math.ceil(sidebarLayout.scrollTop)
      const canReachTargetTop =
        sidebarLayout.scrollHeight - sidebarLayout.clientHeight >= targetTop - 1
      const reachedTargetTop = Math.abs(currentTop - targetTop) <= 1 && canReachTargetTop

      if (reachedTargetTop || window.performance.now() >= deadline) {
        resolve()
        return
      }

      window.requestAnimationFrame(continueRestore)
    }

    window.requestAnimationFrame(continueRestore)
  })
}
const persistCurrentTabState = () => {
  saveCurrentAccountScroll(route.path)
}
const getNavigationTarget = (index: number) => {
  switch (index) {
    case 0:
      return resolveAccountRouteTarget(accountRouteTarget.value)
    case 1:
      return '/chats'
    case 2:
      return settingsRouteTarget.value
    default:
      return route.path
  }
}

watch(
  () => route.path,
  (path) => {
    isSyncingPageFromRoute.value = true
    currentPageIndex.value = getCurrentPageIndex()

    if (isAccountPath(path) && !route.query.fromChat) {
      store.commit('options/setAccountLastRoute', path)
    }

    queueMicrotask(() => {
      isSyncingPageFromRoute.value = false
    })
  }
)

watch(currentPageIndex, (index) => {
  if (isSyncingPageFromRoute.value) {
    return
  }

  const target = getNavigationTarget(index)
  const targetPath = router.resolve(target).path

  if (target && (targetPath !== route.path || route.query.fromChat)) {
    router.push(target).then(async () => {
      await restoreAccountScroll(targetPath)
    })
  }
})

onMounted(() => {
  isSyncingPageFromRoute.value = true
  currentPageIndex.value = getCurrentPageIndex()

  if (isAccountPath(route.path) && !route.query.fromChat) {
    store.commit('options/setAccountLastRoute', route.path)
  }

  queueMicrotask(() => {
    isSyncingPageFromRoute.value = false
  })
})
</script>
<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';
@use '@/assets/styles/generic/_variables.scss';

/**
 * 1. Navigation Button.
 *    a. Active
 *    b. Inactive
 */
.app-navigation {
  &.v-bottom-navigation {
    --a-app-navigation-border-width: var(--a-border-width-thin);

    height: var(--a-app-navigation-height) !important;
    min-height: var(--a-app-navigation-height) !important;
    transform: unset !important;
    overflow: visible;

    @media (max-width: map.get(variables.$breakpoints, 'mobile')) {
      bottom: env(safe-area-inset-bottom) !important;
    }
  }

  &__button {
    height: 100%;
    font-weight: var(--a-app-navigation-button-font-weight);
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0;
  }
  &__label {
    font-size: var(--a-app-navigation-label-font-size);
  }
  :deep(.v-btn.v-btn--active) {
    font-size: unset;

    > .v-btn__overlay {
      background-color: unset;
    }
  }
  :deep(.v-btn:not(.v-btn--active)) {
    filter: unset;

    .app-navigation__label {
      font-size: var(--a-app-navigation-label-font-size-inactive);
    }
  }
  :deep(.v-bottom-navigation__content) {
    height: 100%;
  }
  :deep(.app-navigation__badge .v-badge__badge) {
    font-size: var(--a-app-navigation-badge-font-size);
    width: var(--a-app-navigation-badge-size);
    height: var(--a-app-navigation-badge-size);
  }
}

.v-theme--light {
  .app-navigation {
    &__container {
      border-top: var(--a-app-navigation-border-width) solid map.get(settings.$grey, 'lighten-2');
    }
    &.v-bottom-navigation {
      background-color: map.get(settings.$shades, 'white');
    }
    :deep(.v-btn.v-btn--active) {
      color: map.get(colors.$adm-colors, 'regular');
    }
    :deep(.v-btn.v-btn:not(.v-btn--active)) {
      color: var(--a-color-text-muted-light);
    }
    :deep(.v-bottom-navigation__content) {
      border-top: var(--a-app-navigation-border-width) solid map.get(settings.$grey, 'lighten-2');
    }
  }
}

.v-theme--dark {
  .app-navigation {
    &.v-bottom-navigation {
      background-color: map.get(colors.$adm-colors, 'black');
    }
    :deep(.v-btn.v-btn--active) {
      color: var(--a-color-text-inverse);
    }
    :deep(.v-btn:not(.v-btn--active)) {
      color: var(--a-color-text-muted-dark);
    }
  }
}
</style>
