<template>
  <div class="send-funds-form">
    <v-form
      v-model="validForm"
      @submit.prevent="confirm"
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
        :label="currency"
        type="text"
        readonly
      />

      <v-text-field
        v-model.number="amount"
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
        @click="confirm"
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

    <v-dialog
      v-model="dialog"
    >
      <v-card>
        <v-card-title class="headline">{{ $t('transfer.confirm_title') }}</v-card-title>

        <v-card-text v-html="confirmMessage"/>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            flat="flat"
            @click="dialog = false"
          >
            {{ $t('transfer.confirm_cancel') }}
          </v-btn>

          <v-btn
            flat="flat"
            @click="submit"
          >
            {{ $t('transfer.confirm_approve') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { throttle } from 'underscore'
import { sendTokens, sendMessage } from '@/lib/adamant-api'
import { Cryptos, CryptoAmountPrecision, Fees, isErc20 } from '@/lib/constants'
import validateAddress from '@/lib/validateAddress'

/**
 * Returns sum with precision of two numbers.
 * @param {number} left
 * @param {number} right
 * @param {number} precision
 * @param {number}
 */
function sumWithPrecision (left, right, precision = 6) {
  return ((left * 10 * precision) + (right * 10 * precision)) / (10 * precision)
}

/**
 * Subtract with precision two numbers.
 * @param {number} left
 * @param {number} right
 * @param {number} precision
 * @param {number}
 */
function subtractWithPrecision (left, right, precision = 6) {
  return ((left * 10 * precision) - (right * 10 * precision)) / (10 * precision)
}

export default {
  created () {
    this.currency = this.cryptoCurrency
    this.address = this.recipientAddress
    this.amount = this.amountToSend
  },
  mounted () {
    this.fetchAddress = throttle(this.fetchUserCryptoAddress, 1000)
    this.fetchAddress()
  },
  watch: {
    address () {
      this.fetchAddress()
    },
    currency () {
      this.fetchAddress()
    }
  },
  computed: {
    transferFee () {
      if (this.currency === Cryptos.ADM) return Fees.ADM_TRANSFER

      return this.$store.getters[`${this.currency.toLowerCase()}/fee`]
    },
    finalAmount () {
      const amount = this.amount > 0 ? this.amount : 0

      const finalAmount = sumWithPrecision(
        amount,
        this.transferFee,
        this.exponent
      ).toFixed(this.exponent)

      return parseFloat(finalAmount)
    },
    balance () {
      return this.currency === Cryptos.ADM
        ? this.$store.state.balance
        : this.$store.state[this.currency.toLowerCase()].balance
    },
    maxToTransfer () {
      const fee = isErc20(this.currency) ? 0 : this.transferFee
      const maxToTransfer = subtractWithPrecision(
        this.balance,
        fee
      ).toFixed(this.exponent)

      return maxToTransfer > 0 ? parseFloat(maxToTransfer) : 0
    },
    cryptoAddress () {
      return this.currency === Cryptos.ADM
        ? ''
        : this.$store.getters['partners/cryptoAddress'](this.address, this.currency)
    },
    recipientName () {
      return this.$store.getters['partners/displayName'](this.address)
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
          v => !!v || this.$t('errors.fieldIsRequired'),
          v => this.finalAmount <= this.balance || this.$t('errors.notEnoughTokens')
        ]
      }
    },
    confirmMessage () {
      let target = this.recipientName || this.cryptoAddress

      if (target !== this.address) {
        target += ` (${this.address})`
      }

      const msgType = this.recipientName ? 'transfer.confirm_message_with_name' : 'transfer.confirm_message'
      return this.$t(msgType, { amount: this.amount, target, crypto: this.currency })
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
    dialog: false,
    fetchAddress: null // fn throttle
  }),
  methods: {
    confirm () {
      this.dialog = true
    },
    submit () {
      if (!this.$refs.form.validate()) return false

      this.freeze()
      this.sendFunds()
        .then(transactionId => {
          // @todo this check must be done inside `store`
          if (!transactionId) {
            throw new Error('No hash')
          }

          this.$emit('send', transactionId)
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
          ? sendMessage({ to: this.address, message: this.comment, amount: this.amount })
          : sendTokens(this.address, this.amount)
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
    },
    fetchUserCryptoAddress () {
      if (validateAddress('ADM', this.address)) {
        this.$store.dispatch('partners/fetchAddress', {
          crypto: this.currency,
          partner: this.address
        })
      }
    }
  },
  props: {
    cryptoCurrency: {
      type: String,
      default: 'ADM',
      validator: value => {
        return ['ADM', 'ETH', 'BNB'].includes(value)
      }
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
      "invalidCryptoAddress": "Incorrect wallet address",
      "notEnoughTokens": "Not enough tokens"
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
      "invalidCryptoAddress": "Неверный адрес кошелька",
      "notEnoughTokens": "Недостаточно токенов"
    }
  }
}
</i18n>
