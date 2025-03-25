<template>
  <div :class="classes">
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
    noMaxWidth: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const classes = computed(() => {
      return {
        'a-container': true,
        'a-container--padding': props.padding,
        'a-container--no-mw': props.noMaxWidth
      }
    })

    return {
      classes
    }
  }
})
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';

.a-container {
  width: 100%;
  max-width: 800px;
  position: relative;

  &--no-mw {
    max-width: unset;
  }

  &--padding {
    padding: 0 24px;
  }

  @media #{map-get($display-breakpoints, 'sm-and-down')} {
    &--padding {
      padding: 0 16px;
    }
  }
}
</style>
