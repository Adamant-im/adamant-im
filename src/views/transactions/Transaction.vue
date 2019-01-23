<template>
  <component v-bind:is="transactionComponent" :id="tx_id" :crypto="crypto" />
</template>

<script>
import AdmTransaction from '../../components/transactions/AdmTransaction.vue'
import EthTransaction from '../../components/transactions/EthTransaction.vue'
import Erc20Transaction from '../../components/transactions/Erc20Transaction.vue'
import BtcTransaction from '../../components/transactions/BtcTransaction.vue'

import { Cryptos, isErc20, isBtcBased } from '../../lib/constants'

export default {
  name: 'transaction',
  props: ['tx_id', 'crypto'],
  components: {
    AdmTransaction,
    EthTransaction,
    Erc20Transaction,
    BtcTransaction
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
