<template>
  <v-list density="compact" variant="text" elevation="9" :class="classes.root">
    <v-list-item @click="emit('click:reply')">
      <v-list-item-title>{{ t('chats.chat_actions.reply') }}</v-list-item-title>

      <template #append>
        <v-icon :icon="mdiReply" />
      </template>
    </v-list-item>

    <v-divider />

    <v-list-item @click="emit('click:copy')">
      <v-list-item-title>{{ t('chats.chat_actions.copy') }}</v-list-item-title>

      <template #append>
        <v-icon :icon="mdiContentCopy" />
      </template>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiContentCopy, mdiReply } from '@mdi/js'

const className = 'message-actions-list'
const classes = {
  root: className
}

export default defineComponent({
  emits: ['click:reply', 'click:copy'],
  setup(props, { emit }) {
    const { t } = useI18n()

    return {
      classes,
      t,
      emit,
      mdiContentCopy,
      mdiReply
    }
  }
})
</script>

<style lang="scss">
.message-actions-list {
  --a-chat-message-actions-list-padding-block: 0;
  --a-chat-message-actions-list-radius: var(--a-radius-sm);
  --a-chat-message-actions-list-offset-top: var(--a-space-2);
  padding-top: var(--a-chat-message-actions-list-padding-block);
  padding-bottom: var(--a-chat-message-actions-list-padding-block);
  border-radius: var(--a-chat-message-actions-list-radius);
  margin-top: var(--a-chat-message-actions-list-offset-top);
}
</style>
