<template>
  <slot
    :status="status"
    :query-status="queryStatus"
    :inconsistentStatus="inconsistentStatus"
    :refetch="refetch"
  />
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useTransactionStatusQuery } from '@/hooks/queries/transaction'
import { Cryptos, CryptoSymbol, TransactionStatus, tsIcon } from '@/lib/constants'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'

export default defineComponent({
  props: {
    /**
     * Transaction ID
     */
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    }
  },
  setup(props) {
    const transactionId = computed(() =>
      props.transaction.type === 'ADM' ? props.transaction.id : props.transaction.hash
    )
    const crypto = computed(() => props.transaction.type)

    const isNotFinalized = computed(() => {
      const { status } = props.transaction
      return status === TransactionStatus.REGISTERED || status === TransactionStatus.PENDING
    })
    const isSupportedCrypto = computed(() => {
      return props.transaction.type in Cryptos
    })
    const queryEnabled = computed(() => {
      return isNotFinalized.value && isSupportedCrypto.value
    })

    const { queryStatus, status, inconsistentStatus, refetch } = useTransactionStatusQuery(
      transactionId,
      crypto.value as CryptoSymbol,
      { enabled: queryEnabled }
    )

    const transactionStatus = computed(() => {
      if (props.transaction.type === 'UNKNOWN_CRYPTO') {
        return TransactionStatus.UNKNOWN
      }

      if (props.transaction.type === 'ADM') {
        return props.transaction.status === TransactionStatus.CONFIRMED
          ? TransactionStatus.CONFIRMED
          : status.value
      }

      // other cryptos
      return status.value
    })

    const statusIcon = computed(() => tsIcon(transactionStatus.value))

    return {
      queryStatus,
      status: transactionStatus,
      inconsistentStatus,
      statusIcon,
      refetch
    }
  }
})
</script>
