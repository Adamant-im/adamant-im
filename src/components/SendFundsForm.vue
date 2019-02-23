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
        :disabled="addressReadonly"
      />

      <v-text-field
        v-model="cryptoAddress"
        :rules="validationRules.cryptoAddress"
        :disabled="addressReadonly"
        type="text"
      >
        <template slot="label">
          <span v-if="addressReadonly && currency !== 'ADM'" class="font-weight-medium">
            {{ $t('transfer.to_label') }} {{ recipientName || address }}
          </span>
          <span v-else class="font-weight-medium">
            {{ $t('transfer.to_address_label') }}
          </span>
        </template>
      </v-text-field>

      <v-text-field
        v-model="amountString"
        :rules="validationRules.amount"
        type="number"
      >
        <template slot="label">
          <span class="font-weight-medium">{{ $t('transfer.amount_label') }}</span>
          <span class="body-1">
            {{ `(max: ${maxToTransferFixed} ${currency})` }}
          </span>
        </template>
      </v-text-field>

      <v-text-field
        :value="`${this.transferFeeFixed} ${this.currency}`"
        :label="$t('transfer.commission_label')"
        disabled
      />
      <v-text-field
        :value="`${this.finalAmountFixed} ${this.currency}`"
        :label="$t('transfer.final_amount_label')"
        disabled
      />

      <v-text-field
        v-if="this.address"
        v-model="comment"
        :label="$t('transfer.comments_label')"
        counter
        maxlength="100"
      />

      <div class="text-xs-center">
        <v-btn
          :disabled="!validForm || disabledButton || !amount"
          @click="confirm"
        >
          <v-progress-circular
            v-show="showSpinner"
            indeterminate
            color="primary"
            size="24"
            class="mr-3"
          />
          {{ $t('transfer.send_button') }}
        </v-btn>
      </div>

    </v-form>

    <v-dialog
      v-model="dialog"
      width="500"
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

          <v-btn @click="submit">
            {{ $t('transfer.confirm_approve') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { BigNumber } from 'bignumber.js'

import { sendMessage } from '@/lib/adamant-api'
import { Cryptos, CryptoAmountPrecision, CryptoNaturalUnits, TransactionStatus as TS } from '@/lib/constants'
import validateAddress from '@/lib/validateAddress'
import { isNumeric } from '@/lib/numericHelpers'

export default {
  created () {
    this.currency = this.cryptoCurrency
    this.address = this.recipientAddress
    this.amount = this.amountToSend
  },
  mounted () {
    this.fetchUserCryptoAddress()
  },
  computed: {
    /**
     * @returns {number}
     */
    transferFee () {
      return this.$store.getters[`${this.currency.toLowerCase()}/fee`]
    },

    /**
     * String representation of `this.transferFee`
     * @returns {string}
     */
    transferFeeFixed () {
      return BigNumber(this.transferFee).toFixed()
    },

    /**
     * @returns {number}
     */
    finalAmount () {
      return BigNumber.sum(this.amount, this.transferFee)
        .toNumber()
    },

    /**
     * String representation of `this.finalAmount`
     * @returns {string}
     */
    finalAmountFixed () {
      return BigNumber(this.finalAmount).toFixed()
    },

    /**
     * Return balance of specific cryptocurrency
     * @returns {number}
     */
    balance () {
      return this.currency === Cryptos.ADM
        ? this.$store.state.balance
        : this.$store.state[this.currency.toLowerCase()].balance
    },

    /**
     * @returns {number}
     */
    maxToTransfer () {
      if (this.balance < this.transferFee) return 0

      return BigNumber(this.balance)
        .minus(this.transferFee)
        .toNumber()
    },

    /**
     * String representation of `this.maxToTransfer`
     * @returns {string}
     */
    maxToTransferFixed () {
      return BigNumber(this.maxToTransfer).toFixed() // ??? this.exponent
    },

    /**
     * Own address depending on selected currency
     * @returns {string}
     */
    ownAddress () {
      return this.$store.state[this.currency.toLowerCase()].address
    },
    recipientName () {
      if (this.currency === Cryptos.ADM) {
        return this.$store.getters['partners/displayName'](this.cryptoAddress)
      }
    },
    exponent () {
      return CryptoAmountPrecision[this.currency]
    },
    cryptoList () {
      return Object.keys(Cryptos)
    },
    validationRules () {
      const fieldRequired = v => !!v || this.$t('transfer.error_field_is_required')

      return {
        cryptoAddress: [
          fieldRequired,
          v => validateAddress(this.currency, v) || this.$t('transfer.error_incorrect_address', { crypto: this.currency })
        ],
        amount: [
          fieldRequired,
          v => v > 0 || this.$t('transfer.error_incorrect_amount'),
          v => this.finalAmount <= this.balance || this.$t('transfer.error_not_enough'),
          v => this.validateNaturalUnits(v, this.currency) || this.$t('transfer.error_natural_units')
        ]
      }
    },
    confirmMessage () {
      let target = this.cryptoAddress

      if (this.recipientName) {
        target += ` (${this.recipientName})`
      }

      const msgType = this.recipientName ? 'transfer.confirm_message_with_name' : 'transfer.confirm_message'
      return this.$t(msgType, { amount: BigNumber(this.amount).toFixed(), target, crypto: this.currency })
    }
  },
  watch: {
    amountString (value) {
      if (isNumeric(value) && value > 0) {
        this.amount = +value
      } else {
        this.amount = 0
      }
    }
  },
  data: () => ({
    currency: '',
    address: '',
    cryptoAddress: '',
    amountString: '',
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

      this.disabledButton = true
      this.showSpinner = true

      return this.sendFunds()
        .then(transactionId => {
          if (!transactionId) {
            throw new Error('No hash')
          }

          // send message if come from chat
          if (this.address) {
            this.pushTransactionToChat(transactionId)
          }

          this.$emit('send', transactionId, this.currency)
        })
        .catch(err => {
          console.error(err)
          this.$emit('error', err.message || err)
        })
        .finally(() => {
          this.disabledButton = false
          this.showSpinner = false
          this.dialog = false
        })
    },
    sendFunds () {
      if (this.ownAddress !== this.cryptoAddress) {
        if (this.currency === Cryptos.ADM) {
          let promise
          if (this.address) { // if come from chat
            promise = sendMessage({
              amount: this.amount,
              message: this.comment,
              to: this.cryptoAddress
            })
          } else {
            promise = this.$store.dispatch('adm/sendTokens', {
              address: this.cryptoAddress,
              amount: this.amount
            })
          }
          return promise.then(result => result.transactionId)
        } else {
          return this.$store.dispatch(this.currency.toLowerCase() + '/sendTokens', {
            amount: this.amount,
            admAddress: this.address,
            address: this.cryptoAddress,
            comments: this.comment
          })
        }
      } else {
        return Promise.reject(
          this.$t('transfer.error_same_recipient')
        )
      }
    },
    pushTransactionToChat (transactionId) {
      let amount = this.amount

      // unformat ADM `amount`
      if (this.currency === Cryptos.ADM) {
        amount = amount * 1e8
      }

      this.$store.dispatch('chat/pushTransaction', {
        transactionId,
        hash: transactionId,
        recipientId: this.address,
        type: this.currency,
        status: TS.PENDING,
        amount,
        comment: this.comment
      })
    },
    fetchUserCryptoAddress () {
      if (this.currency === Cryptos.ADM) {
        this.cryptoAddress = this.address

        return
      }

      if (validateAddress('ADM', this.address)) {
        this.$store.dispatch('partners/fetchAddress', {
          crypto: this.currency,
          partner: this.address
        }).then(address => {
          this.cryptoAddress = address
        })
      }
    },
    validateNaturalUnits (amount, currency) {
      const units = CryptoNaturalUnits[currency]

      const [ , right = '' ] = BigNumber(amount).toFixed().split('.')

      return right.length <= units
    }
  },
  filters: {
    /**
     * @param {BigNumber} bigNumber
     */
    toFixed: bigNumber => bigNumber.toFixed()
  },
  props: {
    cryptoCurrency: {
      type: String,
      default: 'ADM',
      validator: value => value in Cryptos
    },
    recipientAddress: {
      type: String,
      default: ''
    },
    amountToSend: {
      type: Number,
      default: 0
    },
    addressReadonly: {
      type: Boolean,
      default: false
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
