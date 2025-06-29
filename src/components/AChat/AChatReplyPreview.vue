<template>
  <div :class="classes.root">
    <div :class="classes.container">
      <div :class="classes.avatar">
        <ChatAvatar :user-id="message.senderId" use-public-key />
      </div>

      <div :class="classes.message">
        <span v-if="!isCryptoTransfer" v-html="messageLabel"></span>
        <span v-else>{{ cryptoTransferLabel }}</span>
      </div>

      <v-btn
        @click="$emit('cancel')"
        :class="classes.closeButton"
        :icon="mdiClose"
        size="24"
        variant="plain"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

import ChatAvatar from '@/components/Chat/ChatAvatar.vue'
import { Cryptos } from '@/lib/constants'
import currencyFormatter from '@/filters/currencyAmountWithSymbol'
import { formatChatPreviewMessage } from '@/lib/markdown'
import { mdiClose } from '@mdi/js'
import type { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'

const className = 'a-chat-reply-preview'
const classes = {
  root: className,
  container: `${className}__container`,
  message: `${className}__message`,
  avatar: `${className}__avatar`,
  closeButton: `${className}__close-button`
}

type AChatReplyPreviewProps = {
  message: NormalizedChatMessageTransaction
  partnerId: string
}

const props = defineProps<AChatReplyPreviewProps>()

defineEmits<{
  (e: 'cancel'): void
}>()

const { t } = useI18n()
const store = useStore()

const isCryptoTransfer = computed(() => {
  const validCryptos = Object.keys(Cryptos)

  return props.message ? validCryptos.includes(props.message.type) : false
})

const cryptoTransferLabel = computed(() => {
  const direction =
    props.message.senderId === props.partnerId ? t('chats.received_label') : t('chats.sent_label')
  const amount = currencyFormatter(props.message.amount, props.message.type)
  const message = props.message.message ? `: ${props.message.message}` : ''

  return `${direction} ${amount}${message}`
})

const messageLabel = computed(() => {
  return store.state.options.formatMessages
    ? formatChatPreviewMessage(props.message.message)
    : props.message.message
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';

$message-max-lines: 2;

.a-chat-reply-preview {
  border-left: 3px solid map.get(colors.$adm-colors, 'attention');
  border-radius: 8px;
  margin: 8px;

  &__container {
    padding: 8px 16px;
    position: relative;
    display: flex;
  }

  &__message {
    @include mixins.a-text-regular-enlarged();
    line-height: 20px; // half of <ChatAvatar/> height

    margin-left: 8px;
    margin-right: 8px;

    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: $message-max-lines;
    -webkit-box-orient: vertical;
  }

  &__close-button {
    position: absolute;
    right: 0;
    top: 0;
    margin-right: 4px;
    margin-top: 4px;
  }
}

.v-theme--light {
  .a-chat-reply-preview {
    background-color: map.get(colors.$adm-colors, 'secondary');
    color: map.get(colors.$adm-colors, 'regular');
  }
}

.v-theme--dark {
  .a-chat-reply-preview {
    background-color: rgba(245, 245, 245, 0.1); // @todo const
    color: #fff;
  }
}
</style>
