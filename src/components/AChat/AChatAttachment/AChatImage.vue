<template>
  <AChatFileLoader :partner-id="partnerId" :file="img" :transaction="transaction">
    <template #default="{ fileUrl, width, height }">
      <v-img :src="fileUrl" :aspect-ratio="width / height" cover @click="$emit('click')">
        <template #placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular color="grey-lighten-4" indeterminate />
          </div>
        </template>
      </v-img>
    </template>
  </AChatFileLoader>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { AChatFileLoader } from './AChatFileLoader.tsx'
import { LocalFile, NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { FileAsset } from '@/lib/adamant-api/asset'

const className = 'a-chat-image'
const classes = {
  root: className
}

export default defineComponent({
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    },
    img: {
      type: Object as PropType<FileAsset | LocalFile>,
      required: true
    },
    partnerId: {
      type: String,
      required: true
    }
  },
  components: { AChatFileLoader },
  setup() {
    return {
      classes
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/settings/_colors.scss';
@import '@/assets/styles/themes/adamant/_mixins.scss';

.a-chat-image {
}

.v-theme--light {
}

.v-theme--dark {
}
</style>
