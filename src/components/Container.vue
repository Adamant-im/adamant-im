<template>
  <div :class="classes">
    <slot></slot>
  </div>
</template>

<script>
export default {
  computed: {
    classes () {
      return {
        'a-container': true,
        'a-container--padding': this.padding
      }
    }
  },
  props: {
    padding: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_variables.styl'

.a-container
  width: 100%
  max-width: 800px
  position: relative

  &--padding
    padding: 0 24px

  @media $display-breakpoints.sm-and-down
    &--padding
      padding: 0 16px
</style>
