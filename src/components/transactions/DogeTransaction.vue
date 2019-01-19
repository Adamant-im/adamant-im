<template>
  <transaction-template
    :amount="amount"
    :timestamp="transaction.timestamp"
    :id="transaction.hash"
    :fee="fee"
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
  name: 'doge-transaction',
  props: ['id'],
  components: {
    TransactionTemplate
  },
  mounted () {
    this.$store.dispatch('doge/getTransaction', { hash: this.id })
  },
  data () {
    return { }
  },
  computed: {
    transaction () {
      return this.$store.getters['doge/transaction'](this.id) || { }
    },
    amount () {
      if (!this.transaction.amount) return ''
      return this.transaction.amount + ' ' + Cryptos.DOGE
    },
    fee () {
      if (!this.transaction.fee) return ''
      return this.transaction.fee + ' ' + Cryptos.DOGE
    },
    sender () {
      const { senders, senderId } = this.transaction
      if (senderId) {
        return this.formatAddress(senderId)
      } else if (senders) {
        return this.formatAddresses(senders)
      }
    },
    recipient () {
      const { recipientId, recipients } = this.transaction
      if (recipientId) {
        return this.formatAddress(recipientId)
      } else if (recipients) {
        return this.formatAddresses(recipients)
      }
    },
    partner () {
      if (this.transaction.partner) return this.transaction.partner

      const id = this.transaction.senderId !== this.$store.state.doge.address
        ? this.transaction.senderId : this.transaction.recipientId
      return this.getAdmAddress(id)
    },
    explorerLink () {
      return getExplorerUrl(Cryptos.DOGE, this.id)
    },
    confirmations () {
      return this.transaction.confirmations || 0
    }
  },
  methods: {
    getAdmAddress (address) {
      let admAddress = ''

      // First, check the known partners
      const partners = this.$store.state.partners
      Object.keys(partners).some(uid => {
        const partner = partners[uid]
        if (partner[Cryptos.DOGE] === address) {
          admAddress = uid
        }
        return !!admAddress
      })

      if (!admAddress) {
        // Bad news, everyone: we'll have to scan the messages
        Object.values(this.$store.state.chats).some(chat => {
          Object.values(chat.messages).some(msg => {
            if (msg.message && msg.message.hash === this.id) {
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
      if (address === this.$store.state.doge.address) {
        return this.$t('transaction.me')
      }

      let admAddress = this.getAdmAddress(address)
      let name = this.$store.getters['partners/displayName'](admAddress)

      let result = address || ''
      if (admAddress) {
        result += ' (' + (name || admAddress) + ')'
      }

      return result
    },

    formatAddresses (addresses) {
      const count = addresses.length
      return addresses.includes(this.$store.state.doge.address)
        ? `${this.$t('transaction.me_and')} ${this.$tc('transaction.addresses', count - 1)}`
        : this.$tc('transaction.addresses', count)
    }
  }
}
</script>
