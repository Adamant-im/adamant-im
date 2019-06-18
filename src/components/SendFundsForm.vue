<template>
  <div :class="className">
    <v-form
      v-model="validForm"
      @submit.prevent="confirm"
      ref="form"
    >

      <v-select
        v-model="currency"
        class="a-input"
        :items="cryptoList"
        :disabled="addressReadonly"
      />

      <v-text-field
        v-model="cryptoAddress"
        :disabled="addressReadonly"
        class="a-input"
        type="text"
      >
        <template slot="label">
          <span v-if="recipientName" class="font-weight-medium">
            {{ $t('transfer.to_name_label', { name: recipientName }) }}
          </span>
          <span v-else class="font-weight-medium">
            {{ $t('transfer.to_address_label') }}
          </span>
        </template>
      </v-text-field>

      <v-text-field
        v-model="amountString"
        class="a-input"
        :max="maxToTransfer"
        :min="minToTransfer"
        :step="minToTransfer"
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
        :value="`${this.transferFeeFixed} ${this.transferFeeCurrency}`"
        :label="$t('transfer.commission_label')"
        class="a-input"
        disabled
      />
      <v-text-field
        :value="`${this.finalAmountFixed} ${this.currency}`"
        :label="$t('transfer.final_amount_label')"
        class="a-input"
        v-if="!this.hideFinalAmount"
        disabled
      />

      <v-text-field
        v-if="this.address"
        v-model="comment"
        :label="$t('transfer.comments_label')"
        class="a-input"
        counter
        maxlength="100"
      />

      <div class="text-xs-center">
        <v-btn
          :class="`${className}__button`"
          @click="confirm"
          class="a-btn-primary"
        >
          {{ $t('transfer.send_button') }}
        </v-btn>
      </div>

    </v-form>

    <v-dialog
      v-model="dialog"
      width="500"
    >
      <v-card>
        <v-card-title class="a-text-header">{{ $t('transfer.confirm_title') }}</v-card-title>

        <v-divider class="a-divider"></v-divider>

        <v-card-text class="a-text-regular-enlarged" v-html="confirmMessage"/>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            class="a-btn-regular"
            flat
            @click="dialog = false"
          >
            {{ $t('transfer.confirm_cancel') }}
          </v-btn>

          <v-btn
            class="a-btn-regular"
            flat
            @click="submit"
            :disabled="disabledButton"
          >
            <v-progress-circular
              v-show="showSpinner"
              indeterminate
              color="primary"
              size="24"
              class="mr-3"
            />
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
import { Cryptos, CryptoAmountPrecision, CryptoNaturalUnits, TransactionStatus as TS, isErc20 } from '@/lib/constants'
import validateAddress from '@/lib/validateAddress'
import { isNumeric } from '@/lib/numericHelpers'

/**
 * @returns {string | boolean}
 */
function validateForm () {
  const errorMessage = Object
    .entries(this.validationRules)
    .flatMap(([property, validators]) => {
      const propertyValue = this[property]

      return validators
        .map(validator => {
          return validator.call(this, propertyValue)
        })
        .filter(v => v !== true) // returns only errors
    })
    .slice(0, 1) // get first error
    .join() // array to string

  return errorMessage || true
}

export default {
  created () {
    this.currency = this.cryptoCurrency
    this.address = this.recipientAddress
    this.amount = this.amountToSend

    // create watcher after setting default from props
    this.$watch('currency', () => {
      this.$refs.form.validate()
    })
  },
  mounted () {
    this.fetchUserCryptoAddress()
  },
  computed: {
    className: () => 'send-funds-form',

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
     * Transfer currency (may differ from the amount currency in case of ERC-20 tokens)
     * @returns {string}
     */
    transferFeeCurrency () {
      return isErc20(this.currency) ? Cryptos.ETH : this.currency
    },

    /**
     * @returns {number}
     */
    finalAmount () {
      return isErc20(this.currency)
        ? this.amount
        : BigNumber.sum(this.amount, this.transferFee).toNumber()
    },

    /**
     * String representation of `this.finalAmount`
     * @returns {string}
     */
    finalAmountFixed () {
      return BigNumber(this.finalAmount).toFixed()
    },

    /**
     * Indicates whether final amount field should be hidden (e.g., for the ERC20 tokens)
     * @returns {boolean}
     */
    hideFinalAmount () {
      return isErc20(this.currency)
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

    ethBalance () {
      return this.$store.state.eth.balance
    },

    /**
     * @returns {number}
     */
    maxToTransfer () {
      // ERC20 tokens are feed in ETH, so the fee itself does not affect balance
      if (isErc20(this.currency)) {
        return this.balance
      }

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
     * Minimum amount to transfer
     * @returns {number}
     */
    minToTransfer () {
      return 10 ** (this.exponent * -1)
    },

    /**
     * Own address depending on selected currency
     * @returns {string}
     */
    ownAddress () {
      return this.$store.state[this.currency.toLowerCase()].address
    },
    recipientName () {
      return this.$store.getters['partners/displayName'](this.address)
    },
    exponent () {
      return CryptoAmountPrecision[this.currency]
    },
    cryptoList () {
      return Object.keys(Cryptos)
    },
    confirmMessage () {
      const msgType = this.recipientName ? 'transfer.confirm_message_with_name' : 'transfer.confirm_message'

      return this.$t(msgType, {
        amount: BigNumber(this.amount).toFixed(),
        crypto: this.currency,
        name: this.recipientName,
        address: this.cryptoAddress
      })
    },
    validationRules () {
      return {
        cryptoAddress: [
          v => validateAddress(this.currency, v) || this.$t('transfer.error_incorrect_address', { crypto: this.currency }),
          v => v !== this.ownAddress || this.$t('transfer.error_same_recipient')
        ],
        amount: [
          v => v > 0 || this.$t('transfer.error_incorrect_amount'),
          v => this.finalAmount <= this.balance || this.$t('transfer.error_not_enough'),
          v => this.validateNaturalUnits(v, this.currency) || this.$t('transfer.error_natural_units'),
          v => isErc20(this.currency)
            ? this.ethBalance >= this.transferFee || this.$t('transfer.error_not_enough_eth_fee')
            : true
        ]
      }
    },
    hasComment () {
      return this.comment.length > 0
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
      const abstract = validateForm.call(this)

      if (abstract === true) {
        this.dialog = true
      } else {
        this.$store.dispatch('snackbar/show', {
          message: abstract,
          timeout: 3000
        })
      }
    },
    submit () {
      this.disabledButton = true
      this.showSpinner = true

      return this.sendFunds()
        .then(transactionId => {
          if (!transactionId) {
            throw new Error('No hash')
          }

          if (this.currency === Cryptos.ADM) {
            // push fast transaction if come from chat
            if (this.address && this.hasComment) {
              this.pushTransactionToChat(transactionId, this.cryptoAddress)
            }
          } else { // other cryptos
            // if come from chat
            if (this.address) {
              this.pushTransactionToChat(transactionId, this.address)
            }
          }

          this.$emit('send', transactionId, this.currency)
        })
        .catch(err => {
          console.error(err)
          let message = err.message
          if (err.response.status === 500 && err.response.data.error.code === -26) {
            message = this.$t('transfer.error_dust_amount')
          }
          this.$emit('error', message)
        })
        .finally(() => {
          this.disabledButton = false
          this.showSpinner = false
          this.dialog = false
        })
    },
    sendFunds () {
      if (this.currency === Cryptos.ADM) {
        let promise
        // 1. sendMessage if come from Chat and Comment Field is not empty
        // 2. else send regular transaction with `type = 0`
        if (this.address && this.hasComment) {
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
    },
    pushTransactionToChat (transactionId, adamantAddress) {
      let amount = this.amount

      // unformat ADM `amount`
      if (this.currency === Cryptos.ADM) {
        amount = amount * 1e8
      }

      this.$store.dispatch('chat/pushTransaction', {
        transactionId,
        hash: transactionId,
        recipientId: adamantAddress,
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

<style lang="stylus" scoped>
.send-funds-form
  &__button
    margin-top: 15px
</style>
