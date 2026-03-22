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
    :transaction-status="status"
    :additional-status="additionalStatus"
    :inconsistent-status="inconsistentStatus"
    :adm-tx="admTx"
    :crypto="crypto"
    :feeCrypto="AllCryptos.ETH"
    @refetch-status="refetch"
  />
</template>

<script lang="ts" setup>
import { computed, PropType } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import TransactionTemplate from './TransactionTemplate.vue'
import { getExplorerTxUrl } from '@/config/utils'
import { Cryptos, CryptoSymbol } from '@/lib/constants'
import { AllCryptos } from '@/lib/constants/cryptos'
import { useCryptoAddressPretty } from './hooks/address'
import { useBlockHeight } from '@/hooks/queries/useBlockHeight'
import { useTransactionAdditionalStatus } from './hooks/useTransactionAdditionalStatus'
import { useTransactionStatus } from './hooks/useTransactionStatus'
import { useInconsistentStatus } from './hooks/useInconsistentStatus'
import { useFindAdmAddress } from './hooks/useFindAdmAddress'
import { useFindAdmTransaction } from './hooks/useFindAdmTransaction'
import { useSyncChatTransferPendingStatus } from './hooks/useSyncChatTransferPendingStatus'
import { useErc20TransactionQuery } from '@/hooks/queries/transaction'
import { useClearPendingTransaction } from './hooks/useClearPendingTransaction'
import { getPartnerAddress } from './utils/getPartnerAddress'
import { isStringEqualCI } from '@/lib/textHelpers'

const props = defineProps({
  crypto: {
    required: true,
    type: String as PropType<CryptoSymbol>
  },
  id: {
    required: true,
    type: String
  }
})

const store = useStore()
const route = useRoute()

const cryptoAddress = computed(() => store.state.eth.address)
const myAdmAddress = computed(() => store.state.address)
const preferredPartnerId = computed(() =>
  typeof route.query.from === 'string' ? route.query.from.match(/\/chats\/([^/]+)/)?.[1] || '' : ''
)

const {
  status: queryStatus,
  isFetching,
  isLoadingError,
  isRefetchError,
  error,
  data: transaction,
  refetch
} = useErc20TransactionQuery(props.crypto)(props.id, {
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
  undefined,
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
    return getPartnerAddress(senderAdmAddress.value, recipientAdmAddress.value, myAdmAddress.value)
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

const senderFormatted = useCryptoAddressPretty(
  transaction,
  cryptoAddress,
  senderAdmAddress,
  'sender'
)
const recipientFormatted = useCryptoAddressPretty(
  transaction,
  cryptoAddress,
  recipientAdmAddress,
  'recipient'
)

const explorerLink = computed(() => getExplorerTxUrl(Cryptos.ETH, props.id))
const blockHeight = useBlockHeight('ETH', {
  enabled: () => transactionStatus.value === 'CONFIRMED'
})
const confirmations = computed(() => {
  if (!blockHeight.value || !transaction.value) return NaN

  if ('blockNumber' in transaction.value && transaction.value.blockNumber) {
    return blockHeight.value - transaction.value.blockNumber + 1
  }

  return transaction.value?.confirmations
})

const fee = computed(() => transaction.value?.fee)
</script>
