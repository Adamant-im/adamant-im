<template>
  <div v-show="modalWindow" class="modal-wrapper" :class="modalWindow ? 'active' : ''">
    <div class="modal-overlay"></div>
    <div class="modal-container">
      <div class="modal">
        <div class="modal-body">
          <!--TODO: check parent name with 'this.$parent.$vnode.tag'-->
          <!--<h3>{{ $t('scan.modal_header') === 'scan.modal_header'? 'Scan your password from QR-code' : $t('scan.modal_header') }}</h3>-->
          <video id="preview"></video>
        </div>
        <div class="modal-footer">
          <div class="buttons_container" v-if="cameras.length > 1" v-for="(camera, index) in cameras" :key="camera.id">
            <md-button v-if="camera.id === activeCameraId" :title="camera.name" disabled class="md-raised md-short">
              {{ $t('scan.camera_button') === 'scan.camera_button'? 'Camera' : $t('scan.camera_button') + index }}
            </md-button>
            <md-button class="md-raised md-short" v-if="camera.id !== activeCameraId" :title="camera.name" @click.stop="selectCamera(camera)">
              {{ $t('scan.camera_button') === 'scan.camera_button'? 'Camera' : $t('scan.camera_button') + index }}
            </md-button>
          </div>
          <md-button class="md-raised md-short" @click="hideModal"> {{ $t('scan.close_button') === 'scan.close_button'? 'Close' : $t('scan.close_button') }} </md-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Instascan from 'instascan'

export default {
  name: 'qrscan',
  methods: {
    hideModal () {
      this.$emit('hide-modal')
    },
    selectCamera: function (camera) {
      this.activeCameraId = camera.id
      this.scanner.start(camera)
    },
    switch_camera () {
      if (this.scanner) {
        this.currentCamera++
        if (this.cameraList.length <= this.currentCamera) {
          this.currentCamera = 0
        }
        var camera = this.cameraList[this.currentCamera]
        this.selectCamera(camera)
      }
    },
    parseHandler (content) {
      let addressData = this.parseURI(content)
      if (addressData) {
        if (this.scanner) {
          this.scanner.stop()
        }
        // this.$router.push('/chats/')
        // this.$store.commit('create_chat', addressData.address)
        // if (addressData.label && !this.$store.state.partners[addressData.address]) {
        //   this.$store.commit('change_display_name', {partnerName: addressData.address, partnerDisplayName: addressData.label})
        // }
        // this.$router.push('/chats/' + addressData.address + '/')
      }
      this.$emit('code-grabbed', content)
      this.hideModal()
      this.$router.push('/')
    }
  },
  beforeDestroy: function () {
    let self = this
    console.log(self.scanner)
    if (self.scanner) {
      self.scanner.stop()
      console.log(self.scanner)
    }
  },
  mounted: function () {
    let self = this
    self.scanner = new Instascan.Scanner({ video: document.getElementById('preview'), scanPeriod: 5, mirror: false })
    console.log(self.scanner)
    self.scanner.addListener('scan', function (content, image) {
      self.parseHandler(content)
    })
    Instascan.Camera.getCameras().then(function (cameras) {
      self.cameras = cameras
      if (cameras.length > 0) {
        self.activeCameraId = cameras[1] ? cameras[1].id : cameras[0].id
        self.scanner.start(cameras[1] ? cameras[1] : cameras[0])
      } else {
        console.error('No cameras found.')
      }
    }).catch(function (e) {
      console.error(e)
    })
  },
  computed: {
    modalWindow () {
      return this.modal
    }
  },
  watch: {
  },
  props: ['modal'],
  data () {
    return {
      scanner: null,
      activeCameraId: null,
      cameras: [],
      scans: [],
      cameraList: [],
      currentCamera: false
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  .modal-wrapper {
    z-index: 999;
    display: table;
    position: fixed;
    width: 100%;
    height: 100%;
    opacity: 0;
    top: 0;
    left: 0;
    visibility: hidden;
    .modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: black;
      opacity: 0;
      visibility: hidden;
      z-index: 1;
    }
    .modal-container {
      display: table-cell;
      vertical-align: middle;
      position: relative;
      z-index: 2;
      opacity: 0;
      visibility: hidden;
      .modal {
        background: white;
        max-width: 600px;
        max-height: 600px;
        box-shadow: 0 7px 8px -4px rgba(0,0,0,.2),0 13px 19px 2px rgba(0,0,0,.14),0 5px 24px 4px rgba(0,0,0,.12);
        margin: auto;
        display: block;
        border-radius: 4px;
        opacity: 0;
        visibility: hidden;
        .modal-body {
          max-height: 400px;
          overflow: hidden;
          padding: 1em;
        }
        .modal-footer {
          display: inline-block;
          padding: 0 2rem 1rem;
          .buttons_container {
            display: inline-block;
          }
        }
      }
    }
    &.active {
      opacity: 1;
      visibility: visible;
      .modal-overlay {
        opacity: 0.5;
        visibility: visible;
      }
      .modal-container {
        opacity: 1;
        visibility: visible;
      }
      .modal {
        opacity: 1;
        visibility: visible;
      }
    }
  }
</style>
