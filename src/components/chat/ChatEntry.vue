<template>
  <component v-bind:is="entryComponent" :readOnly="readOnly" :message="message" :brief="!!brief"></component>
</template>

<script>
import AdmMessage from './AdmMessage.vue'
import EthTransfer from './EthTransfer.vue'

export default {
  name: 'chat-entry',
  props: ['message', 'brief', 'readOnly'],
  components: {
    AdmMessage,
    EthTransfer
  },
  computed: {
    entryComponent () {
      // TODO: as long as we support only ETH and ERC20-based tokens this condition is OK,
      // but will need to be adjusted in the future
      if (this.message.message && this.message.message.type) return 'eth-transfer'
      return 'adm-message'
    }
  }
}
</script>
