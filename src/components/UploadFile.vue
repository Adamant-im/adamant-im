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

<script lang="ts" setup>
type Props = {
  accept?: string
}

withDefaults(defineProps<Props>(), {
  accept: ''
})

const emit = defineEmits<{
  (e: 'file', files: File[]): void
}>()

const uploadFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const selectedFiles = input.files

  if (!selectedFiles) {
    return
  }

  emit('file', Array.from(selectedFiles))
  // Reset the input value to allow selecting the same files again
  input.value = ''
}
</script>
