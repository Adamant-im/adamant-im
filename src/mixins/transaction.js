import { Cryptos, TransactionStatus as TS, TransactionAdditionalStatus as TAS } from '@/lib/constants'
import { verifyTransactionDetails } from '@/lib/txVerify'

export default {
  methods: {
    /**
     * Fetch transaction status from ETH, ERC20, DOGE modules.
     * @param {{ id: string, type: string, hash: string }} admSpecialMessage
     * @param {string} partnerId Partner ADM address
     */
    fetchTransactionStatus (admSpecialMessage, partnerId) {
      if (!admSpecialMessage || !partnerId) return

      const { type, hash, senderId, recipientId } = admSpecialMessage

      // ADM transaction already has property `status`
      if (type === Cryptos.ADM) return

      if (type in Cryptos) {
        this.fetchCryptoAddresses(type, recipientId, senderId)
        this.fetchTransaction(type, hash, admSpecialMessage.timestamp)
      }
    },

    /**
     * Fetch transaction and save to state.
     * @param {string} type Transaction type
     * @param {string} hash Transaction hash
     * @param {number} timestamp ADAMANT special message timestamp
     */
    fetchTransaction (type, hash) {
      const cryptoModule = type.toLowerCase()
      return this.$store.dispatch(`${cryptoModule}/getTransaction`, { hash })
    },

    /**
     * Fetch recipientId & senderId crypto addresses.
     * @param type Crypto name
     * @param recipientId
     * @param senderId
     * @returns {Promise}
     */
    fetchCryptoAddresses (type, recipientId, senderId) {
      const recipientCryptoAddress = this.$store.dispatch('partners/fetchAddress', {
        crypto: type,
        partner: recipientId
      })
      const senderCryptoAddress = this.$store.dispatch('partners/fetchAddress', {
        crypto: type,
        partner: senderId
      })

      return Promise.all([recipientCryptoAddress, senderCryptoAddress])
    },

    /**
     * Get Tx status with additional info to show in Chat, ChatPreview and TransactionTemplate
     * @param {{ id: string, type: string, hash: string }} admSpecialMessage
     * @returns {object}
     */
    getTransactionStatus (admSpecialMessage) {
      const status = {
        status: TS.PENDING,
        virtualStatus: TS.PENDING,
        inconsistentReason: '',
        addStatus: TAS.NONE,
        addDescription: ''
      }

      if (!admSpecialMessage) return status
      status.status = admSpecialMessage.status
      status.virtualStatus = admSpecialMessage.status
      const { hash, type, senderId, recipientId } = admSpecialMessage

      // ADM is a special case when using sockets
      if (type === Cryptos.ADM || type === 0 || type === 'message') {
        if (admSpecialMessage.status === TS.REGISTERED) {
          // If it's a message, getChats() in adamant-api.js will update height and confirmations later,
          // But now we must show Tx as confirmed
          if (type === 'message') {
            status.virtualStatus = TS.CONFIRMED
            status.addStatus = TAS.ADM_REGISTERED
            status.addDescription = this.$t('transaction.statuses_add.adm_registered')
          } else {
            // All transactions we get via socket are shown in chats, including ADM direct transfers
            // Currently, we don't update confirmations for direct transfers, see getChats() in adamant-api.js
            // So we'll update confirmations here
            const transfer = this.$store.state.adm.transactions[hash]
            if (transfer && (transfer.height || transfer.confirmations > 0)) {
              status.status = TS.CONFIRMED
              status.virtualStatus = TS.CONFIRMED
            } else {
              this.fetchTransaction(type, hash)
            }
          }
        }
        return status
      } else if (!Cryptos[type]) {
        // if crypto is not supported
        status.status = TS.UNKNOWN
        status.virtualStatus = TS.UNKNOWN
        return status
      }

      const getterName = type.toLowerCase() + '/transaction'
      const getter = this.$store.getters[getterName]
      if (!getter) return status

      const transaction = getter(hash)
      status.status = (transaction && transaction.status) || TS.PENDING
      status.virtualStatus = status.status

      const recipientCryptoAddress = this.$store.getters['partners/cryptoAddress'](recipientId, type)
      const senderCryptoAddress = this.$store.getters['partners/cryptoAddress'](senderId, type)

      // do not update status until cryptoAddresses and transaction are received
      if (!recipientCryptoAddress || !senderCryptoAddress || !transaction) {
        status.status = TS.PENDING
        status.virtualStatus = TS.PENDING
        return status
      }

      // check if Tx is not a fake
      if (status.status === TS.CONFIRMED || status.status === TS.REGISTERED) {
        const txVerify = verifyTransactionDetails(transaction, admSpecialMessage, { recipientCryptoAddress, senderCryptoAddress })
        if (!txVerify.isTxConsistent) {
          status.status = TS.INVALID
          status.virtualStatus = TS.INVALID
          status.inconsistentReason = txVerify.txInconsistentReason
          return status
        }
      }

      if (status.status === TS.REGISTERED) {
        // Dash InstantSend transactions must be shown as confirmed
        if (transaction.instantsend) {
          status.virtualStatus = TS.CONFIRMED
          status.addStatus = TS.INSTANT_SEND
          status.addDescription = this.$t('transaction.statuses_add.instant_send')
        }
      }

      // console.log('status', status)
      return status
    }

  }
}
