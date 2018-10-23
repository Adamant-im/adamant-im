<template>
  <div v-show="modalWindow" class="modal-wrapper" :class="modalWindow ? 'active' : ''">
    <div class="modal-overlay"></div>
    <div class="modal-container">
      <div class="modal">
        <div class="modal-body">
          <h3>{{$t('scan.' + this.checkParentName() + '.modal_header') }}</h3>
          <md-progress v-show="loading" md-theme="grey" md-indeterminate></md-progress>
          <video id="preview"></video>
        </div>
        <div class="modal-footer">
          <md-button style="max-width: 40px; min-width: 40px; margin-right: 0; padding: 0" v-for="(camera) in cameras" :key="camera.id"
                     v-if="cameras.length > 1 && camera.id !== activeCameraId"
                     :title="camera.name" @click.stop="selectCamera(camera)">
            <md-icon md-src="/img/Attach/rotate-cam.svg"></md-icon>
          </md-button>
          <md-button class="md-raised" @click="hideModal"> {{ $t('scan.close_button') }} </md-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import utils from '../lib/adamant'

export default {
  name: 'qrscan',
  methods: {
    checkParentName () {
      return this.$parent.$options._componentTag || this.$parent.$options.name || this.$parent.name
    },
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
      let addressData = utils.parseURI(content)
      if (addressData) {
        if (this.scanner) {
          this.scanner.stop()
        }
      }
      this.$emit('code-grabbed', content)
      this.hideModal()
    }
  },
  beforeDestroy: function () {
    let self = this
    if (self.scanner) {
      self.scanner.stop()
    }
  },
  mounted: function () {
    // Do not remove webpackMode!!!
    import(
      /* webpackMode: "lazy" */
      'instascan').then((Instascan) => {
      this.loading = false
      let self = this
      self.scanner = new Instascan.Scanner({ video: document.getElementById('preview'), scanPeriod: 5, mirror: false })
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
      currentCamera: false,
      loading: true
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
        width: 95%;
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
          padding: 1em;
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
