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
