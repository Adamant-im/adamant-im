<template>
  <component v-bind:is="entryComponent" :readOnly="readOnly" :message="message" :brief="!!brief"></component>
</template>

<script>
import AdmMessage from './AdmMessage.vue'
import CryptoTransfer from './CryptoTransfer'

export default {
  name: 'chat-entry',
  props: ['message', 'brief', 'readOnly'],
  components: {
    AdmMessage,
    CryptoTransfer
  },
  computed: {
    entryComponent () {
      const type = this.message.message && this.message.message.type
      if (type && type.includes('_transaction')) return 'crypto-transfer'
      return 'adm-message'
    }
  }
}
</script>
