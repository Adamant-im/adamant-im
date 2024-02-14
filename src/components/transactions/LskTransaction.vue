<template>
  <transaction-template
    :id="transaction.hash || ''"
    :amount="currency(transaction.amount, crypto)"
    :timestamp="transaction.timestamp || NaN"
    :fee="currency(transaction.fee, 'LSK')"
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
    :text-data="transaction.data || ''"
  />
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import TransactionTemplate from './TransactionTemplate.vue'
import { getExplorerTxUrl } from '@/config/utils'
import { Cryptos } from '../../lib/constants'
import { useChatName } from '@/components/AChat/hooks/useChatName'
import { useFindAdmAddress } from '@/hooks/address/useFindAdmAddress'
import { usePartnerCryptoAddress } from '@/hooks/address/usePartnerCryptoAddress'
import { useTransactionStatus } from '@/hooks/useTransactionStatus'
import { formatBTCAddress } from '@/utils/address'
import currency from '@/filters/currencyAmountWithSymbol'

export default defineComponent({
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

    const cryptoKey = computed(() => props.crypto.toLowerCase())
    const cryptoAddress = computed(() => store.state.lsk.address)
    const transaction = computed(
      () => store.getters[`${cryptoKey.value}/transaction`](props.id) || {}
    )

    const sender = computed(() => transaction.value.senderId || '')
    const recipient = computed(() => transaction.value.recipientId || '')

    const senderAdmAddress = useFindAdmAddress(cryptoKey, transaction.value.senderId, props.id)
    const recipientAdmAddress = useFindAdmAddress(
      cryptoKey,
      transaction.value.recipientId,
      props.id
    )
    const senderName = useChatName(senderAdmAddress)
    const recipientName = useChatName(recipientAdmAddress)

    const senderFormatted = computed(() => {
      return formatBTCAddress(
        transaction.value.senderId,
        cryptoAddress.value,
        t,
        senderAdmAddress.value,
        senderName.value
      )
    })
    const recipientFormatted = computed(() => {
      return formatBTCAddress(
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
    const partnerAdmAddress = useFindAdmAddress(cryptoKey, partnerCryptoAddress, props.id)

    const explorerLink = computed(() => getExplorerTxUrl(Cryptos.LSK, props.id))
    const confirmations = computed(() => {
      const { height } = transaction.value
      const currentHeight = store.getters[`${cryptoKey.value}/height`]

      if (height === undefined || currentHeight === 0) {
        return 0
      }

      return currentHeight - height + 1
    })

    const admTx = computed(() => {
      const admTx = {}
      // Bad news, everyone: we'll have to scan the messages
      Object.values(store.state.chat.chats).some((chat) => {
        Object.values(chat.messages).some((msg) => {
          if (msg.hash && msg.hash === props.id) {
            Object.assign(admTx, msg)
          }
          return !!admTx.id
        })
        return !!admTx.id
      })
      return admTx
    })

    const status = useTransactionStatus(admTx, transaction)

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
