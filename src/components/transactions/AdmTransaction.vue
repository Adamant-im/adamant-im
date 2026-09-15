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
    :additional-status="additionalStatus"
    :inconsistent-status="inconsistentStatus"
    :crypto="crypto"
    @refetch-status="refetch"
  />
</template>

<script lang="ts">
import { computed, defineComponent, PropType, toRef, watch } from 'vue'
import { useStore } from 'vuex'
import { useTransactionAdditionalStatus } from './hooks/useTransactionAdditionalStatus'
import { useTransactionStatus } from './hooks/useTransactionStatus'
import { useFindAdmTransaction } from './hooks/useFindAdmTransaction'
import { useSyncChatTransferPendingStatus } from './hooks/useSyncChatTransferPendingStatus'
import { useInconsistentStatus } from './hooks/useInconsistentStatus'
import { useFormatADMAddress } from '@/hooks/address/useFormatADMAddress'
import { useBlockHeight } from '@/hooks/queries/useBlockHeight'
import { useAdmTransactionQuery } from '@/hooks/queries/transaction'
import TransactionTemplate from './TransactionTemplate.vue'
import { getExplorerTxUrl } from '@/config/utils'
import { Cryptos, CryptoSymbol, TransactionStatusType } from '@/lib/constants'
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
      isLoadingError,
      isRefetchError,
      error,
      data: transaction,
      refetch
    } = useAdmTransactionQuery(toRef(props, 'id'), {
      refetchOnMount: true
    })
    const admTx = useFindAdmTransaction(toRef(props, 'id'))
    const inconsistentStatus = useInconsistentStatus(transaction, props.crypto, admTx)
    const statusValue = computed<TransactionStatusType | undefined>(
      () =>
        (transaction.value as { status?: TransactionStatusType } | undefined)?.status ||
        admTx.value?.status
    )
    const additionalStatus = useTransactionAdditionalStatus(transaction, props.crypto)
    const resolvedTransactionStatus = useTransactionStatus(
      isFetching,
      queryStatus,
      statusValue,
      inconsistentStatus,
      undefined,
      additionalStatus,
      isLoadingError,
      isRefetchError,
      error
    )
    const transactionStatus = computed(() =>
      queryStatus.value === 'pending' && admTx.value
        ? admTx.value.status
        : resolvedTransactionStatus.value
    )
    useSyncChatTransferPendingStatus(
      props.crypto,
      toRef(props, 'id'),
      admTx,
      isFetching,
      queryStatus
    )

    watch(
      [queryStatus, transactionStatus, transaction],
      ([resolvedQueryStatus, resolvedStatus, resolvedTransaction]) => {
        const localTransaction = admTx.value

        if (resolvedQueryStatus !== 'success' || !localTransaction || !resolvedTransaction?.id) {
          return
        }

        const partnerId = getPartnerAddress(
          localTransaction.senderId,
          localTransaction.recipientId,
          store.state.address
        )

        if (!partnerId) return

        store.commit('chat/updateCryptoTransferMessage', {
          partnerId,
          hash: localTransaction.hash || localTransaction.id,
          status: resolvedStatus,
          confirmations: resolvedTransaction.confirmations
        })
      },
      { immediate: true }
    )

    const partnerAdmAddress = computed(() => {
      return transaction.value
        ? getPartnerAddress(
            transaction.value.senderId,
            transaction.value.recipientId,
            store.state.address
          )
        : ''
    })

    const senderId = computed(() => transaction.value?.senderId || '')
    const recipientId = computed(() => transaction.value?.recipientId || '')

    const senderFormatted = useFormatADMAddress(senderId)
    const recipientFormatted = useFormatADMAddress(recipientId)

    const explorerLink = computed(() => getExplorerTxUrl(Cryptos.ADM, props.id))

    const blockHeight = useBlockHeight('ADM', {
      enabled: () => transactionStatus.value === 'CONFIRMED'
    })
    const confirmations = computed(() => {
      if (!transaction.value) return NaN
      const restConfirmations = transaction.value.confirmations || 0
      if (restConfirmations < 1 || !transaction.value.height || !blockHeight.value) {
        return restConfirmations
      }

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
      transactionStatus,
      inconsistentStatus,
      additionalStatus
    }
  }
})
</script>
