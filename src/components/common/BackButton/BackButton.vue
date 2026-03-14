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
  &.v-btn:first-child {
    width: var(--a-back-button-size);
    height: var(--a-back-button-size);
    margin: 0 var(--a-back-button-margin-inline);
    border-radius: var(--a-radius-round);
  }

  &:hover > .v-btn__overlay {
    opacity: var(--a-back-button-hover-overlay-opacity);
    transition: all var(--a-back-button-hover-transition-duration) ease;
  }
}
</style>
