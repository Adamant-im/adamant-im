<template>
  <transaction-template
    v-if="transaction"
    :id="transaction.hash"
    :amount="currency(transaction.amount, crypto)"
    :timestamp="transaction.timestamp"
    :fee="currency(transaction.fee, 'ETH')"
    :confirmations="confirmations"
    :sender="sender"
    :recipient="recipient"
    :sender-formatted="senderFormatted"
    :recipient-formatted="recipientFormatted"
    :explorer-link="explorerLink"
    :partner="partnerAdmAddress"
    :status="{ status, virtualStatus: status }"
    :adm-tx="admTx"
    :crypto="crypto"
  />

  <TransactionTemplateLoading v-else :explorer-link="explorerLink" :crypto="crypto" />
</template>

<script lang="ts">
import type { PropType } from 'vue'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import TransactionTemplate from './TransactionTemplate.vue'
import { getExplorerTxUrl } from '@/config/utils'
import { Cryptos, CryptoSymbol, TransactionStatus } from '@/lib/constants'
import { useChatName } from '@/components/AChat/hooks/useChatName'
import { useFindAdmAddress } from '@/hooks/address/useFindAdmAddress'
import { usePartnerCryptoAddress } from '@/hooks/address/usePartnerCryptoAddress'
import { formatCryptoAddress } from '@/utils/address'
import currency from '@/filters/currencyAmountWithSymbol'
import { useFindAdmTransaction } from '@/hooks/address'
import TransactionTemplateLoading from './TransactionTemplateLoading.vue'
import { useErc20TransferQuery } from '@/hooks/queries/useErc20TransferQuery'

export default defineComponent({
  name: 'Erc20Transaction',
  components: {
    TransactionTemplateLoading,
    TransactionTemplate
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
    const { t } = useI18n()

    const ethKey = computed(() => 'eth')
    const cryptoAddress = computed(() => store.state.eth.address)

    const {
      isFetching,
      isError,
      isSuccess,
      data: transaction
    } = useErc20TransferQuery(props.id, props.crypto)
    const status = computed(() => {
      if (isFetching.value) return TransactionStatus.PENDING
      if (isError.value) return TransactionStatus.REJECTED
      if (isSuccess.value) return TransactionStatus.CONFIRMED

      return TransactionStatus.PENDING
    })

    const sender = computed(() => transaction.value?.senderId || '')
    const recipient = computed(() => transaction.value?.recipientId || '')

    const senderAdmAddress = useFindAdmAddress(ethKey, transaction.value?.senderId, props.id)
    const recipientAdmAddress = useFindAdmAddress(ethKey, transaction.value?.recipientId, props.id)
    const senderName = useChatName(senderAdmAddress.value)
    const recipientName = useChatName(recipientAdmAddress.value)

    const senderFormatted = computed(() => {
      return formatCryptoAddress(
        transaction.value?.senderId,
        cryptoAddress.value,
        t,
        senderAdmAddress.value,
        senderName.value
      )
    })
    const recipientFormatted = computed(() => {
      return formatCryptoAddress(
        transaction.value?.recipientId,
        cryptoAddress.value,
        t,
        recipientAdmAddress.value,
        recipientName.value
      )
    })

    const partnerCryptoAddress = usePartnerCryptoAddress(
      cryptoAddress,
      transaction.value?.senderId,
      transaction.value?.recipientId
    )
    const partnerAdmAddress = useFindAdmAddress(ethKey, partnerCryptoAddress, props.id)

    const explorerLink = computed(() => getExplorerTxUrl(Cryptos.ETH, props.id))
    const confirmations = computed(() => {
      if (!transaction.value?.blockNumber || !store.state.eth.blockNumber) return 0

      return Math.max(0, store.state.eth.blockNumber - transaction.value.blockNumber)
    })
    const admTx = useFindAdmTransaction(props.id)

    return {
      sender,
      recipient,
      senderFormatted,
      recipientFormatted,
      partnerAdmAddress,
      explorerLink,
      confirmations,
      transaction,
      admTx,
      status,
      currency
    }
  }
})
</script>
