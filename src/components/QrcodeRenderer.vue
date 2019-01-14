<template>
  <img alt="" ref="qrcode" />
</template>

<script>
import QRCode from 'qrcode'

export default {
  props: {
    text: {
      type: String
    }
  },
  watch: {
    async text () {
      try {
        await QRCode.toDataURL(this.text, (error, url) => {
          if (error) throw error
          this.$refs.qrcode.src = url
        })
      } catch (error) {
        console.error(error)
      }
    }
  }
}
</script>
