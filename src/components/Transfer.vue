<template>
  <div class="transfer">
      <form novalidate @submit.stop.prevent="submit">
          <md-input-container>
              <label>{{ $t('transfer.to_address_label') }}</label>
              <md-input v-model="targetAddress"></md-input>
          </md-input-container>
          <md-input-container>
              <label>{{ $t('transfer.amount_label') }} (max: {{ maxToTransfer }} ADM)</label>
              <md-input type="number" v-model="targetAmount"></md-input>
          </md-input-container>
          <md-input-container>
              <label>{{ $t('transfer.commission_label') }}</label>
              <md-input type="number" v-model="commission"></md-input>
          </md-input-container>
          <md-input-container>
              <label>{{ $t('transfer.final_amount_label') }}</label>
              <md-input type="number" readonly v-model="finalAmount"></md-input>
          </md-input-container>
          <md-layout md-align="center" md-gutter="16">
              <md-button class="md-raised md-primary" v-on:click="transfer">{{ $t('transfer.send_button') }}</md-button>

          </md-layout>
      </form>
  </div>
</template>

<script>
export default {
  name: 'home',
  methods: {
    transfer: function () {
      this.transferFunds(this.targetAmount, this.targetAddress)
    }
  },
  computed: {
    maxToTransfer: function () {
      this.amountToTransfer = (parseFloat(this.$store.state.balance) - this.commission).toFixed(2)
      if (this.amountToTransfer < 0) {
        this.amountToTransfer = 0
      }
      return this.amountToTransfer
    }
  },
  watch: {
    targetAmount (to, from) {
      this.finalAmount = (parseFloat(to) + 0.5).toFixed(2)
    },
    'language' (to, from) {
      this.$i18n.locale = to
    }
  },
  data () {
    return {
      finalAmount: 0,
      commission: 0.5,
      amountToTransfer: 0,
      targetAddress: '',
      targetAmount: ''
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

</style>
