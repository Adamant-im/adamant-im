<template>
  <div :class="classes.root">
    <div :class="classes.activator" @click="fileInput?.click()">
      <slot />
    </div>

    <input
      id="fileInput"
      ref="fileInput"
      type="file"
      accept="image/*"
      :class="classes.input"
      @change="onFileSelect"
    />

    <canvas ref="canvasElement" :class="classes.image" />
  </div>
</template>

<script setup lang="ts">
import { vibrate } from '@/lib/vibrate'
import { useTemplateRef } from 'vue'
import type { BrowserQRCodeReader } from '@zxing/browser'

const IMG_MAX_SIZE = 400

const emit = defineEmits<{
  (e: 'detect', text: string): void
  (e: 'error', err: unknown): void
}>()

const className = 'qrcode-capture'

const classes = {
  root: className,
  activator: `${className}__activator`,
  input: `${className}__file-input`,
  image: `${className}__image`
}

let codeReader: BrowserQRCodeReader

const canvas = useTemplateRef('canvasElement')
const fileInput = useTemplateRef('fileInput')

const drawCanvas = (file: File) => {
  const img = new Image()
  const imgUrl = URL.createObjectURL(file)

  const revokeObjectURL = () => {
    URL.revokeObjectURL(imgUrl)
  }

  const promise = new Promise((resolve, reject) => {
    img.onload = () => {
      if (!canvas.value) {
        return reject()
      }

      const ctx = canvas.value.getContext('2d')

      if (!ctx) {
        return reject()
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

      resolve(canvas)
    }

    img.onerror = (e) => reject(e)

    img.src = imgUrl
  })

  promise.finally(revokeObjectURL)

  return promise
}

const getQrcode = () => {
  return codeReader?.decodeFromCanvas(canvas.value!).getText()
}

const tryToDecode = () => {
  return new Promise<string>((resolve, reject) => {
    // Vue should rerender <canvas> element,
    // so add a callback to the macrotasks queue
    setTimeout(() => {
      try {
        resolve(getQrcode())
      } catch (e) {
        reject(e)
      }
    }, 0)
  })
}

const onFileSelect = async (event: Event) => {
  try {
    if (!codeReader) {
      const { BrowserQRCodeReader } = await import('@zxing/browser')
      codeReader = new BrowserQRCodeReader()
    }

    const input = event.target as HTMLInputElement

    const file = input.files![0]!

    await drawCanvas(file)
    const qrCodeText = await tryToDecode()

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
