<template>
  <component v-bind:is="entryComponent" :message="message" :brief="!!brief"></component>
</template>

<script>
  import AdmMessage from './AdmMessage.vue'
  import EthTransfer from './EthTransfer.vue'

  export default {
    name: 'chat-entry',
    props: ['message', 'brief'],
    components: {
      AdmMessage,
      EthTransfer
    },
    computed: {
      entryComponent () {
        if (this.message.message && this.message.message.type === 'eth_transaction') return 'eth-transfer'
        return 'adm-message'
      }
    }
  }
</script>
