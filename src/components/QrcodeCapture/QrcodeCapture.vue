<template>
  <div :class="className">
    <div :class="`${className}__activator`" @click="fileInput?.click()">
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

<script setup lang="ts">
import { vibrate } from '@/lib/vibrate'
import { useTemplateRef } from 'vue'
import { IMG_MAX_SIZE } from '@/components/QrcodeCapture/consts'
import type { BrowserQRCodeReader } from '@zxing/browser/esm/readers/BrowserQRCodeReader'

const emit = defineEmits<{
  (e: 'detect'): void
  (e: 'error', err: unknown): void
}>()

const className = 'qrcode-capture'

let qrCodeText = ''
let codeReader: BrowserQRCodeReader | null = null

const canvas = useTemplateRef('canvasElement')
const fileInput = useTemplateRef('fileInput')

const drawCanvas = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const imgUrl = URL.createObjectURL(file)

    img.onload = () => {
      if (!canvas.value) {
        reject()
      }

      const ctx = canvas.value.getContext('2d')

      if (!ctx) {
        reject()
      }

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

      URL.revokeObjectURL(imgUrl)

      resolve(canvas)
    }

    img.onerror = (e) => reject(e)

    img.src = imgUrl
  })
}

/**
 * Decode QRCode from canvas.
 * @returns {Promise<string>}
 */
const getQrcode = async () => {
  const result = await codeReader.decodeFromCanvas(canvas.value)

  return result.text
}

const tryToDecode = () => {
  return new Promise((resolve, reject) => {
    // Vue should rerender <img> element,
    // so add a callback to the macrotasks queue
    setTimeout(() => {
      getQrcode()
        .then((qrCodeText) => resolve(qrCodeText))
        .catch((err) => reject(err))
    }, 0)
  })
}

const onFileSelect = async (event: Event) => {
  try {
    if (!codeReader) {
      const { BrowserQRCodeReader } = await import('@zxing/browser')
      codeReader = new BrowserQRCodeReader()
    }

    await drawCanvas(event.target.files[0])
    qrCodeText = await tryToDecode()

    vibrate.veryShort()

    emit('detect', qrCodeText)
  } catch (err) {
    vibrate.tripleVeryShort()

    emit('error', err)
  }

  if (fileInput.value) {
    // Reset input to trigger change event later if user selects same image (Chrome)
    fileInput.value.value = ''
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
