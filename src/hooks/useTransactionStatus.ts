import {
  Cryptos,
  TransactionAdditionalStatus as TAS,
  TransactionStatus as TS,
  TransactionStatusType
} from '@/lib/constants'
import { verifyTransactionDetails } from '@/lib/txVerify'
import { computed, ComputedRef, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

export function useTransactionStatus(admTxRef: ComputedRef<any>, coinTxRef: ComputedRef<any>) {
  const { t } = useI18n()
  const store = useStore()

  onMounted(() => {
    if (!admTxRef.value) return

    const { status, type, timestamp } = admTxRef.value
    const hash = admTxRef.value.hash || admTxRef.value.id

    if (status === TS.REGISTERED && (type === Cryptos.ADM || type === 0 || type === 8)) {
      const transfer = store.state.adm.transactions[hash]

      if (
        !transfer.height &&
        (transfer.confirmations === undefined || transfer.confirmations <= 0)
      ) {
        store.dispatch(`adm/getTransaction`, { hash, timestamp })
      }
    }
  })

  const computedStatus = computed(() => {
    const status: {
      status: TransactionStatusType
      virtualStatus: TransactionStatusType
      inconsistentReason: string
      addStatus: (typeof TAS)[keyof typeof TAS]
      addDescription: string
    } = {
      status: TS.PENDING,
      virtualStatus: TS.PENDING,
      inconsistentReason: '',
      addStatus: TAS.NONE,
      addDescription: ''
    }

    // if no hash, it is an empty object
    const admSpecialMessage =
      admTxRef.value && (admTxRef.value.hash || admTxRef.value.id) ? admTxRef.value : undefined

    if (!admSpecialMessage && (!coinTxRef || !coinTxRef.value)) return status
    status.status = admSpecialMessage ? admSpecialMessage.status : coinTxRef.value.status
    status.virtualStatus = status.status

    // we don't need all this in case of not in-chat coin transfer
    if (admSpecialMessage) {
      const { type, senderId, recipientId } = admSpecialMessage
      const hash = admSpecialMessage.hash || admSpecialMessage.id

      // ADM is a special case when using sockets
      if (type === Cryptos.ADM || type === 0 || type === 8 || type === 'message') {
        if (admSpecialMessage.status === TS.REGISTERED) {
          // If it's a message, getChats() in adamant-api.js will update height and confirmations later,
          // But now we must show Tx as confirmed
          if (type === 'message') {
            status.virtualStatus = TS.CONFIRMED
            status.addStatus = TAS.ADM_REGISTERED
            status.addDescription = t('transaction.statuses_add.adm_registered')
          } else {
            // All transactions we get via socket are shown in chats, including ADM direct transfers
            // Currently, we don't update confirmations for direct transfers, see getChats() in adamant-api.js
            // So we'll update confirmations here
            const transfer = store.state.adm.transactions[hash]
            if (transfer && (transfer.height || transfer.confirmations > 0)) {
              status.status = TS.CONFIRMED
              status.virtualStatus = status.status
            } else {
              // @todo remove
              // this.fetchTransaction('ADM', hash, admSpecialMessage.timestamp)
            }
          }
        }
        return status
        // @ts-expect-error-next-line
      } else if (!Cryptos[type]) {
        // if crypto is not supported
        status.status = TS.UNKNOWN
        status.virtualStatus = status.status
        return status
      }

      const getterName = type.toLowerCase() + '/transaction'
      const getter = store.getters[getterName]
      if (!getter) return status

      const coinTx = getter(hash)
      status.status = (coinTx && coinTx.status) || TS.PENDING
      status.virtualStatus = status.status

      const recipientCryptoAddress = store.getters['partners/cryptoAddress'](recipientId, type)
      const senderCryptoAddress = store.getters['partners/cryptoAddress'](senderId, type)

      // do not update status until cryptoAddresses and transaction are received
      if (!recipientCryptoAddress || !senderCryptoAddress || !coinTx) {
        status.status = TS.PENDING
        status.virtualStatus = status.status
        return status
      }

      // check if Tx is not a fake
      // we are unable to check status.status === TS.REGISTERED txs, as their timestamps are Date.now()
      if (status.status === TS.CONFIRMED) {
        const txVerify = verifyTransactionDetails(coinTx, admSpecialMessage, {
          recipientCryptoAddress,
          senderCryptoAddress
        })
        if (!txVerify.isTxConsistent) {
          status.status = TS.INVALID
          status.virtualStatus = status.status
          // @ts-expect-error-next-line
          status.inconsistentReason = txVerify.txInconsistentReason
          return status
        }
      }
    }

    if (status.status === TS.REGISTERED) {
      // Dash InstantSend transactions must be shown as confirmed
      // don't need to verify timestamp, as such txs are fresh
      if (coinTxRef.value.instantsend) {
        status.virtualStatus = TS.CONFIRMED
        status.addStatus = TAS.INSTANT_SEND
        status.addDescription = t('transaction.statuses_add.instant_send')
      }
    }

    return status
  })

  return computedStatus
}
