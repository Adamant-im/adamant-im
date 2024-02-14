<template>
  <transaction-template
    :id="transaction.hash || ''"
    :amount="currency(transaction.amount, crypto)"
    :timestamp="transaction.timestamp || NaN"
    :fee="currency(transaction.fee, 'ETH')"
    :confirmations="confirmations || NaN"
    :sender="sender || ''"
    :recipient="recipient || ''"
    :sender-formatted="senderFormatted || ''"
    :recipient-formatted="recipientFormatted || ''"
    :explorer-link="explorerLink"
    :partner="partnerAdmAddress || ''"
    :status="status"
    :adm-tx="admTx"
    :crypto="crypto"
  />
</template>

<script>
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import TransactionTemplate from './TransactionTemplate.vue'
import { getExplorerTxUrl } from '@/config/utils'
import { Cryptos } from '../../lib/constants'
import { useTransactionStatus } from '@/hooks/useTransactionStatus'
import { useChatName } from '@/components/AChat/hooks/useChatName'
import { useFindAdmAddress } from '@/hooks/address/useFindAdmAddress'
import { usePartnerCryptoAddress } from '@/hooks/address/usePartnerCryptoAddress'
import { formatCryptoAddress } from '@/utils/address'
import currency from '@/filters/currencyAmountWithSymbol'
import { useFindAdmTransaction } from '@/hooks/address'

export default defineComponent({
  name: 'Erc20Transaction',
  components: {
    TransactionTemplate
  },
  props: {
    crypto: {
      required: true,
      type: String
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

    const transaction = computed(() => {
      const prefix = props.crypto.toLowerCase()
      return store.getters[prefix + '/transaction'](props.id) || {}
    })

    const sender = computed(() => transaction.value.senderId || '')
    const recipient = computed(() => transaction.value.recipientId || '')

    const senderAdmAddress = useFindAdmAddress(ethKey, transaction.value.senderId, props.id)
    const recipientAdmAddress = useFindAdmAddress(ethKey, transaction.value.recipientId, props.id)
    const senderName = useChatName(senderAdmAddress.value)
    const recipientName = useChatName(recipientAdmAddress.value)

    const senderFormatted = computed(() => {
      return formatCryptoAddress(
        transaction.value.senderId,
        cryptoAddress.value,
        t,
        senderAdmAddress.value,
        senderName.value
      )
    })
    const recipientFormatted = computed(() => {
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
      transaction.value.senderId,
      transaction.value.recipientId
    )
    const partnerAdmAddress = useFindAdmAddress(ethKey, partnerCryptoAddress, props.id)

    const explorerLink = computed(() => getExplorerTxUrl(Cryptos.ETH, props.id))
    const confirmations = computed(() => {
      if (!transaction.value.blockNumber || !store.state.eth.blockNumber) return 0
      return Math.max(0, store.state.eth.blockNumber - transaction.value.blockNumber)
    })
    const admTx = useFindAdmTransaction(props.id)

    const status = useTransactionStatus(admTx, transaction)

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
