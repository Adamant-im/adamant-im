<template>
  <img :src="dataURL" alt="" />
</template>

<script>
import QRCode from 'qrcode'

export default {
  data: () => ({
    dataURL: ''
  }),
  watch: {
    async text () {
      try {
        this.dataURL = await QRCode.toDataURL(this.text)
      } catch (error) {
        console.error(error)
      }
    }
  },
  props: {
    text: {
      type: String,
      required: true
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
