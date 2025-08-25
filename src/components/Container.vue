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
@use 'sass:map';
@use 'vuetify/settings';

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

  @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
    &--padding {
      padding: 0 16px 0 24px;
    }
  }
}
</style>
