import { Cryptos } from '@/lib/constants'

export default {
  methods: {
    /**
     * Get transaction status from ETH, ERC20, DOGE modules
     * and update chat message status.
     * @param {{ id: string, type: string, hash: string }} transaction
     * @param {string} partnerId Partner ADM address
     */
    fetchTransactionStatus ({ id, type, hash }, partnerId) {
      // ADM transactions already has property `status`
      if (type === Cryptos.ADM) return

      const getterName = type.toLowerCase() + '/transaction'
      const getter = this.$store.getters[getterName]

      if (!getter) return

      this.fetchTransaction(type, hash)
        .then(() => {
          const tx = getter(hash)
          let status = tx && tx.status

          status = status === 'SUCCESS'
            ? 'confirmed'
            : status === 'PENDING'
              ? 'sent'
              : 'rejected'

          this.$store.commit('chat/updateMessage', {
            partnerId,
            id,
            status
          })
        })
    },
    /**
     * Fetch transaction and save to state.
     * Used in `transactionStatus` to check transaction status.
     * @param {string} type Transaction type
     * @param {string} hash Transaction hash
     */
    fetchTransaction (type, hash) {
      const cryptoModule = type.toLowerCase()

      return this.$store.dispatch(`${cryptoModule}/getTransaction`, {
        hash
      })
    }
  }
}
