<template>
  <div class="qrscan">
      <video id="preview"></video>
      <div class="switch_camera" v-if="this.cameraList.length>1" v-on:click="switch_camera"><md-icon>switch_camera</md-icon></div>
  </div>
</template>

<script>
export default {
  name: 'qrscan',
  methods: {
    selectCamera (camera) {
      console.log(camera.id)
      this.scanner.start(camera)
    },
    switch_camera () {
      if (this.scanner) {
        this.currentCamera ++
        if (this.cameraList.length <= this.currentCamera) {
          this.currentCamera = 0
        }
        var camera = this.cameraList[this.currentCamera]
        this.selectCamera(camera)
      }
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
      } else {
        // content is string data
        const wordCount = content.split(' ').length

        if (wordCount === 12) { // looks like a passphrase
          this.$store.commit('save_passphrase', { passPhrase: content })
          this.$router.push('/')
        }
      }
    },
    getCameras (cameras) {
      this.cameraList = cameras
      for (var i in cameras) {
        if (cameras[i].name.indexOf('ack') > 0) {
          this.currentCamera = i
        }
      }
      if (this.currentCamera === false) {
        this.currentCamera = this.cameraList.length - 1
      }
      if (cameras.length > 0) {
        this.scanner.start(cameras[this.currentCamera])
      } else {
        this.$router.push('/chats/')
      }
    }
  },
  beforeDestroy: function () {
    if (this.scanner) {
      this.scanner.stop()
    }
  },
  mounted: function () {
    // var Instascan = require('instascan/src/index.js')
// eslint-disable-next-line no-undef
    this.scanner = new Instascan.Scanner({ video: document.getElementById('preview'), scanPeriod: 5, mirror: false })
    this.scanner.addListener('scan', this.parseHandler)
// eslint-disable-next-line no-undef
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
      cameraList: [],
      currentCamera: false,
      scanner: false
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
    .qrscan {
        position: relative;
    }
    #preview {
        max-height:100%;
        max-width:100%;
    }
.switch_camera
{
    position:absolute;
    z-index:1000;
    right: 15%;
    bottom:20%;
}
</style>
