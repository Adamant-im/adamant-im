<template>
  <Transaction
    :transaction="transaction"
    :fee="fee"
    :confirmations="confirmations || NaN"
    :sender-formatted="senderFormatted || ''"
    :recipient-formatted="recipientFormatted || ''"
    :explorer-link="explorerLink"
    :partner="partnerAdmAddress || ''"
    :fetch-status="fetchStatus"
    :inconsistent-status="inconsistentStatus"
    :adm-tx="admTx"
    :crypto="crypto"
    @refetch-status="refetch"
  />
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useStore } from 'vuex'
import Transaction from './Transaction.vue'
import { getExplorerTxUrl } from '@/config/utils'
import { Cryptos, CryptoSymbol } from '@/lib/constants'
import { useCryptoAddressPretty } from './hooks/address'
import { useTransactionStatus } from './hooks/useTransactionStatus'
import { useInconsistentStatus } from './hooks/useInconsistentStatus'
import { useFindAdmTransaction } from './hooks/useFindAdmTransaction'
import { useErc20TransferQuery } from '@/hooks/queries/useErc20TransferQuery'
import { getPartnerAddress } from './utils/getPartnerAddress'

export default defineComponent({
  name: 'Erc20Transaction',
  components: {
    Transaction
  },
  props: {
    crypto: {
      required: true,
      type: String as PropType<CryptoSymbol>
    },
    id: {
      required: true,
      type: String
    }
  },
  setup(props) {
    const store = useStore()

    const cryptoAddress = computed(() => store.state.eth.address)

    const {
      status,
      isFetching,
      data: transaction,
      refetch
    } = useErc20TransferQuery(props.id, props.crypto)
    const fetchStatus = useTransactionStatus(isFetching, status)
    const inconsistentStatus = useInconsistentStatus(transaction, props.crypto)

    const admTx = useFindAdmTransaction(props.id)
    const senderAdmAddress = computed(() => admTx.value?.senderId || '')
    const recipientAdmAddress = computed(() => admTx.value?.recipientId || '')
    const partnerAdmAddress = computed(() =>
      admTx.value
        ? getPartnerAddress(admTx.value?.senderId, admTx.value?.recipientId, cryptoAddress.value)
        : ''
    )

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
    const confirmations = computed(() => {
      if (!transaction.value?.blockNumber || !store.state.eth.blockNumber) return 0

      return Math.max(0, store.state.eth.blockNumber - transaction.value.blockNumber)
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
      fetchStatus,
      inconsistentStatus
    }
  }
})
</script>
