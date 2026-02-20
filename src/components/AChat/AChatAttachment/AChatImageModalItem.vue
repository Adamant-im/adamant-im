<template>
  <v-carousel-item
    :class="classes.root"
    :max-width="normalizedWidth"
    :max-height="normalizedHeight"
  >
    <pull-down @action="$emit('closeModal')" :offset="PULLDOWN_OFFSET" no-loader full-height>
      <v-img :src="imageUrl" contain />
    </pull-down>
  </v-carousel-item>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, watch } from 'vue'
import { useStore } from 'vuex'

import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { FileAsset } from '@/lib/adamant-api/asset'
import { PullDown } from '@/components/common/PullDown'

const className = 'a-chat-image-modal-item'
const classes = {
  root: className
}

const PULLDOWN_OFFSET = 60

export default defineComponent({
  components: { PullDown },
  props: {
    file: {
      type: Object as PropType<FileAsset>,
      required: true
    },
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    },
    isCurrentSlide: {
      type: Boolean,
      required: true
    }
  },
  emits: ['closeModal'],
  setup(props) {
    const store = useStore()
    const imageUrl = ref('')

    const rawWidth = computed(() => props.file.resolution?.[0] || 0)
    const rawHeight = computed(() => props.file.resolution?.[1] || 0)

    // So the modal window has some space to click outside an image
    const screenWidth = window.innerWidth * 0.85
    const screenHeight = window.innerHeight * 0.85

    const normalizedWidth = computed(() => {
      if (!rawWidth.value || !rawHeight.value) return screenWidth
      const aspectRatio = rawWidth.value / rawHeight.value

      let width = screenWidth
      let height = width / aspectRatio

      if (height > screenHeight) {
        height = screenHeight
        width = height * aspectRatio
      }
      return width
    })

    const normalizedHeight = computed(() => {
      if (!rawWidth.value || !rawHeight.value) return screenHeight
      const aspectRatio = rawWidth.value / rawHeight.value

      let height = screenHeight
      let width = height * aspectRatio

      if (width > screenWidth) {
        width = screenWidth
        height = width / aspectRatio
      }
      return height
    })

    const publicKey = computed(() =>
      props.transaction.senderId === store.state.address
        ? props.transaction.recipientPublicKey
        : props.transaction.senderPublicKey
    )
    const isCurrentSlide = computed(() => props.isCurrentSlide)

    const getFileFromStorage = async () => {
      const { id, nonce } = props.file

      imageUrl.value = await store.dispatch('attachment/getAttachmentUrl', {
        cid: id,
        publicKey: publicKey.value,
        nonce
      })
    }

    watch(
      isCurrentSlide,
      (value: boolean) => {
        if (value) {
          getFileFromStorage()
        }
      },
      { immediate: true }
    )

    return {
      classes,
      imageUrl,
      normalizedWidth,
      normalizedHeight,
      PULLDOWN_OFFSET
    }
  }
})
</script>

<style scoped>
.a-chat-image-modal-item {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
