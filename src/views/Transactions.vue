<template>
  <v-layout row wrap justify-center>

    <app-toolbar
      :title="$t('transaction.transactions')"
      flat
    />

    <v-flex xs12 sm12 md8 lg5>

      <v-list two-line class="transparent">
        <transaction-list-item
          v-for="(transaction, i) in transactions"
          :key="i"
          :id="transaction.id"
          :user-id="userId"
          :sender-id="transaction.senderId"
          :partner-id="transaction.partner"
          :timestamp="transaction.timestamp"
          :amount="transaction.amount"
          @click:transaction="goToTransaction"
          @click:icon="goToChat"
        />
      </v-list>

    </v-flex>

  </v-layout>
</template>

<script>
import { Cryptos } from '@/lib/constants'
import AppToolbar from '@/components/AppToolbar'
import TransactionListItem from '@/components/TransactionListItem'

export default {
  mounted () {
    this.$store.dispatch('adm/getNewTransactions')
  },
  computed: {
    transactions () {
      return this.$store.getters['adm/sortedTransactions']
    },
    userId () {
      return this.$store.state.address
    }
  },
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
