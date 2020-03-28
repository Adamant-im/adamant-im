<template>
  <transaction-template
    :amount="transaction.amount | currency"
    :timestamp="transaction.timestamp"
    :id="transaction.id"
    :fee="transaction.fee | currency"
    :confirmations="transaction.confirmations"
    :sender="sender"
    :recipient="recipient"
    :explorerLink="explorerLink"
    :partner="transaction.partner"
    :status="status"
  />
</template>

<script>
import TransactionTemplate from './TransactionTemplate.vue'
import getExplorerUrl from '../../lib/getExplorerUrl'
import { Cryptos } from '../../lib/constants'
import partnerName from '@/mixins/partnerName'

export default {
  mixins: [partnerName],
  name: 'adm-transaction',
  props: {
    id: {
      required: true,
      type: String
    }
  },
  components: {
    TransactionTemplate
  },
  computed: {
    transaction () {
      return this.$store.state.adm.transactions[this.id] || { }
    },
    sender () {
      return this.formatAddress(this.transaction.senderId)
    },
    recipient () {
      return this.formatAddress(this.transaction.recipientId)
    },
    explorerLink () {
      return getExplorerUrl(Cryptos.ADM, this.id)
    },
    status () {
      return this.transaction.status
    }
  },
  methods: {
    formatAddress (address) {
      if (address === this.$store.state.address) {
        return this.$t('transaction.me')
      }
      let result = this.getPartnerName(address)
      if (result !== '' && result !== undefined) {
        result += ' (' + address + ')'
      } else {
        result = address
      }
      return result
    }
  }
}
</script>
