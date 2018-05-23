<template>
    <div class="transaction transaction_detail">
      <md-table v-if="transaction">
        <md-table-body>
          <md-table-row >
            <md-table-cell class='label_td'>{{ $t('transaction.amount') }}</md-table-cell>
            <md-table-cell >{{ $formatAmount(transaction.amount) }} ADM</md-table-cell>
          </md-table-row>
          <md-table-row >
            <md-table-cell  class='label_td'>{{ $t('transaction.date') }}</md-table-cell>
            <md-table-cell >{{ dateFormat(transaction.timestamp) }}</md-table-cell>
          </md-table-row>
          <md-table-row >
            <md-table-cell  class='label_td'>{{ $t('transaction.confirmations') }}</md-table-cell>
            <md-table-cell >{{ confirmations }}</md-table-cell>
          </md-table-row>
          <md-table-row >
            <md-table-cell  class='label_td'>{{ $t('transaction.commission') }}</md-table-cell>
            <md-table-cell >{{ $formatAmount(transaction.fee) }} ADM</md-table-cell>
          </md-table-row>
          <md-table-row >
            <md-table-cell  class='label_td'>{{ $t('transaction.txid') }}</md-table-cell>
            <md-table-cell class='data_td'>{{ $route.params.tx_id }}</md-table-cell>
          </md-table-row>
          <md-table-row >
            <md-table-cell  class='label_td'>{{ $t('transaction.sender') }}</md-table-cell>
            <md-table-cell class='data_td'>{{ transaction.senderId.toString().toUpperCase() }}</md-table-cell>
          </md-table-row>
          <md-table-row >
            <md-table-cell  class='label_td'>{{ $t('transaction.recipient') }}</md-table-cell>
            <md-table-cell class='data_td'>{{ transaction.recipientId.toString().toUpperCase() }} </md-table-cell>
          </md-table-row>
          <md-table-row class='open_in_explorer'>
            <md-table-cell  class='label_td'>
              <div v-on:click="openInExplorer">{{ $t('transaction.explorer') }}</div>
            </md-table-cell>
            <md-table-cell class='data_td'>
              <div v-on:click="openInExplorer">&gt;</div>
            </md-table-cell>
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
      openInExplorer: function () {
        window.open('https://explorer.adamant.im/tx/' + this.$route.params.tx_id, '_blank')
      }
    },
    computed: {
      confirmations: function () {
        if (!this.transaction.confirmations) {
          return '⏱'
        }
        return this.transaction.confirmations
      },
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
<style>
  .label_td {
    text-align: left;
  }
  .transaction_detail {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  @media (max-width: 380px) {
    .data_td {
      font-size: 10px!important;
    }
    .label_td {
      text-align:left;
      max-width:100px;
    }

  }

  .open_in_explorer {
    cursor: pointer;
  }
</style>

