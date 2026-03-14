<template>
  <v-container fluid :class="`${className}__container`">
    <slot />
  </v-container>

  <app-snackbar />
</template>

<script setup lang="ts">
import AppSnackbar from '@/components/AppSnackbar.vue'

const className = 'chat-layout'
</script>

<style lang="scss" scoped>
.chat-layout {
  &__container {
    padding: 0;
  }
}
</style>
