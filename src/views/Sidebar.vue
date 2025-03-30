<template>
  <div
    :class="{
      [`${className} d-flex justify-center ma-auto`]: true,
      [`${className}__with-aside`]: needAside
    }"
  >
    <aside
      v-if="needAside"
      :class="{
        [`${className}__aside`]: true,
        [`${className}__aside--has-view`]: hasView
      }"
      ref="aside"
      :style="{ '--width': width }"
      @mousedown="startResize"
    >
      <left-side />
    </aside>
    <div
      class="d-flex justify-center align-center"
      :class="{
        [`${className}__router-view`]: true,
        [`${className}__router-view--no-aside`]: !needAside
      }"
    >
      <img v-show="showLogo" src="/img/adamant-logo-transparent-512x512.png" draggable="false" />

      <router-view :key="route.path" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { computed, useTemplateRef, ref } from 'vue'
import { useStore } from 'vuex'
import LeftSide from '@/LeftSide.vue'

const className = 'sidebar'

defineProps<{
  readyToShow?: boolean
}>()

const route = useRoute()
const store = useStore()

const asideRef = useTemplateRef('aside')
let isResizing = false
const initWidth = '33%'

const width = ref(initWidth)

const hasView = computed(() => {
  return route.matched.length > 1
})

const needAside = computed(() => {
  return store.getters.isLogged
})

const showLogo = computed(() => {
  return !hasView.value
})

const startResize = (event: MouseEvent) => {
  if (!asideRef.value) return

  const { left, width: boxWidth } = asideRef.value.getBoundingClientRect()
  const mouseX = event.clientX

  if (mouseX >= left + boxWidth - 10) {
    isResizing = true
    document.addEventListener('mousemove', resize)
    document.addEventListener('mouseup', stopResize)
  }
}

const resize = (event: MouseEvent) => {
  if (isResizing) {
    requestAnimationFrame(() => {
      if (asideRef.value) {
        width.value = Math.max(100, event.clientX - asideRef.value.offsetLeft) + 'px'
      }
    })
  }
}

const stopResize = () => {
  isResizing = false
  document.removeEventListener('mousemove', resize)
  document.removeEventListener('mouseup', stopResize)
}
</script>
<style lang="scss" scoped>
@use 'sass:map';
@use 'vuetify/settings';
@use '@/assets/styles/settings/_colors.scss';

.sidebar {
  display: flex;
  max-width: 1300px;

  &__with-aside {
    @media (min-width: 1300px) {
      border-right: 2px solid black;
      border-left: 2px solid black;
    }
  }

  &__aside {
    width: var(--width);
    min-height: 100%;
    height: calc(100vh - var(--v-layout-bottom));
    border-right: 2px solid black;
    position: relative;
    min-width: max(300px, 25%);
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
    }

    &--has-view {
      @media (max-width: 799px) {
        display: none;
      }
    }
  }

  &__router-view {
    flex: 1;

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

    @media (max-width: 799px) {
      img {
        display: none;
      }
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
      @media (min-width: 1300px) {
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
