<template>
  <v-menu
    :min-width="80"
    :max-width="264"
    :close-on-content-click="false"
    @update:model-value="emit('dialog:close')"
  >
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
        <slot name="top" />
      </div>

      <slot name="bottom" />
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
  reactionSelect: `${className}__reaction-select`
}

export default defineComponent({
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    }
  },
  emits: ['click:reply', 'click:copy', 'dialog:close'],
  setup(props, { emit }) {
    const { t } = useI18n()

    return { t, classes, emit }
  }
})
</script>

<style lang="scss">
.message-actions-dropdown {
  &__reaction-select {
    margin-top: 8px;
  }
}
</style>
