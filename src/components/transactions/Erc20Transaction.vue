<template>
  <transaction-template
    :amount="transaction.amount | currency(crypto)"
    :timestamp="transaction.timestamp"
    :id="transaction.hash"
    :fee="transaction.fee | currency('ETH')"
    :confirmations="confirmations"
    :sender="sender"
    :recipient="recipient"
    :explorerLink="explorerLink"
    :partner="partner"
    :status="transaction.status"
  />
</template>

<script>
import TransactionTemplate from './TransactionTemplate.vue'
import getExplorerUrl from '../../lib/getExplorerUrl'
import { Cryptos } from '../../lib/constants'

export default {
  name: 'erc20-transaction',
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
  components: {
    TransactionTemplate
  },
  data () {
    return { }
  },
  computed: {
    transaction () {
      const prefix = this.crypto.toLowerCase()
      return this.$store.getters[prefix + '/transaction'](this.id) || { }
    },
    sender () {
      return this.formatAddress(this.transaction.senderId)
    },
    recipient () {
      return this.formatAddress(this.transaction.recipientId)
    },
    partner () {
      if (this.transaction.partner) return this.transaction.partner

      const id = this.transaction.senderId !== this.$store.state.eth.address
        ? this.transaction.senderId : this.transaction.recipientId
      return this.getAdmAddress(id)
    },
    explorerLink () {
      return getExplorerUrl(Cryptos.ETH, this.id)
    },
    confirmations () {
      if (!this.transaction.blockNumber || !this.$store.state.eth.blockNumber) return 0
      return Math.max(0, this.$store.state.eth.blockNumber - this.transaction.blockNumber)
    }
  },
  methods: {
    getAdmAddress (address) {
      let admAddress = ''

      // First, check the known partners
      const partners = this.$store.state.partners
      Object.keys(partners).some(uid => {
        const partner = partners[uid]
        if (partner[Cryptos.ETH] === address) {
          admAddress = uid
        }
        return !!admAddress
      })

      if (!admAddress) {
        // Bad news, everyone: we'll have to scan the messages
        Object.values(this.$store.state.chat.chats).some(chat => {
          Object.values(chat.messages).some(msg => {
            if (msg.hash && msg.hash === this.id) {
              admAddress = msg.senderId === this.$store.state.address ? msg.recipientId : msg.senderId
            }
            return !!admAddress
          })
          return !!admAddress
        })
      }

      return admAddress
    },

    formatAddress (address) {
      if (address === this.$store.state.eth.address) {
        return this.$t('transaction.me')
      }

      let admAddress = this.getAdmAddress(address)
      let name = this.$store.getters['partners/displayName'](admAddress)

      let result = address || ''
      if (admAddress) {
        result += ' (' + (name || admAddress) + ')'
      }

      return result
    }
  }
}
</script>
