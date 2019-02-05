<template>
  <div>
    <app-toolbar-centered
      app
      :title="$t('transaction.transactions')"
      flat
    />

    <v-container fluid class="pa-0">
      <v-layout row wrap justify-center>

        <v-flex v-if="isFulfilled" xs12 sm12 md8 lg5>

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
          </v-list>

          <h3 v-else class="headline text-xs-center mt-4">{{ $t('transaction.no_transactions') }}</h3>

        </v-flex>

      </v-layout>
    </v-container>
  </div>
</template>

<script>
import { Cryptos } from '@/lib/constants'
import AppToolbarCentered from '@/components/AppToolbarCentered'
import TransactionListItem from '@/components/TransactionListItem'

export default {
  mounted () {
    this.$store.dispatch(`${this.cryptoModule}/getNewTransactions`)
      .then(() => {
        this.isFulfilled = true
      })
  },
  computed: {
    transactions () {
      return this.$store.getters[`${this.cryptoModule}/sortedTransactions`]
    },
    hasTransactions () {
      return this.transactions && this.transactions.length > 0
    },
    crypto () {
      return this.$route.params.crypto in Cryptos
        ? this.$route.params.crypto
        : 'ADM'
    },
    cryptoModule () {
      return this.crypto.toLowerCase()
    }
  },
  data: () => ({
    isFulfilled: false
  }),
  methods: {
    goToTransaction (transactionId) {
      this.$router.push({
        name: 'Transaction',
        params: {
          crypto: this.crypto,
          tx_id: transactionId
        }
      })
    },
    goToChat (partnerId) {
      this.$router.push({
        name: 'Chat',
        params: {
          partner: partnerId
        }
      })
    }
  },
  components: {
    AppToolbarCentered,
    TransactionListItem
  }
}
</script>
