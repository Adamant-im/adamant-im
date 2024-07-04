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
    :partner="partnerId"
    :status="{ status, virtualStatus: status }"
    :adm-tx="admTx"
    :crypto="crypto"
  />
</template>

<script lang="ts">
import { useFormatADMAddress } from '@/hooks/address/useFormatADMAddress'
import { useAdmTransferQuery } from '@/hooks/queries/useAdmTransferQuery'
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import TransactionTemplate from './TransactionTemplate.vue'
import { getExplorerTxUrl } from '@/config/utils'
import { Cryptos, TransactionStatus } from '@/lib/constants'

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
    const { isFetching, isError, isSuccess, data: transaction } = useAdmTransferQuery(props.id)

    const status = computed(() => {
      if (isFetching.value) return TransactionStatus.PENDING
      if (isError.value) return TransactionStatus.REJECTED
      if (isSuccess.value) return TransactionStatus.CONFIRMED

      return TransactionStatus.PENDING
    })

    const sender = computed(() => transaction.value?.senderId || '')
    const recipient = computed(() => transaction.value?.recipientId || '')
    const partnerId = computed(() => {
      if (!transaction.value) return ''

      return transaction.value.senderId === store.state.address
        ? transaction.value.recipientId
        : transaction.value.senderId
    })

    const senderFormatted = computed(() => {
      const senderId = transaction.value?.senderId
      return senderId ? useFormatADMAddress(senderId).value : ''
    })
    const recipientFormatted = computed(() => {
      const recipientId = transaction.value?.recipientId
      return recipientId ? useFormatADMAddress(recipientId).value : ''
    })

    const explorerLink = computed(() => getExplorerTxUrl(Cryptos.ADM, props.id))

    return {
      transaction,
      sender,
      recipient,
      partnerId,
      senderFormatted,
      recipientFormatted,
      admTx: transaction,
      explorerLink,
      currency,
      status
    }
  }
})
</script>
