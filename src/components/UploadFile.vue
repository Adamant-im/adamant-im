<template>
  <input
    :accept="accept"
    ref="fileInput"
    style="display: none"
    multiple
    type="file"
    @change="uploadFile"
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { readFileAsDataURL } from '@/lib/file'

export type FileData = {
  name: string
  type: string
  content: string
  isImage: boolean
  file: File
  raw: Uint8Array
  width?: number
  height?: number
}

function getImageResolution(file: File): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = (err) => {
      console.log('Error loading image:', err)
      resolve({})
      URL.revokeObjectURL(img.src)
    }

    img.src = URL.createObjectURL(file)
  })
}

export default defineComponent({
  props: {
    accept: {
      type: String as PropType<string>,
      default: ''
    },
    partnerId: {
      type: String as PropType<string>,
      default: ''
    }
  },
  emits: ['image-selected'],
  methods: {
    async uploadFile(event: Event) {
      const input = event.target as HTMLInputElement
      const selectedFiles = input.files

      if (!selectedFiles) {
        console.log('No files selected')
        return
      }

      for (const file of selectedFiles) {
        const { raw, dataURL } = await readFileAsDataURL(file)
        const { width, height } = await getImageResolution(file)

        const fileData: FileData = {
          name: file.name,
          type: file.type,
          content: dataURL,
          raw: raw,
          isImage: file.type.includes('image/'),
          file: file,
          width,
          height
        }

        this.$emit('image-selected', fileData)

        // @todo: Implement this
        // const publicKey = this.$store.getters.publicKey(this.partnerId)
        // this.$store.dispatch('attachment/uploadAttachment', {
        //   file: raw,
        //   publicKey
        // })
      }
    }
  }
})
</script>
