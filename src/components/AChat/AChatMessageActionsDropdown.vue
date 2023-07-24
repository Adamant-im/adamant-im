<template>
  <v-menu :min-width="80" :max-width="184">
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
  </v-menu>
</template>

<script>
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const className = 'message-actions-dropdown'
const classes = {
  root: className,
  list: `${className}__list`
}

export default defineComponent({
  emits: ['click:reply', 'click:copy'],
  setup() {
    const { t } = useI18n()

    return { t, classes }
  }
})
</script>

<style lang="scss">
.message-actions-dropdown {
  &__list {
    padding-top: 0;
    padding-bottom: 0;
  }
}
</style>
