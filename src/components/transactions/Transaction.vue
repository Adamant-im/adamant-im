<template>
  <component v-bind:is="transactionComponent" :id="tx_id" />
</template>

<script>
import AdmTransaction from './AdmTransaction.vue'
import EthTransaction from './EthTransaction.vue'

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
      return 'adm-transaction'
    }
  }
}
</script>
