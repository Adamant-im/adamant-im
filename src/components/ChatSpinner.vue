<template>
  <div v-if="value" :class="className">
    <div :class="`${className}__overlay`" />

    <v-progress-circular
      :class="`${className}__spinner`"
      :size="CHAT_SPINNER_SIZE"
      :stroke="CHAT_SPINNER_STROKE"
      color="var(--a-spinner-neutral-color)"
      indeterminate
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'

const CHAT_SPINNER_SIZE = 150
const CHAT_SPINNER_STROKE = 1

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
      CHAT_SPINNER_SIZE,
      CHAT_SPINNER_STROKE,
      className
    }
  }
})
</script>

<style lang="scss" scoped>
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
