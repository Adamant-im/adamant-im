<template>
  <v-menu :min-width="80" :max-width="250">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        variant="text"
        :size="28"
        :ripple="false"
        :elevation="0"
        class="a-chat__message-actions-icon"
      >
        <v-icon icon="mdi-chevron-down" :size="24" />
      </v-btn>
    </template>

    <div>
      <div :class="classes.reactionSelect">
        <slot />
      </div>

      <v-list density="compact" variant="text" elevation="9" :class="classes.list">
        <v-list-item @click="$emit('click:reply')">
          <v-list-item-title>{{ t('chats.chat_actions.reply') }}</v-list-item-title>

          <template #append>
            <v-icon icon="mdi-reply" />
          </template>
        </v-list-item>

        <v-divider />

        <v-list-item @click="$emit('click:copy')">
          <v-list-item-title>{{ t('chats.chat_actions.copy') }}</v-list-item-title>

          <template #append>
            <v-icon icon="mdi-content-copy" />
          </template>
        </v-list-item>
      </v-list>
    </div>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'

const className = 'message-actions-dropdown'
const classes = {
  root: className,
  reactionSelect: `${className}__reaction-select`,
  list: `${className}__list`
}

export default defineComponent({
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    }
  },
  emits: ['click:reply', 'click:copy', 'react'],
  setup() {
    const { t } = useI18n()

    return { t, classes }
  }
})
</script>

<style lang="scss">
.message-actions-dropdown {
  &__reaction-select {
    margin-top: 8px;
  }

  &__list {
    padding-top: 0;
    padding-bottom: 0;
    border-radius: 8px;
    margin-top: 16px;
  }
}
</style>
