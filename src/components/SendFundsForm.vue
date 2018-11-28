<template>
  <v-form
    v-model="validForm"
    @submit.prevent="submit"
    ref="form"
    class="send-funds-form"
  >

    <v-text-field
      v-model="address"
      :rules="addressRules"
      label="Recipient address"
      type="text"
    />

    <v-text-field
      v-if="cryptoAddress"
      :value="cryptoAddress"
      :label="`To address (${currency})`"
      type="text"
      readonly
    />

    <v-text-field
      v-model="amount"
      :rules="amountRules"
      label="Amount to send"
      type="number"
    />

    <v-textarea
      v-model="comment"
      label="Comments"
      type="text"
      multi-line
    />

    <v-list class="list-info transparent">
      <v-list-tile v-for="item in listInfo" :key="item.title">
        <v-list-tile-content>
          <v-list-tile-sub-title>{{ item.title }}</v-list-tile-sub-title>
        </v-list-tile-content>

        <v-list-tile-action>
          <v-list-tile-title class="text-xs-right">{{ item.value }}</v-list-tile-title>
        </v-list-tile-action>
      </v-list-tile>
    </v-list>

    <v-btn
      :disabled="!validForm || disabledButton"
      @click="submit"
    >
      <v-progress-circular
        v-show="showSpinner"
        indeterminate
        color="primary"
        size="24"
        class="mr-3"
      />
      Send funds
    </v-btn>

  </v-form>
</template>

<script>
// @todo refactor store
import { sendTokens, sendMessage } from '@/lib/adamant-api'
import { Cryptos, CryptoAmountPrecision, Fees, isErc20 } from '@/lib/constants'

/**
 * Is number and not Infinity or NaN.
 *
 * @param {any} Number or string-number.
 */
function isNumeric (abstract) {
  return !isNaN(parseFloat(abstract)) && isFinite(abstract)
}

export default {
  created () {
    this.currency = this.cryptoCurrency
    this.address = this.recipientAddress
    this.amount = this.amountToSend
  },
  computed: {
    transferFee () {
      if (this.currency === Cryptos.ADM) return Fees.ADM_TRANSFER

      return this.$store.getters[`${this.currency.toLowerCase()}/fee`]
    },
    finalAmount () {
      var fixedPoint = this.exponent
      if (this.amount && this.amount.toString().indexOf('.') > -1) {
        fixedPoint = this.amount.toString().length - this.amount.toString().indexOf('.') - 1
        if (fixedPoint < this.exponent) {
          fixedPoint = this.exponent
        }
      }
      const commission = (this.currency === Cryptos.ADM || this.currency === Cryptos.ETH) ? this.transferFee : 0

      const finalAmount = (parseFloat(this.amount) + parseFloat(commission)).toFixed(fixedPoint)

      return isNumeric(finalAmount) ? finalAmount : commission
    },
    balance () {
      return this.currency === Cryptos.ADM
        ? this.$store.state.balance
        : this.$store.state[this.currency.toLowerCase()].balance
    },
    maxToTransfer () {
      const multiplier = Math.pow(10, this.exponent)
      const commission = isErc20(this.currency) ? 0 : this.transferFee
      let localAmountToTransfer = (Math.floor((parseFloat(this.balance) - commission) * multiplier) / multiplier).toFixed(this.exponent)
      if (localAmountToTransfer < 0) {
        localAmountToTransfer = 0
      }
      return localAmountToTransfer
    },
    cryptoAddress () {
      return this.cryptoCurrency === Cryptos.ADM
        ? this.recipientAddress
        : this.$store.getters['partners/cryptoAddress'](this.address, this.currency)
    },
    exponent () {
      return CryptoAmountPrecision[this.currency]
    },
    listInfo () {
      return [
        {
          title: 'Balance',
          value: `${this.balance} ${this.currency}`
        },
        {
          title: 'Max to transfer',
          value: `${this.maxToTransfer} ${this.currency}`
        },
        {
          title: 'Transfer fee',
          value: `${this.transferFee} ${this.currency}`
        },
        {
          title: 'Final amount',
          value: `${this.finalAmount} ${this.currency}`
        }
      ]
    }
  },
  data: () => ({
    currency: '',
    address: '',
    amount: 0,
    comment: '',

    validForm: true,
    disabledButton: false,
    showSpinner: false,

    addressRules: [
      v => !!v || 'Address is required'
    ],
    amountRules: [
      v => !!v || 'Amount is required'
    ]
  }),
  methods: {
    submit () {
      if (!this.$refs.form.validate()) return false

      this.freeze()
      this.sendFunds()
        .then(transactionId => {
          // @todo this check must be done inside `store`
          if (!transactionId) {
            throw new Error('No hash')
          }

          this.$emit('send')
        })
        .catch(err => {
          console.error(err)
          this.$store.dispatch('snackbar/show', {
            message: err.message
          })
        })
        .finally(() => {
          this.antiFreeze()
        })
    },
    sendFunds () {
      if (this.currency === Cryptos.ADM) {
        const promise = (this.comment && this.address)
          ? sendMessage({ to: this.cryptoAddress, message: this.comment, amount: this.amount })
          : sendTokens(this.cryptoAddress, this.amount)
        return promise.then(result => result.transactionId)
      } else {
        return this.$store.dispatch(this.currency.toLowerCase() + '/sendTokens', {
          amount: this.amount,
          admAddress: this.address,
          ethAddress: this.cryptoAddress,
          comments: this.comment
        })
      }
    },
    freeze () {
      this.disabledButton = true
      this.showSpinner = true
    },
    antiFreeze () {
      this.disabledButton = false
      this.showSpinner = false
    }
  },
  props: {
    cryptoCurrency: {
      type: String,
      default: ''
    },
    recipientAddress: {
      type: String,
      default: ''
    },
    amountToSend: {
      type: Number,
      default: null
    }
  }
}
</script>

<style scoped>
/**
 * Remove paddings.
 */
.list-info >>> .v-list__tile {
  padding: 0;
}
</style>
