<template>
  <v-container fluid :class="[className, { [`${className}--flush`]: containerNoPadding }]">
    <slot />
  </v-container>
  <app-snackbar />
  <app-navigation v-if="showNavigation" />
</template>

<script setup lang="ts">
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppNavigation from '@/components/AppNavigation.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useScreenSize } from '@/hooks/useScreenSize'

const className = 'toolbar-layout'

const route = useRoute()
const store = useStore()

const { isMobileView } = useScreenSize()

const isLogged = computed(() => store.getters.isLogged)

const showNavigation = computed(() => {
  return (
    route.meta.showNavigation && isLogged.value && !(route.name === 'Chat' && isMobileView.value)
  )
})

const containerNoPadding = computed(() => route.meta.containerNoPadding)
</script>

<style lang="scss" scoped>
.toolbar-layout {
  padding: var(--a-toolbar-layout-padding);

  &--flush {
    padding: 0;
  }
}
</style>
