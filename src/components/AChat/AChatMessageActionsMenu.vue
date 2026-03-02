<template>
  <v-list density="compact" variant="text" :class="classes.vList" elevation="9">
    <v-list-item @click="onClickReply">
      <v-list-item-title>{{ t('chats.chat_actions.reply') }}</v-list-item-title>

      <template #append>
        <v-icon :icon="mdiReply" />
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
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiContentCopy, mdiReply } from '@mdi/js'

const className = 'message-actions-menu'
const classes = {
  root: className,
  vList: `${className}__list`,
  vOverlayContent: `${className}__overlay-content`,
  vOverlayContentLeft: `${className}__overlay-content--left`,
  vOverlayContentRight: `${className}__overlay-content--right`
}

export default defineComponent({
  emits: ['update:modelValue', 'click:reply', 'click:copy'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const onClickReply = () => emit('click:reply')
    const onClickCopy = () => emit('click:copy')

    return {
      classes,
      t,
      onClickReply,
      onClickCopy,
      mdiContentCopy,
      mdiReply
    }
  }
})
</script>

<style lang="scss">
@use '@/assets/styles/components/_chat.scss';

.message-actions-menu {
  --a-chat-message-actions-menu-list-padding-block: 0;
  --a-chat-message-actions-menu-list-radius: var(--a-radius-sm);
  --a-chat-message-actions-menu-overlay-inset-inline: var(--a-space-4);

  &__list {
    padding-top: var(--a-chat-message-actions-menu-list-padding-block);
    padding-bottom: var(--a-chat-message-actions-menu-list-padding-block);
    border-radius: var(--a-chat-message-actions-menu-list-radius);
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
