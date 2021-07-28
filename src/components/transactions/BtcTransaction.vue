<template>
  <div>
    <transaction-template
      :id="transaction.hash || '' "
      :amount="transaction.amount | currency(crypto)"
      :timestamp="transaction.timestamp || NaN"
      :fee="fee"
      :confirmations="confirmations || NaN"
      :sender="sender || '' "
      :recipient="recipient || '' "
      :explorer-link="explorerLink"
      :partner="partner || '' "
      :status="getTransactionStatus(admTx)"
      :adm-tx="admTx"
      :crypto="crypto"
    />
  </div>
</template>

<script>
import TransactionTemplate from './TransactionTemplate.vue'
import getExplorerUrl from '../../lib/getExplorerUrl'
import partnerName from '@/mixins/partnerName'
import { CryptoNaturalUnits } from '@/lib/constants'

import transaction from '@/mixins/transaction'
import { isStringEqualCI } from '@/lib/textHelpers'

export default {
  name: 'BtcTransaction',
  components: {
    TransactionTemplate
  },
  mixins: [transaction, partnerName],
  props: ['id', 'crypto'],
  computed: {
    fee () {
      const fee = this.transaction.fee
      if (!fee) return ''
      return `${+fee.toFixed(CryptoNaturalUnits[this.crypto])} ${this.crypto.toUpperCase()}`
    },
    cryptoKey () {
      return this.crypto.toLowerCase()
    },
    transaction () {
      return this.$store.getters[`${this.cryptoKey}/transaction`](this.id) || { }
    },
    sender () {
      const { senders, senderId } = this.transaction
      const onlySender = senderId && (!senders || senders.length === 1)
      if (onlySender) {
        return this.formatAddress(senderId)
      } else if (senders) {
        return this.formatAddresses(senders)
      } else {
        return undefined
      }
    },
    recipient () {
      const { recipientId, recipients } = this.transaction
      const onlyRecipient = recipientId && (!recipients || recipients.length === 1)
      if (onlyRecipient) {
        return this.formatAddress(recipientId)
      } else if (recipients) {
        return this.formatAddresses(recipients)
      } else {
        return undefined
      }
    },
    partner () {
      if (this.transaction.partner) return this.transaction.partner

      const id = !isStringEqualCI(this.transaction.senderId, this.$store.state[this.cryptoKey].address)
        ? this.transaction.senderId
        : this.transaction.recipientId
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
      const admTx = {}
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
  mounted () {
    // Not needed, as called from Transaction.vue
    // this.$store.dispatch(`${this.cryptoKey}/getTransaction`, { hash: this.id })
  },
  methods: {
    getAdmAddress (address) {
      let admAddress = ''

      // First, check the known partners
      const partners = this.$store.state.partners
      Object.keys(partners).some(uid => {
        const partner = partners[uid]
        if (isStringEqualCI(partner[this.crypto], address)) {
          admAddress = uid
        }
        return !!admAddress
      })

      if (!admAddress) {
        // Bad news, everyone: we'll have to scan the messages
        Object.values(this.$store.state.chat.chats).some(chat => {
          Object.values(chat.messages).some(msg => {
            if (msg.hash && msg.hash === this.id) {
              admAddress = isStringEqualCI(msg.senderId, this.$store.state.address) ? msg.recipientId : msg.senderId
            }
            return !!admAddress
          })
          return !!admAddress
        })
      }

      return admAddress
    },

    formatAddress (address) {
      const admAddress = this.getAdmAddress(address)
      let name = ''

      if (isStringEqualCI(address, this.$store.state[this.cryptoKey].address)) {
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
        ? `${this.$tc('transaction.me_and_addresses', count - 1)}`
        : this.$tc('transaction.addresses', count)
    }
  }
}
</script>
