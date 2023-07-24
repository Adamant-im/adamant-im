<template>
  <div
    class="a-chat__message-container"
    :class="{
      'a-chat__message-container--right': isStringEqualCI(sender.id, userId),
      'a-chat__message-container--transition': elementLeftOffset === 0
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
        'a-chat__message--flashing': flashing
      }"
      :data-txid="id"
    >
      <div class="a-chat__message-card">
        <div class="a-chat__message-card-header">
          <div :title="timeTitle" class="a-chat__timestamp">
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

        <div v-if="isReply" class="a-chat__quoted-message">
          <quoted-message
            :message-id="asset.replyto_id"
            @click="$emit('click:quotedMessage', asset.replyto_id)"
          />
        </div>

        <div>
          <div class="a-chat__direction a-text-regular-bold">
            {{
              isStringEqualCI(sender.id, userId)
                ? $t('chats.sent_label')
                : $t('chats.received_label')
            }}
          </div>
          <div
            class="a-chat__amount"
            :class="isClickable ? 'a-chat__amount--clickable' : ''"
            @click="onClickAmount"
          >
            <v-row align="center" no-gutters>
              <slot name="crypto" />
              <div class="a-chat__rates-column d-flex ml-4">
                <span class="mb-1">{{ currencyFormatter(amount, crypto) }}</span>
                <span class="a-chat__rates">{{ historyRate }}</span>
              </div>
            </v-row>
          </div>
        </div>

        <div class="a-chat__message-card-body">
          <div class="a-chat__message-text mb-1 a-text-regular-enlarged">
            {{ message }}
          </div>
        </div>
      </div>
    </div>

    <slot name="actions" />
  </div>
</template>

<script>
import { computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

import { tsIcon, tsUpdatable, tsColor } from '@/lib/constants'
import { isStringEqualCI } from '@/lib/textHelpers'
import currencyAmount from '@/filters/currencyAmount'
import { timestampInSec } from '@/filters/helpers'
import currencyFormatter from '@/filters/currencyAmountWithSymbol'
import { useSwipeLeft } from '@/hooks/useSwipeLeft'
import QuotedMessage from './QuotedMessage'

export default {
  components: {
    QuotedMessage
  },
  props: {
    id: {
      type: null,
      required: true
    },
    currency: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },
    time: {
      type: String,
      default: ''
    },
    timeTitle: {
      type: String,
      default: ''
    },
    userId: {
      type: String,
      default: ''
    },
    sender: {
      type: Object,
      required: true
    },
    amount: {
      type: [Number, String],
      default: 0
    },
    locale: {
      type: String,
      default: 'en'
    },
    status: {
      type: Object,
      required: true
    },
    isClickable: {
      type: Boolean,
      default: false
    },
    crypto: {
      type: String,
      default: 'ADM'
    },
    hash: {
      required: true,
      type: String
    },
    txTimestamp: {
      required: true
    },
    asset: {
      type: Object,
      // eslint-disable-next-line vue/require-valid-default-prop
      default: {}
    },
    isReply: {
      type: Boolean,
      default: false
    },
    /**
     * Highlight the message by applying a background flash effect
     */
    flashing: {
      type: Boolean,
      default: false
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

    const statusIcon = computed(() => tsIcon(props.status.virtualStatus))
    const statusTitle = computed(() =>
      t(`chats.transaction_statuses.${props.status.virtualStatus}`)
    )
    const statusUpdatable = computed(() => tsUpdatable(props.status.virtualStatus, props.currency))
    const statusColor = computed(() => tsColor(props.status.virtualStatus))
    const historyRate = computed(() => {
      const amount = currencyAmount(props.amount, props.crypto)
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
      if (props.isClickable) {
        emit('click:transaction', props.id)
      }
    }

    const updateStatus = () => {
      if (statusUpdatable.value) {
        emit('click:transactionStatus', props.id)
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
}
</script>
