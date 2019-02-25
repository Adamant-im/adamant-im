<template>
  <img :src="dataUrl" alt="" />
</template>

<script>
import QRCode from 'qrcode'

export default {
  data: () => ({
    dataUrl: ''
  }),
  mounted () {
    this.render()
  },
  methods: {
    render () {
      if (this.text) {
        if (this.logo) {
          QRCode.toCanvas(this.text, this.opts).then(canvas => {
            const dHeight = canvas.height / 6
            const dWidth = canvas.width / 6
            const dy = canvas.height / 2 - dHeight / 2
            const dx = canvas.width / 2 - dWidth / 2
            const ctx = canvas.getContext('2d')
            const image = new Image(dWidth, dHeight)
            image.src = this.logo
            ctx.drawImage(image, dx, dy, dWidth, dHeight)
            this.dataUrl = canvas.toDataURL()
          }).catch(error => console.error(error))
        } else {
          QRCode.toDataURL(this.text, this.opts).then(dataUrl => {
            this.dataUrl = dataUrl
          }).catch(error => console.error(error))
        }
      }
    }
  },
  props: {
    logo: {
      type: String
    },
    opts: {
      type: Object
    },
    text: {
      required: true,
      type: String
    }
  },
  watch: {
    text () {
      this.render()
    }
  }
}
</script>

<style lang="stylus" scoped>
/**
 * 1. Should not be inline to avoid empty element with line-height.
 */
img
  display: block // [1]
</style>
