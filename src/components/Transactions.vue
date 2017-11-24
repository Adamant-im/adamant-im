<template>
    <div class="transaction">
      <md-table v-once>
        <md-table-header>
          <md-table-row>
            <md-table-head>{{ $t('transaction.sender') }}</md-table-head>
            <md-table-head>{{ $t('transaction.recipient') }}</md-table-head>
            <md-table-head md-numeric>{{ $t('transaction.amount') }}</md-table-head>
            <md-table-head>{{ $t('transaction.date') }}</md-table-head>

          </md-table-row>
        </md-table-header>

        <md-table-body>
          <md-table-row v-for="(transaction, index) in transactions" :key="index">
            <md-table-cell>{{ transaction.senderId.toString().toUpperCase() }}</md-table-cell>
            <md-table-cell>{{ transaction.recipientId.toString().toUpperCase() }}</md-table-cell>
            <md-table-cell>{{ toFixed(transaction.amount / 100000000) }} ADM</md-table-cell>
            <md-table-cell>{{ dateFormat(transaction.timestamp) }}</md-table-cell>
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
      transactions: function () {
        this.getTransactions()
        if (this.$store.state.transactions) {
          return this.$store.state.transactions
        }
//        this.getTransactionInfo(this.$route.params.tx_id)
//        return false
      }
    }
  }
</script>

