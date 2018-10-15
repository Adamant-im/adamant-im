<template>
  <div class="modal-wrapper active">
    <div class="modal-overlay"></div>
    <div class="modal-container">
      <div class="modal">
        <div class="modal-body">
          <h3>{{ $t(`qr_save.${this.getParentName()}.modal_header`) }}</h3>
          <md-layout md-flex="66" md-flex-xsmall="80" md-align="center" style="margin-top: 40px;">
            <a href="#" @click.prevent="downloadQRCode">
              <qr-code :text="text" ref="qrCode" style="padding: 5px; border: 5px solid #000;"></qr-code>
            </a>
          </md-layout>
          <md-layout md-flex="66" md-flex-xsmall="80" md-align="center">
            <p>{{ $t('qr_save.how_to_save_text') }}</p>
          </md-layout>
        </div>
        <div class="modal-footer">
          <md-button class="md-raised" v-on:click="hideModal">{{ $t('qr_save.close_button') }}</md-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import b64toBlob from 'b64-to-blob'
import FileSaver from 'file-saver'

export default {
  name: 'QRSave',
  props: ['text'],
  methods: {
    showErrorMessage (errorMessage) {
      this.errorMessage = errorMessage
      this.$refs.snackbar.open()
    },
    getParentName () {
      return this.$parent.$options._componentTag || this.$parent.$options.name || this.$parent.name
    },
    downloadQRCode () {
      const imgUrl = this.$refs.qrCode.qrCode._oDrawing._elImage.src
      const base64Data = imgUrl.slice(22)
      const blob = b64toBlob(base64Data, 'image/png')

      FileSaver.saveAs(blob, 'adamant-im.png')
    },
    hideModal () {
      this.$emit('hide-modal')
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
  .z-index-1000 {
    z-index: 1000 !important;
  }
</style>
