<template>
  <chat-entry-template
    :confirm="message.confirm_class"
    :direction="message.direction"
    :timestamp="message.timestamp"
    :brief="brief"
    :readOnly="readOnly"
    :message="message"
  >
    <p v-if="message.amount">
      {{ $t("chats." + (message.direction === "from" ? "sent_label" : "received_label")) }}
    </p>
    <p
      v-if="message.amount"
      @click="goToTransaction"
      class="transaction-amount"
    >
      <span v-text="$formatAmount(message.amount)"></span> ADM
    </p>

    <p
      v-html="renderMarkdown(message.message)"
      :class="{ transfer_comment: !!message.amount }"
    ></p>

    <template slot="brief-view">
      <span v-html="message.message"></span>
    </template>
  </chat-entry-template>
</template>

<script>
import ChatEntryTemplate from './ChatEntryTemplate.vue'
import { Cryptos } from '@/lib/constants'
import renderMarkdown from '@/lib/markdown'

export default {
  name: 'adm-message',
  components: { ChatEntryTemplate },
  props: ['message', 'brief', 'readOnly'],
  methods: {
    goToTransaction () {
      this.$store.commit('leave_chat')
      const params = { crypto: Cryptos.ADM, tx_id: this.message.id }
      this.$router.push({ name: 'Transaction', params })
    },
    renderMarkdown (text = '') {
      return renderMarkdown(text)
    }
  }
}
</script>

<style>
  .transfer_comment {
    font-style: italic;
  }
</style>
