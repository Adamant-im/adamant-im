<template>
  <div
    :class="classes.root"
    v-touch="{
      move: onMove,
      end: onSwipeEnd
    }"
    :style="{
      top: `${elementTopOffset}px`
    }"
  >
    <slot/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { useSwipeDown } from '@/hooks/useSwipeDown'

const className = 'pull-to-refresh'
const classes = {
  root: className
}

export default defineComponent({
  setup() {
    const { onMove, onSwipeEnd, elementTopOffset } = useSwipeDown(() => {
      console.log('swipe triggered')
    })

    return {
      classes,
      onMove,
      onSwipeEnd,
      elementTopOffset
    }
  }
})
</script>

<style scoped>
.pull-to-refresh {
  position: relative;
}
</style>
