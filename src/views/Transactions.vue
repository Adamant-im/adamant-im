<template>
  <div id="txListElement">
    <app-toolbar-centered
      app
      :title="$t('transaction.transactions')"
      flat
    />

    <v-container fluid class="pa-0">
      <v-layout row wrap justify-center>

        <container v-if="isFulfilled">

          <v-list v-if="hasTransactions" two-line class="transparent">
            <transaction-list-item
              v-for="(transaction, i) in transactions"
              :key="i"
              :id="transaction.id"
              :sender-id="transaction.senderId"
              :recipient-id="transaction.recipientId"
              :timestamp="transaction.timestamp"
              :amount="transaction.amount"
              :crypto="crypto"
              @click:transaction="goToTransaction"
              @click:icon="goToChat"
            />
            <v-list-tile v-if="isLoading">
              <InlineSpinner />
            </v-list-tile>
          </v-list>

          <h3 v-else class="headline text-xs-center mt-4">
            {{ $t('transaction.no_transactions') }}
          </h3>

        </container>

        <InlineSpinner v-else-if="!isRejected" class="pt-4" />

      </v-layout>
    </v-container>
  </div>
</template>

<script>
import AppToolbarCentered from '@/components/AppToolbarCentered'
import InlineSpinner from '@/components/InlineSpinner'
import TransactionListItem from '@/components/TransactionListItem'

export default {
  beforeDestroy () {
    window.removeEventListener('scroll', this.onScroll)
  },
  mounted () {
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
    window.addEventListener('scroll', this.onScroll)
  },
  computed: {
    transactions () {
      return this.$store.getters[`${this.cryptoModule}/sortedTransactions`]
    },
    hasTransactions () {
      return this.transactions && this.transactions.length > 0
    },
    isLoading () {
      return this.$store.getters[`${this.cryptoModule}/areTransactionsLoading`]
    },
    cryptoModule () {
      return this.crypto.toLowerCase()
    }
  },
  data: () => ({
    isFulfilled: false,
    isRejected: false
  }),
  methods: {
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
      if (windowHeight + scrollPosition >= height) {
        this.$store.dispatch(`${this.cryptoModule}/getOldTransactions`)
      }
    }
  },
  props: {
    crypto: {
      default: 'ADM',
      type: String
    }
  },
  components: {
    AppToolbarCentered,
    InlineSpinner,
    TransactionListItem
  }
}
</script>
