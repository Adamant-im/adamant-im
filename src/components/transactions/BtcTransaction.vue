<template>
  <div>
    <transaction-template
      :id="transaction.hash || ''"
      :amount="currency(transaction.amount, crypto)"
      :timestamp="transaction.timestamp || NaN"
      :fee="fee"
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
  </div>
</template>

<script>
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useChatName } from '@/components/AChat/hooks/useChatName'
import { useFindAdmAddress } from '@/hooks/address/useFindAdmAddress'
import { usePartnerCryptoAddress } from '@/hooks/address/usePartnerCryptoAddress'
import { useTransactionStatus } from '@/hooks/useTransactionStatus'
import { formatCryptoAddress, formatMultipleBTCAddresses } from '@/utils/address'
import TransactionTemplate from './TransactionTemplate.vue'
import { getExplorerTxUrl } from '@/config/utils'
import { CryptosInfo } from '@/lib/constants'
import { useFindAdmTransaction } from '@/hooks/address'

import currency from '@/filters/currencyAmountWithSymbol'

export default defineComponent({
  components: {
    TransactionTemplate
  },
  props: ['id', 'crypto'],
  setup(props) {
    const store = useStore()
    const { t } = useI18n()

    const cryptoKey = computed(() => props.crypto.toLowerCase())
    const transaction = computed(
      () => store.getters[`${cryptoKey.value}/transaction`](props.id) || {}
    )

    const cryptoAddress = computed(() => store.state[cryptoKey.value].address)
    const partnerCryptoAddress = usePartnerCryptoAddress(
      cryptoAddress,
      transaction.value.senderId,
      transaction.value.recipientId
    )

    const partnerAdmAddress = useFindAdmAddress(cryptoKey, partnerCryptoAddress, props.id)
    const senderAdmAddress = useFindAdmAddress(cryptoKey, transaction.value.senderId, props.id)
    const recipientAdmAddress = useFindAdmAddress(
      cryptoKey,
      transaction.value.recipientId,
      props.id
    )

    const senderName = useChatName(senderAdmAddress.value)
    const recipientName = useChatName(recipientAdmAddress.value)

    const fee = computed(() => {
      const fee = transaction.value.fee
      if (!fee) return ''

      return `${+fee.toFixed(CryptosInfo[props.crypto].decimals)} ${props.crypto.toUpperCase()}`
    })

    const sender = computed(() => {
      const { senders, senderId } = transaction.value
      const onlySender = senderId && (!senders || senders.length === 1)
      if (onlySender) {
        return senderId
      } else if (senders) {
        return senders.join(', ')
      } else {
        return undefined
      }
    })

    const recipient = computed(() => {
      const { recipientId, recipients } = transaction.value
      const onlyRecipient = recipientId && (!recipients || recipients.length === 1)
      if (onlyRecipient) {
        return recipientId
      } else if (recipients) {
        return recipients.join(', ')
      } else {
        return undefined
      }
    })

    const senderFormatted = computed(() => {
      const { senders, senderId } = transaction.value
      const onlySender = senderId && (!senders || senders.length === 1)
      if (onlySender) {
        return formatCryptoAddress(
          senderId,
          cryptoAddress.value,
          t,
          senderAdmAddress.value,
          senderName.value
        )
      } else if (senders) {
        return formatMultipleBTCAddresses(senders, cryptoAddress.value, t)
      } else {
        return undefined
      }
    })

    const recipientFormatted = computed(() => {
      const { recipientId, recipients } = transaction.value
      const onlyRecipient = recipientId && (!recipients || recipients.length === 1)
      if (onlyRecipient) {
        return formatCryptoAddress(
          recipientId,
          cryptoAddress.value,
          t,
          recipientAdmAddress.value,
          recipientName.value
        )
      } else if (recipients) {
        return formatMultipleBTCAddresses(recipients, cryptoAddress.value, t)
      } else {
        return undefined
      }
    })

    const explorerLink = computed(() => getExplorerTxUrl(props.crypto, props.id))
    const confirmations = computed(() => {
      const { height, confirmations } = transaction.value

      let result = confirmations
      if (height) {
        // Calculate confirmations count based on the tx block height and the last block height.
        // That's for BTC only as it does not return the confirmations for the transaction.
        const c = store.getters[`${cryptoKey.value}/height`] - height + 1
        if (c > 0 && (c > result || !result)) {
          result = c
        }
      }

      return result
    })

    const admTx = useFindAdmTransaction(props.id)

    const { status } = useTransactionStatus(admTx, transaction)

    return {
      transaction,
      fee,
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
