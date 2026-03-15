<template>
  <v-row
    class="a-chat__message-container"
    :class="{
      'a-chat__message-container--right': isStringEqualCI(transaction.senderId, userId),
      'a-chat__message-container--transition': elementLeftOffset === 0,
      'a-chat__message-container--disable-max-width': disableMaxWidth,
      'a-chat__message-container--grouped':
        !transaction.showBubble && isStringEqualCI(transaction.senderId, userId),
      'a-chat__message-container--grouped-left':
        !transaction.showBubble && !isStringEqualCI(transaction.senderId, userId)
    }"
    v-touch="{
      move: onMove,
      end: onSwipeEnd
    }"
    :style="{
      left: swipeDisabled ? '0px' : `${elementLeftOffset}px`
    }"
    v-longpress="onLongPress"
  >
    <div
      v-if="showInlinePendingStatus"
      class="a-chat__inline-status a-chat__inline-status--pending"
    >
      <v-icon :icon="statusIcon" :size="CHAT_INLINE_PENDING_STATUS_ICON_SIZE" />
    </div>
    <div
      v-else-if="showInlineRejectedStatus"
      class="a-chat__inline-status a-chat__inline-status--rejected"
    >
      <v-icon
        :icon="statusIcon"
        :size="CHAT_INLINE_PENDING_STATUS_ICON_SIZE"
        color="red"
        @click="$emit('click:status')"
      />
    </div>

    <div
      class="a-chat__message"
      :class="{
        'a-chat__message--flashing': flashing,
        'elevation-9': elevation
      }"
      :data-id="dataId"
    >
      <div class="a-chat__message-card">
        <div v-if="transaction.showTime" class="a-chat__message-card-header">
          <div v-if="transaction.status === 'CONFIRMED'" class="a-chat__blockchain-status">
            &#x26AD;
          </div>
          <div class="a-chat__timestamp">
            {{ time }}
          </div>
          <div v-if="isOutgoingMessage" class="a-chat__status">
            <v-icon
              v-if="transaction.status === 'REJECTED'"
              :icon="statusIcon"
              :size="CHAT_STATUS_ICON_ERROR_SIZE"
              color="red"
              @click="$emit('click:status')"
            />
            <v-icon v-else :icon="statusIcon" :size="CHAT_STATUS_ICON_SIZE" />
          </div>
        </div>

        <div v-if="transaction.isReply" class="a-chat__quoted-message">
          <quoted-message
            :message-id="transaction.asset.replyto_id"
            @click="$emit('click:quotedMessage', transaction.asset.replyto_id)"
          />
        </div>

        <div class="a-chat__message-card-body">
          <!-- eslint-disable vue/no-v-html -- Safe with DOMPurify.sanitize() content -->
          <!-- AChatMessage :message <- Chat.vue :message="formatMessage(message)" <- formatMessage <- DOMPurify.sanitize() -->
          <div v-if="html" class="a-chat__message-text" v-html="formattedMessage" />
          <!-- eslint-enable vue/no-v-html -->
          <div v-else class="a-chat__message-text" v-text="formattedMessage" />
        </div>
      </div>
    </div>

    <slot name="actions" />
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

import { useFormatMessage } from './hooks/useFormatMessage'
import { usePartnerId } from './hooks/usePartnerId'
import { useTransactionTime } from './hooks/useTransactionTime'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { isStringEqualCI } from '@/lib/textHelpers'
import { TransactionStatus, tsIcon } from '@/lib/constants'
import QuotedMessage from './QuotedMessage.vue'
import { useSwipeLeft } from '@/hooks/useSwipeLeft'
import formatDate from '@/filters/date'
import { isWelcomeChat } from '@/lib/chat/meta/utils'
import {
  CHAT_INLINE_PENDING_STATUS_DELAY_MS,
  CHAT_INLINE_PENDING_STATUS_ICON_SIZE,
  CHAT_STATUS_ICON_ERROR_SIZE,
  CHAT_STATUS_ICON_SIZE
} from './helpers/uiMetrics'

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
    html: {
      type: Boolean,
      default: false
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
    },
    swipeDisabled: {
      type: Boolean
    }
  },
  emits: ['click:status', 'click:quotedMessage', 'swipe:left', 'longpress'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useStore()

    const userId = computed(() => store.state.address)
    const partnerId = usePartnerId(props.transaction)

    const showAvatar = computed(() => !isWelcomeChat(partnerId.value))

    const statusIcon = computed(() => tsIcon(props.transaction.status))
    const isOutgoingMessage = computed(() =>
      isStringEqualCI(props.transaction.senderId, userId.value)
    )
    const isQueuedPendingMessage = computed(() =>
      Boolean(store.state.chat.pendingMessages[String(props.transaction.id)])
    )
    const formattedMessage = useFormatMessage(props.transaction)
    const time = useTransactionTime(props.transaction)
    const pendingStatusDelayElapsed = ref(false)

    let pendingStatusTimer: ReturnType<typeof setTimeout> | undefined

    const clearInlinePendingStatusTimer = () => {
      if (pendingStatusTimer) {
        clearTimeout(pendingStatusTimer)
        pendingStatusTimer = undefined
      }
    }

    const syncInlinePendingStatus = () => {
      clearInlinePendingStatusTimer()
      pendingStatusDelayElapsed.value = false

      if (
        !isOutgoingMessage.value ||
        props.transaction.showTime ||
        props.transaction.status !== TransactionStatus.PENDING ||
        !isQueuedPendingMessage.value
      ) {
        return
      }

      pendingStatusTimer = setTimeout(() => {
        pendingStatusDelayElapsed.value = true
      }, CHAT_INLINE_PENDING_STATUS_DELAY_MS)
    }

    const showInlinePendingStatus = computed(
      () =>
        pendingStatusDelayElapsed.value &&
        isOutgoingMessage.value &&
        !props.transaction.showTime &&
        isQueuedPendingMessage.value &&
        props.transaction.status === TransactionStatus.PENDING
    )
    const showInlineRejectedStatus = computed(
      () =>
        isOutgoingMessage.value &&
        !props.transaction.showTime &&
        props.transaction.status === TransactionStatus.REJECTED
    )

    const { onMove, onSwipeEnd, elementLeftOffset } = useSwipeLeft(() => {
      emit('swipe:left')
    })

    const onLongPress = () => {
      emit('longpress')
    }

    watch(
      () => [
        props.transaction.id,
        props.transaction.status,
        props.transaction.showTime,
        isQueuedPendingMessage.value
      ],
      syncInlinePendingStatus,
      { immediate: true }
    )

    watch(isOutgoingMessage, syncInlinePendingStatus)

    onBeforeUnmount(() => {
      clearInlinePendingStatusTimer()
    })

    return {
      t,
      userId,
      statusIcon,
      isOutgoingMessage,
      formattedMessage,
      showAvatar,
      onMove,
      onSwipeEnd,
      elementLeftOffset,
      isStringEqualCI,
      onLongPress,
      formatDate,
      time,
      showInlinePendingStatus,
      showInlineRejectedStatus,
      CHAT_INLINE_PENDING_STATUS_ICON_SIZE,
      CHAT_STATUS_ICON_SIZE,
      CHAT_STATUS_ICON_ERROR_SIZE
    }
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/_chat-message-content.scss' as chatMessageContent;

.a-chat__inline-status {
  position: absolute;
  top: 50%;
  right: calc(100% + var(--a-space-2));
  transform: translateY(-50%);
  display: flex;
  align-items: center;

  &--pending {
    color: rgba(var(--v-theme-on-surface), 0.72);
    pointer-events: none;
  }

  &--rejected {
    color: rgba(var(--v-theme-on-surface), 0.72);

    :deep(.v-icon) {
      cursor: pointer;
      pointer-events: auto;
    }
  }
}

.a-chat__message-text {
  @include chatMessageContent.a-chat-message-body-copy();
}
</style>
