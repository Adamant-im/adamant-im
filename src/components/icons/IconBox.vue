<template>
  <div :class="className">
    <slot />
  </div>
</template>

<script>
/**
 * Do the same thing as deprecated `v-avatar`
 */
import { ref } from 'vue'

export default {
  setup() {
    const className = ref('icon-box')

    return {
      className
    }
  }
}
</script>

<style lang="scss" scoped>
.icon-box {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(.v-icon) {
    display: block;
  }
}
</style>
