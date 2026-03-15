<template>
  <v-list density="compact" variant="text" elevation="9" :class="classes.root">
    <v-list-item @click="onClickPrimaryAction">
      <v-list-item-title>{{ primaryActionLabel }}</v-list-item-title>

      <template #append>
        <v-icon :icon="primaryActionIcon" />
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
import { computed, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiContentCopy, mdiRefresh, mdiReply } from '@mdi/js'
import { useStore } from 'vuex'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { TransactionStatus } from '@/lib/constants'
import { isStringEqualCI } from '@/lib/textHelpers'

const className = 'message-actions-list'
const classes = {
  root: className
}

export default defineComponent({
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    }
  },
  emits: ['click:reply', 'click:copy', 'click:retry'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useStore()

    const isRejectedOutgoingMessage = computed(
      () =>
        props.transaction.type === 'message' &&
        props.transaction.status === TransactionStatus.REJECTED &&
        isStringEqualCI(props.transaction.senderId, store.state.address)
    )
    const primaryActionLabel = computed(() =>
      isRejectedOutgoingMessage.value
        ? t('chats.chat_actions.retry')
        : t('chats.chat_actions.reply')
    )
    const primaryActionIcon = computed(() =>
      isRejectedOutgoingMessage.value ? mdiRefresh : mdiReply
    )

    const onClickPrimaryAction = () => {
      emit(isRejectedOutgoingMessage.value ? 'click:retry' : 'click:reply')
    }

    return {
      classes,
      t,
      emit,
      onClickPrimaryAction,
      primaryActionLabel,
      primaryActionIcon,
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
