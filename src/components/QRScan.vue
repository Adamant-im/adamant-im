<template>
  <div class="qrscan">
      <video id="preview"></video>
  </div>
</template>

<script>
export default {
  name: 'qrscan',
  methods: {
    errorMessage (message) {
      this.formErrorMessage = this.$t('chats.' + message)
      this.$refs.chatSnackbar.open()
    },
    parseHandler (content) {
      var addressData = this.parseURI(content)
      if (addressData) {
        if (this.scanner) {
          this.scanner.stop()
        }
        this.$router.push('/chats/')
        this.$store.commit('create_chat', addressData.address)
        if (addressData.label && !this.$store.state.partners[addressData.address]) {
          this.$store.commit('change_display_name', {partnerName: addressData.address, partnerDisplayName: addressData.label})
        }
        this.$router.push('/chats/' + addressData.address + '/')
      }
    },
    getCameras (cameras) {
      if (cameras.length > 0) {
        this.scanner.start(cameras[0])
      } else {
        console.error('No cameras found.')
      }
    }
  },
  mounted: function () {
    var Instascan = require('instascan')
    this.scanner = new Instascan.Scanner({ video: document.getElementById('preview') })
    this.scanner.addListener('scan', this.parseHandler)
    Instascan.Camera.getCameras().then(this.getCameras).catch(function (e) {
      console.error(e)
    })
  },
  computed: {
  },
  watch: {
  },
  data () {
    return {
      message: '',
      scanner: false
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

</style>
