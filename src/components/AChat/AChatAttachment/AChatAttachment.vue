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
      class="a-chat__message"
      :class="{
        'a-chat__message--flashing': flashing,
        'elevation-9': elevation
      }"
      :data-id="dataId"
    >
      <div class="a-chat__message-card">
        <div class="a-chat__message-card-header">
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
              :title="t('chats.retry_message')"
              :size="CHAT_STATUS_ICON_ERROR_SIZE"
              color="red"
              @click="$emit('resend')"
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

    <div
      :class="{
        'a-chat__attachments': true,
        'a-chat__attachments--inline': !hasImagesOnly
      }"
    >
      <ImageLayout
        v-if="hasImagesOnly"
        :partnerId="partnerId"
        :images="transaction.localFiles || transaction.asset.files"
        :transaction="transaction"
        @click:image="openModal"
      />
      <InlineLayout
        v-else
        :partnerId="partnerId"
        :files="transaction.localFiles || transaction.asset.files"
        :transaction="transaction"
        @click:file="openModal"
      />

      <AChatImageModal
        :files="transaction.asset.files"
        :transaction="transaction"
        :index="currentIndex"
        :modal="isModalOpen"
        v-if="isModalOpen"
        @close="closeModal"
        @update:modal="closeModal"
      />
    </div>

    <slot name="actions" />
  </v-row>
</template>

<script lang="ts">
import { FileAsset } from '@/lib/adamant-api/asset'
import { ref, computed, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

import { useFormatMessage } from '../hooks/useFormatMessage'
import { usePartnerId } from '../hooks/usePartnerId'
import { useTransactionTime } from '../hooks/useTransactionTime'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { isLocalFile } from '@/lib/files'
import { downloadFile, isStringEqualCI } from '@/lib/textHelpers'
import { tsIcon } from '@/lib/constants'
import QuotedMessage from '../QuotedMessage.vue'
import { useSwipeLeft } from '@/hooks/useSwipeLeft'
import formatDate from '@/filters/date'
import { isWelcomeChat } from '@/lib/chat/meta/utils'
import ImageLayout from './ImageLayout.vue'
import InlineLayout from './InlineLayout.vue'
import AChatImageModal from './AChatImageModal.vue'
import { CHAT_STATUS_ICON_ERROR_SIZE, CHAT_STATUS_ICON_SIZE } from '../helpers/uiMetrics'

export default defineComponent({
  methods: { downloadFile },
  components: {
    InlineLayout,
    ImageLayout,
    QuotedMessage,
    AChatImageModal
  },
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    },
    partnerId: {
      type: String,
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
  emits: ['resend', 'click:quotedMessage', 'swipe:left', 'longpress'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useStore()

    const userId = computed(() => store.state.address)
    const partnerId = usePartnerId(props.transaction)
    const currentIndex = ref(0)
    const isModalOpen = ref(false)

    const openModal = (index: number) => {
      currentIndex.value = index
      isModalOpen.value = true
    }

    const closeModal = () => {
      isModalOpen.value = false
    }
    const showAvatar = computed(() => !isWelcomeChat(partnerId.value))

    const statusIcon = computed(() => tsIcon(props.transaction.status))
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

    const hasImagesOnly = computed(() => {
      const files = props.transaction.localFiles || (props.transaction.asset.files as FileAsset[])

      return files.every((file) => {
        if (isLocalFile(file)) {
          return file.file.isImage
        }

        return ['jpg', 'jpeg', 'png'].includes(file.extension!)
      })
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
      CHAT_STATUS_ICON_SIZE,
      CHAT_STATUS_ICON_ERROR_SIZE,
      currentIndex,
      isModalOpen,
      openModal,
      closeModal,
      hasImagesOnly
    }
  }
})
</script>
<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/components/_chat-message-content.scss' as chatMessageContent;
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.a-chat__attachments {
  --a-chat-attachments-offset-top: var(--a-space-1);
  --a-chat-attachments-grid-width: 80vw;
  width: var(--a-chat-attachments-max-width);
  max-width: 100%;
  margin-top: var(--a-chat-attachments-offset-top);

  &--inline {
    width: auto;
  }
}

.a-chat__message-text {
  @include chatMessageContent.a-chat-message-body-copy();
}

.a-chat_file-container {
  max-width: var(--a-chat-attachments-file-container-max-width);
}

.a-chat_fileContainerWithElement {
  display: grid;
  gap: calc(var(--a-space-1) / 2);
  width: var(--a-chat-attachments-grid-width);
  max-width: var(--a-chat-attachments-grid-max-width);
  grid-template-columns: repeat(
    auto-fit,
    minmax(var(--a-chat-attachments-grid-min-column-width), 1fr)
  );
}

.a-chat_file-img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

.v-theme--light {
  .a-chat-file {
    background-color: map.get(colors.$adm-colors, 'secondary');
    color: map.get(colors.$adm-colors, 'regular');
  }
}

.v-theme--dark {
  .a-chat-file {
    background-color: map.get(colors.$adm-colors, 'secondary2-slightly-transparent');
    color: map.get(settings.$shades, 'white');
  }
}
</style>
