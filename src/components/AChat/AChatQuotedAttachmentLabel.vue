<template>
  <span v-if="imageAndVideoCount > 0">
    {{ cameraEmoji }}<sub style="font-size: 0.7em">{{ imageAndVideoCount }}</sub>
  </span>
  <span v-if="restMediaCount > 0">
    {{ paperEmoji }}<sub style="font-size: 0.7em">{{ restMediaCount }}</sub>
  </span>
  <span v-if="transaction.message">
    {{ transaction.message }}
  </span>
</template>

<script lang="ts" setup>
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { FileAsset } from '@/lib/adamant-api/asset'
import { computed } from 'vue'

const cameraEmoji = '📸'
const paperEmoji = '📄'

type Props = {
  transaction: NormalizedChatMessageTransaction
}
const props = defineProps<Props>()

const files = computed(() => props.transaction.asset.files)

const imageAndVideoCount = computed(
  () =>
    files.value.filter(
      (file: FileAsset) => file.mimeType?.startsWith('image') || file.mimeType?.startsWith('video')
    ).length
)

const restMediaCount = computed(() => files.value.length - imageAndVideoCount.value)
</script>
