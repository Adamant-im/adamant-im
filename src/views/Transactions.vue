<template>
    <div class="transaction transaction_list">
      <spinner v-if="isLoading" />
      <md-list class="custom-list md-triple-line md-transparent">
        <md-list-item v-for="(transaction) in transactions" :key="transaction.id" style="cursor:pointer">
          <md-avatar>
            <md-icon>{{ transaction.direction === 'from' ? 'flight_takeoff' : 'flight_land' }}</md-icon>
          </md-avatar>

          <div class="md-list-text-container" v-on:click="goToTransaction(transaction.id)">
            <div>
              {{ displayName(transaction) }}
              <span class="partner_display_name">{{ formatPartnerAddress(transaction) }}</span>
            </div>
            <span>{{ $formatAmount(transaction.amount, crypto) }} {{crypto}}</span>
            <p>{{ $formatDate(transaction.timestamp) }}</p>
          </div>

          <md-button
            class="md-icon-button md-list-action"
            v-if="showChat"
            @click="openChat(transaction)"
          >
            <md-icon>{{ hasMessages(transaction) ? "chat" : "chat_bubble_outline" }}</md-icon>
          </md-button>

          <md-divider class="md-inset"></md-divider>
        </md-list-item>
      </md-list>

    </div>
</template>

<script>

import { Cryptos } from '../lib/constants'
import Spinner from '@/components/Spinner.vue'

export default {
  name: 'transactions',
  components: { Spinner },
  data () {
    return {
      bgTimer: null,
      prefix: this.crypto.toLowerCase(),
      showChat: this.crypto === Cryptos.ADM
    }
  },
  mounted () {
    this.update()
    clearInterval(this.bgTimer)
    this.bgTimer = setInterval(() => this.update(), 5000)
    window.addEventListener('scroll', this.onScroll)
  },
  beforeDestroy () {
    clearInterval(this.bgTimer)
    window.removeEventListener('scroll', this.onScroll)
  },
  methods: {
    hasMessages (transaction) {
      const chat = this.$store.state.chats[transaction.partner]
      return chat && chat.messages && Object.keys(chat.messages).length > 0
    },
    openChat (transaction) {
      const partner = transaction.partner
      this.$store.commit('select_chat', partner)
      this.$router.push('/chats/' + partner + '/')
    },
    goToTransaction (id) {
      const params = { crypto: this.crypto, tx_id: id }
      this.$router.push({ name: 'Transaction', params })
    },
    getPartner (tx) {
      return tx.partner || (tx.direction === 'to' ? tx.senderId : tx.recipientId)
    },
    displayName (tx) {
      const partner = this.getPartner(tx)
      return this.crypto === Cryptos.ADM
        ? this.$store.getters['partners/displayName'](partner) || ''
        : ''
    },
    formatPartnerAddress (tx) {
      const partner = this.getPartner(tx)
      return this.crypto === Cryptos.ADM
        ? '(' + partner + ')'
        : partner
    },
    update () {
      this.$store.dispatch(`${this.prefix}/getNewTransactions`)
    },
    onScroll () {
      const pageHeight = document.body.offsetHeight
      const windowHeight = window.innerHeight
      const scrollPosition = window.scrollY || window.pageYOffset || document.body.scrollTop + (document.documentElement.scrollTop || 0)

      // If we've scrolled to the very bottom, fetch the older transactions from server
      if (windowHeight + scrollPosition >= pageHeight) {
        this.$store.dispatch(`${this.prefix}/getOldTransactions`)
      }
    }
  },
  computed: {
    transactions: function () {
      return this.$store.getters[`${this.prefix}/sortedTransactions`]
    },
    isLoading () {
      return this.$store.getters[`${this.prefix}/areTransactionsLoading`]
    }
  },
  props: ['crypto']
}
</script>
<style>
  .md-list-item .md-list-item-container .md-list-action:nth-child(3) {
    margin: 0 -3px 0 16px !important;
  }
</style>

<style>
  .partner_display_name {
    color: rgba(0, 0, 0, .54);
    font-size: 14px;
  }
</style>
