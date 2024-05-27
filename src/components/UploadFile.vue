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
<script>
export default {
  props: {
    accept: String,
    partnerId: {
      type: String,
      default: ''
    }
  },
  emits: ['image-selected'],
  methods: {
    uploadFile(event) {
      const selectedFiles = event.target.files
      console.log('files', selectedFiles)

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const imageData = {
              name: file.name,
              type: file.type,
              content: e.target.result,
              isImage: file.type.includes('image/')
            }
            this.$emit('image-selected', imageData)
            const publicKey = this.$store.getters.publicKey(this.partnerId)
            console.log(this.partnerId)
            console.log(publicKey)
            this.$store.dispatch('attachment/uploadAttachment', {
              file,
              publicKey
            })
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }
}
</script>
