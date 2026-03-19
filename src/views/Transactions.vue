<template>
  <navigation-wrapper
    :class="{
      [`${className}--empty`]: !hasView && !hasTransactions,
      [`${className}--list-loading`]: !hasView && hasTransactions && isRecentLoading,
      [`${className}--detail-loading`]: hasView && isRecentLoading
    }"
    :content-padding="false"
    :ready-to-show="isFulfilled"
    @scroll-content="onScroll"
  >
    <template #loader>
      <v-list-item
        v-if="isRecentLoading"
        :class="[`${className}__loading-item`, `${className}__loading-item--recent`]"
      >
        <InlineSpinner />
      </v-list-item>
    </template>

    <router-view v-if="hasView" />

    <div v-show="!hasView">
      <v-list
        v-if="hasTransactions"
        lines="three"
        bg-color="transparent"
        :class="`${className}__list`"
      >
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
        <v-list-item :class="`${className}__loading-item`">
          <InlineSpinner v-if="isOlderLoading" />
        </v-list-item>
      </v-list>

      <h3 v-else :class="`${className}__empty-state`">
        {{ t('transaction.no_transactions') }}
      </h3>
    </div>
  </navigation-wrapper>
</template>

<script lang="ts" setup>
import InlineSpinner from '@/components/InlineSpinner.vue'
import TransactionListItem from '@/components/TransactionListItem.vue'
import { isStringEqualCI } from '@/lib/textHelpers'
import { AllNodesDisabledError, AllNodesOfflineError } from '@/lib/nodes/utils/errors'
import { useAccountViewState } from '@/hooks/useAccountViewState'
import NavigationWrapper from '@/components/NavigationWrapper.vue'
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch
} from 'vue'
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
const className = 'transactions-view'

const hasView = computed(() => route.matched.length > 2)
const transactionListScrollTop = ref(0)
const { sidebarLayoutRef, isRestoringAccountScroll } = useAccountViewState()
const applySidebarScrollTop = async (top: number) => {
  await nextTick()
  await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
  sidebarLayoutRef?.value?.scrollTo({ top })
  await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
  sidebarLayoutRef?.value?.scrollTo({ top })
}

const isFulfilled = ref(false)
const isRejected = ref(false)
const activeCrypto = ref(props.crypto)

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
const areNodesOnline = computed(() => nodes.value?.some((node) => node.status === 'online'))
const isOnline = computed(() => store.getters['isOnline'])

onBeforeRouteUpdate((to, from) => {
  if (to.name !== 'Transactions') return
  return navigationGuard.transactions(to, from)
})

const getNewTransactions = () => {
  const doNotUpdate =
    (route.meta.previousRoute as RouteLocationNormalizedLoaded)?.params?.txId &&
    !isFulfilled.value &&
    (route.meta.previousPreviousRoute as RouteLocationNormalizedLoaded)?.name &&
    (route.meta.previousRoute as RouteLocationNormalizedLoaded)?.params?.crypto ===
      cryptoModule.value.toUpperCase()

  if (doNotUpdate) {
    isFulfilled.value = true
  } else {
    const fetchingCrypto = cryptoModule.value
    activeCrypto.value = props.crypto
    store
      .dispatch(`${fetchingCrypto}/getNewTransactions`)
      .then(() => {
        if (cryptoModule.value === fetchingCrypto) {
          isFulfilled.value = true
        }
      })
      .catch((err) => {
        if (cryptoModule.value !== fetchingCrypto) return
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
  if (isRestoringAccountScroll.value) {
    return
  }

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

const handleLoading = (isConnected: boolean) => {
  if (isConnected && isRecentLoading.value) getNewTransactions()
  if (isConnected && isOlderLoading.value)
    store.dispatch(`${cryptoModule.value}/getOldTransactions`)
}

const addScrollListener = () => {
  sidebarLayoutRef?.value?.addEventListener('scroll', onScroll)
}
const removeScrollListener = () => {
  sidebarLayoutRef?.value?.removeEventListener('scroll', onScroll)
}

onMounted(() => {
  if (!isLoginViaPassword.value || isIDBReady.value) {
    getNewTransactions()
  }

  addScrollListener()
})

onActivated(async () => {
  if (store.state.options.forceTransactionsRefresh) {
    store.commit('options/updateOption', { key: 'forceTransactionsRefresh', value: false })
    isFulfilled.value = false
    sidebarLayoutRef?.value?.scrollTo({ top: 0 })
    getNewTransactions()
  }

  // Defer scroll listener attachment so that scroll restoration
  // does not trigger a spurious getNewTransactions via the zero-scroll check
  await nextTick()
  await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
  await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
  addScrollListener()
})

onDeactivated(() => {
  removeScrollListener()
})

onBeforeUnmount(() => {
  removeScrollListener()
})

const onHasViewChange = async (nextHasView: boolean, previousHasView: boolean) => {
  if (nextHasView === previousHasView || !sidebarLayoutRef?.value) {
    return
  }

  if (nextHasView) {
    transactionListScrollTop.value = sidebarLayoutRef.value.scrollTop
    return
  }

  await applySidebarScrollTop(transactionListScrollTop.value)
}

watch(hasView, onHasViewChange)

watch(isOnline, (online) => {
  if (props.crypto !== 'ADM') handleLoading(online as boolean)
})

watch(areNodesOnline, (nodesOnline) => {
  if (props.crypto === 'ADM') handleLoading(nodesOnline)
})

watch(isIDBReady, (newVal) => {
  if (newVal) {
    getNewTransactions()
  }
})

watch(
  () => props.crypto,
  (newCrypto, oldCrypto) => {
    if (newCrypto !== oldCrypto) {
      isFulfilled.value = false
      transactionListScrollTop.value = 0
      getNewTransactions()
    }
  }
)

watch(
  () => store.state.options.forceTransactionsRefresh,
  (newVal) => {
    if (newVal) {
      store.commit('options/updateOption', { key: 'forceTransactionsRefresh', value: false })
      isFulfilled.value = false
      sidebarLayoutRef?.value?.scrollTo({ top: 0 })
      getNewTransactions()
    }
  }
)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/themes/adamant/_mixins.scss' as mixins;

.transactions-view {
  --a-transactions-loading-item-padding-inline: var(--a-screen-padding-inline);

  &__loading-item {
    padding-inline: var(--a-transactions-loading-item-padding-inline);

    &--recent {
      position: absolute;
      top: var(--a-transactions-loading-item-offset-top);
      z-index: 1;
    }
  }

  &__empty-state {
    @include mixins.a-text-caption();
    margin: 0;
    text-align: center;
  }

  &--empty {
    :deep(.navigation-wrapper__container--loader) {
      margin-top: var(--a-space-12);
    }
  }

  &--list-loading {
    .transactions-view__loading-item--recent {
      top: var(--a-space-12);
    }
  }

  &--detail-loading {
    .transactions-view__loading-item--recent {
      top: var(--a-space-12);
    }
  }
}
</style>
