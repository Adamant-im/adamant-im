<template>
  <div>
    <app-toolbar-centered
      app
      :title="$t('home.send_btn')"
      flat
    />

    <v-container fluid>
      <v-layout row wrap justify-center>

        <container>

          <send-funds-form
            :crypto-currency="cryptoCurrency"
            :recipient-address="recipientAddress"
            :amount-to-send="amountToSend"
            :address-readonly="comeFromChat"
            @send="onSend"
            @error="onError"
          />

        </container>

      </v-layout>
    </v-container>
  </div>
</template>

<script>
import { Cryptos } from '@/lib/constants'
import validateAddress from '@/lib/validateAddress'
import { isNumeric } from '@/lib/numericHelpers'

import AppToolbarCentered from '@/components/AppToolbarCentered'
import SendFundsForm from '@/components/SendFundsForm'

export default {
  created () {
    this.validateCryptoCurrency()
    this.validateRecipientAddress()
    this.validateAmountToSend()
  },
  computed: {
    comeFromChat () {
      return this.recipientAddress.length > 0
    }
  },
  data: () => ({
    cryptoCurrency: Cryptos.ADM,
    recipientAddress: '',
    amountToSend: undefined
  }),
  methods: {
    validateCryptoCurrency () {
      if (
        this.$route.params.cryptoCurrency &&
        Object.keys(Cryptos).includes(this.$route.params.cryptoCurrency)
      ) {
        this.cryptoCurrency = this.$route.params.cryptoCurrency
      }
    },
    validateRecipientAddress () {
      if (validateAddress('ADM', this.$route.params.recipientAddress)) {
        this.recipientAddress = this.$route.params.recipientAddress
      }
    },
    validateAmountToSend () {
      if (isNumeric(this.$route.params.amountToSend)) {
        this.amountToSend = parseFloat(this.$route.params.amountToSend)
      }
    },
    onSend (transactionId, crypto) {
      const userComeFrom = this.$route.query.from

      if (userComeFrom) {
        this.$router.replace(userComeFrom)
      } else {
        this.$router.replace(`/transactions/${crypto}/${transactionId}`)
      }
    },
    onError (message) {
      this.$store.dispatch('snackbar/show', { message })
    }
  },
  components: {
    AppToolbarCentered,
    SendFundsForm
  }
}
</script>
