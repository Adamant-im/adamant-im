<template>
  <v-row
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
      left: swipeDisabled ? '0px' : `${elementLeftOffset}px`
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
      <div
        v-if="showAvatar"
        class="a-chat__message-avatar hidden-xs-only"
        :class="{ 'a-chat__message-avatar--right': isStringEqualCI(transaction.senderId, userId) }"
      >
        <slot name="avatar" />
      </div>
      <div class="a-chat__message-card">
        <div class="a-chat__message-card-header mt-1">
          <div v-if="status.status === 'CONFIRMED'" class="a-chat__blockchain-status">&#x26AD;</div>
          <div class="a-chat__timestamp">
            {{ time }}
          </div>
          <div v-if="isOutgoingMessage" class="a-chat__status">
            <v-icon
              v-if="status.status === 'REJECTED'"
              :icon="statusIcon"
              :title="$t('chats.retry_message')"
              size="15"
              color="red"
              @click="$emit('resend')"
            />
            <v-icon v-else :icon="statusIcon" size="13" />
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
          <div
            v-if="html"
            class="a-chat__message-text a-text-regular-enlarged"
            v-html="formattedMessage"
          />
          <!-- eslint-enable vue/no-v-html -->
          <div
            v-else
            class="a-chat__message-text a-text-regular-enlarged"
            v-text="formattedMessage"
          />
          <v-btn @click="getFileFromStorage()">CLICK ME</v-btn>
          <pre>
            {{ JSON.stringify(transaction.id, null, 2) }}
          </pre>
        </div>
      </div>
    </div>

    <slot name="actions" />
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useStore } from 'vuex'

import { useFormatMessage } from './hooks/useFormatMessage'
import { usePartnerId } from './hooks/usePartnerId'
import { useTransactionTime } from './hooks/useTransactionTime'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { downloadFile, isStringEqualCI } from '@/lib/textHelpers'
import { tsIcon } from '@/lib/constants'
import QuotedMessage from './QuotedMessage.vue'
import { useSwipeLeft } from '@/hooks/useSwipeLeft'
import formatDate from '@/filters/date'
import { isWelcomeChat } from '@/lib/chat/meta/utils'

export default defineComponent({
  methods: { downloadFile },
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
  emits: ['resend', 'click:quotedMessage', 'swipe:left', 'longpress'],
  setup(props, { emit }) {
    const store = useStore()

    const userId = computed(() => store.state.address)
    const partnerId = usePartnerId(props.transaction)

    const getFileFromStorage = async () => {
      //TODO: refactor for each file
      const cid = props.transaction.asset.files[0].file_id
      const fileName = props.transaction.asset.files[0].file_name
      const fileType = props.transaction.asset.files[0].file_type
      const nonce = props.transaction.asset.files[0].nonce
      const myAddress = store.state.address

      const publicKey =
        props.transaction.senderId === myAddress
          ? props.transaction.recipientPublicKey
          : props.transaction.senderPublicKey
      const data = await store.dispatch('attachment/getAttachment', { cid, publicKey, nonce })
      if (!!data && !!fileName && !!fileType) {
        // TODO: resolve MIME-type
        downloadFile(data, fileName, '')
      }
    }

    const showAvatar = computed(() => !isWelcomeChat(partnerId.value))

    const statusIcon = computed(() => tsIcon(props.status.virtualStatus))
    const isOutgoingMessage = computed(() =>
      isStringEqualCI(props.transaction.senderId, userId.value)
    )
    const formattedMessage = useFormatMessage(props.transaction)
    const time = useTransactionTime(props.transaction)

    const { onMove, onSwipeEnd, elementLeftOffset } = useSwipeLeft(() => {
      emit('swipe:left')
    })

    const onLongPress = () => {
      emit('longpress')
    }

    return {
      userId,
      statusIcon,
      isOutgoingMessage,
      formattedMessage,
      getFileFromStorage,
      showAvatar,
      onMove,
      onSwipeEnd,
      elementLeftOffset,
      isStringEqualCI,
      onLongPress,
      formatDate,
      time
    }
  }
})
</script>
