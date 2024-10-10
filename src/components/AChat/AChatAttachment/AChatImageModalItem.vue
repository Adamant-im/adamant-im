<template>
  <v-carousel-item :class="classes.root" :src="imageUrl" :max-width="width" :max-height="height" />
</template>

<script lang="ts">
import { defineComponent, PropType, ref, onMounted, computed } from 'vue'
import { useStore } from 'vuex'

import { LocalFile, NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { FileAsset } from '@/lib/adamant-api/asset'

function isLocalFile(file: FileAsset | LocalFile): file is LocalFile {
  return 'file' in file && file.file?.file instanceof File
}

const className = 'a-chat-image-modal-item'
const classes = {
  root: className
}

export default defineComponent({
  props: {
    file: {
      type: Object as PropType<FileAsset | LocalFile>,
      required: true
    },
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    }
  },
  setup(props) {
    const store = useStore()
    const imageUrl = ref('')

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

    const getFileFromStorage = async () => {
      const myAddress = store.state.address

      const cid = props.file?.id
      const fileName = props.file?.name
      const fileType = props.file?.type
      const nonce = props.file?.nonce

      const publicKey =
        props.transaction.senderId === myAddress
          ? props.transaction.recipientPublicKey
          : props.transaction.senderPublicKey
      imageUrl.value = await store.dispatch('attachment/getAttachmentUrl', {
        cid,
        publicKey,
        nonce
      })
      if (!!fileName && !!fileType) {
        // TODO: resolve MIME-type
        // downloadFile(data, fileName, '')
      }
    }

    onMounted(() => {
      getFileFromStorage()
    })

    return {
      classes,
      getFileFromStorage,
      imageUrl,
      width,
      height
    }
  }
})
</script>

<style scoped>
.a-chat-image-modal-item {
  display: flex;
  align-items: center;
  justify-content: space-around;
}
</style>
