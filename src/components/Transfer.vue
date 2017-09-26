<template>
  <div class="transfer">
        <div>Your balance is <span v-html="this.$store.state.balance"></span> HAZE</div>
      <form novalidate @submit.stop.prevent="submit">
          <md-input-container>
              <label>{{ $t('transfer.to_address_label') }}</label>
              <md-input v-model="targetAddress"></md-input>
          </md-input-container>
          <md-input-container>
              <label>{{ $t('transfer.amount_label') }}</label>
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
  },
  watch: {
    targetAmount (to, from) {
      this.finalAmount = (parseFloat(to) + 0.1).toFixed(2)
    },
    'language' (to, from) {
      this.$i18n.locale = to
    }
  },
  data () {
    return {
      finalAmount: 0,
      commission: 0.1,
      targetAddress: '',
      targetAmount: ''
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

</style>
