<template>
  <v-layout row wrap justify-center>

    <v-flex md5>

      <v-list two-line subheader class="transparent">
        <v-subheader>{{ $t('transactions') }}</v-subheader>

        <transaction-list-item
          v-for="(transaction, i) in transactions"
          :key="i"
          :id="transaction.id"
          :direction="transaction.direction"
          :sender-id="transaction.senderId"
          :partner-id="transaction.partner"
          :timestamp="transaction.timestamp"
          @click:transaction="goToTransaction"
          @click:icon="goToChat"
        />
      </v-list>

    </v-flex>

  </v-layout>
</template>

<script>
import { Cryptos } from '@/lib/constants'
import TransactionListItem from '@/components/TransactionListItem'

export default {
  mounted () {
    this.$store.dispatch('adm/getNewTransactions')
  },
  computed: {
    transactions () {
      return this.$store.getters['adm/sortedTransactions']
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
    TransactionListItem
  }
}
</script>

<i18n>
{
  "en": {
    "transactions": "Transactions"
  },
  "ru": {
    "transactions": "Транзакции"
  }
}
</i18n>
