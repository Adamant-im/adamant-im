<template>
  <TransactionTemplate
    :transaction="transaction"
    :fee="fee"
    :confirmations="confirmations || NaN"
    :sender-formatted="senderFormatted || ''"
    :recipient-formatted="recipientFormatted || ''"
    :explorer-link="explorerLink"
    :partner="partnerAdmAddress || ''"
    :query-status="queryStatus"
    :transaction-status="transactionStatus"
    :crypto="crypto"
    @refetch-status="refetch"
  />
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useStore } from 'vuex'
import { useTransactionStatus } from './hooks/useTransactionStatus'
import { useFormatADMAddress } from '@/hooks/address/useFormatADMAddress'
import { useBlockHeight } from '@/hooks/queries/useBlockHeight'
import { useAdmTransactionQuery } from '@/hooks/queries/transaction'
import TransactionTemplate from './TransactionTemplate.vue'
import { getExplorerTxUrl } from '@/config/utils'
import { Cryptos, CryptoSymbol } from '@/lib/constants'
import { getPartnerAddress } from './utils/getPartnerAddress'

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
      type: String as PropType<CryptoSymbol>
    }
  },
  setup(props) {
    const store = useStore()
    const {
      status: queryStatus,
      isFetching,
      data: transaction,
      refetch
    } = useAdmTransactionQuery(props.id)
    const transactionStatus = useTransactionStatus(isFetching, queryStatus)

    const partnerAdmAddress = computed(() => {
      return transaction.value
        ? getPartnerAddress(
            transaction.value.senderId,
            transaction.value.recipientId,
            store.state.address
          )
        : ''
    })

    const senderId = computed(() => transaction.value?.senderId)
    const recipientId = computed(() => transaction.value?.recipientId)

    const senderFormatted = useFormatADMAddress(senderId)
    const recipientFormatted = useFormatADMAddress(recipientId)

    const explorerLink = computed(() => getExplorerTxUrl(Cryptos.ADM, props.id))

    const blockHeight = useBlockHeight('ADM', {
      enabled: () => transactionStatus.value === 'CONFIRMED'
    })
    const confirmations = computed(() => {
      if (!blockHeight.value || !transaction.value) return NaN

      return Math.max(
        blockHeight.value - transaction.value.height + 1,
        transaction.value.confirmations
      )
    })

    const fee = computed(() => transaction.value?.fee)

    return {
      refetch,
      transaction,
      fee,
      senderFormatted,
      recipientFormatted,
      partnerAdmAddress,
      explorerLink,
      confirmations,
      queryStatus,
      transactionStatus
    }
  }
})
</script>
