<template>
  <component :is="transactionComponent" :id="txId" :crypto="crypto" />
</template>

<script>
import AdmTransaction from '../../components/transactions/AdmTransaction.vue'
import EthTransaction from '../../components/transactions/EthTransaction.vue'
import Erc20Transaction from '../../components/transactions/Erc20Transaction.vue'
import BtcTransaction from '../../components/transactions/BtcTransaction.vue'
import DogeTransaction from '../../components/transactions/DogeTransaction.vue'
import DashTransaction from '../../components/transactions/DashTransaction.vue'
import KlyTransaction from '../../components/transactions/KlyTransaction.vue'

import { Cryptos, isErc20, isKlyBased } from '../../lib/constants'
import { getTxUpdateInterval } from '../../lib/transactionsFetching'

export default {
  name: 'Transaction',
  components: {
    AdmTransaction,
    EthTransaction,
    Erc20Transaction,
    BtcTransaction,
    DogeTransaction,
    DashTransaction,
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
      if (this.crypto === Cryptos.BTC) return 'btc-transaction'
      if (this.crypto === Cryptos.DOGE) return 'doge-transaction'
      if (this.crypto === Cryptos.DASH) return 'dash-transaction'
      if (isErc20(this.crypto)) return 'erc20-transaction'
      if (isKlyBased(this.crypto)) return 'kly-transaction'
      return 'adm-transaction'
    }
  },
  mounted() {
    this.update()
    window.clearInterval(this.timer)
    this.timer = window.setInterval(() => this.update(), getTxUpdateInterval(this.crypto))
  },
  beforeUnmount() {
    window.clearInterval(this.timer)
  },
  methods: {
    update() {
      // Regularly update Tx details with confirmations count, do force — fetch details for existing Tx also
      this.$store.dispatch(this.crypto.toLowerCase() + '/updateTransaction', {
        hash: this.txId,
        force: true,
        updateOnly: true
      })
    }
  }
}
</script>
