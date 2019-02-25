<template>
  <component :is="transactionComponent" :id="txId" :crypto="crypto" />
</template>

<script>
import AdmTransaction from '../../components/transactions/AdmTransaction.vue'
import EthTransaction from '../../components/transactions/EthTransaction.vue'
import Erc20Transaction from '../../components/transactions/Erc20Transaction.vue'
import DogeTransaction from '../../components/transactions/DogeTransaction.vue'

import { Cryptos, isErc20 } from '../../lib/constants'

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
    DogeTransaction
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
      const action = this.crypto.toLowerCase() + '/getTransaction'
      this.$store.dispatch(action, { hash: this.txId, force: true })
    }
  },
  computed: {
    transactionComponent () {
      if (this.crypto === Cryptos.ETH) return 'eth-transaction'
      if (isErc20(this.crypto)) return 'erc20-transaction'
      if (this.crypto === Cryptos.DOGE) return 'doge-transaction'
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
