import { Cryptos, TransactionStatus as TS } from '@/lib/constants'
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
      console.log('Fetching tx from transaction.js..')
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

    getTransactionStatus (admSpecialMessage) {
      if (!admSpecialMessage) return TS.PENDING

      const { hash, type, senderId, recipientId } = admSpecialMessage

      // ADM transaction already has property `status`
      // if (type === Cryptos.ADM) return admSpecialMessage.status
      if (type === Cryptos.ADM) {
        // Special case for socket ADM transfer
        if (admSpecialMessage.amount > 0 && admSpecialMessage.height === undefined && !admSpecialMessage.message && admSpecialMessage.status === 'delivered') {
          admSpecialMessage.status = 'confirmed'
        }
        return admSpecialMessage.status
      }
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

        const txVerify = verifyTransactionDetails(transaction, admSpecialMessage, { recipientCryptoAddress, senderCryptoAddress })
        if (txVerify.isTxConsistent) {
          status = TS.CONFIRMED
        } else {
          console.log(`Inconsistent ${type} transaction ${hash}:`, txVerify)
          status = TS.INVALID
        }
      } else {
        status = (status === 'PENDING' || status === 'REGISTERED')
          ? TS.PENDING
          : TS.REJECTED
      }

      return status
    }
  }
}
