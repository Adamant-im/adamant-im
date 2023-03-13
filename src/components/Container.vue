<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    padding: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    classes () {
      return {
        'a-container': true,
        'a-container--padding': this.padding
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';

.a-container {
  width: 100%;
  max-width: 800px;
  position: relative;

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
