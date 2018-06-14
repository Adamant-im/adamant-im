<template>
  <div class="transfer">

      <form novalidate @submit.stop.prevent="submit">
    	    <md-input-container>
              <md-select v-model="crypto" style="text-align: left;" :disabled="!!this.fixedCrypto">
                  <md-option v-for="c in cryptosList" v-bind:key="c" :value="c">
                      {{ c }}
                  </md-option>
              </md-select>
          </md-input-container>
          <md-input-container :title="!this.fixedAddress ? $t('transfer.to_address_label_tooltip') : ''">
              <label>{{ addressLabel }}</label>
              <md-input v-model="targetAddress" :readonly="!!this.fixedAddress"></md-input>
          </md-input-container>
          <md-layout>
            <md-layout>
              <md-input-container>
                <label style="text-align:left" class="amount-label">
                  {{ $t('transfer.amount_label') }} <span style="font-size: 10px;">(max: {{ maxToTransfer }} {{ crypto }})</span>
                </label>
                <md-input type="number" min=0 :max="maxToTransfer" v-model="targetAmount"></md-input>
              </md-input-container>
            </md-layout>
          </md-layout>

          <md-input-container>
              <label>{{ $t('transfer.commission_label') }}</label>
              <md-input type="number" readonly v-model="commission"></md-input>
          </md-input-container>
          <md-input-container>
              <label style="text-align:left">{{ $t('transfer.final_amount_label') }}</label>
              <md-input type="number" readonly v-model="finalAmount"></md-input>
          </md-input-container>
          <md-layout md-align="center" md-gutter="16">
              <md-button class="md-raised md-primary" :title="$t('transfer.send_button_tooltip')" v-on:click="transfer">{{ $t('transfer.send_button') }}</md-button>

          </md-layout>
      </form>
      <md-snackbar md-position="bottom center" md-accent ref="transferSnackbar" md-duration="2000">
          <span>{{ formErrorMessage }}</span>
      </md-snackbar>
      <md-dialog-confirm
              :md-title="$t('transfer.confirm_title')"
              :md-content-html="$t('transfer.confirm_message', { amount: targetAmount, target: receiver, crypto })"
              :md-ok-text="$t('transfer.confirm_approve')"
              :md-cancel-text="$t('transfer.confirm_cancel')"
              @close="onClose"
              ref="confirm_transfer_dialog">
      </md-dialog-confirm>
  </div>
</template>

<script>
import validateAddress from '../lib/validateAddress'
import { Cryptos, CryptoAmountPrecision, Fees } from '../lib/constants'

export default {
  name: 'home',
  methods: {
    errorMessage (message, opts) {
      this.formErrorMessage = this.$t('transfer.' + message, opts)
      this.$refs.transferSnackbar.open()
    },
    onClose (type) {
      if (type === 'ok') {
        if (this.crypto === Cryptos.ADM) {
          this.transferFunds(this.targetAmount, this.targetAddress)
        } else if (this.crypto === Cryptos.ETH) {
          this.$store.dispatch('eth/sendTokens', {
            amount: this.targetAmount,
            admAddress: this.fixedAddress,
            ethAddress: this.targetAddress
          }).then(hash => this.$router.push('/transactions/ETH/' + hash))
        }
      }
    },
    transfer: function () {
      if (!this.targetAddress) {
        this.errorMessage('error_no_address')
        return
      }
      if (!validateAddress(this.crypto, this.targetAddress)) {
        this.errorMessage('error_incorrect_address', { crypto: this.crypto })
        return
      }
      if (!this.targetAmount) {
        this.errorMessage('error_no_amount')
        return
      }
      if (this.targetAmount < 0) {
        this.errorMessage('error_incorrect_amount')
        return
      }
      if ((parseFloat(this.targetAmount) + this.commission) > parseFloat(this.balance)) {
        this.errorMessage('error_not_enough')
        return
      }
      this.$refs['confirm_transfer_dialog'].open()
    }
  },
  computed: {
    maxToTransfer: function () {
      const multiplier = Math.pow(10, this.exponent)
      this.amountToTransfer = (Math.floor((parseFloat(this.balance) - this.commission) * multiplier) / multiplier).toFixed(this.exponent)
      if (this.amountToTransfer < 0) {
        this.amountToTransfer = 0
      }
      return this.amountToTransfer
    },
    commission () {
      return this.crypto === Cryptos.ETH ? this.$store.state.eth.fee : Fees.TRANSFER
    },
    balance () {
      return this.crypto === Cryptos.ETH ? this.$store.state.eth.balance : this.$store.state.balance
    },
    exponent () {
      return CryptoAmountPrecision[this.crypto]
    },
    cryptosList () {
      return Object.keys(Cryptos)
    },
    displayName () {
      return this.$store.getters['partners/displayName'](this.fixedAddress)
    },
    addressLabel () {
      const displayName = this.displayName
      if (displayName) {
        return this.$t('transfer.to_label') + ' ' + displayName
      }

      if (this.fixedCrypto && this.fixedCrypto !== Cryptos.ADM) {
        return this.$t('transfer.to_label') + ' ' + this.fixedAddress
      }

      return this.$t('transfer.to_address_label')
    },
    receiver () {
      let name = this.displayName || this.fixedAddress

      if (name !== this.targetAddress) {
        name += ' (' + this.targetAddress + ')'
      }

      return name
    }
  },
  mounted () {
    if (!this.fixedCrypto || !this.fixedAddress) return

    this.targetAddress = (this.fixedCrypto === Cryptos.ADM)
      ? this.fixedAddress
      : this.$store.getters['partners/cryptoAddress'](this.fixedAddress, this.fixedCrypto)
  },
  watch: {
    targetAmount (to, from) {
      var fixedPoint = this.exponent
      if (to.toString().indexOf('.') > -1) {
        fixedPoint = to.toString().length - to.toString().indexOf('.') - 1
        if (fixedPoint < this.exponent) {
          fixedPoint = this.exponent
        }
      }
      this.finalAmount = (parseFloat(to) + parseFloat(this.commission)).toFixed(fixedPoint)
    },
    'language' (to, from) {
      this.$i18n.locale = to
    }
  },
  data () {
    return {
      finalAmount: 0,
      formErrorMessage: '',
      amountToTransfer: 0,
      targetAddress: '',
      targetAmount: '',
      crypto: this.fixedCrypto || Cryptos.ADM
    }
  },
  props: ['fixedCrypto', 'fixedAddress']
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

    .address-in-confirm {
        word-break: break-word;
    }
    .md-dialog-container.md-active .md-dialog {
        background: #fefefe;
    }
    .md-input-container.md-has-value input.md-input[readonly] {
        color: rgba(0, 0, 0, 0.54);
    }
    .transfer {
	margin-top: 80px;
    }
    .transfer form {
        max-width: 95%;
	margin: auto;
    }
    @media (max-width: 800px) {
        .transfer {
            padding-left: 1rem;
            padding-right: 1rem;
        }
        .amount-label {
          font-size: 12px;
        }
    }
</style>
