<template>
  <div>
    <transaction-template
      :amount="transaction.amount | currency(crypto)"
      :timestamp="transaction.timestamp || NaN"
      :id="transaction.hash"
      :fee="transaction.fee | currency(crypto)"
      :confirmations="confirmations || NaN"
      :sender="sender"
      :recipient="recipient"
      :explorerLink="explorerLink"
      :partner="partner"
      :status="transaction.status"
      :admTx="admTx"
    />
  </div>
</template>

<script>
import TransactionTemplate from './TransactionTemplate.vue'
import getExplorerUrl from '../../lib/getExplorerUrl'
import partnerName from '@/mixins/partnerName'

export default {
  mixins: [partnerName],
  name: 'btc-transaction',
  props: ['id', 'crypto'],
  components: {
    TransactionTemplate
  },
  mounted () {
    this.$store.dispatch(`${this.cryptoKey}/getTransaction`, { hash: this.id })
  },
  data () {
    return { }
  },
  computed: {
    cryptoKey () {
      return this.crypto.toLowerCase()
    },
    transaction () {
      return this.$store.getters[`${this.cryptoKey}/transaction`](this.id) || { }
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

      const id = this.transaction.senderId !== this.$store.state[this.cryptoKey].address
        ? this.transaction.senderId : this.transaction.recipientId
      return this.getAdmAddress(id)
    },
    explorerLink () {
      return getExplorerUrl(this.crypto, this.id)
    },
    confirmations () {
      const { height, confirmations } = this.transaction

      let result = confirmations
      if (height) {
        // Calculate confirmations count based on the tx block height and the last block height.
        // That's for BTC only as it does not return the confirmations for the transaction.
        const c = this.$store.getters[`${this.cryptoKey}/height`] - height
        if (isFinite(c) && c > result) {
          result = c
        }
      }

      return result
    },
    admTx () {
      let admTx = {}
      // Bad news, everyone: we'll have to scan the messages
      Object.values(this.$store.state.chat.chats).some(chat => {
        Object.values(chat.messages).some(msg => {
          if (msg.hash && msg.hash === this.id) {
            Object.assign(admTx, msg)
          }
          return !!admTx.id
        })
        return !!admTx.id
      })
      return admTx
    }
  },
  methods: {
    getAdmAddress (address) {
      let admAddress = ''

      // First, check the known partners
      const partners = this.$store.state.partners
      Object.keys(partners).some(uid => {
        const partner = partners[uid]
        if (partner[this.crypto] === address) {
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
      let admAddress = this.getAdmAddress(address)
      let name = ''

      if (address === this.$store.state[this.cryptoKey].address) {
        name = this.$t('transaction.me')
      } else {
        name = this.getPartnerName(admAddress)
      }

      let result = ''
      if (name !== '' && name !== undefined) {
        result = name + ' (' + (address) + ')'
      } else {
        result = address
        if (admAddress) {
          result += ' (' + (admAddress) + ')'
        }
      }

      return result
    },

    formatAddresses (addresses) {
      const count = addresses.length
      return addresses.includes(this.$store.state[this.cryptoKey].address)
        ? `${this.$t('transaction.me_and')} ${this.$tc('transaction.addresses', count - 1)}`
        : this.$tc('transaction.addresses', count)
    }
  }
}
</script>
