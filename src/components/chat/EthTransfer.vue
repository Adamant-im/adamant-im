<template>
  <chat-entry-template
    :confirm="confirm"
    :direction="message.direction"
    :timestamp="message.timestamp"
    :brief="brief"
  >
    <p>{{ $t("chats." + (message.direction === "from" ? "sent_label" : "received_label")) }}</p>
    <p class='transaction-amount' v-on:click="goToTransaction()">
      <span v-html="message.message.amount"></span> ETH
    </p>
    <p><em v-html="message.message.comments"></em></p>

    <template slot="brief-view">
      <span>{{ $t("chats." + (message.direction === "from" ? "sent_label" : "received_label")) }}</span>&nbsp;
      <span v-html="message.message.amount"></span> ETH
    </template>
  </chat-entry-template>
</template>

<script>
  import ChatEntryTemplate from './ChatEntryTemplate.vue'
  import { Cryptos } from '../../lib/constants'

  export default {
    name: 'eth-transfer',
    components: { ChatEntryTemplate },
    props: ['message', 'brief'],
    methods: {
      goToTransaction () {
        this.$store.commit('leave_chat')
        const params = { crypto: Cryptos.ETH, tx_id: this.hash }
        this.$router.push({ name: 'Transaction', params })
      }
    },
    mounted () {
      const timestamp = this.message.timestamp
      this.$store.dispatch('eth/getTransaction', { hash: this.hash, timestamp, amount: this.amount })
    },
    computed: {
      hash () {
        return this.message.message && this.message.message.hash
      },
      amount () {
        return this.message.message && this.message.message.amount
      },
      confirm () {
        const tx = this.$store.state.eth.transactions[this.hash]
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
