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
      if (type in Cryptos) {
        // Don't need to fetch coin addresses for ADM txs
        if (type !== Cryptos.ADM) this.fetchCryptoAddresses(type, recipientId, senderId)
        // Update status, including ADM direct transfers and in-chat transfers
        // Message txs are not processed here
        this.fetchTransaction(type, hash, admSpecialMessage.timestamp)
      }
    },

    /**
     * Fetch transaction and save to state.
     * @param {string} type Transaction type
     * @param {string} hash Transaction hash
     * @param {number} timestamp ADAMANT special message timestamp. If coin Tx is not known yet, set its timestamp to ADM rich message timestamp. Later it will be updated
     */
    fetchTransaction (type, hash, timestamp) {
      const cryptoModule = type.toLowerCase()
      return this.$store.dispatch(`${cryptoModule}/getTransaction`, { hash, timestamp })
    },

    /**
     * Get crypto tx info from store
     * @param {string} type Transaction type
     * @param {string} hash Transaction hash
     */
    getTransaction (type, hash) {
      let transaction
      if (type === 'ADM') {
        transaction = this.$store.state.adm.transactions[hash] || { }
      } else if (!Cryptos[type]) {
        transaction = {}
      } else {
        transaction = this.$store.getters[`${type.toLowerCase()}/transaction`](hash) || {}
      }
      return transaction
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
     * @param {{ id: string, type: string, hash: string }} admSpecialMessage ADM message or ADM rich message of Tx transfer
     * @param {object} coinTx in case it's not in-chat coin transfer, we have all the data already
     * @returns {object}
     */
    getTransactionStatus (admSpecialMessage, coinTx) {
      const status = {
        status: TS.PENDING,
        virtualStatus: TS.PENDING,
        inconsistentReason: '',
        addStatus: TAS.NONE,
        addDescription: ''
      }

      // if no hash, it is an empty object
      admSpecialMessage = admSpecialMessage && (admSpecialMessage.hash || admSpecialMessage.id) ? admSpecialMessage : undefined

      if (!admSpecialMessage && !coinTx) return status
      status.status = admSpecialMessage ? admSpecialMessage.status : coinTx.status
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
              status.addDescription = this.$t('transaction.statuses_add.adm_registered')
            } else {
              // All transactions we get via socket are shown in chats, including ADM direct transfers
              // Currently, we don't update confirmations for direct transfers, see getChats() in adamant-api.js
              // So we'll update confirmations here
              const transfer = this.$store.state.adm.transactions[hash]
              if (transfer && (transfer.height || transfer.confirmations > 0)) {
                status.status = TS.CONFIRMED
                status.virtualStatus = status.status
              } else {
                this.fetchTransaction('ADM', hash, admSpecialMessage.timestamp)
              }
            }
          }
          return status
        } else if (!Cryptos[type]) {
          // if crypto is not supported
          status.status = TS.UNKNOWN
          status.virtualStatus = status.status
          return status
        }

        const getterName = type.toLowerCase() + '/transaction'
        const getter = this.$store.getters[getterName]
        if (!getter) return status

        coinTx = getter(hash)
        status.status = (coinTx && coinTx.status) || TS.PENDING
        status.virtualStatus = status.status

        const recipientCryptoAddress = this.$store.getters['partners/cryptoAddress'](recipientId, type)
        const senderCryptoAddress = this.$store.getters['partners/cryptoAddress'](senderId, type)

        // do not update status until cryptoAddresses and transaction are received
        if (!recipientCryptoAddress || !senderCryptoAddress || !coinTx) {
          status.status = TS.PENDING
          status.virtualStatus = status.status
          return status
        }

        // check if Tx is not a fake
        // we are unable to check status.status === TS.REGISTERED txs, as their timestamps are Date.now()
        if (status.status === TS.CONFIRMED) {
          const txVerify = verifyTransactionDetails(coinTx, admSpecialMessage, { recipientCryptoAddress, senderCryptoAddress })
          if (!txVerify.isTxConsistent) {
            status.status = TS.INVALID
            status.virtualStatus = status.status
            status.inconsistentReason = txVerify.txInconsistentReason
            return status
          }
        }
      }

      if (status.status === TS.REGISTERED) {
        // Dash InstantSend transactions must be shown as confirmed
        // don't need to verify timestamp, as such txs are fresh
        if (coinTx.instantsend) {
          status.virtualStatus = TS.CONFIRMED
          status.addStatus = TAS.INSTANT_SEND
          status.addDescription = this.$t('transaction.statuses_add.instant_send')
        }
      }

      return status
    }
  }
}
