<template>
  <chat-entry-template
    :confirm="confirm"
    :direction="message.direction"
    :timestamp="message.timestamp"
  >
    <p>{{ $t("chats." + (message.direction === "from" ? "sent_label" : "received_label")) }}</p>
    <p class='transaction-amount' v-on:click="goToTransaction()">
      <span v-html="$formatAmount(message.amount)"></span> ETH
    </p>
  </chat-entry-template>
</template>

<script>
  import ChatEntryTemplate from './ChatEntryTemplate.vue'
  import { Cryptos } from '../../lib/constants'

  export default {
    name: 'eth-transfer',
    components: { ChatEntryTemplate },
    props: ['message'],
    methods: {
      goToTransaction () {
        this.$store.commit('leave_chat')
        const params = { crypto: Cryptos.ETH, tx_id: this.message.id }
        this.$router.push({ name: 'Transaction', params })
      }
    },
    computed: {
      amount () {
        return this.message.message && this.message.message.amount
      },
      confirm () {
        const hash = this.message.message && this.message.message.hash
        const tx = this.$store.state.eth.transactions[hash]
        const status = tx && tx.status

        if (status === 'SUCCESS') {
          return 'confirmed'
        } else if (status === 'ERROR') {
          return 'error'
        } else {
          return 'unconfirmed'
        }
      }
    }
  }
</script>
