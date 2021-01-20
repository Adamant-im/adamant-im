<template>
  <transaction-template
    :amount="transaction.amount | currency"
    :timestamp="transaction.timestamp || NaN"
    :id="transaction.id"
    :fee="transaction.fee | currency"
    :confirmations="transaction.confirmations || NaN"
    :sender="sender"
    :recipient="recipient"
    :explorerLink="explorerLink"
    :partner="transaction.partner"
    :status="status"
    :admTx="admTx"
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
      return this.formatAddress(this.transaction.senderId) || ''
    },
    recipient () {
      return this.formatAddress(this.transaction.recipientId) || ''
    },
    admTx () {
      return this.$store.getters['chat/messageById'](this.id) || this.$store.state.adm.transactions[this.id] || { }
    },
    explorerLink () {
      return getExplorerUrl(Cryptos.ADM, this.id) || ''
    },
    status () {
      return this.transaction.status || ''
    }
  },
  methods: {
    formatAddress (address) {
      let name = ''
      if (address === this.$store.state.address) {
        name = this.$t('transaction.me')
      } else {
        name = this.getPartnerName(address)
      }

      let result = ''
      if (name !== '' && name !== undefined) {
        result = name + ' (' + address + ')'
      } else {
        result = address
      }
      return result
    }
  }
}
</script>
