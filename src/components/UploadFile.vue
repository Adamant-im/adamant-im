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

export type FileData = {
  name: string
  type: string
  content: string
  isImage: boolean
  file: File
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
    uploadFile(event: Event) {
      const input = event.target as HTMLInputElement
      const selectedFiles = input.files

      if (!selectedFiles) {
        console.log('No files selected')
        return
      }

      for (const file of selectedFiles) {
        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => {
          const fileData: FileData = {
            name: file.name,
            type: file.type,
            content: e.target?.result as string,
            isImage: file.type.includes('image/'),
            file: file
          }
          this.$emit('image-selected', fileData)
          const publicKey = this.$store.getters.publicKey(this.partnerId)
          this.$store.dispatch('attachment/uploadAttachment', {
            file: new Uint8Array(reader.result as ArrayBuffer),
            publicKey
          })
        }
        reader.readAsDataURL(file)
      }
    }
  }
})
</script>
