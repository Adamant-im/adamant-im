<template>
  <div :class="className" class="w-100">
    <app-toolbar-centered app :title="$t('home.send_btn')" flat absolute disable-max-width />

    <v-container fluid class="px-0 py-0" :class="`${className}__content`">
      <v-row justify="center" no-gutters>
        <container padding disable-max-width>
          <send-funds-form
            class="pt-5"
            :crypto-currency="cryptoCurrency"
            :recipient-address="recipientAddress"
            :amount-to-send="amountToSend"
            :address-readonly="comeFromChat"
            :reply-to-id="$route.query.replyToId"
            @send="onSend"
            @error="onError"
          />
        </container>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import validateAddress from '@/lib/validateAddress'
import { isNumeric } from '@/lib/numericHelpers'

import AppToolbarCentered from '@/components/AppToolbarCentered.vue'
import SendFundsForm from '@/components/SendFundsForm.vue'
import { AllCryptos } from '@/lib/constants/cryptos'
import { vibrate } from '@/lib/vibrate'

export default {
  components: {
    AppToolbarCentered,
    SendFundsForm
  },
  data: () => ({
    cryptoCurrency: AllCryptos.ADM,
    recipientAddress: '',
    amountToSend: undefined
  }),
  setup() {
    const className = 'send-funds'

    return {
      className
    }
  },
  computed: {
    comeFromChat() {
      return this.recipientAddress.length > 0
    }
  },
  created() {
    this.validateCryptoCurrency()
    this.validateRecipientAddress()
    this.validateAmountToSend()
  },
  methods: {
    validateCryptoCurrency() {
      if (
        this.$route.params.cryptoCurrency &&
        Object.keys(AllCryptos).includes(this.$route.params.cryptoCurrency)
      ) {
        this.cryptoCurrency = this.$route.params.cryptoCurrency
      }
    },
    validateRecipientAddress() {
      if (validateAddress('ADM', this.$route.params.recipientAddress)) {
        this.recipientAddress = this.$route.params.recipientAddress
      }
    },
    validateAmountToSend() {
      if (isNumeric(this.$route.params.amountToSend)) {
        this.amountToSend = parseFloat(this.$route.params.amountToSend)
      }
    },
    onSend(transactionId, crypto) {
      const userComeFrom = this.$route.query.from

      vibrate.doubleVeryShort()

      if (userComeFrom) {
        this.$router.replace(userComeFrom)
      } else {
        this.$router.replace(`/transactions/${crypto}/${transactionId}`)
      }
    },
    onError(message) {
      vibrate.tripleVeryShort()
      this.$store.dispatch('snackbar/show', {
        message,
        timeout: 3000,
        variant: 'outlined'
      })
    }
  }
}
</script>
<style scoped lang="scss">
.send-funds {
  position: relative;

  &__content {
    overflow-y: auto;
    height: calc(100vh - var(--v-layout-bottom) - var(--toolbar-height));
    padding-top: var(--toolbar-height);
  }
}
</style>
