<template>
  <div>
    <transaction-template
      :amount="amount"
      :timestamp="transaction.timestamp"
      :id="transaction.id"
      :fee="transaction.fee"
      :confirmations="transaction.confirmations"
      :sender="sender"
      :recipient="recipient"
      :explorerLink="explorerLink"
      :partner="partner"
      :status="status"
    />
  </div>
</template>

<script>
import TransactionTemplate from './TransactionTemplate.vue'
import getExplorerUrl from '../../lib/getExplorerUrl'
import { Cryptos } from '../../lib/constants'

export default {
  name: 'adm-transaction',
  props: ['id'],
  components: {
    TransactionTemplate
  },
  mounted () {
    if (!this.$store.state.transactions[this.id]) {
      this.getTransactionInfo(this.id)
    }
  },
  data () {
    return { }
  },
  computed: {
    transaction () {
      return this.$store.state.transactions[this.id] || { }
    },
    amount () {
      if (!this.transaction.amount) return ''
      return this.$formatAmount(this.transaction.amount) + ' ' + Cryptos.ADM
    },
    fee () {
      if (!this.transaction.fee) return ''
      return this.$formatAmount(this.transaction.fee) + ' ' + Cryptos.ADM
    },
    sender () {
      return this.formatAddress(this.transaction.senderId)
    },
    recipient () {
      return this.formatAddress(this.transaction.recipientId)
    },
    partner () {
      return this.transaction.senderId !== this.$store.state.address
        ? this.transaction.senderId : this.transaction.recipientId
    },
    explorerLink () {
      return getExplorerUrl(Cryptos.ADM, this.id)
    },
    status () {
      return ''
    }
  },
  methods: {
    formatAddress (address) {
      if (address === this.$store.state.address) {
        return this.$t('transaction.me')
      }

      let result = address

      const name = this.$store.getters['partners/displayName'](address)
      if (name) {
        result += ' (' + name + ')'
      }

      return result
    }
  }
}
</script>
