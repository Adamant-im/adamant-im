<template>
  <v-row justify="center" no-gutters :class="className">
    <app-toolbar-centered
      app
      :title="transaction?.id"
      flat
      fixed
      :class="`${className}__toolbar`"
    />

    <container class="container--with-app-toolbar">
      <v-list bg-color="transparent">
        <TransactionListItem :title="t('transaction.amount')">
          {{
            typeof transaction?.amount === 'number'
              ? formatAmount(transaction?.amount) + ` ${crypto}`
              : placeholder
          }}
        </TransactionListItem>

        <v-divider />

        <TransactionListItem :title="t('transaction.currentVal')">
          {{ rate }}
        </TransactionListItem>

        <v-divider />

        <TransactionListItem :title="t('transaction.valueTimeTxn')">
          {{ historyRate }}
        </TransactionListItem>

        <v-divider />

        <v-list-item>
          <template #prepend>
            <v-list-item-title :class="`${className}__title`">
              {{ t('transaction.status') }}
              <v-icon
                v-if="statusUpdatable || rotateAnimation"
                :class="{
                  [`${className}__update-status-icon--rotate`]: rotateAnimation
                }"
                icon="mdi-refresh"
                size="20"
                @click="updateStatus()"
              />
            </v-list-item-title>
          </template>

          <div
            :class="[
              `${className}__inconsistent-status`,
              `${className}__inconsistent-status--${transactionStatus}`
            ]"
          >
            <v-icon
              v-if="transactionStatus === 'INVALID'"
              icon="mdi-alert-outline"
              size="20"
              style="color: #f8a061 !important"
            />
            {{ t(`transaction.statuses.${transactionStatus}`)
            }}<span v-if="inconsistentStatus">{{
              ': ' + t(`transaction.inconsistent_reasons.${inconsistentStatus}`, { crypto })
            }}</span>
            <!--            <span v-if="status.addStatus">{{ ': ' + status.addDescription }}</span>-->
          </div>
        </v-list-item>

        <v-divider />

        <TransactionListItem :title="t('transaction.date')">
          {{ transaction?.timestamp ? formatDate(transaction.timestamp) : placeholder }}
        </TransactionListItem>

        <v-divider />

        <TransactionListItem :title="t('transaction.confirmations')">
          {{ confirmations || placeholder }}
        </TransactionListItem>

        <v-divider />

        <TransactionListItem :title="t('transaction.commission')">
          {{ typeof fee === 'number' ? formatAmount(fee) + ` ${crypto}` : placeholder }}
        </TransactionListItem>

        <v-divider />

        <TransactionListItem
          :title="t('transaction.txid')"
          @click="handleCopyToClipboard(transaction?.id)"
        >
          {{ transaction?.id || placeholder }}
        </TransactionListItem>

        <v-divider />

        <TransactionListItem
          :title="t('transaction.sender')"
          @click="handleCopyToClipboard(sender)"
        >
          {{ senderFormatted || placeholder }}
        </TransactionListItem>

        <v-divider />

        <TransactionListItem
          :title="t('transaction.recipient')"
          @click="handleCopyToClipboard(recipient)"
        >
          {{ recipientFormatted || placeholder }}
        </TransactionListItem>

        <v-divider v-if="comment" />

        <TransactionListItem v-if="comment" :title="t('transaction.comment')">
          {{ comment || placeholder }}
        </TransactionListItem>

        <v-divider v-if="textData" />

        <TransactionListItem v-if="textData" :title="t('transaction.textData')">
          {{ textData || placeholder }}
        </TransactionListItem>

        <v-divider v-if="explorerLink" />

        <TransactionListItem
          v-if="explorerLink"
          :title="t('transaction.explorer')"
          @click="openInExplorer"
        >
          <v-icon icon="mdi-chevron-right" size="20" />
        </TransactionListItem>

        <v-divider v-if="partner && !ifComeFromChat" />

        <TransactionListItem
          v-if="partner && !ifComeFromChat"
          :title="hasMessages ? t('transaction.continueChat') : t('transaction.startChat')"
          @click="openChat"
        >
          <v-icon :icon="hasMessages ? 'mdi-comment' : 'mdi-comment-outline'" size="20" />
        </TransactionListItem>
      </v-list>
    </container>
  </v-row>
</template>

<script lang="ts">
import type { QueryStatus } from '@tanstack/vue-query'
import BigNumber from 'bignumber.js'
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import copyToClipboard from 'copy-to-clipboard'
import {
  CryptosInfo,
  CryptoSymbol,
  Symbols,
  TransactionStatusType,
  tsUpdatable
} from '@/lib/constants'
import { DecodedChatMessageTransaction } from '@/lib/adamant-api'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { InconsistentStatus } from './utils/getInconsistentStatus'
import { PendingTransaction } from '@/lib/pending-transactions'
import { AnyCoinTransaction } from '@/lib/nodes/types/transaction'
import AppToolbarCentered from '@/components/AppToolbarCentered.vue'
import TransactionListItem from './TransactionListItem.vue'
import { timestampInSec } from '@/filters/helpers'
import { formatDate } from '@/lib/formatters'

const className = 'transaction-view'

export default defineComponent({
  components: {
    AppToolbarCentered,
    TransactionListItem
  },
  props: {
    crypto: {
      type: String as PropType<CryptoSymbol>,
      required: true
    },
    explorerLink: {
      type: String,
      required: true
    },
    transaction: {
      type: Object as PropType<
        AnyCoinTransaction | DecodedChatMessageTransaction | PendingTransaction
      >
    },
    /**
     * ADM address
     */
    partner: {
      type: String
    },
    admTx: {
      type: Object as PropType<NormalizedChatMessageTransaction>
    },
    queryStatus: {
      type: String as PropType<QueryStatus>,
      required: true
    },
    transactionStatus: {
      type: String as PropType<TransactionStatusType>,
      required: true
    },
    inconsistentStatus: {
      type: String as PropType<InconsistentStatus>
    },
    confirmations: {
      type: Number
    },
    fee: {
      type: Number
    },
    textData: {
      type: String
    },
    senders: {
      type: Array as PropType<string[]>
    },
    recipients: {
      type: Array as PropType<string[]>
    },
    senderFormatted: {
      type: String
    },
    recipientFormatted: {
      type: String
    }
  },
  emits: ['refetch-status'],
  setup(props, { emit }) {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()

    const transaction = computed(() => props.transaction)
    const sender = computed(() => props.senders?.join(',') ?? transaction.value?.senderId)
    const recipient = computed(() => props.recipients?.join(',') ?? transaction.value?.senderId)

    const hasMessages = computed(() => {
      if (!props.partner) return false

      const chat = store.state.chat.chats[props.partner]
      return chat && chat.messages && Object.keys(chat.messages).length > 0
    })

    const placeholder = computed(() => {
      if (!props.queryStatus) return Symbols.CLOCK

      return props.transactionStatus === 'REJECTED' ? Symbols.CROSS : Symbols.HOURGLASS
    })

    const ifComeFromChat = computed(() =>
      Object.prototype.hasOwnProperty.call(route.query, 'fromChat')
    )

    const comment = computed(() =>
      props.admTx && props.admTx.message ? props.admTx.message : false
    )

    const statusUpdatable = computed(() => tsUpdatable(props.transactionStatus, props.crypto))
    const historyRate = computed(() => {
      if (!transaction.value) return

      return store.getters['rate/historyRate'](
        timestampInSec(props.crypto, transaction.value.timestamp),
        transaction.value.amount,
        props.crypto
      )
    })
    const rate = computed(() => {
      if (!transaction.value) return

      return store.getters['rate/rate'](transaction.value.amount, props.crypto)
    })

    const handleCopyToClipboard = (text?: string) => {
      if (!text) return

      copyToClipboard(text)
      store.dispatch('snackbar/show', {
        message: t('home.copied'),
        timeout: 2000
      })
    }

    const openInExplorer = () => {
      if (props.explorerLink) {
        window.open(props.explorerLink, '_blank', 'resizable,scrollbars,status,noopener')
      }
    }

    const openChat = () => {
      router.push('/chats/' + props.partner + '/')
    }

    const rotateAnimation = ref(false)
    const updateStatus = () => {
      rotateAnimation.value = true
      setTimeout(() => (rotateAnimation.value = false), 1000)

      if (statusUpdatable.value) {
        emit('refetch-status')
      }
    }

    const getHistoryRates = () => {
      if (!transaction.value) return

      store.dispatch('rate/getHistoryRates', {
        timestamp: timestampInSec(props.crypto, transaction.value.timestamp!)
      })
    }

    watch(
      () => props.transaction,
      () => {
        getHistoryRates()
      },
      { immediate: true }
    )

    const formatAmount = (amount: number) => {
      return BigNumber(amount)
        .decimalPlaces(CryptosInfo[props.crypto].decimals, BigNumber.ROUND_DOWN)
        .toFixed()
    }

    return {
      formatDate,
      t,
      className,
      sender,
      recipient,
      handleCopyToClipboard,
      openInExplorer,
      openChat,
      updateStatus,
      rotateAnimation,
      hasMessages,
      placeholder,
      ifComeFromChat,
      comment,
      statusUpdatable,
      historyRate,
      rate,
      formatAmount
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/settings/_colors.scss';

.transaction-view {
  &__titlecontent {
    flex: 1 0 auto;
  }
  &__toolbar {
    :deep(.v-toolbar__title) div {
      text-overflow: ellipsis;
      max-width: 100%;
      overflow: hidden;
    }
  }
  &__update-status-icon {
    &--rotate {
      transform: rotate(400grad);
      transition-duration: 1s;
    }
  }
  &__inconsistent-status {
    font-weight: 300;
    font-size: 14px;
    text-align: right;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 100%;
    width: 100%;
  }
}

/** Themes **/
.v-theme--light {
  .transaction-view {
    :deep(.v-divider) {
      border-color: map-get($adm-colors, 'secondary2');
    }
  }
}
.v-theme--light,
.v-theme--dark {
  .transaction-view {
    &__inconsistent-status--REJECTED {
      color: map-get($adm-colors, 'danger') !important;
    }
    &__inconsistent-status--PENDING {
      color: map-get($adm-colors, 'attention') !important;
    }
    &__inconsistent-status--REGISTERED {
      color: map-get($adm-colors, 'attention') !important;
    }
    &__inconsistent-status--CONFIRMED {
      color: map-get($adm-colors, 'good') !important;
    }
    &__inconsistent-status--INVALID {
      color: map-get($adm-colors, 'attention') !important;
    }
    &__inconsistent-status--UNKNOWN {
      color: map-get($adm-colors, 'attention') !important;
    }
  }
}
</style>
