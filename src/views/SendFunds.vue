<template>
  <navigation-wrapper :class="className">
    <send-funds-form
      ref="sendFundsFormRef"
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
import { computed, onBeforeMount, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

const store = useStore()
const route = useRoute()
const router = useRouter()

const className = 'send-funds'
const replacingPages = ['Chat', 'Chats', 'Options']
const replyToId = typeof route.query.replyToId === 'string' ? route.query.replyToId : undefined

const cryptoCurrency = ref(AllCryptos.ADM)
const recipientAddress = ref('')
const amountToSend = ref<number | undefined>(undefined)
const sendFundsFormRef = ref<any>()

const comeFromChat = computed(() => recipientAddress.value.length > 0)

onBeforeMount(() => {
  validateCryptoCurrency()
  validateRecipientAddress()
  validateAmountToSend()
})

onBeforeRouteLeave((to, from, next) => {
  const currentData = store.state.options.sendFundsData

  // if not from chats
  if (!comeFromChat.value) {
    const willBeReplaced = replacingPages.includes(to.name as string)

    store.commit('options/updateOption', {
      key: 'sendFundsData',
      value: {
        ...currentData,
        wasSendingFunds: willBeReplaced,
        cryptoCurrency: sendFundsFormRef.value?.currency,
        recipientAddress: sendFundsFormRef.value?.cryptoAddress,
        amountToSend: sendFundsFormRef.value?.amountString,
        increaseFee: sendFundsFormRef.value?.increaseFee
      }
    })
  } else {
    const isChatPath = to.path.includes('chats')
    const {
      amountString: formAmountString,
      comment: formComment,
      increaseFee: formIncreaseFee
    } = sendFundsFormRef.value || {}

    store.commit('options/updateOption', {
      key: 'sendFundsData',
      value: {
        ...currentData,
        amountFromChat: isChatPath ? '' : formAmountString,
        comment: isChatPath ? '' : formComment,
        increaseFeeChat: isChatPath ? false : formIncreaseFee
      }
    })
  }
  next()
})

const validateCryptoCurrency = () => {
  if (
    route.params.cryptoCurrency &&
    Object.keys(AllCryptos).includes(route.params.cryptoCurrency as string)
  ) {
    cryptoCurrency.value = route.params.cryptoCurrency as CryptoSymbol
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

