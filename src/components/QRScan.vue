<template>
  <div v-show="modalWindow" class="modal-wrapper" :class="modalWindow ? 'active' : ''">
    <div class="modal-overlay"></div>
    <div class="modal-container">
      <div class="modal">
        <div class="modal-body">
          <h3>{{$t('scan.' + this.checkParentName() + '.modal_header') }}</h3>
          <md-progress v-show="loading" md-theme="grey" md-indeterminate></md-progress>
          <qrcode-reader
              :paused="paused"
              :camera="camera"
              @init="onInit"
              @decode="parseHandler">
          </qrcode-reader>
        </div>
        <div class="modal-footer">
          <md-button style="max-width: 40px; min-width: 40px; margin-right: 0; padding: 0"
                     @click.stop="switchCamera()">
            <md-icon md-src="/img/Attach/rotate-cam.svg"></md-icon>
          </md-button>
          <md-button class="md-raised" @click="hideModal"> {{ $t('scan.close_button') }} </md-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { QrcodeReader } from 'vue-qrcode-reader'

export default {
  name: 'qrscan',
  components: {
    QrcodeReader
  },
  props: ['modal'],
  data () {
    return {
      loading: true,
      useRearCamera: true,
      paused: false
    }
  },
  methods: {
    checkParentName () {
      return this.$parent.$options._componentTag || this.$parent.$options.name || this.$parent.name
    },
    hideModal () {
      this.$emit('hide-modal')
    },
    async onInit (promise) {
      try {
        this.loading = true
        await promise
      } catch (error) {
        this.$emit('error', error)
      } finally {
        this.loading = false
      }
    },
    switchCamera () {
      this.useRearCamera = !this.useRearCamera
    },
    parseHandler (content) {
      this.$emit('code-grabbed', content)
      this.hideModal()
    }
  },
  computed: {
    modalWindow () {
      return this.modal
    },
    camera () {
      if (this.useRearCamera) {
        return {
          facingMode: { ideal: 'environment' }
        }
      } else {
        return {
          facingMode: { exact: 'user' }
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
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
