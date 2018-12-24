<template>
  <canvas width="36" height="36" ref="avatar"></canvas>
</template>

<script>
export default {
  mounted () {
    this.generateAvatar()
  },
  methods: {
    generateAvatar () {
      // @todo Identicon will be here
      const el = this.$refs.avatar
      const ctx = el.getContext('2d')

      const circleSize = this.size / 2
      ctx.beginPath()
      ctx.arc(circleSize, circleSize, circleSize - 1, 0, 2 * Math.PI)
      ctx.stroke()
    }
  },
  props: {
    size: {
      type: Number,
      default: 36
    },
    userId: {
      type: String,
      required: true
    }
  }
}
</script>
