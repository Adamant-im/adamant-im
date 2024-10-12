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
import { computeCID, readFileAsBuffer, readFileAsDataURL } from '@/lib/file'

import { EncodedFile, encodeFile } from '@/lib/adamant-api'

export type FileData = {
  cid: string
  name: string
  type: string
  content: string
  isImage: boolean
  file: File
  encoded: EncodedFile
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

      for (const file of Array.from(selectedFiles)) {
        const dataURL = await readFileAsDataURL(file)
        const arrayBuffer = await readFileAsBuffer(file)
        const { width, height } = await getImageResolution(file)
        const encodedFile = await encodeFile(arrayBuffer, { to: this.partnerId })
        const cid = await computeCID(encodedFile.binary)

        // Cache the attachment
        const blob = new Blob([arrayBuffer], { type: file.type })
        const url = URL.createObjectURL(blob)

        // Cache image URL
        this.$store.commit('attachment/setAttachment', { cid, url })

        const fileData: FileData = {
          cid,
          name: file.name,
          type: file.type,
          content: dataURL,
          encoded: encodedFile,
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

      // Reset the input value to allow selecting the same files again
      input.value = ''
    }
  }
})
</script>
