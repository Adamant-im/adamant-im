<template>
  <navigation-wrapper
    :content-padding="false"
    :ready-to-show="isFulfilled"
    @scroll-content="onScroll"
  >
    <template #loader>
      <v-list-item v-if="isRecentLoading" style="position: absolute; top: 20px">
        <InlineSpinner />
      </v-list-item>
    </template>

    <router-view v-if="hasView" />

    <template v-else>
      <v-list v-if="hasTransactions" lines="three" bg-color="transparent">
        <transaction-list-item
          v-for="(transaction, i) in transactions"
          :id="transaction.id"
          :key="i"
          :sender-id="sender(transaction)"
          :recipient-id="recipient(transaction)"
          :timestamp="transaction.timestamp || NaN"
          :amount="transaction.amount"
          :crypto="crypto"
          :status="transaction.status"
          :text-data="transaction.data"
          @click:transaction="goToTransaction"
          @click:icon="goToChat"
        />
        <v-list-item>
          <InlineSpinner v-if="isOlderLoading" />
        </v-list-item>
      </v-list>

      <h3 v-else class="a-text-caption text-center mt-6">
        {{ t('transaction.no_transactions') }}
      </h3>
    </template>
  </navigation-wrapper>
</template>

<script lang="ts" setup>
import InlineSpinner from '@/components/InlineSpinner.vue'
import TransactionListItem from '@/components/TransactionListItem.vue'
import { isStringEqualCI } from '@/lib/textHelpers'
import { AllNodesDisabledError, AllNodesOfflineError } from '@/lib/nodes/utils/errors'
import { useSavedScroll } from '@/hooks/useSavedScroll'
import NavigationWrapper from '@/components/NavigationWrapper.vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { onBeforeRouteUpdate, RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import navigationGuard from '@/router/navigationGuard'
import { CoinTransaction } from '@/lib/nodes/types/transaction'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'

const props = withDefaults(
  defineProps<{
    crypto: string
  }>(),
  {
    crypto: 'ADM'
  }
)

const store = useStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const { hasView, sidebarLayoutRef } = useSavedScroll()

const isFulfilled = ref(false)
const isRejected = ref(false)

const cryptoModule = computed(() => {
  return props.crypto.toLowerCase()
})

const isRecentLoading = computed(() => store.getters[`${cryptoModule.value}/areRecentLoading`])

const isOlderLoading = computed(() => store.getters[`${cryptoModule.value}/areOlderLoading`])

const isLoginViaPassword = computed(() => store.getters['options/isLoginViaPassword'])
const isIDBReady = computed(() => store.state.IDBReady)
const transactions = computed(() => {
  const transactions: (CoinTransaction & { data?: string })[] =
    store.getters[`${cryptoModule.value}/sortedTransactions`]

  const address = store.state[props.crypto.toLowerCase()].address
  return transactions.filter((tx) => {
    // Filter invalid "fake" transactions (from chat rich message)
    return (
      Object.prototype.hasOwnProperty.call(tx, 'amount') &&
      (isStringEqualCI(tx.recipientId, address) || isStringEqualCI(tx.senderId, address))
    )
  })
})
const hasTransactions = computed(() => transactions.value && transactions.value.length > 0)
const nodes = computed<NodeStatusResult[]>(
  () => store.getters[`nodes/${props.crypto.toLowerCase()}`]
)
const areNodesDisabled = computed(() => nodes.value?.some((node) => node.status === 'disabled'))

onBeforeRouteUpdate((to, from, next) => {
  navigationGuard.transactions(to, from, next)
})

const getNewTransactions = () => {
  const doNotUpdate =
    (route.meta.previousRoute as RouteLocationNormalizedLoaded)?.params?.txId &&
    !isFulfilled.value &&
    (route.meta.previousPreviousRoute as RouteLocationNormalizedLoaded)?.name

  if (doNotUpdate) {
    isFulfilled.value = true
  } else {
    store
      .dispatch(`${cryptoModule.value}/getNewTransactions`)
      .then(() => {
        isFulfilled.value = true
      })
      .catch((err) => {
        isRejected.value = true
        let message = err.message
        if (err instanceof AllNodesOfflineError) {
          message = t('errors.all_nodes_offline', {
            crypto: err.nodeLabel.toUpperCase()
          })

          if (!areNodesDisabled.value) {
            return
          }
        } else if (err instanceof AllNodesDisabledError) {
          message = t('errors.all_nodes_disabled', {
            crypto: err.nodeLabel.toUpperCase()
          })
        }

        store.dispatch('snackbar/show', {
          message
        })
      })
  }
}

const onScroll = (event: Event) => {
  const target = event.target as HTMLElement

  const height = target.offsetHeight
  const scrollHeight = target.scrollHeight
  const scrollPosition = Math.ceil(target.scrollTop || 0)

  // If we've scrolled to the very bottom, fetch the older transactions from server
  if (!isOlderLoading.value && height + scrollPosition >= scrollHeight) {
    store.dispatch(`${cryptoModule.value}/getOldTransactions`)
  }
  // If we've scrolled to the very top, fetch the recent transactions from server
  if (!isRecentLoading.value && scrollPosition === 0) {
    getNewTransactions()
  }
}

const sender = (transaction: CoinTransaction & { senders?: string[] }) => {
  const { senders, senderId } = transaction
  const onlySender = senderId && (!senders || senders.length === 1)
  if (onlySender) {
    return senderId
  } else if (senders) {
    return formatAddresses(senders)
  }

  return ''
}

const recipient = (transaction: CoinTransaction & { recipients?: string[] }) => {
  const { recipientId, recipients } = transaction
  const onlyRecipient = recipientId && (!recipients || recipients.length === 1)
  if (onlyRecipient) {
    return recipientId
  } else if (recipients) {
    return formatAddresses(recipients)
  }

  return ''
}

const formatAddresses = (addresses: string[]) => {
  const count = addresses.length
  return addresses.includes(store.state[props.crypto.toLowerCase()].address)
    ? `${
        t('transaction.me') +
        ' (' +
        store.state[cryptoModule.value].address +
        ') ' +
        t('transaction.addresses', count - 1)
      }`
    : addresses[0] + ' ' + t('transaction.addresses', count - 1)
}

const goToTransaction = (transactionId: string) => {
  router.push({
    name: 'Transaction',
    params: {
      crypto: props.crypto,
      txId: transactionId
    }
  })
}

const goToChat = (partnerId: string) => {
  router.push({
    name: 'Chat',
    params: { partnerId }
  })
}

onMounted(() => {
  if (!isLoginViaPassword.value || isIDBReady.value) {
    getNewTransactions()
  }

  sidebarLayoutRef?.value.addEventListener('scroll', onScroll)
})

onBeforeUnmount(() => {
  sidebarLayoutRef?.value.removeEventListener('scroll', onScroll)
})

watch(isIDBReady, (newVal) => {
  if (newVal) {
    getNewTransactions()
  }
})
</script>
