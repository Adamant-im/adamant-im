<template>
  <i class="v-icon" :class="{ 'v-icon--link': isClickable }">
    <svg
      class="svg-icon"
      xmlns="http://www.w3.org/2000/svg"
      :width="width"
      :height="height"
      :viewBox="viewBox"
      :shape-rendering="shapeRendering"
      :aria-labelledby="title"
      role="presentation"
      @click="$emit('click')"
    >
      <title v-if="title">{{ title }}</title>
      <g :fill="color">
        <slot/>
      </g>
    </svg>
  </i>
</template>

<script>
export default {
  created () {
    // if component has @click attr, make cursor: pointer
    const listeners = Object.keys(this.$listeners)
    const hasClickAttr = listeners.some(
      listener => /^click/.test(listener)
    )

    if (hasClickAttr) {
      this.isClickable = true
    }
  },
  data: () => ({
    isClickable: false
  }),
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
    },
    shapeRendering: {
      type: String,
      default: 'auto'
    }
  }
}
</script>

<style lang="stylus">
@import '~vuetify/src/stylus/settings/_colors.styl'

/* Themes */
.theme--light
  .svg-icon
    fill: rgba(0,0,0,0.54)
.theme--dark
  .svg-icon
    fill: $shades.white
</style>
