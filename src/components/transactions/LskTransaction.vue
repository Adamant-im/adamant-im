<template>
  <transaction-template
    :id="transaction.hash || '' "
    :amount="transaction.amount | currency(crypto)"
    :timestamp="transaction.timestamp || NaN"
    :fee="transaction.fee | currency('LSK')"
    :confirmations="confirmations || NaN"
    :sender="sender || '' "
    :recipient="recipient || '' "
    :explorer-link="explorerLink"
    :partner="partner || '' "
    :status="status() || '' "
    :status-inconsistent="inconsistent_reason"
    :adm-tx="admTx"
    :crypto="crypto"
  />
</template>

<script>
import TransactionTemplate from './TransactionTemplate.vue'
import getExplorerUrl from '../../lib/getExplorerUrl'
import { Cryptos, TransactionStatus as TS } from '../../lib/constants'
import partnerName from '@/mixins/partnerName'
import { verifyTransactionDetails } from '@/lib/txVerify'

export default {
  name: 'LskTransaction',
  components: {
    TransactionTemplate
  },
  mixins: [partnerName],
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
  data () {
    return {
      inconsistent_reason: ''
    }
  },
  computed: {
    cryptoKey () {
      return this.crypto.toLowerCase()
    },
    transaction () {
      return this.$store.getters[`${this.cryptoKey}/transaction`](this.id) || { }
    },
    sender () {
      return this.transaction.senderId ? this.formatAddress(this.transaction.senderId) : ''
    },
    recipient () {
      return this.transaction.recipientId ? this.formatAddress(this.transaction.recipientId) : ''
    },
    partner () {
      if (this.transaction.partner) return this.transaction.partner

      const id = this.transaction.senderId !== this.$store.state.lsk.address
        ? this.transaction.senderId
        : this.transaction.recipientId
      return this.getAdmAddress(id)
    },
    explorerLink () {
      return getExplorerUrl(Cryptos.LSK, this.id)
    },
    confirmations () {
      const { height, confirmations } = this.transaction

      let result = confirmations
      if (height) {
        // Calculate actual confirmations count based on the tx block height and the last block height.
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
  methods: {
    status () {
      let status = this.transaction.status
      const messageTx = this.admTx
      if (status === 'SUCCESS' && messageTx && messageTx.id) {
        const txVerify = verifyTransactionDetails(this.transaction, messageTx, { recipientCryptoAddress: this.recipient, senderCryptoAddress: this.sender })
        if (txVerify.isTxConsistent) {
          status = TS.CONFIRMED
          this.inconsistent_reason = ''
        } else {
          this.inconsistent_reason = this.$t(`transaction.inconsistent_reasons.${txVerify.txInconsistentReason}`, { crypto: this.crypto })
          status = TS.INVALID
        }
      }
      return status
    },
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
      const admAddress = this.getAdmAddress(address)
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
