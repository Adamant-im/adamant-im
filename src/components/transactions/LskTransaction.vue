<template>
  <transaction-template
    :amount="transaction.amount | currency(crypto)"
    :timestamp="transaction.timestamp || NaN"
    :id="transaction.hash || '' "
    :fee="transaction.fee | currency('LSK')"
    :confirmations="transaction.confirmations || NaN"
    :sender="sender || '' "
    :recipient="recipient || '' "
    :explorerLink="explorerLink"
    :partner="partner || '' "
    :status="transaction.status || '' "
    :admTx="admTx"
  />
</template>

<script>
import TransactionTemplate from './TransactionTemplate.vue'
import getExplorerUrl from '../../lib/getExplorerUrl'
import { Cryptos } from '../../lib/constants'
import partnerName from '@/mixins/partnerName'

export default {
  mixins: [partnerName],
  name: 'lsk-transaction',
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
      console.log('/transaction:', prefix, this.$store)
      return this.$store.getters[prefix + '/transaction'](this.id) || { }
    },
    sender () {
      console.log('sender:', this.transaction, this.transaction.senderId)
      return this.transaction.senderId ? this.formatAddress(this.transaction.senderId) : ''
    },
    recipient () {
      return this.transaction.recipientId ? this.formatAddress(this.transaction.recipientId) : ''
    },
    partner () {
      if (this.transaction.partner) return this.transaction.partner

      const id = this.transaction.senderId !== this.$store.state.lsk.address
        ? this.transaction.senderId : this.transaction.recipientId
      return this.getAdmAddress(id)
    },
    explorerLink () {
      return getExplorerUrl(Cryptos.LSK, this.id)
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
      const partners = this.$store.state.partners.list
      Object.keys(partners).some(uid => {
        const partner = partners[uid]
        if (partner[Cryptos.LSK] === address) {
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

      if (address === this.$store.state.lsk.address) {
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
    }
  }
}
</script>
