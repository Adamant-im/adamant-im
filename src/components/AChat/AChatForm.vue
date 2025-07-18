<template>
  <div :class="classList">
    <v-divider v-if="showDivider" class="a-chat__divider" />

    <slot name="reply-preview" />
    <slot name="preview-file" />

    <v-textarea
      ref="messageTextarea"
      v-model="message"
      @input="onInput"
      :placeholder="placeholder"
      :disabled="shouldDisableInput"
      hide-details
      single-line
      auto-grow
      rows="1"
      max-rows="10"
      variant="underlined"
      density="compact"
      base-color="primary"
      color="primary"
      v-on="listeners"
      :autofocus="isDesktopDevice"
      @focusin="isInputFocused = true"
      @focusout="isInputFocused = false"
    >
      <template #prepend-inner>
        <chat-emojis
          @keydown.capture.esc="closeElement"
          :open="isEmojiPickerOpen"
          @onChange="onToggleEmojiPicker"
          @get-emoji-picture="emojiPicture"
        ></chat-emojis>
      </template>
      <template v-if="showSendButton" #append-inner>
        <slot name="append" />
        <v-icon class="a-chat__send-icon" :icon="mdiSend" size="28" />
      </template>
    </v-textarea>

    <div v-if="showSendButton" class="a-chat__form-send-area" @click="submitMessage" />
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import ChatEmojis from '@/components/Chat/ChatEmojis.vue'
import { isMobile } from '@/lib/display-mobile'
import { mdiSend } from '@mdi/js'
import { useChatStateStore } from '@/stores/modal-state'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { VTextarea } from 'vuetify/components'

type Textarea = VTextarea & {
  calculateInputHeight: () => void
}

const store = useStore()
const chatStateStore = useChatStateStore()
const { t } = useI18n()

const { setEmojiPickerOpen } = chatStateStore

type Props = {
  partnerId?: string
  messageText?: string
  showSendButton?: boolean
  sendOnEnter?: boolean
  label?: string
  shouldDisableInput?: boolean
  showDivider?: boolean
  validator: (message: string) => string | false
}

const props = withDefaults(defineProps<Props>(), {
  partnerId: '',
  messageText: '',
  showSendButton: true,
  sendOnEnter: true,
  label: undefined,
  shouldDisableInput: false,
  showDivider: false
})

const emit = defineEmits<{
  (e: 'message', message: string): void
  (e: 'esc'): void
  (e: 'error', error: string): void
}>()

const message = ref('')
const botCommandIndex = ref<number | null>(null)
const botCommandSelectionMode = ref(false)
const isInputFocused = ref(false)
const messageTextarea = useTemplateRef<Textarea | null>('messageTextarea')

const className = 'a-chat'
const classList = [
  `${className}__form`,
  {
    [`${className}__form--is-active`]: !!message.value
  }
]

const isEmojiPickerOpen = computed({
  get: () => chatStateStore.isEmojiPickerOpen,
  set: setEmojiPickerOpen
})
const placeholder = computed(() => props.label ?? t('chats.type_a_message'))
const isDesktopDevice = !isMobile()
const listeners = computed(() => {
  return {
    keypress: (e: KeyboardEvent) => {
      // on some devices keyCode for CTRL+ENTER is 10
      // https://bugs.chromium.org/p/chromium/issues/detail?id=79407
      if (e.keyCode === 13 || e.keyCode === 10) {
        // Enter || Ctrl+Enter
        if (props.sendOnEnter) {
          // add LF and calculate height when CTRL+ENTER or ALT+ENTER or CMD+ENTER (Mac & Windows)
          // no need to add LF for shiftKey, it will be added automatically
          if (e.ctrlKey || e.altKey || e.metaKey) {
            addLineFeed()
            calculateInputHeight()
            return
          }

          if (!e.shiftKey) {
            // send message if shiftKey is not pressed
            e.preventDefault()
            submitMessage()
          }
        } else {
          if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
            e.preventDefault()
            submitMessage()
          }
        }
      }
    },
    keydown: (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        emit('esc')
      }
    }
  }
})

onMounted(() => {
  if (props.messageText) {
    message.value = props.messageText
    focus()
  }
  attachKeyCommandListener()
})

onBeforeUnmount(() => {
  destroyKeyCommandListener()
})

watch(
  () => props.shouldDisableInput,
  (newVal) => {
    nextTick(() => {
      if (!newVal && !isInputFocused.value) {
        messageTextarea.value?.focus()
      }
    })
  }
)

const attachKeyCommandListener = () => {
  window.addEventListener('keydown', onKeyCommand)
}

const destroyKeyCommandListener = () => {
  window.removeEventListener('keydown', onKeyCommand)
}

const onKeyCommand = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.shiftKey && event.code === 'Digit1') {
    openElement()
  } else if (isInputFocused.value && (event.code === 'ArrowUp' || event.code === 'ArrowDown')) {
    selectCommand(event)
  } else if (event.key.length === 1) {
    botCommandSelectionMode.value = false
    botCommandIndex.value = null
  }
}

const openElement = () => {
  isEmojiPickerOpen.value = true
}

const closeElement = () => {
  isEmojiPickerOpen.value = false
  setTimeout(() => focus(), 0)
}

const onInput = () => {
  store.commit('draftMessage/saveMessage', {
    message: message.value,
    partnerId: props.partnerId
  })
}

const emojiPicture = (emoji: string) => {
  const caretPosition = messageTextarea.value?.selectionStart || undefined

  let before = message.value.slice(0, caretPosition)
  const after = message.value.slice(caretPosition)
  let emojiLength = emoji.length

  if (
    (before.length > 0 &&
      !/\s|[[{(\n]/.test(before.slice(-1)) && // Check for a space, newline or parentheses before the emoji
      !before
        .slice(-2)
        .match(/[\p{Emoji_Presentation}\p{Emoji}\p{Emoji_Modifier_Base}\p{Emoji_Component}]/gu)) ||
    /[\d]/.test(before.slice(-1))
  ) {
    before += ' '
    emojiLength += 1
  }
  message.value = before + emoji + after
  closeElement()

  // Set the cursor position to after the newly inserted text
  const newCaretPosition = (caretPosition || 0) + emojiLength
  focus()
  nextTick(() => {
    messageTextarea.value?.setSelectionRange(newCaretPosition, newCaretPosition)
  })
  onInput()
}

const onToggleEmojiPicker = (state: boolean) => {
  isEmojiPickerOpen.value = state

  focus()
}

const submitMessage = () => {
  const error = props.validator(message.value)
  if (error === false) {
    if (message.value.startsWith('/')) {
      store.commit('botCommands/addCommand', {
        partnerId: props.partnerId,
        command: message.value.trim(),
        timestamp: Date.now()
      })
    }
    emit('message', message.value)
    message.value = ''
    store.commit('draftMessage/deleteMessage', {
      message: message.value,
      partnerId: props.partnerId
    })
    botCommandIndex.value = null
    botCommandSelectionMode.value = false
  } else {
    emit('error', error)
  }

  // Fix textarea height to 1 row after miltiline message send
  calculateInputHeight()
  focus()
}

const calculateInputHeight = () => {
  nextTick(messageTextarea.value?.calculateInputHeight)
}

const addLineFeed = () => {
  message.value += '\n'
}

const focus = () => {
  messageTextarea.value?.focus()
}

const selectCommand = (event: KeyboardEvent) => {
  const direction = event.code
  if (!message.value) {
    botCommandSelectionMode.value = true
  }
  if (!botCommandSelectionMode.value) {
    return
  }
  event.preventDefault()
  const commands = store.getters['botCommands/getCommandsHistory'](props.partnerId)
  const maxIndex = commands.length > 0 ? commands.length - 1 : 0
  if (botCommandIndex.value === null) {
    if (direction === 'ArrowUp') {
      botCommandIndex.value = maxIndex
      message.value = commands[botCommandIndex.value]?.command || ''
    }
    return
  }

  if (direction === 'ArrowUp') {
    if (botCommandIndex.value > 0) {
      botCommandIndex.value--
      message.value = commands[botCommandIndex.value]?.command || ''
    }
    return
  }

  if (botCommandIndex.value < maxIndex) {
    botCommandIndex.value++
    message.value = commands[botCommandIndex.value]?.command || ''
  }
}

defineExpose({
  focus
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

/**
 * 1. Limit height of message form.
 * 2. Align icons at the bottom.
 */
.a-chat__form {
  :deep(.v-text-field__slot) textarea {
    max-height: 230px;
    overflow-y: auto;
  }
  :deep(.v-text-field) {
    align-items: flex-end;
  }
  :deep(.v-textarea) {
    .v-input__prepend {
      margin-bottom: 2px;
      margin-inline-end: 9px;
      padding-top: 0;
    }
    .v-field__append-inner,
    .v-field__prepend-inner {
      margin-top: auto;
      padding-top: 0;
      margin-bottom: 4px;
    }
    .v-field__prepend-inner > .v-icon,
    .v-field__append-inner > .v-icon,
    .v-field__clearable > .v-icon {
      --v-medium-emphasis-opacity: 1;
    }
    .v-input__control {
      margin-bottom: 2px;
    }
    .v-field__input {
      &::placeholder {
        --v-disabled-opacity: 1;
      }
    }
  }
}

.a-chat__divider {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.a-chat__form-send-area {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 50px;
  height: 50px;
  cursor: pointer;
}

.v-theme--light {
  .a-chat__form {
    :deep(.v-textarea) {
      .v-field__input {
        caret-color: map.get(colors.$adm-colors, 'primary');

        &::placeholder {
          color: map.get(colors.$adm-colors, 'muted');
        }
      }
    }
  }
}

.v-theme--dark {
  .a-chat__form {
    :deep(.v-textarea) {
      .v-field__input {
        caret-color: map.get(colors.$adm-colors, 'primary');

        &::placeholder {
          color: rgba(map.get(settings.$shades, 'white'), 70%);
        }
      }
    }
  }
}
</style>
