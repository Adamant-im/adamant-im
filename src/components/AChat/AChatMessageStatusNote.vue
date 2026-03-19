<template>
  <div :class="classes.root">
    {{ t('chats.message_not_sent_status') }}
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const className = 'a-chat-message-status-note'
const classes = {
  root: className
}

const { t } = useI18n()
</script>

<style lang="scss">
.a-chat-message-status-note {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--a-space-2) var(--a-space-3);
  border-radius: var(--a-radius-md);
  background-color: rgb(var(--v-theme-surface));
  border: var(--a-border-width-thin) solid rgb(var(--v-theme-error));
  min-height: var(--a-chat-actions-overlay-reaction-height);
}
</style>
