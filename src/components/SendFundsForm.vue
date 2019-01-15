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
        :label="$t('transfer.crypto')"
      />

      <v-text-field
        v-model="address"
        :rules="validationRulus.admAddress"
        :label="$t('transfer.to_address_label')"
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
        :label="$t('transfer.amount_label')"
        type="number"
      />

      <v-textarea
        v-model="comment"
        :label="$t('transfer.comments_label')"
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
        {{ $t('transfer.send_button') }}
      </v-btn>

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
import { BigNumber } from 'bignumber.js'
import { sendTokens, sendMessage } from '@/lib/adamant-api'
import { Cryptos, CryptoAmountPrecision, Fees, isErc20 } from '@/lib/constants'
import validateAddress from '@/lib/validateAddress'

export default {
  created () {
    this.currency = this.cryptoCurrency
    this.address = this.recipientAddress
    this.amount = this.amountToSend
  },
  mounted () {
    this.fetchAddress = throttle(this.fetchUserCryptoAddress, 1000)
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

      const finalAmount = BigNumber.sum(amount, this.transferFee)
        .toFixed(this.exponent)

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
    cryptoAddress () {
      return this.currency === Cryptos.ADM
        ? ''
        : this.$store.getters['contacts/cryptoAddress'](this.address, this.currency)
    },
    recipientName () {
      return this.$store.getters['contacts/contactName'](this.address)
    },
    exponent () {
      return CryptoAmountPrecision[this.currency]
    },
    listInfo () {
      return [
        {
          title: this.$t('transfer.balance'),
          value: `${this.balance} ${this.currency}`
        },
        {
          title: this.$t('transfer.max_transfer'),
          value: `${this.maxToTransfer} ${this.currency}`
        },
        {
          title: this.$t('transfer.commission_label'),
          value: `${this.transferFee} ${this.currency}`
        },
        {
          title: this.$t('transfer.final_amount_label'),
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
          v => !!v || this.$t('transfer.error_field_is_required'),
          v => validateAddress('ADM', v) || this.$t('transfer.error_incorrect_address', { crypto: 'ADM' })
        ],
        amount: [
          v => !!v || this.$t('transfer.error_field_is_required'),
          v => this.finalAmount <= this.balance || this.$t('transfer.error_not_enough')
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
          this.dialog = false
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
      if (
        validateAddress('ADM', this.address) &&
        this.currency !== Cryptos.ADM
      ) {
        this.$store.dispatch('contacts/fetchCryptoAddress', {
          userId: this.address,
          cryptoCurrency: this.currency
        })
      }
    }
  },
  props: {
    cryptoCurrency: {
      type: String,
      default: 'ADM',
      validator: value => {
        const cryptos = Object.values(Cryptos)

        return cryptos.includes(value)
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
