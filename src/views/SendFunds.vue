<template>
  <navigation-wrapper :class="className">
    <send-funds-form
      class="pt-5"
      :crypto-currency="cryptoCurrency"
      :recipient-address="recipientAddress"
      :amount-to-send="amountToSend"
      :address-readonly="comeFromChat"
      :reply-to-id="replyToId"
      @send="onSend"
      @error="onError"
    />
  </navigation-wrapper>
</template>

<script setup lang="ts">
import validateAddress from '@/lib/validateAddress'
import { isNumeric } from '@/lib/numericHelpers'

import SendFundsForm from '@/components/SendFundsForm.vue'
import { AllCryptos, CryptoSymbol } from '@/lib/constants/cryptos'
import { vibrate } from '@/lib/vibrate'
import NavigationWrapper from '@/components/NavigationWrapper.vue'
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

const store = useStore()
const route = useRoute()
const router = useRouter()

const className = 'send-funds'
const replacingPages = ['Chat', 'Chats', 'Options']
const replyToId = typeof route.query.replyToId === 'string' ? route.query.replyToId : undefined

const cryptoCurrency = ref(route.params.cryptoCurrency as string)
const recipientAddress = ref('')
const amountToSend = ref<number | undefined>(undefined)

const comeFromChat = computed(() => recipientAddress.value.length > 0)

onMounted(() => {
  validateCryptoCurrency()
  validateRecipientAddress()
  validateAmountToSend()
})

onBeforeRouteLeave((to, from, next) => {
  const willBeReplaced = replacingPages.includes(to.name as string)

  store.commit('options/updateOption', {
    key: 'wasSendingFunds',
    value: willBeReplaced
  })
  next()
})

const validateCryptoCurrency = () => {
  if (
    route.params.cryptoCurrency &&
    Object.keys(AllCryptos).includes(route.params.cryptoCurrency as string)
  ) {
    cryptoCurrency.value = route.params.cryptoCurrency as string
  }
}

const validateRecipientAddress = () => {
  if (validateAddress('ADM', route.params.recipientAddress as string)) {
    recipientAddress.value = route.params.recipientAddress as string
  }
}

const validateAmountToSend = () => {
  if (isNumeric(route.params.amountToSend)) {
    amountToSend.value = parseFloat(route.params.amountToSend as string)
  }
}

const onSend = (transactionId: string, crypto: CryptoSymbol) => {
  const userComeFrom = route.query.from as string

  vibrate.doubleVeryShort()

  if (userComeFrom) {
    router.replace(userComeFrom)
  } else {
    router.replace(`/transactions/${crypto}/${transactionId}`)
  }
}

const onError = (message: string) => {
  vibrate.tripleVeryShort()
  store.dispatch('snackbar/show', {
    message,
    timeout: 3000,
    variant: 'outlined'
  })
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
