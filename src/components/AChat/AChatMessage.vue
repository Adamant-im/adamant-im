<template>
  <v-row
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
  >
    <div
      class="a-chat__message"
      :class="{
        'a-chat__message--flashing': flashing
      }"
      :data-txid="id"
    >
      <div
        v-if="showAvatar"
        class="a-chat__message-avatar hidden-xs-only"
        :class="{ 'a-chat__message-avatar--right': isStringEqualCI(sender.id, userId) }"
      >
        <slot name="avatar" />
      </div>
      <div class="a-chat__message-card">
        <div v-if="!hideTime" class="a-chat__message-card-header mt-1">
          <div v-if="status.status === 'CONFIRMED'" class="a-chat__blockchain-status">&#x26AD;</div>
          <div :title="timeTitle" class="a-chat__timestamp">
            {{ time }}
          </div>
          <div v-if="isOutgoingMessage" class="a-chat__status">
            <v-icon
              v-if="status.status === 'REJECTED'"
              :icon="statusIcon"
              :title="i18n.retry"
              size="15"
              color="red"
              @click="$emit('resend')"
            />
            <v-icon v-else :icon="statusIcon" size="13" />
          </div>
        </div>

        <div v-if="isReply" class="a-chat__quoted-message">
          <quoted-message
            :message-id="asset.replyto_id"
            @click="$emit('click:quotedMessage', asset.replyto_id)"
          />
        </div>

        <div class="a-chat__message-card-body">
          <!-- eslint-disable vue/no-v-html -- Safe with DOMPurify.sanitize() content -->
          <!-- AChatMessage :message <- Chat.vue :message="formatMessage(message)" <- formatMessage <- DOMPurify.sanitize() -->
          <div v-if="html" class="a-chat__message-text a-text-regular-enlarged" v-html="message" />
          <!-- eslint-enable vue/no-v-html -->
          <div v-else class="a-chat__message-text a-text-regular-enlarged" v-text="message" />
        </div>
      </div>
    </div>

    <slot name="actions" />
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { isStringEqualCI } from '@/lib/textHelpers'
import { tsIcon } from '@/lib/constants'
import QuotedMessage from './QuotedMessage'
import { useSwipeLeft } from '@/hooks/useSwipeLeft'

export default defineComponent({
  components: {
    QuotedMessage
  },
  props: {
    id: {
      type: null,
      required: true
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
    status: {
      type: Object,
      required: true
    },
    userId: {
      type: String,
      default: ''
    },
    sender: {
      type: Object,
      required: true
    },
    showAvatar: {
      type: Boolean,
      default: true
    },
    locale: {
      type: String,
      default: 'en'
    },
    html: {
      type: Boolean,
      default: false
    },
    i18n: {
      type: Object,
      default: () => ({
        retry: 'Message did not sent, weak connection. Click to retry'
      })
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
    },
    hideTime: {
      type: Boolean,
      default: false
    }
  },
  emits: ['resend', 'click:quotedMessage', 'swipe:left'],
  setup(props, { emit }) {
    const statusIcon = computed(() => tsIcon(props.status.virtualStatus))
    const isOutgoingMessage = computed(() => isStringEqualCI(props.sender.id, props.userId))

    const { onMove, onSwipeEnd, elementLeftOffset } = useSwipeLeft(() => {
      emit('swipe:left')
    })

    return {
      statusIcon,
      isOutgoingMessage,
      onMove,
      onSwipeEnd,
      elementLeftOffset,
      isStringEqualCI
    }
  }
})
</script>
