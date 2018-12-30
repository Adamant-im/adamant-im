<template>
  <v-form
    v-model="validForm"
    @submit.prevent="submit"
    ref="form"
    class="send-funds-form"
  >

    <v-select
      v-model="currency"
      :items="cryptoList"
      :label="$t('selectCryptoCurrency')"
    />

    <v-text-field
      v-model="address"
      :rules="validationRulus.admAddress"
      :label="$t('admAddress')"
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
      :rules="validationRulus.amount"
      :label="$t('amount')"
      type="number"
    />

    <v-textarea
      v-model="comment"
      :label="$t('comments')"
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
      {{ $t('sendFunds') }}
    </v-btn>

  </v-form>
</template>

<script>
import validateAddress from '@/lib/validateAddress'
import { sendTokens, sendMessage } from '@/lib/adamant-api'
import { Cryptos, CryptoAmountPrecision, Fees, isErc20 } from '@/lib/constants'
import { isNumeric } from '@/lib/numericHelpers'

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
          title: this.$t('balance'),
          value: `${this.balance} ${this.currency}`
        },
        {
          title: this.$t('maxToTransfer'),
          value: `${this.maxToTransfer} ${this.currency}`
        },
        {
          title: this.$t('transferFee'),
          value: `${this.transferFee} ${this.currency}`
        },
        {
          title: this.$t('finalAmount'),
          value: `${this.finalAmount} ${this.currency}`
        }
      ]
    },
    cryptoList () {
      return Object.keys(Cryptos)
    },
    validationRulus () {
      return {
        admAddress: [
          v => !!v || this.$t('errors.fieldIsRequired'),
          v => validateAddress('ADM', v) || this.$t('errors.invalidCryptoAddress')
        ],
        amount: [
          v => !!v || this.$t('errors.fieldIsRequired')
        ]
      }
    }
  },
  data: () => ({
    currency: '',
    address: '',
    amount: 0,
    comment: '',

    validForm: true,
    disabledButton: false,
    showSpinner: false
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
      default: undefined
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

<i18n>
{
  "en": {
    "selectCryptoCurrency": "Cryptocurrency",
    "admAddress": "To address",
    "amount": "Amount to send",
    "comments": "Comments",
    "balance": "Balance",
    "maxToTransfer": "Max to transfer",
    "transferFee": "Transfer fee",
    "finalAmount": "Final amount",
    "sendFunds": "Send funds",
    "errors": {
      "fieldIsRequired": "Field is required",
      "invalidCryptoAddress": "Incorrect wallet address"
    }
  },
  "ru": {
    "selectCryptoCurrency": "Криптовалюта",
    "admAddress": "Адрес получателя",
    "amount": "Количество для перевода",
    "comments": "Комментарий",
    "balance": "Баланс",
    "maxToTransfer": "Макс. сумма перевода",
    "transferFee": "Комиссия за перевод",
    "finalAmount": "Количество, включая комиссию",
    "sendFunds": "Передать токены",
    "errors": {
      "fieldIsRequired": "Заполните это поле",
      "invalidCryptoAddress": "Неверный адрес кошелька"
    }
  }
}
</i18n>
