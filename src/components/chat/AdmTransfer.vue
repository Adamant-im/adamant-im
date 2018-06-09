<template>
  <chat-entry-template
    :confirm="message.confirm_class"
    :direction="message.direction"
    :timestamp="message.timestamp"
  >
    <p>{{ $t("chats." + (message.direction === "from" ? "sent_label" : "received_label")) }}</p>
    <p class='transaction-amount' v-on:click="goToTransaction()">
      <span v-html="$formatAmount(message.amount)"></span> ADM
    </p>
  </chat-entry-template>
</template>

<script>
  import ChatEntryTemplate from './ChatEntryTemplate.vue'
  import { Cryptos } from '../../lib/constants'

  export default {
    name: 'adm-transfer',
    components: { ChatEntryTemplate },
    props: ['message'],
    methods: {
      goToTransaction () {
        this.$store.commit('leave_chat')
        const params = { crypto: Cryptos.ADM, tx_id: this.message.id }
        this.$router.push({ name: 'Transaction', params })
      }
    }
  }
</script>
