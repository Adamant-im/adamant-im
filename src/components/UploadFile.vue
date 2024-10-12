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
import { useStore } from 'vuex'
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
      required: true
    }
  },
  emits: ['file'],
  setup(props, { emit }) {
    const store = useStore()

    const uploadFile = async (event: Event) => {
      const input = event.target as HTMLInputElement
      const selectedFiles = input.files

      if (!selectedFiles) {
        console.warn('No files selected')
        return
      }

      for (const file of Array.from(selectedFiles)) {
        const dataURL = await readFileAsDataURL(file)
        const arrayBuffer = await readFileAsBuffer(file)
        const { width, height } = await getImageResolution(file)
        const encodedFile = await encodeFile(arrayBuffer, { to: props.partnerId })
        const cid = await computeCID(encodedFile.binary)

        // Cache the attachment
        const blob = new Blob([arrayBuffer], { type: file.type })
        const url = URL.createObjectURL(blob)

        // Cache image URL
        store.commit('attachment/setAttachment', { cid, url })

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

        emit('file', fileData)
      }

      // Reset the input value to allow selecting the same files again
      input.value = ''
    }

    return {
      uploadFile
    }
  }
})
</script>
