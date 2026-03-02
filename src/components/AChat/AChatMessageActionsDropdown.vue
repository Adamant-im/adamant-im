<template>
  <v-menu
    :min-width="CHAT_ACTIONS_DROPDOWN_MIN_WIDTH"
    :max-width="CHAT_ACTIONS_DROPDOWN_MAX_WIDTH"
    :close-on-content-click="false"
    :model-value="open"
    @update:model-value="toggleMenu"
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        variant="text"
        :size="CHAT_ACTIONS_DROPDOWN_BUTTON_SIZE"
        :ripple="false"
        :elevation="0"
        class="a-chat__message-actions-icon"
        @click="toggleMenu(true)"
      >
        <v-icon :icon="mdiChevronDown" :size="CHAT_ACTIONS_DROPDOWN_ICON_SIZE" />
      </v-btn>
    </template>

    <div>
      <div :class="classes.top">
        <slot name="top" />
      </div>

      <slot name="bottom" />
    </div>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiChevronDown } from '@mdi/js'

import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import {
  CHAT_ACTIONS_DROPDOWN_BUTTON_SIZE,
  CHAT_ACTIONS_DROPDOWN_ICON_SIZE,
  CHAT_ACTIONS_DROPDOWN_MAX_WIDTH,
  CHAT_ACTIONS_DROPDOWN_MIN_WIDTH
} from './helpers/uiMetrics'

const className = 'message-actions-dropdown'
const classes = {
  root: className,
  top: `${className}__top`
}

export default defineComponent({
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    },
    open: {
      type: Boolean
    }
  },
  emits: ['click:reply', 'click:copy', 'open:change'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const toggleMenu = (state: boolean) => {
      emit('open:change', state, props.transaction)
    }

    return {
      t,
      classes,
      mdiChevronDown,
      toggleMenu,
      CHAT_ACTIONS_DROPDOWN_MIN_WIDTH,
      CHAT_ACTIONS_DROPDOWN_MAX_WIDTH,
      CHAT_ACTIONS_DROPDOWN_BUTTON_SIZE,
      CHAT_ACTIONS_DROPDOWN_ICON_SIZE
    }
  }
})
</script>

<style lang="scss">
.message-actions-dropdown {
  --a-chat-message-actions-dropdown-top-gap: var(--a-space-2);

  &__top {
    margin-top: var(--a-chat-message-actions-dropdown-top-gap);
  }
}
</style>
