<template>
  <transaction-template
    :id="transaction.id || ''"
    :amount="currency(transaction.amount)"
    :timestamp="transaction.timestamp || NaN"
    :fee="currency(transaction.fee)"
    :confirmations="transaction.confirmations || NaN"
    :sender="sender"
    :recipient="recipient"
    :sender-formatted="senderFormatted || ''"
    :recipient-formatted="recipientFormatted || ''"
    :explorer-link="explorerLink"
    :partner="transaction.partner || ''"
    :status="status"
    :adm-tx="admTx"
    :crypto="crypto"
  />
</template>

<script>
import { useFormatADMAddress } from '@/hooks/address/useFormatADMAddress'
import { useTransactionStatus } from '@/hooks/useTransactionStatus'
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import TransactionTemplate from './TransactionTemplate.vue'
import { getExplorerTxUrl } from '@/config/utils'
import { Cryptos } from '@/lib/constants'

import currency from '@/filters/currencyAmountWithSymbol'

export default defineComponent({
  components: {
    TransactionTemplate
  },
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
  setup(props) {
    const store = useStore()

    const transaction = computed(() => store.state.adm.transactions[props.id] || {})

    const sender = computed(() => transaction.value.senderId || '')
    const recipient = computed(() => transaction.value.recipientId || '')

    const senderFormatted = useFormatADMAddress(transaction.value.senderId)
    const recipientFormatted = useFormatADMAddress(transaction.value.recipientId)

    const admTx = computed(() => {
      return (
        store.getters['chat/messageById'](props.id) || store.state.adm.transactions[props.id] || {}
      )
    })
    const explorerLink = computed(() => getExplorerTxUrl(Cryptos.ADM, props.id))

    const { status } = useTransactionStatus(admTx, undefined)

    return {
      transaction,
      sender,
      recipient,
      senderFormatted,
      recipientFormatted,
      admTx,
      explorerLink,
      currency,
      status
    }
  }
})
</script>
