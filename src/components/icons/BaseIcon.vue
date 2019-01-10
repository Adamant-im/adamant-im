<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="width"
    :height="height"
    :viewBox="viewBox"
    :aria-labelledby="title"
    role="presentation"
  >
    <title v-if="title">{{ title }}</title>
    <g :fill="color">
      <slot/>
    </g>
  </svg>
</template>

<script>
export default {
  props: {
    width: {
      type: [Number, String],
      default: 32
    },
    height: {
      type: [Number, String],
      default: 32
    },
    title: {
      type: String
    },
    color: {
      type: String,
      default: undefined
    },
    viewBox: {
      type: String,
      default: '0 0 512 512'
    }
  }
}
</script>

<style lang="stylus">
svg
  display: inline-block
  vertical-align: baseline

/* icon circle, context styles
.v-avatar svg
  border-radius: 50%
  display: inline-flex
  height: inherit
  width: inherit
*/
</style>
