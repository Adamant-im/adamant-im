<template>
  <slot
    :is-loading="isLoading"
    :upload-progress="uploadProgress"
    :download-file-progress="downloadFileProgress"
    :download-preview-progress="downloadPreviewProgress"
    :file-url="fileUrl"
    :preview-url="previewUrl"
    :error="error"
    :width="width"
    :height="height"
    :allow-auto-download-preview="allowAutoDownloadPreview"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@tanstack/vue-query'

import { FileAsset } from '@/lib/adamant-api/asset'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { LocalFile, isLocalFile } from '@/lib/files'
import { PreviewPreferences } from '@/lib/constants'

type Props = {
  file: FileAsset | LocalFile
  partnerId: string
  transaction: NormalizedChatMessageTransaction
}

const props = defineProps<Props>()

const store = useStore()
const myAddress = computed(() => store.state.address)

const publicKey = computed(() => {
  return props.transaction.senderId === myAddress.value
    ? props.transaction.recipientPublicKey
    : props.transaction.senderPublicKey
})

const width = computed(() => {
  if (isLocalFile(props.file)) {
    return props.file.file.width
  } else {
    return props.file.resolution?.[0]
  }
})

const height = computed(() => {
  if (isLocalFile(props.file)) {
    return props.file.file.height
  } else {
    return props.file.resolution?.[1]
  }
})

const isAutoDownloadAllowed = (preferenceKey: string) => {
  return computed(() => {
    const isContact = store.getters['partners/displayName'](props.partnerId)
    const preference = store.state.options[preferenceKey]

    return (
      preference === PreviewPreferences.everybody ||
      (isContact && preference === PreviewPreferences.contacts)
    )
  })
}

const allowAutoDownloadFile = isAutoDownloadAllowed('fullMediaPreference')
const allowAutoDownloadPreview = isAutoDownloadAllowed('previewPreference')

const { data, isLoading, error } = useQuery({
  queryKey: ['file', (props.file as FileAsset).id],
  queryFn: async () => {
    const file = props.file as FileAsset

    const previewPromise =
      allowAutoDownloadPreview.value && file.preview?.id
        ? store.dispatch('attachment/getAttachmentUrl', {
            cid: file.preview.id,
            publicKey: publicKey.value,
            nonce: file.preview.nonce
          })
        : Promise.resolve(null)

    const previewUrl = await previewPromise

    let fileUrl: string | null = null
    if (allowAutoDownloadFile.value) {
      fileUrl = await store.dispatch('attachment/getAttachmentUrl', {
        cid: file.id,
        publicKey: publicKey.value,
        nonce: file.nonce
      })
    }

    return { fileUrl, previewUrl }
  },
  enabled: !isLocalFile(props.file),
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnMount: true
})

const fileUrl = computed(() => {
  if (isLocalFile(props.file)) {
    return store.getters['attachment/getImageUrl'](props.file.file.cid)
  }

  const localUrl = store.getters['attachment/getImageUrl'](props.file.id)
  if (localUrl) {
    return localUrl
  }

  return data.value?.fileUrl
})

const previewUrl = computed(() => {
  if (isLocalFile(props.file)) {
    return store.getters['attachment/getImageUrl'](props.file.file.preview?.cid)
  }

  const localUrl = store.getters['attachment/getImageUrl'](props.file.preview?.id)
  if (localUrl) {
    return localUrl
  }

  return data.value?.previewUrl
})

const uploadProgress = computed(() => {
  if (isLocalFile(props.file)) {
    return store.getters['attachment/getUploadProgress'](props.file.file.cid)
  }

  return 100
})

const downloadFileProgress = computed(() => {
  if (isLocalFile(props.file)) {
    return store.getters['attachment/getDownloadProgress'](props.file.file.cid)
  }

  return store.getters['attachment/getDownloadProgress'](props.file.id)
})

const downloadPreviewProgress = computed(() => {
  if (isLocalFile(props.file)) {
    return store.getters['attachment/getDownloadProgress'](props.file.file.preview?.cid)
  }

  return store.getters['attachment/getDownloadProgress'](props.file.preview?.id)
})
</script>
