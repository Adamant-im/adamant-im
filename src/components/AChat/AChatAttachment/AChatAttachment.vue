<template>
  <v-row
    class="a-chat__message-container a-chat__message-container--with-attachments"
    :class="{
      'a-chat__message-container--right': isSender,
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
      left: swipeDisabled ? '0px' : `${elementLeftOffset}px`,
      width: `${singleImageWidth}`
    }"
    v-longpress="onLongPress"
  >
    <v-btn
      v-show="attachmentsToDownload.length"
      class="a-chat__download-attachments-btn"
      :class="{
        'a-chat__download-attachments-btn--left': isSender,
        'a-chat__download-attachments-btn--right': !isSender
      }"
      icon
      variant="text"
      :size="32"
      :disabled="areAttachmentsDownloading"
      @click="downloadAllAttachments"
    >
      <v-icon
        class="a-chat__download-attachments-btn__icon"
        size="100%"
        :icon="areAttachmentsDownloading ? mdiClockOutline : mdiArrowDownCircleOutline"
      />
    </v-btn>

    <div
      class="a-chat__message a-chat__message--with-attachments"
      :class="{
        'a-chat__message--flashing': flashing,
        'elevation-9': elevation
      }"
      :data-id="dataId"
    >
      <div class="a-chat__message-card">
        <div class="a-chat__message-card-header mt-1">
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
        :style="{ maxHeight }"
        @download-image="downloadAttachment"
        @click:image="openModal"
      />
      <InlineLayout
        v-else
        :partnerId="partnerId"
        :files="transaction.localFiles || transaction.asset.files"
        :transaction="transaction"
        @download-image="downloadAttachment"
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
        @download-file="onDownloadFile"
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
import { isLocalFile, LocalFile } from '@/lib/files'
import { isStringEqualCI } from '@/lib/textHelpers'
import { tsIcon } from '@/lib/constants'
import QuotedMessage from '../QuotedMessage.vue'
import { useSwipeLeft } from '@/hooks/useSwipeLeft'
import formatDate from '@/filters/date'
import { isWelcomeChat } from '@/lib/chat/meta/utils'
import ImageLayout from './ImageLayout.vue'
import InlineLayout from './InlineLayout.vue'
import AChatImageModal from './AChatImageModal.vue'
import { mdiClockOutline, mdiArrowDownCircleOutline } from '@mdi/js'
import { isFileImage } from '@/lib/files/helpers/isFileImage'

export default defineComponent({
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
  emits: [
    'resend',
    'click:quotedMessage',
    'swipe:left',
    'longpress',
    'downloadAttachment',
    'downloadAllAttachments'
  ],
  setup(props, { emit }) {
    const windowHeight = window.innerHeight

    const singleImageHeight = windowHeight / 3
    const multipleImagesHeight = (windowHeight * 2) / 3

    const { t } = useI18n()
    const store = useStore()
    const partnerId = usePartnerId(props.transaction)
    const formattedMessage = useFormatMessage(props.transaction)
    const time = useTransactionTime(props.transaction)
    const { onMove, onSwipeEnd, elementLeftOffset } = useSwipeLeft(() => {
      emit('swipe:left')
    })

    const currentIndex = ref(0)
    const isModalOpen = ref(false)

    const userId = computed(() => store.state.address)
    const isSender = computed(() => isStringEqualCI(props.transaction.senderId, userId.value))
    const showAvatar = computed(() => !isWelcomeChat(partnerId.value))
    const statusIcon = computed(() => tsIcon(props.transaction.status))
    const files = computed(
      () => props.transaction.localFiles || (props.transaction.asset.files as FileAsset[])
    )

    const isOutgoingMessage = computed(() =>
      isStringEqualCI(props.transaction.senderId, userId.value)
    )

    const isImage = (file: FileAsset) => {
      return isFileImage(file)
    }

    const hasImagesOnly = computed(() => {
      return files.value.every((file) => {
        if (isLocalFile(file)) {
          return file.file.isImage
        }

        return isImage(file)
      })
    })

    const maxHeight = computed(() => {
      if (!hasImagesOnly.value) {
        return 'auto'
      }

      if (files.value.length === 1) {
        return `${singleImageHeight}px`
      }

      return `${multipleImagesHeight}px`
    })

    const singleImageWidth = computed(() => {
      const defaultWidth = 500

      if (hasImagesOnly.value && files.value.length === 1) {
        const file = files.value[0]

        const width = isLocalFile(file) ? file.file.width : file.resolution?.[0]
        const height = isLocalFile(file) ? file.file.height : file.resolution?.[1]

        const aspectRatio = width && height ? width / height : 1

        return `${singleImageHeight * aspectRatio}px`
      }

      return `${defaultWidth}px`
    })

    const attachmentsToDownload = computed(() => {
      const getImageUrl = store.getters['attachment/getImageUrl']

      return files.value.filter((file): file is FileAsset => {
        if (isLocalFile(file)) return false
        if (!isImage(file)) return false

        return !getImageUrl(file.id) || !getImageUrl(file.preview?.id)
      })
    })

    const isDownloaded = (id?: string) => {
      return store.getters['attachment/getDownloadProgress'](id) === 100
    }

    const areAttachmentsDownloading = computed(() => {
      return attachmentsToDownload.value.some((file) => {
        return !isDownloaded(file.id) || !isDownloaded(file.preview?.id)
      })
    })

    const downloadAttachment = (attachment: FileAsset | LocalFile) => {
      emit('downloadAttachment', attachment)
    }

    const downloadAllAttachments = () => {
      emit('downloadAllAttachments', attachmentsToDownload.value)
    }

    const openModal = (index: number) => {
      currentIndex.value = index
      isModalOpen.value = true
    }

    const closeModal = () => {
      isModalOpen.value = false
    }

    const onLongPress = () => {
      emit('longpress')
    }

    const onDownloadFile = (file: FileAsset | LocalFile) => {
      try {
        store.dispatch('attachment/downloadFile', {
          transaction: props.transaction,
          file
        })
      } catch {
        store.dispatch('snackbar/show', {
          message: t('chats.file_not_found'),
          isError: true
        })
      }
    }

    return {
      t,
      userId,
      isSender,
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
      currentIndex,
      isModalOpen,
      openModal,
      closeModal,
      hasImagesOnly,
      maxHeight,
      singleImageWidth,
      attachmentsToDownload,
      areAttachmentsDownloading,
      downloadAttachment,
      downloadAllAttachments,
      onDownloadFile,
      mdiClockOutline,
      mdiArrowDownCircleOutline
    }
  }
})
</script>
<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';

.a-chat__attachments {
  width: 500px;
  max-width: 100%;

  &--inline {
    width: auto;
  }
}

.a-chat_file-container {
  max-width: 420px;
}

.a-chat_fileContainerWithElement {
  display: grid;
  gap: 2px;
  width: 80vw;
  max-width: 200px;
  grid-template-columns: repeat(auto-fit, minmax(98px, 1fr));
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
    background-color: rgba(245, 245, 245, 0.1); // @todo const
    color: #fff;
  }
}
</style>
