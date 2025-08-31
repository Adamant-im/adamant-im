<template>
  <v-list density="compact" variant="text" elevation="9" :class="classes.root">
    <v-list-item @click="emit('click:reply')">
      <v-list-item-title>{{ t('chats.chat_actions.reply') }}</v-list-item-title>

      <template #append>
        <v-icon :icon="mdiReply" />
      </template>
    </v-list-item>

    <div v-if="allowCopy">
      <v-divider />

      <v-list-item @click="emit('click:copy')">
        <v-list-item-title>{{ t('chats.chat_actions.copy') }}</v-list-item-title>

        <template #append>
          <v-icon :icon="mdiContentCopy" />
        </template>
      </v-list-item>
    </div>
  </v-list>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { mdiContentCopy, mdiReply } from '@mdi/js'

const className = 'message-actions-list'
const classes = {
  root: className
}

type Props = {
  allowCopy: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'click:reply'): void
  (e: 'click:copy'): void
}>()

const { t } = useI18n()
</script>

<style lang="scss">
.message-actions-list {
  padding-top: 0;
  padding-bottom: 0;
  border-radius: 8px;
  margin-top: 16px;
}
</style>
