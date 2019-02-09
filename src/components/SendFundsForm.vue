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
            {{ $t('transfer.to_label') }} {{ recipientName || address  }}
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
            (max: {{ maxToTransfer }} {{ currency }})
          </span>
        </template>
      </v-text-field>

      <v-text-field
        :value="`${this.transferFee} ${this.currency}`"
        :label="$t('transfer.commission_label')"
        disabled
      />
      <v-text-field
        :value="`${this.finalAmount} ${this.currency}`"
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

import { sendTokens, sendMessage } from '@/lib/adamant-api'
import { Cryptos, CryptoAmountPrecision, Fees, isErc20, CryptoNaturalUnits } from '@/lib/constants'
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
    transferFee () {
      if (this.currency === Cryptos.ADM) return Fees.ADM_TRANSFER

      return this.$store.getters[`${this.currency.toLowerCase()}/fee`]
    },
    finalAmount () {
      const amount = this.amount > 0 ? this.amount : 0

      const finalAmount = BigNumber.sum(amount, this.transferFee)
        .toFixed()

      return parseFloat(finalAmount)
    },
    balance () {
      return this.currency === Cryptos.ADM
        ? this.$store.state.balance
        : this.$store.state[this.currency.toLowerCase()].balance
    },
    maxToTransfer () {
      const fee = isErc20(this.currency) ? 0 : this.transferFee

      const maxToTransfer = BigNumber(this.balance)
        .minus(fee)
        .toFixed(this.exponent)

      return maxToTransfer > 0 ? parseFloat(maxToTransfer) : 0
    },
    recipientName () {
      return this.$store.getters['contacts/contactName'](this.address)
    },
    exponent () {
      return CryptoAmountPrecision[this.currency]
    },
    cryptoList () {
      return Object.keys(Cryptos)
    },
    validationRules () {
      return {
        cryptoAddress: [
          v => !!v || this.$t('transfer.error_field_is_required'),
          v => validateAddress(this.currency, v) || this.$t('transfer.error_incorrect_address', { crypto: this.currency })
        ],
        amount: [
          v => !!v || this.$t('transfer.error_field_is_required'),
          v => v > 0 || this.$t('transfer.error_incorrect_amount'),
          v => this.finalAmount <= this.balance || this.$t('transfer.error_not_enough'),
          v => this.validateNaturalUnits(v, this.currency) || this.$t('transfer.error_natural_units')
        ]
      }
    },
    confirmMessage () {
      let target = this.recipientName || this.cryptoAddress

      if (this.address && target !== this.address) {
        target += ` (${this.address})`
      }

      const msgType = this.recipientName ? 'transfer.confirm_message_with_name' : 'transfer.confirm_message'
      return this.$t(msgType, { amount: BigNumber(this.amount).toFixed(), target, crypto: this.currency })
    }
  },
  watch: {
    amountString (value) {
      if (isNumeric(value)) {
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

      this.freeze()
      this.sendFunds()
        .then(transactionId => {
          // @todo this check must be done inside `store`
          if (!transactionId) {
            throw new Error('No hash')
          }

          // send message if come from chat
          if (this.address) {
            this.pushTransactionToChat(transactionId)
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
          this.dialog = false
        })
    },
    sendFunds () {
      if (this.currency === Cryptos.ADM) {
        const promise = this.address // if come from chat
          ? sendMessage({ to: this.cryptoAddress, message: this.comment, amount: this.amount })
          : sendTokens(this.cryptoAddress, this.amount)
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
        status: 'confirmed',
        amount,
        comment: this.comment
      })
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
      if (this.currency === Cryptos.ADM) {
        this.cryptoAddress = this.address

        return
      }

      if (validateAddress('ADM', this.address)) {
        this.$store.dispatch('contacts/fetchCryptoAddress', {
          userId: this.address,
          cryptoCurrency: this.currency
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
      default: undefined
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
