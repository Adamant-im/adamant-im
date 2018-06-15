<template>
    <div class="transaction transaction_list">
      <md-list class="custom-list md-triple-line">
        <md-list-item v-for="(transaction) in transactions" :key="transaction.id" style="cursor:pointer">
          <md-avatar>
            <md-icon v-if="transaction.senderId !== currentAddress">flight_land</md-icon>
            <md-icon v-if="transaction.senderId === currentAddress">flight_takeoff</md-icon>
          </md-avatar>

          <div class="md-list-text-container" v-on:click="goToTransaction(transaction.id)">
            <span v-if="transaction.senderId !== currentAddress">{{ transaction.senderId.toString().toUpperCase() }}</span>
            <span v-else>{{ transaction.recipientId.toString().toUpperCase() }}</span>
            <span>{{ $formatAmount(transaction.amount) }} ADM</span>
            <p>{{ dateFormat(transaction.timestamp) }}</p>
          </div>

          <md-button class="md-icon-button md-list-action" v-on:click="openChat(transaction)">
            <md-icon>{{ hasMessages(transaction) ? "chat" : "chat_bubble_outline" }}</md-icon>
          </md-button>

          <md-divider class="md-inset"></md-divider>
        </md-list-item>
      </md-list>

    </div>
</template>

<script>
import { Cryptos } from '../lib/constants'

export default {
  name: 'transaction',
  data () {
    return {
    }
  },
  mounted: function () {
    this.getTransactions()
  },
  watch: {
    '$route': function (value) {
      this.getTransactionInfo(value.params.tx_id)
    }
  },
  methods: {
    dateFormat: function (timestamp) {
      return new Date(parseInt(timestamp) * 1000 + Date.UTC(2017, 8, 2, 17, 0, 0, 0)).toLocaleString()
    },
    getPartner (transaction) {
      return transaction.senderId !== this.$store.state.address ? transaction.senderId : transaction.recipientId
    },
    hasMessages (transaction) {
      const partner = this.getPartner(transaction)
      const chat = this.$store.state.chats[partner]
      return chat && chat.messages && Object.keys(chat.messages).length > 0
    },
    openChat (transaction) {
      const partner = this.getPartner(transaction)
      this.$store.commit('select_chat', partner)
      this.$router.push('/chats/' + partner + '/')
    },
    goToTransaction (id) {
      const params = { crypto: Cryptos.ADM, tx_id: id }
      this.$router.push({ name: 'Transaction', params })
    }
  },
  computed: {
    currentAddress: function () {
      return this.$store.state.address
    },
    transactions: function () {
      function compare (a, b) {
        if (a.timestamp < b.timestamp) {
          return 1
        }
        if (a.timestamp > b.timestamp) {
          return -1
        }
        return 0
      }
      if (this.$store.state.transactions) {
        return Object.values(this.$store.state.transactions).sort(compare)
      }
    }
  }
}
</script>
