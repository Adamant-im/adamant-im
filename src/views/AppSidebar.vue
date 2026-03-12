<template>
  <div
    :class="{
      [classes.root]: true,
      [classes.rootWithAside]: needAside,
      [classes.frame]: true
    }"
    :style="{
      '--asideWidth': asideWidth,
      '--asideResizeHandleWidth': `${ASIDE_RESIZE_HANDLE_WIDTH}px`
    }"
  >
    <aside
      v-if="needAside"
      :class="{
        [classes.aside]: true,
        [classes.asideHasView]: hasView
      }"
      ref="aside"
      @mousedown="startResize"
    >
      <left-side />
    </aside>
    <div :class="[classes.layout, 'a-scroll-pane']" ref="sidebarLayout">
      <component :is="layout">
        <div
          :class="{
            [classes.routerViewHost]: true,
            [classes.routerView]: true,
            [classes.routerViewNoAside]: !needAside,
            [classes.routerViewLogo]: showLogo
          }"
        >
          <img
            v-show="showLogo"
            src="/img/adamant-logo-transparent-512x512.png"
            draggable="false"
          />
          <router-view v-show="!showLogo" :key="route.path" />
        </div>
      </component>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, useTemplateRef, ref, provide, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import LeftSide from '@/components/LeftSide.vue'
import { useScreenSize } from '@/hooks/useScreenSize'
import { sidebarLayoutKey } from '@/lib/constants'
import { filterRouteParams } from '@/router/filterRouteParams'
import { useChatStateStore } from '@/stores/modal-state'
import { storeToRefs } from 'pinia'

const store = useStore()
const chatStateStore = useChatStateStore()
const route = useRoute()
const router = useRouter()

const sidebarLayoutRef = useTemplateRef('sidebarLayout')

provide(sidebarLayoutKey, sidebarLayoutRef)

const className = 'sidebar'

const classes = {
  root: className,
  frame: `${className}__frame`,
  rootWithAside: `${className}__with-aside`,
  aside: `${className}__aside`,
  asideHasView: `${className}__aside--has-view`,
  routerViewHost: `${className}__router-view-host`,
  routerView: `${className}__router-view`,
  routerViewNoAside: `${className}__router-view--no-aside`,
  routerViewLogo: `${className}__router-view--logo`,
  layout: `${className}__layout`
}

const layout = computed(() => route.meta.layout || 'default')

const SAVED_WIDTH_KEY = 'aside_width'
const ASIDE_RESIZE_HANDLE_WIDTH = 10

const asideRef = useTemplateRef('aside')
let isResizing = false
const initWidth = '33%'

const minWidth = 300

const asideWidth = ref(initWidth)

const hasView = computed(() => {
  return route.matched.length > 1
})

const needAside = computed(() => {
  return store.getters.isLogged
})

const isFulfilled = computed<boolean>(() => store.state.chat.isFulfilled)

const { isMobileView } = useScreenSize()

const showLogo = computed(() => {
  if (route.name === 'Chat' && !isMobileView.value) {
    return !isFulfilled.value
  }

  return !hasView.value
})

const stopResize = () => {
  isResizing = false
  document.body.style.cursor = 'auto'
  document.removeEventListener('mousemove', resize)
  document.removeEventListener('mouseup', stopResize)
}

const startResize = (event: MouseEvent) => {
  if (!asideRef.value) return

  const { left, width: boxWidth } = asideRef.value.getBoundingClientRect()
  const mouseX = event.clientX

  if (mouseX >= left + boxWidth - ASIDE_RESIZE_HANDLE_WIDTH && !isResizing) {
    isResizing = true
    document.body.style.cursor = 'ew-resize'
    document.addEventListener('mousemove', resize)
    document.addEventListener('mouseup', stopResize)
  }
}

const resize = (event: MouseEvent) => {
  if (isResizing) {
    requestAnimationFrame(() => {
      if (asideRef.value) {
        const { left } = asideRef.value.getBoundingClientRect()

        const newWidth = event.clientX - left

        if (newWidth >= minWidth) {
          asideWidth.value = newWidth + 'px'
          localStorage.setItem(SAVED_WIDTH_KEY, asideWidth.value)
        }
      }
    })
  }
}

if (SAVED_WIDTH_KEY) {
  const value = localStorage.getItem(SAVED_WIDTH_KEY)

  if (value) {
    asideWidth.value = value
  }
}

const {
  actionsDropdownMessageId,
  isShowPartnerInfoDialog,
  isShowFreeTokensDialog,
  isShowSetPasswordDialog,
  isChatMenuOpen,
  isEmojiPickerOpen
} = storeToRefs(chatStateStore)
const { setShowChatStartDialog } = chatStateStore
const isSnackbarShowing = computed(() => store.state.snackbar.show)
const noActiveNodesDialog = computed(() => store.state.chat.noActiveNodesDialog)
const isShowChatStartDialog = computed({
  get: () => chatStateStore.isShowChatStartDialog,
  set: (value) => setShowChatStartDialog(value)
})

const canPressEscape = computed(() => {
  return (
    !noActiveNodesDialog.value &&
    !isShowChatStartDialog.value &&
    !isShowFreeTokensDialog.value &&
    !isShowSetPasswordDialog.value &&
    !isSnackbarShowing.value &&
    !isShowPartnerInfoDialog.value &&
    !isChatMenuOpen.value &&
    !isEmojiPickerOpen.value &&
    actionsDropdownMessageId.value === -1
  )
})

const hasActiveOverlay = () => {
  // Let Vuetify overlays consume Escape first. Otherwise the global sidebar handler
  // can navigate away while a select/menu/dialog is still open in the current view.
  return Array.from(document.querySelectorAll('.v-overlay.v-overlay--active')).some((overlay) => {
    if (!(overlay instanceof HTMLElement)) {
      return false
    }

    const style = window.getComputedStyle(overlay)

    return style.display !== 'none' && style.visibility !== 'hidden'
  })
}

const hasExpandedPopupActivator = () => {
  return Array.from(document.querySelectorAll('[aria-expanded="true"]')).some((element) => {
    if (!(element instanceof HTMLElement)) {
      return false
    }

    return (
      element.getAttribute('role') === 'combobox' ||
      element.hasAttribute('aria-haspopup') ||
      element.classList.contains('v-field')
    )
  })
}

const hasFocusedEditableElement = () => {
  const activeElement = document.activeElement

  if (!(activeElement instanceof HTMLElement)) {
    return false
  }

  if (activeElement instanceof HTMLTextAreaElement) {
    return !activeElement.readOnly && !activeElement.disabled
  }

  if (activeElement instanceof HTMLInputElement) {
    return !activeElement.readOnly && !activeElement.disabled
  }

  return activeElement.isContentEditable
}

const onKeydownHandler = (e: KeyboardEvent) => {
  if (
    e.key !== 'Escape' ||
    !canPressEscape.value ||
    e.defaultPrevented ||
    hasFocusedEditableElement() ||
    hasActiveOverlay() ||
    hasExpandedPopupActivator()
  ) {
    return
  }

  if (route.query.from?.includes('chats')) {
    router.push(route.query.from as string)
    return
  }

  const parentRoute = route.matched.length > 1 ? route.matched.at(-2) : null

  if (parentRoute) {
    const params = filterRouteParams(parentRoute.path, route.params)

    router.push({
      name: parentRoute.name,
      ...(Object.keys(params).length > 0 ? { params } : {})
    })
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydownHandler, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydownHandler, true)
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use 'vuetify/settings';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/generic/_variables.scss';

.sidebar {
  display: flex;
  max-width: var(--a-layout-content-max-width);
  width: 100%;

  &__frame {
    justify-content: center;
    margin: 0 auto;
  }

  &__with-aside {
    max-width: var(--a-layout-split-max-width);
    @media (min-width: variables.$layout-split-frame-breakpoint) {
      border-right: var(--a-border-width-strong) solid black;
      border-left: var(--a-border-width-strong) solid black;
    }
  }

  &__aside {
    width: var(--asideWidth);
    min-height: 100%;
    height: var(--a-layout-height);
    border-right: var(--a-border-width-strong) solid black;
    position: relative;
    max-width: var(--a-layout-split-pane-max-width-ratio);
    user-select: none;

    @media (max-width: map.get(variables.$breakpoints, 'mobile')) {
      margin-top: var(--a-safe-area-top);
      height: var(--a-layout-height-safe);
      border-right: none;
    }

    &::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      width: var(--asideResizeHandleWidth);
      height: 100%;
      cursor: ew-resize;

      @media (max-width: map.get(variables.$breakpoints, 'mobile')) {
        content: none;
      }
    }

    @media (max-width: map.get(variables.$breakpoints, 'mobile')) {
      width: 100%;
      max-width: unset;
      min-width: 100%;
    }

    &--has-view {
      @media (max-width: map.get(variables.$breakpoints, 'mobile')) {
        display: none;
      }
    }
  }

  &__layout {
    @media (max-width: map.get(variables.$breakpoints, 'mobile')) {
      margin-top: var(--a-safe-area-top);
      height: var(--a-layout-height-safe);
    }

    flex: 1 1 auto;
    height: var(--a-layout-height);
    width: calc(100% - var(--asideWidth));

    &:deep(> .v-container) {
      height: 100%;
    }
  }

  &__router-view {
    flex: 1;
    height: 100%;

    &--no-aside {
      width: 100%;
      max-width: var(--a-layout-content-max-width);
    }

    &--logo {
      align-items: center;
    }

    img {
      max-width: var(--a-layout-logo-max-width);
      width: 100%;
      height: auto;
      user-select: none;
    }

    :deep(.a-container) {
      max-width: unset;
    }
  }

  &__router-view-host {
    display: flex;
    justify-content: center;
  }
}

.v-theme--dark {
  .sidebar {
    &__router-view {
      img {
        filter: invert(1) brightness(0.4);
        mix-blend-mode: lighten;
      }
    }
  }
}

.v-theme--light {
  .sidebar {
    &__with-aside {
      @media (min-width: variables.$layout-split-frame-breakpoint) {
        border-right: 2px solid map.get(colors.$adm-colors, 'secondary2');
        border-left: 2px solid map.get(colors.$adm-colors, 'secondary2');
      }
    }

    &__aside {
      border-right-color: map.get(colors.$adm-colors, 'secondary2');
    }

    &__router-view {
      img {
        filter: brightness(0.8);
        mix-blend-mode: hard-light;
      }
    }
  }
}
</style>
