<template>
  <AChatMessageActionsDropdown
    :transaction="transaction"
    :open="open"
    @open:change="toggleActionsDropdown"
    @click:reply="openReplyPreview"
    @click:copy="copyMessageToClipboard"
  >
    <template #top>
      <EmojiPicker
        v-if="showEmojiPicker"
        @emoji:select="onEmojiSelect"
        elevation
        position="absolute"
      />

      <AChatReactionSelect
        v-else
        :transaction="transaction"
        @reaction:add="sendReaction"
        @reaction:remove="removeReaction"
        @click:emoji-picker="$emit('update:showEmojiPicker', true)"
      />
    </template>

    <template #bottom>
      <AChatMessageActionsList
        v-if="!showEmojiPicker"
        @click:reply="openReplyPreview"
        @click:copy="copyMessageToClipboard"
      />
    </template>
  </AChatMessageActionsDropdown>
</template>

<script setup lang="ts">
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import EmojiPicker from '@/components/EmojiPicker.vue'
import {
  AChatReactionSelect,
  AChatMessageActionsList,
  AChatMessageActionsDropdown
} from '@/components/AChat'

const props = defineProps<{
  transaction: NormalizedChatMessageTransaction
  open: boolean
  showEmojiPicker: boolean
}>()

const emit = defineEmits<{
  (e: 'open:change', open: boolean, transaction: NormalizedChatMessageTransaction): void
  (e: 'click:reply', message: NormalizedChatMessageTransaction): void
  (e: 'click:copy', message: NormalizedChatMessageTransaction): void
  (e: 'reaction:add', reactToId: string, emoji: string): void
  (e: 'reaction:remove', reactToId: string, emoji: string): void
  (e: 'emoji:select', transactionId: string, emoji: string): void
  (e: 'update:showEmojiPicker', value: boolean): void
}>()

const toggleActionsDropdown = (open: boolean) => {
  emit('open:change', open, props.transaction)
}

const openReplyPreview = () => {
  emit('click:reply', props.transaction)
}

const copyMessageToClipboard = () => {
  emit('click:copy', props.transaction)
}

const sendReaction = (reactToId: string, emoji: string) => {
  emit('reaction:add', reactToId, emoji)
}

const removeReaction = (reactToId: string, emoji: string) => {
  emit('reaction:remove', reactToId, emoji)
}

const onEmojiSelect = (emoji: string) => {
  emit('emoji:select', props.transaction.id, emoji)
}
</script>
