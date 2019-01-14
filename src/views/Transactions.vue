<template>
  <v-layout row wrap justify-center>

    <app-toolbar
      :title="$t('transaction.transactions')"
      flat
    />

    <v-flex v-if="isFulfilled" xs12 sm12 md8 lg5>

      <v-list v-if="hasTransactions" two-line class="transparent">
        <transaction-list-item
          v-for="(transaction, i) in transactions"
          :key="i"
          :id="transaction.id"
          :user-id="userId"
          :sender-id="transaction.senderId"
          :partner-id="transaction.partner"
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
</template>

<script>
import { Cryptos } from '@/lib/constants'
import AppToolbar from '@/components/AppToolbar'
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
    userId () {
      return this.$store.state.address
    },
    crypto () {
      return ['ADM', 'ETH', 'BNB'].includes(this.$route.params.crypto)
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
          crypto: Cryptos.ADM,
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
    AppToolbar,
    TransactionListItem
  }
}
</script>
