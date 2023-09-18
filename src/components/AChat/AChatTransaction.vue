<template>
  <div
    class="a-chat__message-container"
    :class="{
      'a-chat__message-container--right': isStringEqualCI(transaction.senderId, userId),
      'a-chat__message-container--transition': elementLeftOffset === 0,
      'a-chat__message-container--disable-max-width': disableMaxWidth
    }"
    v-touch="{
      move: onMove,
      end: onSwipeEnd
    }"
    :style="{
      left: `${elementLeftOffset}px`
    }"
    v-longpress="onLongPress"
  >
    <div
      class="a-chat__message"
      :class="{
        'a-chat__message--flashing': flashing,
        'elevation-9': elevation
      }"
      :data-id="dataId"
    >
      <div class="a-chat__message-card">
        <div class="a-chat__message-card-header">
          <div class="a-chat__timestamp">
            {{ time }}
          </div>
          <div class="a-chat__status">
            <v-icon
              size="13"
              :icon="statusIcon"
              :title="statusTitle"
              :color="statusColor"
              :style="statusUpdatable ? 'cursor: pointer;' : 'cursor: default;'"
              @click="updateStatus"
            />
          </div>
        </div>

        <div v-if="transaction.isReply" class="a-chat__quoted-message">
          <quoted-message
            :message-id="transaction.asset.replyto_id"
            @click="$emit('click:quotedMessage', transaction.asset.replyto_id)"
          />
        </div>

        <div>
          <div class="a-chat__direction a-text-regular-bold">
            {{
              isStringEqualCI(transaction.senderId, userId)
                ? $t('chats.sent_label')
                : $t('chats.received_label')
            }}
          </div>
          <div
            class="a-chat__amount"
            :class="isCryptoSupported ? 'a-chat__amount--clickable' : ''"
            @click="onClickAmount"
          >
            <v-row align="center" no-gutters>
              <slot name="crypto" />
              <div class="a-chat__rates-column d-flex ml-4">
                <span class="mb-1">{{ currencyFormatter(transaction.amount, crypto) }}</span>
                <span class="a-chat__rates">{{ historyRate }}</span>
              </div>
            </v-row>
          </div>
        </div>

        <div class="a-chat__message-card-body">
          <div class="a-chat__message-text mb-1 a-text-regular-enlarged">
            {{ transaction.message }}
          </div>
        </div>
      </div>
    </div>

    <slot name="actions" />
  </div>
</template>

<script lang="ts">
import { useTransactionTime } from '@/components/AChat/hooks/useTransactionTime.ts'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { CryptoSymbol } from '@/lib/constants/cryptos'
import { computed, watch, onMounted, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

import { tsIcon, tsUpdatable, tsColor, Cryptos } from '@/lib/constants'
import { isStringEqualCI } from '@/lib/textHelpers'
import currencyAmount from '@/filters/currencyAmount'
import { timestampInSec } from '@/filters/helpers'
import currencyFormatter from '@/filters/currencyAmountWithSymbol'
import { useSwipeLeft } from '@/hooks/useSwipeLeft'
import QuotedMessage from './QuotedMessage.vue'

export default defineComponent({
  components: {
    QuotedMessage
  },
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    },
    dataId: {
      type: String
    },
    status: {
      type: Object,
      required: true
    },
    crypto: {
      type: String,
      default: 'ADM'
    },
    txTimestamp: {
      required: true
    },
    /**
     * Highlight the message by applying a background flash effect
     */
    flashing: {
      type: Boolean,
      default: false
    },
    disableMaxWidth: {
      type: Boolean
    },
    elevation: {
      type: Boolean
    }
  },
  emits: [
    'mount',
    'click:transaction',
    'click:transactionStatus',
    'click:quotedMessage',
    'swipe:left',
    'longpress'
  ],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useStore()

    const userId = computed(() => store.state.address)

    const time = useTransactionTime(props.transaction)
    const isCryptoSupported = computed(() => props.transaction.type in Cryptos)

    const statusIcon = computed(() => tsIcon(props.status.virtualStatus))
    const statusTitle = computed(() =>
      t(`chats.transaction_statuses.${props.status.virtualStatus}`)
    )
    const statusUpdatable = computed(() =>
      tsUpdatable(props.status.virtualStatus, props.crypto as CryptoSymbol)
    )
    const statusColor = computed(() => tsColor(props.status.virtualStatus))
    const historyRate = computed(() => {
      const amount = currencyAmount(props.transaction.amount, props.crypto)
      return (
        '~' +
        store.getters['rate/historyRate'](
          timestampInSec(props.crypto, props.txTimestamp),
          amount,
          props.crypto
        )
      )
    })

    const onClickAmount = () => {
      if (isCryptoSupported.value) {
        emit('click:transaction', props.transaction.id)
      }
    }

    const updateStatus = () => {
      if (statusUpdatable.value) {
        emit('click:transactionStatus', props.transaction.id)
      }
    }

    const getHistoryRates = () => {
      store.dispatch('rate/getHistoryRates', {
        timestamp: timestampInSec(props.crypto, props.txTimestamp)
      })
    }

    const onLongPress = () => {
      emit('longpress')
    }

    watch(
      () => props.txTimestamp,
      () => {
        getHistoryRates()
      }
    )

    onMounted(() => {
      emit('mount')
      getHistoryRates()
    })

    const { onMove, onSwipeEnd, elementLeftOffset } = useSwipeLeft(() => {
      emit('swipe:left')
    })

    return {
      userId,

      time,
      isCryptoSupported,

      isStringEqualCI,
      currencyFormatter,
      statusIcon,
      statusTitle,
      statusUpdatable,
      statusColor,
      historyRate,
      onClickAmount,
      updateStatus,
      onLongPress,

      onMove,
      onSwipeEnd,
      elementLeftOffset
    }
  }
})
</script>
