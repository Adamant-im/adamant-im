<template>
  <div :class="classes" v-bind="$attrs">
    <slot />
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  props: {
    padding: {
      type: Boolean,
      default: false
    },
    disableMaxWidth: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const classes = computed(() => {
      return {
        'a-container': true,
        'a-container--padding': props.padding,
        'a-container--no-mw': props.disableMaxWidth
      }
    })

    return {
      classes
    }
  }
})
</script>

<style lang="scss" scoped>
.a-container {
  width: 100%;
  max-width: 800px;
  position: relative;

  &--no-mw {
    max-width: unset;
  }

  &--padding {
    padding-inline: var(--a-space-6);
  }
}
</style>
