<template>
    <div class="transaction transaction_list">
      <md-list class="custom-list md-triple-line">
        <md-list-item v-for="(transaction, index) in transactions" :key="transaction.id" style="cursor:pointer">
          <md-avatar>
            <md-icon v-if="transaction.senderId !== currentAddress">flight_land</md-icon>
            <md-icon v-if="transaction.senderId === currentAddress">flight_takeoff</md-icon>
          </md-avatar>

          <div class="md-list-text-container" v-on:click="$router.push('/transactions/' + transaction.id + '/')">
            <span v-if="transaction.senderId !== currentAddress">{{ transaction.senderId.toString().toUpperCase() }}</span>
            <span v-else>{{ transaction.recipientId.toString().toUpperCase() }}</span>
            <span>{{ toFixed(transaction.amount / 100000000) }} ADM</span>
            <p>{{ dateFormat(transaction.timestamp) }}</p>
          </div>


          <md-divider class="md-inset"></md-divider>
        </md-list-item>
      </md-list>

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
      currentAddress: function () {
        return this.$store.state.address
      },
      transactions: function () {
        this.getTransactions()
        function compare (a, b) {
          if (a.timestamp < b.timestamp) {
            return 1
          }
          if (a.timestamp > b.timestamp) {
            return -1
          }
          return 0
        }
        if (this.$store.state.transactions) {
          return Object.values(this.$store.state.transactions).sort(compare)
        }
//        this.getTransactionInfo(this.$route.params.tx_id)
//        return false
      }
    }
  }
</script>

