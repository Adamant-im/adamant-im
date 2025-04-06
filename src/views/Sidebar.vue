<template>
  <div
    :class="{
      [`${className} d-flex justify-center ma-auto`]: true,
      [`${className}__with-aside`]: needAside
    }"
    :style="{ '--asideWidth': asideWidth }"
  >
    <aside
      v-if="needAside"
      :class="{
        [`${className}__aside`]: true,
        [`${className}__aside--has-view`]: hasView
      }"
      ref="aside"
      @mousedown="startResize"
    >
      <left-side />
    </aside>
    <div :class="`${className}__layout`">
      <component :is="layout">
        <div
          class="d-flex justify-center align-center"
          :class="{
            [`${className}__router-view`]: true,
            [`${className}__router-view--no-aside`]: !needAside
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
import { useRoute } from 'vue-router'
import { computed, useTemplateRef, ref } from 'vue'
import { useStore } from 'vuex'
import LeftSide from '@/components/LeftSide.vue'
import { useScreenSize } from '@/hooks/useScreenSize'

const className = 'sidebar'

const layout = computed(() => route.meta.layout || 'default')

const route = useRoute()
const store = useStore()

const SAVED_WIDTH_KEY = 'aside_width'

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

  if (mouseX >= left + boxWidth - 10 && !isResizing) {
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
</script>
<style lang="scss" scoped>
@use 'sass:map';
@use 'vuetify/settings';
@use '@/assets/styles/settings/_colors.scss';

.sidebar {
  display: flex;
  max-width: 800px;
  width: 100%;

  &__with-aside {
    max-width: 1512px;
    @media (min-width: 1513px) {
      border-right: 2px solid black;
      border-left: 2px solid black;
    }
  }

  &__aside {
    width: var(--asideWidth);
    min-height: 100%;
    height: calc(100vh - var(--v-layout-bottom));
    border-right: 2px solid black;
    position: relative;
    max-width: 75%;
    user-select: none;

    &::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      width: 10px;
      height: 100%;
      cursor: ew-resize;
    }

    @media (max-width: 799px) {
      width: 100%;
      max-width: unset;
      min-width: 100%;
    }

    &--has-view {
      @media (max-width: 799px) {
        display: none;
      }
    }
  }

  &__layout {
    flex: 1 1 auto;
    overflow-y: auto;
    overflow-x: hidden;
    height: calc(100vh - var(--v-layout-bottom));
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
      max-width: 800px;
    }

    img {
      max-width: 512px;
      width: 100%;
      height: auto;
      user-select: none;
    }

    :deep(.a-container) {
      max-width: unset;
    }
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
      @media (min-width: 1513px) {
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
