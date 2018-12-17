<template>
  <v-layout row wrap justify-center>

    <v-flex lg4 md4 sm12 xs12>
      <send-funds-form
        :crypto-currency="cryptoCurrency"
        :recipient-address="recipientAddress"
        :amount-to-send="amountToSend"
        @send="onSend"
      />
    </v-flex>

  </v-layout>
</template>

<script>
import { Cryptos } from '@/lib/constants'
import validateAddress from '@/lib/validateAddress'
import { isNumeric } from '@/lib/numericHelpers'

import SendFundsForm from '@/components/SendFundsForm'

export default {
  created () {
    this.validateCryptoCurrency()
    this.validateRecipientAddress()
    this.validateAmountToSend()
  },
  computed: {
    cryptoAddress () {
      return this.cryptoCurrency === Cryptos.ADM
        ? this.$route.params.recipientAddress
        : this.$store.getters['partners/cryptoAddress'](this.$route.params.recipientAddress, this.cryptoCurrency)
    }
  },
  data: () => ({
    cryptoCurrency: Cryptos.ADM,
    recipientAddress: '',
    amountToSend: null
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
      if (validateAddress(this.cryptoCurrency, this.cryptoAddress)) {
        this.recipientAddress = this.$route.params.recipientAddress
      }
    },
    validateAmountToSend () {
      if (isNumeric(this.$route.params.amountToSend)) {
        this.amountToSend = parseFloat(this.$route.params.amountToSend)
      }
    },
    userComeFrom () {
      return this.$route.query.from
    },
    onSend (transactionId) {
      if (this.userComeFrom()) {
        this.$router.replace(this.$route.query.from)
      } else {
        this.$router.replace(`/transactions/${this.cryptoCurrency}/${transactionId}'`)
      }
    }
  },
  components: {
    SendFundsForm
  }
}
</script>
