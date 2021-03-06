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
        v-model.trim="cryptoAddress"
        :disabled="addressReadonly"
        @paste="onPasteURIAddress"
        class="a-input"
        type="text"
      >
        <template slot="label">
          <span v-if="recipientName && addressReadonly" class="font-weight-medium">
            {{ $t('transfer.to_name_label', { name: recipientName }) }}
          </span>
          <span v-else class="font-weight-medium">
            {{ $t('transfer.to_address_label') }}
          </span>
        </template>
        <template slot="append" v-if="!addressReadonly">
          <v-menu :offset-overflow="true" :offset-y="false" left>
            <v-icon slot="activator">mdi-dots-vertical</v-icon>
            <v-list>
              <v-list-tile @click="showQrcodeScanner = true">
                <v-list-tile-title>{{ $t('transfer.decode_from_camera') }}</v-list-tile-title>
              </v-list-tile>
              <v-list-tile class="v-list__tile--link">
                <v-list-tile-title>
                  <qrcode-capture @detect="onDetectQrcode" @error="onDetectQrcodeError">
                    <span>{{ $t('transfer.decode_from_image') }}</span>
                  </qrcode-capture>
                </v-list-tile-title>
              </v-list-tile>
            </v-list>
          </v-menu>
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
        <template slot="append">
          <v-menu :offset-overflow="true" :offset-y="false" left>
            <v-icon slot="activator">mdi-dots-vertical</v-icon>
            <v-list>
              <v-list-tile
                :key="item.title"
                @click="divideAmount(item.divider)"
                v-for="item in amountMenuItems"
              >
                <v-list-tile-title>{{ $t(item.title) }}</v-list-tile-title>
              </v-list-tile>
            </v-list>
          </v-menu>
        </template>
      </v-text-field>

      <v-text-field
        :value="`${this.transferFeeFixed} ${this.transferFeeCurrency}`"
        :label="`${this.transferFeeLabel}`"
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
        v-if="addressReadonly"
        v-model="comment"
        :label="$t('transfer.comments_label')"
        @paste="onPasteURIComment"
        class="a-input"
        counter
        maxlength="100"
      />

      <v-checkbox
        :label="$t('transfer.increase_fee')"
        color="grey darken-1"
        v-model="increaseFee"
        v-if="allowIncreaseFee"
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

    <qrcode-scanner-dialog
      @scan="onScanQrcode"
      v-if="showQrcodeScanner"
      v-model="showQrcodeScanner"
    />
  </div>
</template>

<script>
import QrcodeCapture from '@/components/QrcodeCapture'
import QrcodeScannerDialog from '@/components/QrcodeScannerDialog'
import get from 'lodash/get'
import { BigNumber } from 'bignumber.js'
import { INCREASE_FEE_MULTIPLIER } from '../lib/constants'

import { parseURI } from '@/lib/uri'
import { sendMessage } from '@/lib/adamant-api'
import { Cryptos, CryptoAmountPrecision, CryptoNaturalUnits, TransactionStatus as TS, isErc20, isFeeEstimate, isEthBased, getMinAmount, isSelfTxAllowed } from '@/lib/constants'
import validateAddress from '@/lib/validateAddress'
import { formatNumber, isNumeric } from '@/lib/numericHelpers'
import partnerName from '@/mixins/partnerName'

/**
 * @returns {string | boolean}
 */
function validateForm () {
  const errorMessage = Object
    .entries(this.validationRules)
    .flatMap(([property, validators]) => {
      const propertyValue = this[property]

      return validators
        .map(validator => validator.call(this, propertyValue))
        .filter(v => v !== true) // returns only errors
    })
    .slice(0, 1) // get first error
    .join() // array to string

  return errorMessage || true
}

export default {
  mixins: [partnerName],
  components: {
    QrcodeCapture,
    QrcodeScannerDialog
  },
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
      return this.calculateTransferFee(this.amount)
    },

    /**
     * String representation of `this.transferFee`
     * @returns {string}
     */
    transferFeeFixed () {
      return BigNumber(this.transferFee).toFixed()
    },

    /**
     * Label for fee field. Estimate fee or precise value.
     * @returns {string}
     */
    transferFeeLabel () {
      return isFeeEstimate(this.currency) ? this.$t('transfer.commission_estimate_label') : this.$t('transfer.commission_label')
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

      let amount = BigNumber(this.balance)
      // For BTC we keep 1000 satoshis (0.00001 BTC) untouched as there are problems when we try to drain the wallet
      if (this.currency === Cryptos.BTC) {
        amount = amount.minus(0.00001)
      }

      const amt = amount
        .minus(this.calculateTransferFee(this.balance))
        .toNumber()

      return Math.max(amt, 0)
    },
    /**
     * String representation of `this.maxToTransfer`
     * @returns {string}
     */
    maxToTransferFixed () {
      return formatNumber(this.exponent)(this.maxToTransfer)
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
      return this.getPartnerName(this.address)
    },
    exponent () {
      return CryptoAmountPrecision[this.currency]
    },
    cryptoList () {
      return Object.keys(Cryptos)
    },
    confirmMessage () {
      const msgType = this.recipientName && this.addressReadonly ? 'transfer.confirm_message_with_name' : 'transfer.confirm_message'

      return this.$t(msgType, {
        amount: BigNumber(this.amount).toFixed(),
        crypto: this.currency,
        name: this.recipientName,
        address: this.cryptoAddress,
        fee: this.transferFee
      })
    },
    validationRules () {
      return {
        cryptoAddress: [
          v => validateAddress(this.currency, v) || this.$t('transfer.error_incorrect_address', { crypto: this.currency }),
          v => (v !== this.ownAddress || isSelfTxAllowed(this.currency)) || this.$t('transfer.error_same_recipient')
        ],
        amount: [
          v => v > 0 || this.$t('transfer.error_incorrect_amount'),
          v => this.finalAmount <= this.balance || this.$t('transfer.error_not_enough'),
          v => this.validateMinAmount(v, this.currency) || this.$t('transfer.error_dust_amount'),
          v => this.validateNaturalUnits(v, this.currency) || this.$t('transfer.error_dust_amount'),
          v => isErc20(this.currency)
            ? this.ethBalance >= this.transferFee || this.$t('transfer.error_not_enough_eth_fee')
            : true
        ]
      }
    },
    allowIncreaseFee () {
      return (this.currency === Cryptos.BTC) || isEthBased(this.currency)
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
    amountMenuItems: [
      {
        divider: 10,
        title: 'transfer.amount_percent_10'
      },
      {
        divider: 3,
        title: 'transfer.amount_percent_33'
      },
      {
        divider: 2,
        title: 'transfer.amount_percent_50'
      },
      {
        divider: 1,
        title: 'transfer.amount_percent_100'
      }
    ],
    comment: '',
    validForm: true,
    disabledButton: false,
    showQrcodeScanner: false,
    showSpinner: false,
    dialog: false,
    fetchAddress: null, // fn throttle
    increaseFee: false
  }),
  methods: {
    confirm () {
      const abstract = validateForm.call(this)

      if (abstract === true) {
        this.dialog = true
      } else {
        this.$store.dispatch('snackbar/show', {
          message: abstract,
          timeout: 7000
        })
      }
    },

    /**
     * Handle successful address decode from a QR code
     * @param {string} address Address
     */
    onDetectQrcode (address) {
      this.onScanQrcode(address)
    },

    /**
     * Handle failed address decode from a QR code
     * @param {string} error Error instance
     */
    onDetectQrcodeError (error) {
      this.cryptoAddress = ''
      this.$store.dispatch('snackbar/show', {
        message: this.$t('transfer.invalid_qr_code')
      })
      console.warn(error)
    },

    /**
     * Parse address from an URI on paste text
     * @param {ClipboardEvent} e Event
     */
    onPasteURIAddress (e) {
      const data = e.clipboardData.getData('text')
      const address = parseURI(data).address

      if (validateAddress(this.currency, address)) {
        e.preventDefault()
        this.cryptoAddress = address
      } else {
        this.$emit('error', this.$t('transfer.error_incorrect_address', { crypto: this.currency }))
      }
    },

    /**
     * Parse comment from an URI on paste text
     * @param {string} e Event
     */
    onPasteURIComment (e) {
      this.$nextTick(() => {
        const params = parseURI(e.target.value).params

        if (params.message) {
          this.comment = params.message
        }
      })
    },

    /**
     * Parse info from an URI
     * @param {string} uri URI
     */
    onScanQrcode (uri) {
      const recipient = parseURI(uri)

      this.cryptoAddress = ''
      if (validateAddress(this.currency, recipient.address)) {
        this.cryptoAddress = recipient.address
        if (recipient.params.amount) {
          const amount = formatNumber(this.exponent)(recipient.params.amount)

          if (Number(amount) <= this.maxToTransfer) {
            this.amountString = amount
          }
        }
      } else {
        this.$emit('error', this.$t('transfer.error_incorrect_address', { crypto: this.currency }))
      }
    },
    submit () {
      this.disabledButton = true
      this.showSpinner = true

      return this.sendFunds()
        .then(transactionId => {
          if (!transactionId) {
            throw new Error(this.$t('transfer.error_no_hash'))
          }

          if (this.currency === Cryptos.ADM) {
            // push fast transaction if come from chat
            if (this.address) {
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
          let message = err.message
          if (this.currency === Cryptos.DASH && get(err, 'response.data.error.code') === -26) {
            message = this.$t('transfer.error_dust_amount')
          } else if (this.currency === Cryptos.ETH && /Invalid JSON RPC Response/i.test(message)) {
            message = this.$t('transfer.error_unknown')
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
        // 1. if come from Chat then sendMessage
        // 2. else send regular transaction with `type = 0`
        if (this.address) {
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
          comments: this.comment,
          fee: this.transferFee,
          increaseFee: this.increaseFee
        })
      }
    },

    /**
     * Divide amount by predefined value
     * @param {number} divider How much less to send
     */
    divideAmount (divider) {
      this.amountString = formatNumber(this.exponent)(this.maxToTransfer / divider)
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
    validateMinAmount (amount, currency) {
      const min = getMinAmount(currency)
      return amount > min
    },
    validateNaturalUnits (amount, currency) {
      const units = CryptoNaturalUnits[currency]

      const [ , right = '' ] = BigNumber(amount).toFixed().split('.')

      return right.length <= units
    },
    calculateTransferFee (amount) {
      const coef = this.increaseFee ? INCREASE_FEE_MULTIPLIER : 1
      return coef * this.$store.getters[`${this.currency.toLowerCase()}/fee`](amount)
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
.a-input >>> input[type=number]
  -moz-appearance: textfield
.a-input >>> input[type=number]::-webkit-inner-spin-button,
.a-input >>> input[type=number]::-webkit-outer-spin-button
  -webkit-appearance: none
.send-funds-form
  &__button
    margin-top: 15px
</style>
