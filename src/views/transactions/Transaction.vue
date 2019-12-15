<template>
  <component :is="transactionComponent" :id="txId" :crypto="crypto" />
</template>

<script>
import AdmTransaction from '../../components/transactions/AdmTransaction.vue'
import EthTransaction from '../../components/transactions/EthTransaction.vue'
import Erc20Transaction from '../../components/transactions/Erc20Transaction.vue'
import BtcTransaction from '../../components/transactions/BtcTransaction.vue'

import { Cryptos, isErc20, isBtcBased } from '../../lib/constants'

export default {
  name: 'transaction',
  props: {
    crypto: {
      required: true,
      type: String
    },
    txId: {
      required: true,
      type: String
    }
  },
  components: {
    AdmTransaction,
    EthTransaction,
    Erc20Transaction,
    BtcTransaction
  },
  mounted () {
    this.update()
    window.clearInterval(this.timer)
    this.timer = window.setInterval(() => this.update(), 1e4)
  },
  beforeDestroy () {
    window.clearInterval(this.timer)
  },
  methods: {
    update () {
      const action = this.crypto.toLowerCase() + '/updateTransaction'
      this.$store.dispatch(action, { hash: this.txId })
    }
  },
  computed: {
    transactionComponent () {
      if (this.crypto === Cryptos.ETH) return 'eth-transaction'
      if (isErc20(this.crypto)) return 'erc20-transaction'
      if (isBtcBased(this.crypto)) return 'btc-transaction'
      return 'adm-transaction'
    }
  },
  data () {
    return {
      timer: null
    }
  }
}
</script>
