<template>
  <div :class="className">
    <div
      @click="$refs.fileInput.click()"
      :class="`${className}__activator`"
    >
      <slot></slot>
    </div>

    <input
      id="fileInput"
      type="file"
      accept="image/*"
      :class="`${className}__file-input`"
      @change="onFileSelect"
      ref="fileInput"
    >

    <img
      :id="imageBase64"
      :src="imageBase64"
      :class="`${className}__image`"
      ref="imageElement"
    />
  </div>
</template>

<script>
export default {
  computed: {
    className () {
      return 'qrcode-capture'
    }
  },
  data: () => ({
    selectedImage: undefined,
    imageBase64: '',
    qrCodeText: '',
    codeReader: undefined
  }),
  methods: {
    async onFileSelect (event) {
      this.selectedImage = event.target.files[0]

      try {
        const { BrowserQRCodeReader } = await import(
          /* webpackChunkName: "zxing" */
          '@zxing/library'
        )
        this.codeReader = new BrowserQRCodeReader()
        this.imageBase64 = await this.getImageBase64()
        this.qrCodeText = await this.tryToDecode()

        this.$emit('detect', this.qrCodeText)
      } catch (err) {
        this.$emit('error', err)
      }
    },

    /**
     * Converts image into Base64.
     * @returns {Promise<string>}
     */
    getImageBase64 () {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = e => resolve(e.target.result)
        reader.onerror = err => reject(err)

        reader.readAsDataURL(this.selectedImage)
      })
    },

    /**
     * Decode QRCode from Base64 image.
     * @returns {Promise<string>}
     */
    async getQrcode () {
      // heisenbug: zxing cause mutation on `imageElement.src`,
      // so need to clone element before
      const result = await this.codeReader.decodeFromImage(this.$refs.imageElement.cloneNode())

      return result.text
    },

    tryToDecode () {
      return new Promise((resolve, reject) => {
        // Vue should rerender <img> element,
        // so add a callback to the macrotasks queue
        setTimeout(() => {
          this.getQrcode()
            .then(qrCodeText => resolve(qrCodeText))
            .catch(err => reject(err))
        }, 0)
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.qrcode-capture
  &__file-input, &__image
    display: none
</style>
