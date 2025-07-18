<template>
  <v-btn :class="className" icon>
    <slot />
    <v-icon :icon="mdiArrowLeft" />
  </v-btn>
</template>

<script setup lang="ts">
import { mdiArrowLeft } from '@mdi/js'

const className = 'back-button'
</script>

<style lang="scss">
.back-button {
  &:first-child {
    width: 36px;
    height: 36px;
    margin: 0 12px !important;
    border-radius: 50%;
  }

  &:hover > .v-btn__overlay {
    opacity: 0.2;
    transition: all 0.4s ease;
  }
}
</style>
