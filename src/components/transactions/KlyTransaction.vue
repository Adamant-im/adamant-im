<template>
  <transaction-template
    v-if="transaction"
    :id="transaction.hash"
    :amount="currency(transaction.amount, crypto)"
    :timestamp="transaction.timestamp"
    :fee="currency(transaction.fee, 'KLY')"
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
    :text-data="transaction.data || ''"
  />

  <transaction-template-loading v-else :explorer-link="explorerLink" :crypto="crypto" />
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import TransactionTemplate from './TransactionTemplate.vue'
import TransactionTemplateLoading from './TransactionTemplateLoading.vue'
import { getExplorerTxUrl } from '@/config/utils'
import { Cryptos, CryptoSymbol, TransactionStatus } from '@/lib/constants'
import { useChatName } from '@/components/AChat/hooks/useChatName'
import { useFindAdmAddress } from '@/hooks/address/useFindAdmAddress'
import { usePartnerCryptoAddress } from '@/hooks/address/usePartnerCryptoAddress'
import { formatCryptoAddress } from '@/utils/address'
import currency from '@/filters/currencyAmountWithSymbol'
import { useFindAdmTransaction } from '@/hooks/address'
import { useKlyTransferQuery } from '@/hooks/queries/useKlyTransferQuery'

export default defineComponent({
  name: 'KlyTransaction',
  components: {
    TransactionTemplate,
    TransactionTemplateLoading
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

    const { isFetching, isError, isSuccess, data: transaction } = useKlyTransferQuery(props.id)
    const status = computed(() => {
      if (isFetching.value) return TransactionStatus.PENDING
      if (isError.value) return TransactionStatus.REJECTED
      if (isSuccess.value) return TransactionStatus.CONFIRMED

      return TransactionStatus.PENDING
    })

    const cryptoKey = computed(() => props.crypto.toLowerCase())
    const cryptoAddress = computed(() => store.state.kly.address)

    const sender = computed(() => transaction.value?.senderId || '')
    const recipient = computed(() => transaction.value?.recipientId || '')

    const senderAdmAddress = useFindAdmAddress(
      cryptoKey,
      transaction.value?.senderId || '',
      props.id
    )
    const recipientAdmAddress = useFindAdmAddress(
      cryptoKey,
      transaction.value?.recipientId || '',
      props.id
    )
    const senderName = useChatName(senderAdmAddress)
    const recipientName = useChatName(recipientAdmAddress)

    const senderFormatted = computed(() => {
      if (!transaction.value) return ''

      return formatCryptoAddress(
        transaction.value.senderId,
        cryptoAddress.value,
        t,
        senderAdmAddress.value,
        senderName.value
      )
    })
    const recipientFormatted = computed(() => {
      if (!transaction.value) return ''

      return formatCryptoAddress(
        transaction.value.recipientId,
        cryptoAddress.value,
        t,
        recipientAdmAddress.value,
        recipientName.value
      )
    })

    const partnerCryptoAddress = usePartnerCryptoAddress(
      cryptoAddress,
      transaction.value?.senderId || '',
      transaction.value?.recipientId || ''
    )
    const partnerAdmAddress = useFindAdmAddress(cryptoKey, partnerCryptoAddress, props.id)

    const explorerLink = computed(() => getExplorerTxUrl(Cryptos.KLY, props.id))
    const confirmations = computed(() => {
      if (!transaction.value) return 0

      const { height } = transaction.value
      const currentHeight = store.getters[`${cryptoKey.value}/height`]

      if (height === undefined || currentHeight === 0) {
        return 0
      }

      return currentHeight - height + 1
    })

    const admTx = useFindAdmTransaction(props.id)

    return {
      transaction,
      sender,
      recipient,
      senderFormatted,
      recipientFormatted,
      partnerAdmAddress,
      explorerLink,
      confirmations,
      admTx,
      status,
      currency
    }
  }
})
</script>
