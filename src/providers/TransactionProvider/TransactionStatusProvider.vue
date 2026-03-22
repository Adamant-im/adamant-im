<template>
  <slot
    :status="status"
    :query-status="queryStatus"
    :inconsistentStatus="inconsistentStatus"
    :refetch="refetch"
  />
</template>

<script lang="ts">
import { computed, defineComponent, PropType, watch } from 'vue'
import { useStore } from 'vuex'
import { useTransactionStatusQuery } from '@/hooks/queries/transaction'
import {
  Cryptos,
  CryptoSymbol,
  TransactionAdditionalStatus,
  TransactionStatus,
  tsIcon
} from '@/lib/constants'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { useTransactionAdditionalStatus } from '@/components/transactions/hooks/useTransactionAdditionalStatus'
import { isStringEqualCI } from '@/lib/textHelpers'

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
    const store = useStore()
    const transactionId = computed(() =>
      props.transaction.type === 'ADM' ? props.transaction.id : props.transaction.hash
    )
    const crypto = computed(() => props.transaction.type as CryptoSymbol)
    const localAdditionalStatus = useTransactionAdditionalStatus(
      computed(() => props.transaction as any),
      crypto
    )
    const localResolvedStatus = computed(() =>
      localAdditionalStatus.value === TransactionAdditionalStatus.INSTANT_SEND
        ? TransactionStatus.CONFIRMED
        : props.transaction.status
    )
    const partnerId = computed(() =>
      isStringEqualCI(props.transaction.senderId, store.state.address)
        ? props.transaction.recipientId
        : props.transaction.senderId
    )

    const isSupportedCrypto = computed(() => {
      return props.transaction.type in Cryptos
    })
    const queryKnownStatus = computed(() => props.transaction.status)
    const queryEnabled = computed(() => {
      return (
        isSupportedCrypto.value &&
        !!transactionId.value &&
        props.transaction.status !== TransactionStatus.CONFIRMED
      )
    })

    const { transaction, queryStatus, status, inconsistentStatus, additionalStatus, refetch } =
      useTransactionStatusQuery(transactionId, crypto, {
        enabled: queryEnabled,
        knownStatus: queryKnownStatus
      })

    watch(
      transaction,
      (liveTransaction) => {
        const resolvedLiveTransaction = liveTransaction as any

        if (
          queryStatus.value !== 'success' ||
          !resolvedLiveTransaction ||
          !partnerId.value ||
          !props.transaction.hash
        ) {
          return
        }

        store.commit('chat/updateCryptoTransferMessage', {
          partnerId: partnerId.value,
          hash: props.transaction.hash,
          status: resolvedLiveTransaction.status,
          confirmations: resolvedLiveTransaction.confirmations,
          instantlock:
            'instantlock' in resolvedLiveTransaction
              ? resolvedLiveTransaction.instantlock
              : undefined,
          instantlock_internal:
            'instantlock_internal' in resolvedLiveTransaction
              ? resolvedLiveTransaction.instantlock_internal
              : undefined,
          instantsend:
            additionalStatus.value === TransactionAdditionalStatus.INSTANT_SEND ||
            ('instantsend' in resolvedLiveTransaction
              ? resolvedLiveTransaction.instantsend
              : undefined)
        })
      },
      { immediate: true }
    )

    const transactionStatus = computed(() => {
      if (props.transaction.type === 'UNKNOWN_CRYPTO') {
        return TransactionStatus.UNKNOWN
      }

      if (!queryEnabled.value || queryStatus.value === 'pending') {
        return localResolvedStatus.value
      }

      if (
        queryStatus.value === 'error' &&
        props.transaction.status !== TransactionStatus.REJECTED &&
        props.transaction.status !== TransactionStatus.UNKNOWN
      ) {
        return localResolvedStatus.value
      }

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
