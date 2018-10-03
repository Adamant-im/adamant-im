<template>
  <div class="modal-wrapper active">
    <div class="modal-overlay"></div>
    <div class="modal-container">
      <div class="modal">
        <div class="modal-body">
          <h3>{{ $t(`scan.${this.getParentName()}.modal_header`) }}</h3>
          <md-progress v-show="loading" md-theme="grey" md-indeterminate></md-progress>
          <picture-input @change="onImageChange" :crop="false" :hideChangeButton="true" width="200" height="200" buttonClass="md-button md-raised md-theme-grey"></picture-input>
          <p v-show="noQrFound">{{ $t('scan.no_qr_code_found_in_image_text') }}</p>
        </div>
        <div class="modal-footer">
          <md-button class="md-raised" v-on:click="hideModal"> {{ $t('scan.close_button') }}</md-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import PictureInput from 'vue-picture-input'
  import QrCodeReader from 'qrcode-reader'

  export default {
    name: 'QRFileScan',
    components: {
      PictureInput
    },
    props: [],
    data() {
      return {
        loading: false,
        noQrFound: false,
        QrReader: new QrCodeReader()
      }
    },
    methods: {
      getParentName() {
        return this.$parent.$options._componentTag || this.$parent.$options.name || this.$parent.name
      },
      onImageChange(imageUrl) {
        this.loading = true
        this.QrReader.decode(imageUrl)
      },
      onQrDecode(error, result) {
        this.loading = false
        if (!error) {
          this.noQrFound = false
          this.parseHandler(result.result)
        } else {
          this.noQrFound = true
        }
      },
      hideModal() {
        this.$emit('hide-modal')
      },
      parseHandler(content) {
        let addressData = this.parseURI(content)
        this.$emit('code-grabbed', content)
        this.hideModal()
      }
    },
    mounted() {
      this.QrReader.callback = this.onQrDecode
    }
  }
</script>

<style>
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
  }
  .modal-wrapper .modal-overlay {
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
  .modal-wrapper .modal-container {
    display: table-cell;
    vertical-align: middle;
    position: relative;
    z-index: 2;
    opacity: 0;
    visibility: hidden;
  }
  .modal-wrapper .modal-container .modal {
    background: white;
    width: 95%;
    max-width: 600px;
    max-height: 600px;
    box-shadow: 0 7px 8px -4px rgba(0, 0, 0, 0.2), 0 13px 19px 2px rgba(0, 0, 0, 0.14), 0 5px 24px 4px rgba(0, 0, 0, 0.12);
    margin: auto;
    display: block;
    border-radius: 4px;
    opacity: 0;
    visibility: hidden;
  }
  .modal-wrapper .modal-container .modal .modal-body {
    max-height: 400px;
    overflow: hidden;
    padding: 1em;
  }
  .modal-wrapper .modal-container .modal .modal-footer {
    display: inline-block;
    padding: 1em;
  }
  .modal-wrapper.active {
    opacity: 1;
    visibility: visible;
  }
  .modal-wrapper.active .modal-overlay {
    opacity: 0.5;
    visibility: visible;
  }
  .modal-wrapper.active .modal-container {
    opacity: 1;
    visibility: visible;
  }
  .modal-wrapper.active .modal {
    opacity: 1;
    visibility: visible;
  }
  .modal-wrapper .picture-input {
    margin-top: 35px;
  }
</style>
