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
@use '@/assets/styles/components/_layout-primitives.scss' as layoutPrimitives;

.icon-box {
  width: var(--a-icon-box-centered-size);
  height: var(--a-icon-box-centered-size);
  @include layoutPrimitives.a-flex-center();

  :deep(.v-icon) {
    display: block;
  }
}
</style>
