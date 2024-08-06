<template>
  <component :is="transactionComponent" :id="txId" :crypto="crypto" />
</template>

<script>
import AdmTransaction from '../../components/transactions/AdmTransaction.vue'
import EthTransaction from '../../components/transactions/EthTransaction.vue'
import Erc20Transaction from '../../components/transactions/Erc20Transaction.vue'
import BtcTransaction from '../../components/transactions/BtcTransaction.vue'
import KlyTransaction from '../../components/transactions/KlyTransaction.vue'

import { Cryptos, isErc20, isBtcBased, isKlyBased } from '../../lib/constants'

export default {
  name: 'Transaction',
  components: {
    AdmTransaction,
    EthTransaction,
    Erc20Transaction,
    BtcTransaction,
    KlyTransaction
  },
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
  data() {
    return {
      timer: null
    }
  },
  computed: {
    transactionComponent() {
      if (this.crypto === Cryptos.ETH) return 'eth-transaction'
      if (isBtcBased(this.crypto)) return 'btc-transaction'
      if (isErc20(this.crypto)) return 'erc20-transaction'
      if (isKlyBased(this.crypto)) return 'kly-transaction'
      return 'adm-transaction'
    }
  }
}
</script>
