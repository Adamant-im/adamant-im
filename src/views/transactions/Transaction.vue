<template>
  <component v-bind:is="transactionComponent" :id="tx_id" :crypto="crypto" />
</template>

<script>
import AdmTransaction from '../../components/transactions/AdmTransaction.vue'
import EthTransaction from '../../components/transactions/EthTransaction.vue'
import Erc20Transaction from '../../components/transactions/Erc20Transaction.vue'
import DogeTransaction from '../../components/transactions/DogeTransaction.vue'

import { Cryptos, isErc20 } from '../../lib/constants'

export default {
  name: 'transaction',
  props: ['tx_id', 'crypto'],
  components: {
    AdmTransaction,
    EthTransaction,
    Erc20Transaction,
    DogeTransaction
  },
  mounted () {
    this.update()
    clearInterval(this.timer)
    this.timer = setInterval(() => this.update(), 10 * 1000)
  },
  beforeDestroy () {
    clearInterval(this.timer)
  },
  methods: {
    update () {
      const action = this.crypto.toLowerCase() + '/getTransaction'
      this.$store.dispatch(action, { hash: this.tx_id, force: true })
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
