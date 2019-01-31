import { Cryptos } from '@/lib/constants'

export default {
  methods: {
    /**
     * Get transaction status for ETH, ERC20, DOGE.
     * @param {any} transaction Transaction object
     * @returns {string} sent, confirmed, rejected
     */
    transactionStatus (transaction) {
      if (transaction.type === Cryptos.ADM) {
        return transaction.status
      }

      const getterName = transaction.type.toLowerCase() + '/transaction'
      const getter = this.$store.getters[getterName]

      if (!getter) return 'rejected'

      this.fetchTransaction(transaction.type, transaction.hash)

      const tx = getter(transaction.hash)
      const status = tx && tx.status

      if (status === 'SUCCESS') {
        return 'confirmed'
      } else if (status === 'PENDING') {
        return 'sent'
      } else {
        return 'rejected'
      }
    },
    /**
     * Fetch transaction and save to state.
     * Used in `transactionStatus` to check transaction status.
     * @param {string} type Transaction type
     * @param {string} hash Transaction hash
     */
    fetchTransaction (type, hash) {
      const cryptoModule = type.toLowerCase()

      this.$store.dispatch(`${cryptoModule}/getTransaction`, {
        hash
      })
    }
  }
}
