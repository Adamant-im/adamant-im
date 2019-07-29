import { Cryptos, TransactionStatus as TS } from '@/lib/constants'

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
    fetchTransaction (type, hash, timestamp) {
      const cryptoModule = type.toLowerCase()
      const NEW_TRANSACTION_DELTA = 900 // 15 min
      const isNew = (Date.now() - timestamp) / 1000 < NEW_TRANSACTION_DELTA

      return this.$store.dispatch(`${cryptoModule}/getTransaction`, {
        hash,
        isNew
      })
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

    verifyTransactionDetails (transaction, admSpecialMessage, {
      recipientCryptoAddress,
      senderCryptoAddress
    }) {
      if (!recipientCryptoAddress || !senderCryptoAddress) return false
      if (!transaction.senderId || !transaction.recipientId) return false

      if (
        transaction.hash === admSpecialMessage.hash &&
        this.verifyAmount(+transaction.amount, +admSpecialMessage.amount) &&
        this.verifyTimestamp(transaction.timestamp, admSpecialMessage.timestamp) &&
        transaction.senderId.toLowerCase() === senderCryptoAddress.toLowerCase() &&
        transaction.recipientId.toLowerCase() === recipientCryptoAddress.toLowerCase()
      ) {
        return true
      }

      return false
    },

    getTransactionStatus (admSpecialMessage) {
      if (!admSpecialMessage) return TS.PENDING

      const { hash, type, senderId, recipientId } = admSpecialMessage

      // ADM transaction already has property `status`
      if (type === Cryptos.ADM) return admSpecialMessage.status
      if (!Cryptos[type]) return admSpecialMessage.status // if crypto is not supported

      const getterName = type.toLowerCase() + '/transaction'
      const getter = this.$store.getters[getterName]

      if (!getter) return admSpecialMessage.status

      const transaction = getter(hash)
      let status = (transaction && transaction.status) || 'PENDING'

      const recipientCryptoAddress = this.$store.getters['partners/cryptoAddress'](recipientId, type)
      const senderCryptoAddress = this.$store.getters['partners/cryptoAddress'](senderId, type)

      // do not update status until cryptoAddresses and transaction are received
      if (!recipientCryptoAddress || !senderCryptoAddress || !transaction) return TS.PENDING

      if (status === 'SUCCESS') {
        // sometimes timestamp is missing (ETHLike transactions)
        if (!transaction.timestamp) return TS.PENDING

        if (this.verifyTransactionDetails(transaction, admSpecialMessage, {
          recipientCryptoAddress,
          senderCryptoAddress
        })) {
          status = TS.DELIVERED
        } else {
          status = TS.INVALID
        }
      } else {
        status = status === 'PENDING'
          ? TS.PENDING
          : TS.REJECTED
      }

      return status
    },

    /**
     * Delta should be <= 0.5%
     */
    verifyAmount (transactionAmount, specialMessageAmount) {
      const margin = transactionAmount / (100 / 0.5)
      const delta = Math.abs(transactionAmount - specialMessageAmount)

      return delta <= margin
    },

    verifyTimestamp (transactionTimestamp, specialMessageTimestamp) {
      const margin = 1800 // 30 min
      const delta = Math.abs(transactionTimestamp - specialMessageTimestamp) / 1000

      return delta < margin
    }
  }
}
