<template>
  <chat-entry-template
    :confirm="confirm"
    :direction="message.direction"
    :timestamp="message.timestamp"
    :brief="brief"
  >
    <p>{{ $t("chats." + (message.direction === "from" ? "sent_label" : "received_label")) }}</p>
    <p class='transaction-amount' v-on:click="goToTransaction()">
      <span v-text="message.message.amount"></span> {{ crypto }}
    </p>
    <p><em v-text="message.message.comments"></em></p>

    <template slot="brief-view">
      <span>{{ $t("chats." + (message.direction === "from" ? "sent_label" : "received_label")) }}</span>&nbsp;
      <span v-text="message.message.amount"></span> {{ crypto }}
    </template>
  </chat-entry-template>
</template>

<script>
import ChatEntryTemplate from './ChatEntryTemplate.vue'
import { Cryptos } from '../../lib/constants'
import adm from '../../lib/adamant'

export default {
  name: 'eth-transfer',
  components: { ChatEntryTemplate },
  props: ['message', 'brief'],
  methods: {
    goToTransaction () {
      this.$store.commit('leave_chat')
      const params = { crypto: this.crypto, tx_id: this.hash }
      this.$router.push({ name: 'Transaction', params })
    }
  },
  mounted () {
    const timestamp = adm.toTimestamp(this.message.timestamp)
    const prefix = this.crypto.toLowerCase()
    this.$store.dispatch(prefix + '/getTransaction', { hash: this.hash, timestamp, amount: this.amount })
  },
  computed: {
    hash () {
      return this.message.message && this.message.message.hash
    },
    amount () {
      return this.message.message && this.message.message.amount
    },
    confirm () {
      const getter = this.crypto.toLowerCase() + '/transaction'
      const tx = this.$store.getters[getter](this.hash)
      const status = tx && tx.status

      if (status === 'SUCCESS') {
        return 'confirmed'
      } else if (status === 'ERROR') {
        return 'error'
      } else {
        return 'unconfirmed'
      }
    },
    crypto () {
      const type = this.message.message && this.message.message.type
      if (!type) return Cryptos.ETH

      const crypto = type.substr(0, type.indexOf('_')).toUpperCase()
      return crypto
    }
  }
}
</script>
