<template>
  <div id="txListElement">
    <app-toolbar-centered
      app
      :title="$t('transaction.transactions')"
      flat
    />

    <v-container
      fluid
      class="pa-0"
    >
      <v-layout
        row
        wrap
        justify-center
      >
        <v-list-tile
          v-if="isRecentLoading"
          style="position: absolute; top: 20px;"
        >
          <InlineSpinner />
        </v-list-tile>

        <container v-if="isFulfilled">
          <v-list
            v-if="hasTransactions"
            three-line
            class="transparent"
          >
            <transaction-list-item
              v-for="(transaction, i) in transactions"
              :id="transaction.id"
              :key="i"
              :sender-id="sender(transaction)"
              :recipient-id="recipient(transaction)"
              :timestamp="transaction.timestamp || NaN"
              :amount="transaction.amount"
              :crypto="crypto"
              :text-data="transaction.data"
              @click:transaction="goToTransaction"
              @click:icon="goToChat"
            />
            <v-list-tile v-if="isOlderLoading">
              <InlineSpinner />
            </v-list-tile>
          </v-list>

          <h3
            v-else
            class="a-text-caption text-xs-center mt-4"
          >
            {{ $t('transaction.no_transactions') }}
          </h3>
        </container>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import AppToolbarCentered from '@/components/AppToolbarCentered'
import InlineSpinner from '@/components/InlineSpinner'
import TransactionListItem from '@/components/TransactionListItem'
import { isStringEqualCI } from '@/lib/textHelpers'

export default {
  components: {
    AppToolbarCentered,
    InlineSpinner,
    TransactionListItem
  },
  props: {
    crypto: {
      default: 'ADM',
      type: String
    }
  },
  data: () => ({
    isFulfilled: false,
    isRejected: false,
    isUpdating: false
  }),
  computed: {
    transactions () {
      const transactions = this.$store.getters[`${this.cryptoModule}/sortedTransactions`]
      const address = this.$store.state[this.crypto.toLowerCase()].address
      return transactions.filter(tx => {
        // Filter invalid "fake" transactions (from chat rich message)
        return Object.prototype.hasOwnProperty.call(tx, 'amount') && (
          isStringEqualCI(tx.recipientId, address) || isStringEqualCI(tx.senderId, address)
        )
      })
    },
    hasTransactions () {
      return this.transactions && this.transactions.length > 0
    },
    isOlderLoading () {
      return this.$store.getters[`${this.cryptoModule}/areOlderLoading`]
    },
    isRecentLoading () {
      return this.$store.getters[`${this.cryptoModule}/areRecentLoading`]
    },
    cryptoModule () {
      return this.crypto.toLowerCase()
    }
  },
  watch: {
    '$store.state.IDBReady' () {
      if (this.$store.state.IDBReady) this.getNewTransactions()
    }
  },
  beforeDestroy () {
    window.removeEventListener('scroll', this.onScroll)
  },
  mounted () {
    if (!this.$store.getters['options/isLoginViaPassword'] || this.$store.state.IDBReady) {
      this.getNewTransactions()
    }

    window.addEventListener('scroll', this.onScroll)
  },
  // mixins: [scrollPosition],
  methods: {
    sender (transaction) {
      const { senders, senderId } = transaction
      const onlySender = senderId && (!senders || senders.length === 1)
      if (onlySender) {
        return senderId
      } else if (senders) {
        return this.formatAddresses(senders)
      }
    },
    recipient (transaction) {
      const { recipientId, recipients } = transaction
      const onlyRecipient = recipientId && (!recipients || recipients.length === 1)
      if (onlyRecipient) {
        return recipientId
      } else if (recipients) {
        return this.formatAddresses(recipients)
      }
    },
    formatAddresses (addresses) {
      const count = addresses.length
      return addresses.includes(this.$store.state[this.crypto.toLowerCase()].address)
        ? `${this.$tc('transaction.me_and_addresses', count - 1)}`
        : this.$tc('transaction.addresses', count)
    },
    goToTransaction (transactionId) {
      this.$router.push({
        name: 'Transaction',
        params: {
          crypto: this.crypto,
          txId: transactionId
        }
      })
    },
    goToChat (partnerId) {
      this.$router.push({
        name: 'Chat',
        params: { partnerId }
      })
    },
    onScroll () {
      const height = document.getElementById('txListElement').offsetHeight
      const windowHeight = window.innerHeight
      const scrollPosition = window.scrollY || window.pageYOffset || document.body.scrollTop +
        (document.documentElement.scrollTop || 0)
      // If we've scrolled to the very bottom, fetch the older transactions from server
      if (!this.isOlderLoading && windowHeight + scrollPosition >= height) {
        this.$store.dispatch(`${this.cryptoModule}/getOldTransactions`)
      }
      // If we've scrolled to the very top, fetch the recent transactions from server
      if (!this.isRecentLoading && scrollPosition === 0) {
        this.getNewTransactions()
      }
    },
    getNewTransactions () {
      // If we came from Transactions details sreen, do not update transaction list
      const doNotUpdate = this.$route.meta.previousRoute.params.txId && !this.isFulfilled &&
        // If we don't just refresh Tx details screen
        this.$route.meta.previousPreviousRoute && this.$route.meta.previousPreviousRoute.name

      if (doNotUpdate) {
        this.isFulfilled = true
      } else {
        this.$store.dispatch(`${this.cryptoModule}/getNewTransactions`)
          .then(() => {
            this.isFulfilled = true
          })
          .catch(err => {
            this.isRejected = true
            this.$store.dispatch('snackbar/show', {
              message: err.message
            })
          })
      }
    }
  }
}
</script>
