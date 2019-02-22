<template>
  <chat-entry-template
    :confirm="message.confirm_class"
    :direction="message.direction"
    :timestamp="message.timestamp"
    :amount="message.amount"
    :brief="brief"
    :readOnly="readOnly"
    :message="message"
    :show-confirm-icon="message.amount > 0 || message.direction === 'from'"
  >
    <p v-if="message.amount">
      {{ transferLabel }}
    </p>
    <p v-if="message.amount" class='transaction-amount' v-on:click="goToTransaction()">
      <span v-text="amountText"></span> ADM
    </p>
    <p v-html="message.message" v-bind:class="{ transfer_comment: !!message.amount }" ></p>

    <template slot="brief-view">
      <span v-if="message.amount">
        {{ transferLabel }} {{ amountText }} ADM
      </span>
      <span v-else v-html="message.message"></span>
    </template>
  </chat-entry-template>
</template>

<script>
import ChatEntryTemplate from './ChatEntryTemplate.vue'
import { Cryptos } from '../../lib/constants'

export default {
  name: 'adm-message',
  components: { ChatEntryTemplate },
  props: ['message', 'brief', 'readOnly'],
  methods: {
    goToTransaction () {
      this.$store.commit('leave_chat')
      const params = { crypto: Cryptos.ADM, tx_id: this.message.id }
      this.$router.push({ name: 'Transaction', params })
    }
  },
  computed: {
    transferLabel () {
      const label = this.message.direction === 'from' ? 'sent_label' : 'received_label'
      return this.$t(`chats.${label}`)
    },
    amountText () {
      return this.$formatAmount(this.message.amount)
    }
  }
}
</script>

<style>
  .transfer_comment {
    font-style: italic;
  }
</style>
