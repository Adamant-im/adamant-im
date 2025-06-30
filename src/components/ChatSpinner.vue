<template>
  <div v-if="value">
    <div :class="`${className}__overlay`" />

    <v-progress-circular v-if="value" :size="150" :stroke="1" color="#4A4A4A" indeterminate />
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true
    }
  },
  setup() {
    const className = 'chat-spinner'

    return {
      className
    }
  }
})
</script>

<style lang="scss" scoped>
$chat-spinner-size: 150px !default;

.chat-spinner {
  /**
   * 1. Position overlay relative to Container.vue
   */
  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}
</style>
