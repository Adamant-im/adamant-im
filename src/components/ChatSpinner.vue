<template>
  <div v-if="value">
    <div :class="`${className}__overlay`" />

    <v-progress-circular
      v-if="value"
      :size="150"
      :stroke="1"
      :class="`${className}__progress`"
      color="#4A4A4A"
      indeterminate
    />
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    className () {
      return 'chat-spinner'
    }
  }
}
</script>

<style lang="stylus" scoped>

$chat-spinner-size := 150px

.chat-spinner
  /**
   * 1. Position overlay relative to Container.vue
   */
  &__overlay
    position: absolute // [1]
    top: 0
    left: 0
    width: 100%
    height: 100%

  /**
   * 1. Center progress-circular horizontally
   */
  &__progress
    position: fixed
    left: 50%
    margin-left: -($chat-spinner-size / 2) // [1]
    margin-top: 120px // magic number
</style>
