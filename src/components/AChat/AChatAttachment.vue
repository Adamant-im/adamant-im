<template>
  <v-row>
    {{ transaction }}
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useStore } from 'vuex'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'

export default defineComponent({
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    }
  },
  emits: ['resend', 'click:quotedMessage', 'swipe:left', 'longpress'],
  setup(props) {
    const store = useStore()

    // TODO: Look at all files
    const preview = computed(() =>
      store.dispatch('attachment/getAttachment', props.transaction.message.files[0].preview_id)
    )
    const fullFile = computed(() =>
      store.dispatch('attachment/getAttachment', props.transaction.message.files[0].file_id)
    )

    console.log(preview.value)
    console.log(fullFile.value)

    return {}
  }
})
</script>
