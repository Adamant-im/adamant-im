<template>
  <v-list bg-color="transparent" :class="[className, `${className}__list`]">
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
            :class="{ [`${className}__update-status-icon--rotate`]: rotateAnimation }"
            :icon="mdiRefresh"
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
          :icon="mdiAlertOutline"
          size="20"
          style="color: #f8a061 !important"
        />
        {{ formattedTransactionStatus
        }}<span v-if="inconsistentStatus">{{
          ': ' + t(`transaction.inconsistent_reasons.${inconsistentStatus}`, { crypto })
        }}</span>
        <!--            <span v-if="status.addStatus">{{ ': ' + status.addDescription }}</span>-->
      </div>
    </v-list-item>

    <v-divider />

    <TransactionListItem :title="t('transaction.date')">
      {{
        confirmations && transaction?.timestamp ? formatDate(transaction.timestamp) : placeholder
      }}
    </TransactionListItem>

    <v-divider />

    <TransactionListItem :title="t('transaction.confirmations')">
      {{ confirmations || placeholder }}
    </TransactionListItem>

    <v-divider />

    <TransactionListItem :title="t('transaction.commission')">
      <span>{{ calculatedFeeDisplay.token }}</span>
      <span v-if="calculatedFeeDisplay.fiat" :class="`${className}__value-muted`">
        {{ ` ${calculatedFeeDisplay.fiat}` }}
      </span>
    </TransactionListItem>

    <v-divider />

    <TransactionListItem
      :title="t('transaction.txid')"
      @click="handleCopyToClipboard(transaction?.id)"
    >
      {{ transaction?.id || placeholder }}
    </TransactionListItem>

    <v-divider />

    <TransactionListItem :title="t('transaction.sender')" @click="handleCopyToClipboard(sender)">
      <template v-if="senderDisplay.main">
        <span>{{ senderDisplay.main }}</span>
        <span v-if="senderDisplay.muted" :class="`${className}__value-muted`">
          {{ senderDisplay.muted }}
        </span>
      </template>
      <template v-else>{{ placeholder }}</template>
    </TransactionListItem>

    <v-divider />

    <TransactionListItem
      :title="t('transaction.recipient')"
      @click="handleCopyToClipboard(recipient)"
    >
      <template v-if="recipientDisplay.main">
        <span>{{ recipientDisplay.main }}</span>
        <span v-if="recipientDisplay.muted" :class="`${className}__value-muted`">
          {{ recipientDisplay.muted }}
        </span>
      </template>
      <template v-else>{{ placeholder }}</template>
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
      <v-icon :icon="mdiChevronRight" size="20" />
    </TransactionListItem>

    <v-divider v-if="partner && !ifComeFromChat" />

    <TransactionListItem
      v-if="partner && !ifComeFromChat"
      :title="hasMessages ? t('transaction.continueChat') : t('transaction.startChat')"
      @click="openChat"
    >
      <v-icon :icon="hasMessages ? mdiComment : mdiCommentOutline" size="20" />
    </TransactionListItem>
  </v-list>
</template>

<script lang="ts" setup>
import type { QueryStatus } from '@tanstack/vue-query'
import BigNumber from 'bignumber.js'
import { computed, PropType, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import copyToClipboard from 'copy-to-clipboard'
import {
  CryptosInfo,
  CryptoSymbol,
  Symbols,
  TransactionStatus,
  TransactionStatusType,
  tsUpdatable
} from '@/lib/constants'
import { DecodedChatMessageTransaction } from '@/lib/adamant-api'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { InconsistentStatus } from './utils/getInconsistentStatus'
import { PendingTransaction } from '@/lib/pending-transactions'
import { AnyCoinTransaction } from '@/lib/nodes/types/transaction'
import TransactionListItem from './TransactionListItem.vue'
import { timestampInSec } from '@/filters/helpers'
import {
  mdiAlertOutline,
  mdiChevronRight,
  mdiComment,
  mdiCommentOutline,
  mdiRefresh
} from '@mdi/js'
import { useFormattedDate } from '@/hooks/useFormattedDate'
import {
  splitDisplayValueByName,
  type SplitDisplayValue
} from '@/components/transactions/utils/splitDisplayValueByName'

const className = 'transaction-view'

const props = defineProps({
  crypto: { type: String as PropType<CryptoSymbol>, required: true },
  explorerLink: { type: String, required: true },
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
  },
  feeCrypto: {
    type: String
  }
})

const emit = defineEmits(['refetch-status'])
const store = useStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const { formatDate } = useFormattedDate()

const transaction = computed(() => props.transaction)
const sender = computed(() => props.senders?.join(',') ?? transaction.value?.senderId)
const recipient = computed(() => props.recipients?.join(',') ?? transaction.value?.recipientId)

const hasMessages = computed(() => {
  if (!props.partner) return false

  const chat = store.state.chat.chats[props.partner]
  return chat && chat.messages && Object.keys(chat.messages).length > 0
})

const placeholder = computed(() => {
  if (!props.queryStatus) return Symbols.CLOCK

  return props.transactionStatus === 'REJECTED' ? Symbols.CROSS : Symbols.HOURGLASS
})

const ifComeFromChat = computed(() => Object.prototype.hasOwnProperty.call(route.query, 'fromChat'))

const comment = computed(() => (props.admTx && props.admTx.message ? props.admTx.message : false))

const isPendingQuery = computed(() => props.queryStatus === 'pending')

const isRejectedTransaction = computed(() => props.transactionStatus === TransactionStatus.REJECTED)

const formattedTransactionStatus = computed(() => {
  if (isPendingQuery.value) return Symbols.HOURGLASS

  return t(`transaction.statuses.${props.transactionStatus}`)
})

const statusUpdatable = computed(() => tsUpdatable(props.transactionStatus, props.crypto))

const historyRate = computed(() => {
  if (isPendingQuery.value) return Symbols.HOURGLASS

  if (isRejectedTransaction.value) return Symbols.CROSS

  return store.getters['rate/historyRate'](
    calculatedTimestampInSec.value,
    transaction.value?.amount,
    props.crypto
  )
})

const rate = computed(() => {
  if (isPendingQuery.value) return Symbols.HOURGLASS

  if (isRejectedTransaction.value) return Symbols.CROSS

  return store.getters['rate/rate'](transaction.value?.amount, props.crypto)
})

const calculatedTimestampInSec = computed(() => {
  if (!transaction.value) {
    return null
  }

  return timestampInSec(props.crypto, transaction.value.timestamp!)
})

const senderDisplay = computed<SplitDisplayValue>(() =>
  splitDisplayValueByName(props.senderFormatted || '', sender.value)
)

const recipientDisplay = computed<SplitDisplayValue>(() =>
  splitDisplayValueByName(props.recipientFormatted || '', recipient.value)
)

const calculatedFeeDisplay = computed(() => {
  const commissionTokenLabel = (props.feeCrypto ?? props.crypto) as CryptoSymbol

  const { cryptoTransferDecimals, decimals } = CryptosInfo[commissionTokenLabel]

  const isFeeShown =
    typeof props.fee === 'number' &&
    ((props.queryStatus === 'success' && props.fee > 0) || props.transactionStatus === 'CONFIRMED')

  const tokenFee = isFeeShown
    ? `${formatAmount(props.fee, cryptoTransferDecimals ?? decimals)} ${commissionTokenLabel}`
    : placeholder.value

  if (!props.fee || !calculatedTimestampInSec.value) {
    return {
      token: tokenFee,
      fiat: ''
    }
  }

  const commissionUsdAmount = store.getters['rate/historyRate'](
    calculatedTimestampInSec.value,
    props.fee,
    commissionTokenLabel
  )

  if (!commissionUsdAmount) {
    return {
      token: tokenFee,
      fiat: ''
    }
  }

  return {
    token: tokenFee,
    fiat: `~${commissionUsdAmount}`
  }
})

const handleCopyToClipboard = (text?: string) => {
  if (!text) return

  copyToClipboard(text)
  store.dispatch('snackbar/show', { message: t('home.copied'), timeout: 2000 })
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
  if (!calculatedTimestampInSec.value) return

  store.dispatch('rate/getHistoryRates', {
    timestamp: calculatedTimestampInSec.value
  })
}

watch(
  calculatedTimestampInSec,
  () => {
    getHistoryRates()
  },
  { immediate: true }
)

const formatAmount = (amount: number, decimals = CryptosInfo[props.crypto].decimals) => {
  return BigNumber(amount).decimalPlaces(decimals, BigNumber.ROUND_DOWN).toFixed()
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.transaction-view {
  --a-transaction-view-row-min-height: var(--a-list-row-min-height);
  --a-transaction-view-row-padding-block: var(--a-list-row-padding-block);
  --a-transaction-view-row-padding-inline-mobile: var(--a-mobile-screen-padding-inline);
  --a-transaction-view-status-font-size: var(--a-financial-text-font-size);
  --a-transaction-view-status-font-weight: var(--a-financial-text-font-weight);
  --a-transaction-view-value-muted-color-dark: var(--a-color-text-muted-dark);

  &__list {
    :deep(.v-list-item--density-default.v-list-item--one-line) {
      min-height: var(--a-transaction-view-row-min-height);
      padding-top: var(--a-transaction-view-row-padding-block);
      padding-bottom: var(--a-transaction-view-row-padding-block);

      @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
        padding-inline: var(--a-transaction-view-row-padding-inline-mobile);
      }
    }

    :deep(.v-divider) {
      /* Keep row separators visually soft after Vuetify defaults update */
      opacity: calc(var(--v-border-opacity) * 0.6);
    }
  }

  position: relative;

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
    font-weight: var(--a-transaction-view-status-font-weight);
    font-size: var(--a-transaction-view-status-font-size);
    text-align: right;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 100%;
    width: 100%;
  }

  &__value-muted {
    white-space: pre;
  }
}

.v-theme--light {
  .transaction-view {
    &__value-muted {
      color: map.get(colors.$adm-colors, 'muted');
    }
  }
}

.v-theme--dark {
  .transaction-view {
    &__value-muted {
      color: var(--a-transaction-view-value-muted-color-dark);
    }
  }
}

.v-theme--light,
.v-theme--dark {
  .transaction-view {
    &__inconsistent-status--REJECTED {
      color: map.get(colors.$adm-colors, 'danger') !important;
    }
    &__inconsistent-status--PENDING {
      color: map.get(colors.$adm-colors, 'attention') !important;
    }
    &__inconsistent-status--REGISTERED {
      color: map.get(colors.$adm-colors, 'attention') !important;
    }
    &__inconsistent-status--CONFIRMED {
      color: map.get(colors.$adm-colors, 'good') !important;
    }
    &__inconsistent-status--INVALID {
      color: map.get(colors.$adm-colors, 'attention') !important;
    }
    &__inconsistent-status--UNKNOWN {
      color: map.get(colors.$adm-colors, 'attention') !important;
    }
  }
}
</style>
