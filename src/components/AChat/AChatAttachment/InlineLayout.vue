<template>
  <div :class="classes.root">
    <AChatFile
      v-for="(file, index) in files"
      :key="index"
      :file="file"
      :partnerId="partnerId"
      :transaction="transaction"
      @click="handleClick(file)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { FileAsset } from '@/lib/adamant-api/asset'
import { LocalFile, NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import AChatFile from './AChatFile.vue'

const className = 'a-chat-inline-layout'
const classes = {
  root: className
}

export default defineComponent({
  components: { AChatFile },
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    },
    files: {
      type: Array as PropType<Array<FileAsset | LocalFile>>,
      required: true
    },
    partnerId: {
      type: String,
      required: true
    }
  },
  emits: ['click:file'],
  setup(props, { emit }) {
    const handleClick = (img: FileAsset | LocalFile) => {
      emit('click:file', props.files.indexOf(img))
    }

    return {
      classes,
      handleClick
    }
  }
})
</script>

<style lang="scss">
.a-chat-inline-layout {
  display: grid;
  gap: 8px;
}
</style>
