<template>
    <div class="transaction">
      <md-table v-if="transaction">
        <md-table-body>
          <md-table-row >
            <md-table-cell>{{ $t('transaction.amount') }}</md-table-cell>
            <md-table-cell >{{ toFixed(transaction.amount / 100000000) }} ADM</md-table-cell>
          </md-table-row>
          <md-table-row >
            <md-table-cell>{{ $t('transaction.date') }}</md-table-cell>
            <md-table-cell >{{ dateFormat(transaction.timestamp) }}</md-table-cell>
          </md-table-row>
          <md-table-row >
            <md-table-cell>{{ $t('transaction.confirmations') }}</md-table-cell>
            <md-table-cell >{{ transaction.confirmations }}</md-table-cell>
          </md-table-row>
          <md-table-row >
            <md-table-cell>{{ $t('transaction.commission') }}</md-table-cell>
            <md-table-cell >{{ toFixed(transaction.fee / 100000000) }} ADM</md-table-cell>
          </md-table-row>
          <md-table-row >
            <md-table-cell>{{ $t('transaction.txid') }}</md-table-cell>
            <md-table-cell >{{ $route.params.tx_id }}</md-table-cell>
          </md-table-row>
          <md-table-row >
            <md-table-cell>{{ $t('transaction.sender') }}</md-table-cell>
            <md-table-cell >{{ transaction.senderId.toString().toUpperCase() }}</md-table-cell>
          </md-table-row>
          <md-table-row >
            <md-table-cell>{{ $t('transaction.recipient') }}</md-table-cell>
            <md-table-cell >{{ transaction.recipientId.toString().toUpperCase() }} </md-table-cell>
          </md-table-row>
        </md-table-body>
      </md-table>

    </div>
</template>

<script>
  export default {
    name: 'transaction',
    data () {
      return {
      }
    },
    watch: {
      '$route': function (value) {
        this.getTransactionInfo(value.params.tx_id)
      }
    },
    methods: {
      dateFormat: function (timestamp) {
        return new Date(parseInt(timestamp) * 1000 + Date.UTC(2017, 8, 2, 17, 0, 0, 0)).toLocaleString()
      },
      toFixed: function (x) {
        var e
        if (Math.abs(x) < 1.0) {
          e = parseInt(x.toString().split('e-')[1])
          if (e) {
            x *= Math.pow(10, e - 1)
            x = '0.' + (new Array(e)).join('0') + x.toString().substring(2)
          }
        } else {
          e = parseInt(x.toString().split('+')[1])
          if (e > 20) {
            e -= 20
            x /= Math.pow(10, e)
            x += (new Array(e + 1)).join('0')
          }
        }
        return x
      }
    },
    computed: {
      transaction: function () {
        if (this.$store.state.transactions[this.$route.params.tx_id]) {
          return this.$store.state.transactions[this.$route.params.tx_id]
        }
        this.getTransactionInfo(this.$route.params.tx_id)
        return false
      }
    }
  }
</script>

