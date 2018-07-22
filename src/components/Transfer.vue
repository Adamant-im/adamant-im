<template>
  <div class="transfer">
      <spinner v-if="isWaiting" />
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

          <md-input-container v-if="this.fixedAddress && this.crypto=='ETH'">
            <label>{{ $t('transfer.comments_label') }}</label>
            <md-input v-model="comments" maxlength='100'></md-input>
          </md-input-container>

          <md-layout md-align="center" md-gutter="16">
            <md-button class="md-raised md-primary send_funds_button" :title="$t('transfer.send_button_tooltip')" v-on:click="transfer">
              {{ $t('transfer.send_button') }}
            </md-button>
          </md-layout>
      </form>
      <md-snackbar md-position="bottom center" md-accent ref="transferSnackbar" md-duration="2000">
          <span>{{ formErrorMessage }}</span>
      </md-snackbar>
      <md-dialog-confirm
              :md-title="$t('transfer.confirm_title')"
              :md-content-html="confirmMessage"
              :md-ok-text="$t('transfer.confirm_approve')"
              :md-cancel-text="$t('transfer.confirm_cancel')"
              @close="onClose"
              ref="confirm_transfer_dialog">
      </md-dialog-confirm>
  </div>
</template>

<script>
import Spinner from './Spinner.vue'

import validateAddress from '../lib/validateAddress'
import { Cryptos, CryptoAmountPrecision, Fees } from '../lib/constants'
import { sendTokens, sendMessage } from '../lib/adamant-api'

export default {
  name: 'home',
  components: { Spinner },
  methods: {
    errorMessage (message, opts) {
      this.formErrorMessage = this.$t('transfer.' + message, opts)
      this.$refs.transferSnackbar.open()
    },
    onClose (type) {
      if (type !== 'ok') return

      this.isWaiting = true
      this.sendTokens().then(
        hash => {
          this.isWaiting = false

          if (!hash) {
            // No hash: transaction has been rejected
            this.errorMessage('error_transaction_send')
            return
          }

          if (this.fixedAddress) {
            // Go back to chat if we came from there
            this.$router.push({ name: 'Chat', params: { partner: this.fixedAddress } })
          } else {
            // View the newly created transaction
            const params = { crypto: this.crypto, tx_id: hash }
            this.$router.push({ name: 'Transaction', params })
          }
        },
        _ => {
          this.isWaiting = false
          this.errorMessage('error_transaction_send')
        }
      )
    },
    sendTokens () {
      if (this.crypto === Cryptos.ADM) {
        const promise = (this.comments && this.fixedAddress)
          ? sendMessage({ to: this.targetAddress, message: this.comments, amount: this.targetAmount })
          : sendTokens(this.targetAddress, this.targetAmount)
        return promise.then(result => result.transactionId)
      } else if (this.crypto === Cryptos.ETH) {
        return this.$store.dispatch('eth/sendTokens', {
          amount: this.targetAmount,
          admAddress: this.fixedAddress,
          ethAddress: this.targetAddress,
          comments: this.comments
        })
      }

      return Promise.resolve(null)
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
      if ((parseFloat(this.targetAmount) + parseFloat(this.commission)) > parseFloat(this.balance)) {
        this.errorMessage('error_not_enough')
        return
      }
      if (this.fixedAddress && this.crypto !== Cryptos.ADM && this.$store.state.balance < Fees.TRANSFER) {
        this.errorMessage('error_chat_fee', { crypto: this.crypto })
        return
      }
      this.$refs['confirm_transfer_dialog'].open()
    }
  },
  computed: {
    // TODO: !!!CHECK FOR POSSIBLE PROBLEMS
    // TODO: HAS BEEN OVERWRITTEN TO AVOID POSSIBLE SIDE EFFECTS
    maxToTransfer: function () {
      const multiplier = Math.pow(10, this.exponent)
      let localAmountToTransfer = (Math.floor((parseFloat(this.balance) - this.commission) * multiplier) / multiplier).toFixed(this.exponent)
      if (this.amountToTransfer < 0) {
        localAmountToTransfer = 0
      }
      return localAmountToTransfer
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
    confirmMessage () {
      let target = this.displayName || this.fixedAddress || this.targetAddress

      if (target !== this.targetAddress) {
        target += ' (' + this.targetAddress + ')'
      }

      const msgType = this.displayName ? 'transfer.confirm_message_with_name' : 'transfer.confirm_message'

      return this.$t(msgType, { amount: this.targetAmount, target, crypto: this.crypto })
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
      // amountToTransfer: 0,
      targetAddress: '',
      targetAmount: '',
      crypto: this.fixedCrypto || Cryptos.ADM,
      comments: '',
      isWaiting: false
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

  .md-button.send_funds_button {
    margin-top: 20px;
    background-color: #FFFFFF;
  }

  .md-button.send_funds_button:focus {
    background-color: #dfdfdf !important;
  }
</style>
