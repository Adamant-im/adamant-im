<template>
  <div :class="className">
    <div :class="`${className}__activator`" @click="$refs.fileInput.click()">
      <slot />
    </div>

    <input
      id="fileInput"
      ref="fileInput"
      type="file"
      accept="image/*"
      :class="`${className}__file-input`"
      @change="onFileSelect"
    />

    <canvas ref="canvasElement" :class="`${className}__image`" />
  </div>
</template>

<script>
import { vibrate } from '@/lib/vibrate'
import { useTemplateRef } from 'vue'

export default {
  emits: ['detect', 'error'],
  setup() {
    const canvas = useTemplateRef('canvasElement')

    const IMG_MAX_SIZE = 400

    const drawCanvas = (file) => {
      return new Promise((resolve, reject) => {
        const img = new Image()

        img.onload = () => {
          const ctx = canvas.value.getContext('2d')

          const ratio = img.width / img.height
          let newWidth = IMG_MAX_SIZE
          let newHeight = IMG_MAX_SIZE / ratio

          if (newHeight > IMG_MAX_SIZE) {
            newHeight = IMG_MAX_SIZE
            newWidth = IMG_MAX_SIZE * ratio
          }

          canvas.value.width = newWidth
          canvas.value.height = newHeight

          ctx.drawImage(img, 0, 0, canvas.value.width, canvas.value.height)

          resolve(canvas)
        }

        img.onerror = (e) => reject(e)

        img.src = URL.createObjectURL(file)
      })
    }

    return {
      drawCanvas
    }
  },
  data: () => ({
    qrCodeText: '',
    codeReader: undefined
  }),
  computed: {
    className() {
      return 'qrcode-capture'
    }
  },
  methods: {
    async onFileSelect(event) {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser')
        this.codeReader = new BrowserQRCodeReader()
        await this.drawCanvas(event.target.files[0])
        this.qrCodeText = await this.tryToDecode()

        vibrate.veryShort()

        this.$emit('detect', this.qrCodeText)
      } catch (err) {
        vibrate.tripleVeryShort()

        this.$emit('error', err)
      }
      // Reset input to trigger change event later if user selects same image (Chrome)
      this.$refs.fileInput.value = ''
    },
    /**
     * Decode QRCode from canvas.
     * @returns {Promise<string>}
     */
    async getQrcode() {
      const result = await this.codeReader.decodeFromCanvas(this.$refs.canvasElement)

      return result.text
    },

    tryToDecode() {
      return new Promise((resolve, reject) => {
        // Vue should rerender <img> element,
        // so add a callback to the macrotasks queue
        setTimeout(() => {
          this.getQrcode()
            .then((qrCodeText) => resolve(qrCodeText))
            .catch((err) => reject(err))
        }, 0)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.qrcode-capture {
  &__file-input,
  &__image {
    display: none;
  }
}
</style>
