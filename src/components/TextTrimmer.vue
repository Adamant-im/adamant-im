<template>
  <span class="left" ref="left">{{ trimmedText }}</span>
  <span class="ok">...{{ rightText }}</span>
</template>

<script>
export default {
  props: {
    text: String
  },
  data() {
    return {
      leftWidth: 0,
      leftScrollWidth: 0,
      trimmedText: ''
    }
  },

  mounted() {
    this.leftText = this.text.slice(0, -8)
    this.rightText = this.text.slice(-8)

    window.addEventListener('resize', this.calculateTrimmedText)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.calculateTrimmedText)
  },
  methods: {
    // calculateTrimmedText() {
    //   // this.leftWidth = this.$refs.left.clientWidth
    //   // console.log(' Ширина :', this.leftWidth)

    //   // this.leftScrollWidth = this.$refs.left.scrollWidth
    //   // console.log(' scrollWidth :', this.leftScrollWidth)

    //   // if (this.leftScrollWidth > this.leftWidth) {
    //   //   this.trimmedText = this.leftText.substring(
    //   //     0,
    //   //     Math.floor((this.leftText.length * this.leftWidth) / this.leftScrollWidth)
    //   //   )
    //   // } else {
    //   //   this.trimmedText = this.leftText
    //   // }
    //   clearTimeout(this.resizeTimer) // Очистим предыдущий таймер, если он есть

    //   this.resizeTimer = setTimeout(() => {
    //     const containerWidth = this.$refs.left.clientWidth
    //     const originalWidth = this.$refs.left.scrollWidth

    //     if (originalWidth > containerWidth) {
    //       const ratio = containerWidth / originalWidth
    //       const visibleCharacters = Math.floor(this.leftText.length * ratio)
    //       this.trimmedText = this.leftText.substring(0, visibleCharacters - 3) + '...'
    //     } else {
    //       this.trimmedText = this.leftText
    //     }
    //   }, 200)
    // }
    calculateTrimmedText() {
      clearTimeout(this.resizeTimer)

      this.resizeTimer = setTimeout(() => {
        const containerWidth = this.$refs.left.clientWidth
        console.log('clientWidth', containerWidth)
        const originalWidth = this.$refs.left.scrollWidth
        console.log('scrollWidth', originalWidth)

        if (originalWidth > containerWidth) {
          let visibleCharacters = 0
          for (let i = 0; i < this.leftText.length; i++) {
            const textWidth = this.measureTextWidth(this.leftText.substring(0, i + 1))
            if (textWidth <= containerWidth) {
              visibleCharacters = i + 1
            } else {
              break
            }
          }
          this.trimmedText = this.leftText.substring(0, visibleCharacters - 1)
        } else {
          this.trimmedText = this.leftText
        }
      }, 300)
    },
    measureTextWidth(text) {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      context.font =
        getComputedStyle(this.$refs.left).fontSize +
        ' ' +
        getComputedStyle(this.$refs.left).fontFamily
      return context.measureText(text).width
    }
  }
}
</script>

<style scoped>
.ok {
  display: inline-block;
}

.left {
  display: inline-block;
  overflow: hidden;
}
</style>
