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
        {{ $t('transaction.no_transactions') }}
      </h3>
    </template>
  </navigation-wrapper>
</template>

<script>
import InlineSpinner from '@/components/InlineSpinner.vue'
import TransactionListItem from '@/components/TransactionListItem.vue'
import { isStringEqualCI } from '@/lib/textHelpers'
import { AllNodesDisabledError, AllNodesOfflineError } from '@/lib/nodes/utils/errors'
import { useSavedScroll } from '@/hooks/useSavedScroll'
import NavigationWrapper from '@/components/NavigationWrapper.vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import navigationGuard from '@/router/navigationGuard'

export default {
  components: {
    NavigationWrapper,
    InlineSpinner,
    TransactionListItem
  },
  props: {
    crypto: {
      default: 'ADM',
      type: String
    }
  },
  setup(props) {
    const className = 'transactions'

    const classes = {
      root: className,
      content: `${className}__content`
    }

    const store = useStore()
    const route = useRoute()
    const { t } = useI18n()

    const { hasView, sidebarLayoutRef } = useSavedScroll()

    const isFulfilled = ref(false)
    const isRejected = ref(false)
    const isUpdating = ref(false)

    const cryptoModule = computed(() => {
      return props.crypto.toLowerCase()
    })

    const isRecentLoading = computed(() => {
      return store.getters[`${cryptoModule.value}/areRecentLoading`]
    })

    const isOlderLoading = computed(() => store.getters[`${cryptoModule.value}/areOlderLoading`])

    const isLoginViaPassword = computed(() => store.getters['options/isLoginViaPassword'])
    const isIDBReady = computed(() => store.state.IDBReady)

    onBeforeRouteUpdate((to, from, next) => {
      navigationGuard.transactions(to, from, next)
    })

    const getNewTransactions = () => {
      const doNotUpdate =
        route.meta.previousRoute?.params?.txId &&
        !isFulfilled.value &&
        route.meta.previousPreviousRoute &&
        route.meta.previousPreviousRoute.name

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

    const onScroll = (event) => {
      const { target } = event

      const height = target.offsetHeight
      const windowHeight = window.innerHeight
      const scrollPosition = Math.ceil(target.scrollTop || 0)

      // If we've scrolled to the very bottom, fetch the older transactions from server
      if (!isOlderLoading.value && windowHeight + scrollPosition >= height) {
        store.dispatch(`${cryptoModule.value}/getOldTransactions`)
      }
      // If we've scrolled to the very top, fetch the recent transactions from server
      if (!isRecentLoading.value && scrollPosition === 0) {
        getNewTransactions()
      }
    }

    onMounted(() => {
      if (!isLoginViaPassword.value || isIDBReady.value) {
        getNewTransactions()
      }

      sidebarLayoutRef.value.addEventListener('scroll', onScroll)
    })

    onBeforeUnmount(() => {
      sidebarLayoutRef.value.removeEventListener('scroll', onScroll)
    })

    watch(isIDBReady, (newVal) => {
      if (newVal) {
        getNewTransactions()
      }
    })

    return {
      cryptoModule,
      classes,
      hasView,
      isOlderLoading,
      isRecentLoading,
      isFulfilled,
      isRejected,
      isUpdating,
      onScroll
    }
  },
  computed: {
    transactions() {
      const transactions = this.$store.getters[`${this.cryptoModule}/sortedTransactions`]

      const address = this.$store.state[this.crypto.toLowerCase()].address
      return transactions.filter((tx) => {
        // Filter invalid "fake" transactions (from chat rich message)
        return (
          Object.prototype.hasOwnProperty.call(tx, 'amount') &&
          (isStringEqualCI(tx.recipientId, address) || isStringEqualCI(tx.senderId, address))
        )
      })
    },
    hasTransactions() {
      return this.transactions && this.transactions.length > 0
    }
  },
  methods: {
    sender(transaction) {
      const { senders, senderId } = transaction
      const onlySender = senderId && (!senders || senders.length === 1)
      if (onlySender) {
        return senderId
      } else if (senders) {
        return this.formatAddresses(senders)
      }
    },
    recipient(transaction) {
      const { recipientId, recipients } = transaction
      const onlyRecipient = recipientId && (!recipients || recipients.length === 1)
      if (onlyRecipient) {
        return recipientId
      } else if (recipients) {
        return this.formatAddresses(recipients)
      }
    },
    formatAddresses(addresses) {
      const count = addresses.length
      return addresses.includes(this.$store.state[this.crypto.toLowerCase()].address)
        ? `${
            this.$t('transaction.me') +
            ' (' +
            this.$store.state[this.cryptoModule].address +
            ') ' +
            this.$t('transaction.addresses', count - 1)
          }`
        : addresses[0] + ' ' + this.$t('transaction.addresses', count - 1)
    },
    goToTransaction(transactionId) {
      this.$router.push({
        name: 'Transaction',
        params: {
          crypto: this.crypto,
          txId: transactionId
        }
      })
    },
    goToChat(partnerId) {
      this.$router.push({
        name: 'Chat',
        params: { partnerId }
      })
    }
  }
}
</script>
