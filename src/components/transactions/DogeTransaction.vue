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
import { Cryptos, CryptosInfo, CryptoSymbol } from '@/lib/constants'
import { useBtcAddressPretty } from './hooks/address'
import { useTransactionStatus } from './hooks/useTransactionStatus'
import { useInconsistentStatus } from './hooks/useInconsistentStatus'
import { useFindAdmTransaction } from './hooks/useFindAdmTransaction'
import { useDogeTransferQuery } from '@/hooks/queries/useDogeTransferQuery'
import { getPartnerAddress } from './utils/getPartnerAddress'

export default defineComponent({
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

    const cryptoAddress = computed(() => store.state.doge.address)

    const {
      status: fetchStatus,
      isFetching,
      data: transaction,
      refetch
    } = useDogeTransferQuery(props.id, cryptoAddress)
    const status = useTransactionStatus(isFetching, fetchStatus)
    const inconsistentStatus = useInconsistentStatus(transaction, props.crypto)

    const admTx = useFindAdmTransaction(props.id)
    const senderAdmAddress = computed(() => admTx.value?.senderId || '')
    const recipientAdmAddress = computed(() => admTx.value?.recipientId || '')
    const partnerAdmAddress = computed(() =>
      admTx.value
        ? getPartnerAddress(admTx.value?.senderId, admTx.value?.recipientId, cryptoAddress.value)
        : ''
    )

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

    const confirmations = computed(() => transaction.value.confirmations)

    const fee = computed(() => {
      const fee = transaction.value?.fee?.toFixed(CryptosInfo.DOGE.decimals)

      return fee ? `${fee} ${Cryptos.DOGE}` : ''
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
      admTx,
      status,
      inconsistentStatus
    }
  }
})
</script>
