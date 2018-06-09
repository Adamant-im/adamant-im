<template>
  <component v-bind:is="entryComponent" :message="message"></component>
</template>

<script>
  import TextMessage from './TextMessage.vue'
  import AdmTransfer from './AdmTransfer.vue'
  import EthTransfer from './EthTransfer.vue'

  export default {
    name: 'chat-entry',
    props: ['message'],
    components: {
      TextMessage,
      AdmTransfer,
      EthTransfer
    },
    computed: {
      entryComponent () {
        if (this.message.type === 0) return 'adm-transfer'
        if (this.message.message && this.message.message.type === 'eth_transaction') return 'eth-transfer'
        return 'text-message'
      }
    }
  }
</script>
