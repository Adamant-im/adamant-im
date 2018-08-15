<template>
  <component v-bind:is="transactionComponent" :id="tx_id" :crypto="crypto" />
</template>

<script>
import AdmTransaction from './AdmTransaction.vue'
import EthTransaction from './EthTransaction.vue'
import Erc20Transaction from './Erc20Transaction.vue'

import { Cryptos } from '../../lib/constants'

export default {
  name: 'transaction',
  props: ['tx_id', 'crypto'],
  components: {
    AdmTransaction,
    EthTransaction
  },
  computed: {
    transactionComponent () {
      if (this.crypto === Cryptos.ETH) return 'eth-transaction'
      if (this.crypto === Cryptos.BNB) return 'erc20-transaction'
      return 'adm-transaction'
    }
  }
}
</script>
