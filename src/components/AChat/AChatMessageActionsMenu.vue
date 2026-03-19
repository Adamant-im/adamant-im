<template>
  <v-list density="compact" variant="text" :class="classes.vList" elevation="9">
    <v-list-item @click="onClickPrimaryAction">
      <v-list-item-title>{{ primaryActionLabel }}</v-list-item-title>

      <template #append>
        <v-icon :icon="primaryActionIcon" />
      </template>
    </v-list-item>

    <v-divider />

    <v-list-item @click="onClickCopy">
      <v-list-item-title>{{ t('chats.chat_actions.copy') }}</v-list-item-title>

      <template #append>
        <v-icon :icon="mdiContentCopy" />
      </template>
    </v-list-item>
  </v-list>
</template>

<script>
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiContentCopy, mdiRefresh, mdiReply } from '@mdi/js'
import { useStore } from 'vuex'
import { TransactionStatus } from '@/lib/constants'
import { isStringEqualCI } from '@/lib/textHelpers'

const className = 'message-actions-menu'
const classes = {
  root: className,
  vList: `${className}__list`,
  vOverlayContent: `${className}__overlay-content`,
  vOverlayContentLeft: `${className}__overlay-content--left`,
  vOverlayContentRight: `${className}__overlay-content--right`
}

export default defineComponent({
  props: {
    transaction: {
      type: Object,
      required: true
    }
  },
  emits: ['update:modelValue', 'click:reply', 'click:copy', 'click:retry'],
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
    const onClickCopy = () => emit('click:copy')

    return {
      classes,
      t,
      onClickPrimaryAction,
      onClickCopy,
      primaryActionLabel,
      primaryActionIcon,
      mdiContentCopy,
      mdiReply
    }
  }
})
</script>

<style lang="scss">
@use '@/assets/styles/components/_chat-action-surface.scss' as chatActionSurface;
@use '@/assets/styles/components/_chat.scss';

.message-actions-menu {
  --a-chat-message-actions-menu-list-padding-block: 0;
  --a-chat-message-actions-menu-overlay-inset-inline: var(--a-space-4);
  --a-chat-message-actions-menu-list-min-width: 160px;

  &__list {
    @include chatActionSurface.a-chat-action-surface();
    padding-top: var(--a-chat-message-actions-menu-list-padding-block);
    padding-bottom: var(--a-chat-message-actions-menu-list-padding-block);
    min-width: var(--a-chat-message-actions-menu-list-min-width);
  }

  &__overlay-content {
    &--left {
      left: var(--a-chat-message-actions-menu-overlay-inset-inline) !important;
    }

    &--right {
      left: unset !important;
      right: calc(
        var(--a-chat-message-actions-menu-overlay-inset-inline) + #{chat.$scroll-bar-width}
      );
    }
  }
}
</style>
