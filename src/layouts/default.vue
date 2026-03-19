<template>
  <v-container fluid fill-height :class="`${className}__container`">
    <slot />
  </v-container>

  <app-snackbar />
</template>

<script setup lang="ts">
import AppSnackbar from '@/components/AppSnackbar.vue'

const className = 'default-layout'
</script>

<style lang="scss" scoped>
.default-layout {
  &__container {
    padding: var(--a-default-layout-padding);
  }
}
</style>
