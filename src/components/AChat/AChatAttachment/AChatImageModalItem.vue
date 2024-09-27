<template>
  <v-img class="img" :src="imageUrl" alt="Image" />
</template>
<script lang="ts">
import { defineComponent, PropType, ref, onMounted } from 'vue'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { useStore } from 'vuex'
export default defineComponent({
  props: {
    file: {
      type: Object,
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
      getFileFromStorage,
      imageUrl
    }
  }
})
</script>
<style scoped>
.img {
  height: 100%;
  width: 100%;
}
</style>
