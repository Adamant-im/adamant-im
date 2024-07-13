<template>
  <transaction
    :transaction="transaction"
    :fee="fee"
    :confirmations="confirmations || NaN"
    :sender-formatted="senderFormatted || ''"
    :recipient-formatted="recipientFormatted || ''"
    :explorer-link="explorerLink"
    :partner="partnerAdmAddress || ''"
    :status="{ status, virtualStatus: status }"
    :crypto="crypto"
    @refetch-status="refetch"
  />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import { useTransactionStatus } from '@/components/transactions/hooks/useTransactionStatus.ts'
import { useFormatADMAddress } from '@/hooks/address/useFormatADMAddress'
import { useAdmTransferQuery } from '@/hooks/queries/useAdmTransferQuery'
import Transaction from './Transaction.vue'
import { getExplorerTxUrl } from '@/config/utils'
import { Cryptos } from '@/lib/constants'
import { getPartnerAddress } from './utils/getPartnerAddress'

import currency from '@/filters/currencyAmountWithSymbol'

export default defineComponent({
  components: {
    Transaction
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
    const {
      status: fetchStatus,
      isFetching,
      data: transaction,
      refetch
    } = useAdmTransferQuery(props.id)
    const status = useTransactionStatus(isFetching, fetchStatus)

    const partnerAdmAddress = computed(() => {
      return transaction.value
        ? getPartnerAddress(
            transaction.value.senderId,
            transaction.value.recipientId,
            store.state.address
          )
        : ''
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

    const confirmations = computed(() => transaction.value?.confirmations || NaN)

    const fee = computed(() => {
      const fee = transaction.value?.fee
      return fee ? currency(fee) : ''
    })

    return {
      refetch,
      transaction,
      fee,
      senderFormatted,
      recipientFormatted,
      partnerAdmAddress,
      explorerLink,
      confirmations,
      status
    }
  }
})
</script>
