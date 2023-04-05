<template>
  <transaction-template
    :id="transaction.id || '' "
    :amount="currency(transaction.amount)"
    :timestamp="transaction.timestamp || NaN"
    :fee="currency(transaction.fee)"
    :confirmations="transaction.confirmations || NaN"
    :sender="sender || '' "
    :recipient="recipient || '' "
    :sender-formatted="senderFormatted || '' "
    :recipient-formatted="recipientFormatted|| '' "
    :explorer-link="explorerLink"
    :partner="transaction.partner || '' "
    :status="getTransactionStatus(admTx)"
    :adm-tx="admTx"
    :crypto="crypto"
  />
</template>

<script>
import TransactionTemplate from './TransactionTemplate.vue'
import getExplorerUrl from '../../lib/getExplorerUrl'
import { Cryptos } from '../../lib/constants'

import transaction from '@/mixins/transaction'
import partnerName from '@/mixins/partnerName'
import { isStringEqualCI } from '@/lib/textHelpers'
import currency from '@/filters/currencyAmountWithSymbol'

export default {
  name: 'AdmTransaction',
  components: {
    TransactionTemplate
  },
  mixins: [transaction, partnerName],
  props: {
    id: {
      required: true,
      type: String
    },
    crypto: {
      required: true,
      type: String
    }
  },
  computed: {
    transaction () {
      return this.$store.state.adm.transactions[this.id] || { }
    },
    sender () {
      return this.transaction.senderId || ''
    },
    recipient () {
      return this.transaction.recipientId || ''
    },
    senderFormatted () {
      return this.formatAddress(this.transaction.senderId) || ''
    },
    recipientFormatted () {
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
      if (isStringEqualCI(address, this.$store.state.address)) {
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
    },
    currency
  }
}
</script>
