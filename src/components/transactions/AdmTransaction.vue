<template>
  <div>
    <transaction-template
      :amount="amount"
      :timestamp="transaction.timestamp"
      :id="transaction.id"
      :fee="fee"
      :confirmations="transaction.confirmations"
      :sender="sender"
      :recipient="recipient"
      :explorerLink="explorerLink"
      :partner="transaction.partner"
      :status="status"
    />
  </div>
</template>

<script>
import TransactionTemplate from './TransactionTemplate.vue'
import getExplorerUrl from '../../lib/getExplorerUrl'
import { Cryptos } from '../../lib/constants'

export default {
  name: 'adm-transaction',
  props: ['id'],
  components: {
    TransactionTemplate
  },
  mounted () {
    this.update()
    clearInterval(this.bgTimer)
    this.bgTimer = setInterval(() => this.update(), 5000)
  },
  beforeDestroy () {
    clearInterval(this.bgTimer)
  },
  data () {
    return {
      bgTimer: null
    }
  },
  computed: {
    transaction () {
      return this.$store.state.adm.transactions[this.id] || { }
    },
    amount () {
      if (!this.transaction.amount) return ''
      return this.$formatAmount(this.transaction.amount) + ' ' + Cryptos.ADM
    },
    fee () {
      if (!this.transaction.fee) return ''
      return this.$formatAmount(this.transaction.fee) + ' ' + Cryptos.ADM
    },
    sender () {
      return this.formatAddress(this.transaction.senderId)
    },
    recipient () {
      return this.formatAddress(this.transaction.recipientId)
    },
    explorerLink () {
      return getExplorerUrl(Cryptos.ADM, this.id)
    },
    status () {
      return ''
    }
  },
  methods: {
    formatAddress (address) {
      if (address === this.$store.state.address) {
        return this.$t('transaction.me')
      }

      let result = this.$store.getters['partners/displayName'](address)

      if (result) {
        result += ' (' + address + ')'
      }

      return result
    },
    update () {
      this.$store.dispatch('adm/getTransaction', this.id)
    }
  }
}
</script>
