<template>
  <TransactionTemplate
    :transaction="transaction"
    :fee="fee"
    :confirmations="confirmations"
    :sender-formatted="senderFormatted || ''"
    :recipient-formatted="recipientFormatted || ''"
    :explorer-link="explorerLink"
    :partner="partnerAdmAddress || ''"
    :query-status="queryStatus"
    :transaction-status="status"
    :additional-status="additionalStatus"
    :inconsistent-status="inconsistentStatus"
    :adm-tx="admTx"
    :crypto="crypto"
    @refetch-status="refetch"
  />
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import TransactionTemplate from './TransactionTemplate.vue'
import { getExplorerTxUrl } from '@/config/utils'
import { CryptoSymbol } from '@/lib/constants'
import { useBlockHeight } from '@/hooks/queries/useBlockHeight'
import { useBtcAddressPretty } from './hooks/address'
import { useTransactionAdditionalStatus } from './hooks/useTransactionAdditionalStatus'
import { useTransactionStatus } from './hooks/useTransactionStatus'
import { useInconsistentStatus } from './hooks/useInconsistentStatus'
import { useFindAdmAddress } from './hooks/useFindAdmAddress'
import { useFindAdmTransaction } from './hooks/useFindAdmTransaction'
import { useSyncChatTransferPendingStatus } from './hooks/useSyncChatTransferPendingStatus'
import {
  useBtcTransactionQuery,
  useDogeTransactionQuery,
  useDashTransactionQuery
} from '@/hooks/queries/transaction'
import { useClearPendingTransaction } from './hooks/useClearPendingTransaction'
import { getPartnerAddress } from './utils/getPartnerAddress'
import { isStringEqualCI } from '@/lib/textHelpers'

const query = {
  BTC: useBtcTransactionQuery,
  DASH: useDashTransactionQuery,
  DOGE: useDogeTransactionQuery
} as const

export default defineComponent({
  components: {
    TransactionTemplate
  },
  props: {
    crypto: {
      required: true,
      type: String as PropType<Extract<CryptoSymbol, 'BTC' | 'DOGE' | 'DASH'>>
    },
    id: {
      required: true,
      type: String
    }
  },
  setup(props) {
    const store = useStore()
    const route = useRoute()

    const cryptoKey = computed(() => props.crypto.toLowerCase())
    const cryptoAddress = computed(() => store.state[cryptoKey.value].address)
    const myAdmAddress = computed(() => store.state.address)
    const preferredPartnerId = computed(() =>
      typeof route.query.from === 'string'
        ? route.query.from.match(/\/chats\/([^/]+)/)?.[1] || ''
        : ''
    )

    const useTransactionQuery = query[props.crypto]
    const {
      status: queryStatus,
      isFetching,
      isLoadingError,
      isRefetchError,
      error,
      data: transaction,
      refetch
    } = useTransactionQuery(props.id, {
      refetchOnMount: true
    })
    const admTx = useFindAdmTransaction(props.id, preferredPartnerId)
    const inconsistentStatus = useInconsistentStatus(transaction, props.crypto, admTx)
    const additionalStatus = useTransactionAdditionalStatus(transaction, props.crypto)
    const transactionStatus = computed(() => transaction.value?.status)
    const status = useTransactionStatus(
      isFetching,
      queryStatus,
      transactionStatus,
      inconsistentStatus,
      additionalStatus,
      isLoadingError,
      isRefetchError,
      error
    )
    useClearPendingTransaction(props.crypto, transaction, status)

    const senderFallbackAdmAddress = useFindAdmAddress(
      computed(() => props.crypto),
      computed(() => transaction.value?.senderId || ''),
      computed(() => props.id)
    )
    const recipientFallbackAdmAddress = useFindAdmAddress(
      computed(() => props.crypto),
      computed(() => transaction.value?.recipientId || ''),
      computed(() => props.id)
    )
    useSyncChatTransferPendingStatus(props.crypto, props.id, admTx, isFetching, queryStatus)
    const senderAdmAddress = computed(() => {
      if (admTx.value?.senderId) {
        return admTx.value.senderId
      }

      if (isStringEqualCI(transaction.value?.senderId || '', cryptoAddress.value)) {
        return myAdmAddress.value
      }

      return senderFallbackAdmAddress.value || ''
    })
    const recipientAdmAddress = computed(() => {
      if (admTx.value?.recipientId) {
        return admTx.value.recipientId
      }

      if (isStringEqualCI(transaction.value?.recipientId || '', cryptoAddress.value)) {
        return myAdmAddress.value
      }

      return recipientFallbackAdmAddress.value || ''
    })
    const partnerAdmAddress = computed(() => {
      if (senderAdmAddress.value && recipientAdmAddress.value) {
        return getPartnerAddress(
          senderAdmAddress.value,
          recipientAdmAddress.value,
          myAdmAddress.value
        )
      }

      if (senderAdmAddress.value && !isStringEqualCI(senderAdmAddress.value, myAdmAddress.value)) {
        return senderAdmAddress.value
      }

      if (
        recipientAdmAddress.value &&
        !isStringEqualCI(recipientAdmAddress.value, myAdmAddress.value)
      ) {
        return recipientAdmAddress.value
      }

      return ''
    })

    const senderFormatted = useBtcAddressPretty(
      transaction,
      cryptoAddress,
      senderAdmAddress,
      'sender'
    )
    const recipientFormatted = useBtcAddressPretty(
      transaction,
      cryptoAddress,
      recipientAdmAddress,
      'recipient'
    )

    const explorerLink = computed(() => getExplorerTxUrl(props.crypto, props.id))

    const blockHeight = useBlockHeight(props.crypto, {
      enabled: () => transactionStatus.value === 'CONFIRMED'
    })
    const confirmations = computed(() => {
      if (!transaction.value || !blockHeight.value) return NaN

      if ('height' in transaction.value) {
        // BTC and DASH have `height`
        const height = transaction.value.height as number // workaround: TS doesn't infer the type correctly
        return blockHeight.value - height + 1
      } else {
        // DOGE doesn't have `height`
        return transaction.value.confirmations
      }
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
      admTx,
      queryStatus,
      status,
      additionalStatus,
      inconsistentStatus
    }
  }
})
</script>
