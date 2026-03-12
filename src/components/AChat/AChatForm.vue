<template>
  <div :class="classList">
    <v-divider v-if="showDivider" class="a-chat__divider" />

    <slot name="reply-preview" />
    <slot name="preview-file" />

    <div ref="messageInputRoot">
      <v-textarea
        v-model="message"
        @input="onInput"
        :placeholder="placeholder"
        :disabled="shouldDisableInput"
        hide-details
        single-line
        auto-grow
        :rows="textareaRows"
        max-rows="10"
        variant="plain"
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
          <v-icon
            class="a-chat__form-send-area"
            :class="{ 'a-chat__form-send-area--disabled': isDisabled }"
            :icon="mdiSend"
            :size="sendIconSize"
            :disabled="isDisabled"
            @click="submitMessage"
          />
        </template>
      </v-textarea>
    </div>
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
import { VALIDATION_ERRORS } from '@/lib/constants'
import { getMessageSubmitAction } from '@/components/AChat/helpers/messageInputKeypress'
import { resetTextareaAutogrow } from '@/components/AChat/helpers/resetTextareaAutogrow'
import { CHAT_FORM_SEND_ICON_SIZE } from '@/components/AChat/helpers/uiMetrics'

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
const isTextareaHeightSyncScheduled = ref(false)
const latestInputType = ref('')
const messageInputRoot = useTemplateRef<HTMLElement | null>('messageInputRoot')

const className = 'a-chat'
const sendIconSize = CHAT_FORM_SEND_ICON_SIZE
const maxTextareaRows = 10
const getMessageLineCount = (value: string) => value.split('\n').length
const classList = computed(() => [
  `${className}__form`,
  {
    [`${className}__form--is-active`]: !!message.value
  }
])
const textareaRows = computed(() => {
  const lineBreakRows = message.value.split('\n').length

  return Math.min(maxTextareaRows, Math.max(1, lineBreakRows))
})

const isEmojiPickerOpen = computed({
  get: () => chatStateStore.isEmojiPickerOpen,
  set: setEmojiPickerOpen
})
const placeholder = computed(() => props.label ?? t('chats.type_a_message'))
const isDesktopDevice = !isMobile()

const isDisabled = computed(() => {
  const error = props.validator(message.value)

  if (
    error === VALIDATION_ERRORS.NotEnoughFunds ||
    error === VALIDATION_ERRORS.NotEnoughFundsNewAccount
  ) {
    return false
  }

  return error !== false
})

const listeners = computed(() => {
  return {
    keypress: (e: KeyboardEvent) => {
      const action = getMessageSubmitAction({
        keyCode: e.keyCode,
        sendOnEnter: props.sendOnEnter,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey
      })

      if (action === 'linefeed') {
        addLineFeed()
        return
      }

      if (action === 'send') {
        e.preventDefault()
        submitMessage()
      }
    },
    keydown: (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (isInputFocused.value) {
          e.preventDefault()
          e.stopPropagation()
          getTextareaElement()?.blur()
          return
        }

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
        focus()
      }
    })
  }
)

watch(
  () => message.value,
  (nextValue, previousValue) => {
    const isDeleteInput = latestInputType.value.startsWith('delete')
    const hasCollapsedToEmptySecondLineAfterDelete =
      isDeleteInput &&
      getMessageLineCount(previousValue) === 2 &&
      getMessageLineCount(nextValue) === 2 &&
      !previousValue.endsWith('\n') &&
      nextValue.endsWith('\n')

    if (hasCollapsedToEmptySecondLineAfterDelete) {
      // When deleting content from `line1\nline2`, browsers often keep an extra trailing
      // line break (`line1\n`). Collapse only this specific shape.
      // Do not collapse `line1\n\n -> line1\n`, otherwise one delete removes two lines.
      latestInputType.value = ''
      message.value = nextValue.slice(0, -1)
      return
    }

    if (getMessageLineCount(nextValue) < getMessageLineCount(previousValue)) {
      scheduleTextareaHeightSync()
    }

    latestInputType.value = ''
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

const getTextareaElement = () => {
  return messageInputRoot.value?.querySelector('textarea') ?? null
}

const resetTextareaControlHeight = () => {
  const textareaField = messageInputRoot.value?.querySelector('.v-field')

  if (textareaField instanceof HTMLElement) {
    textareaField.style.removeProperty('--v-textarea-control-height')
  }
}

const scheduleTextareaHeightSync = () => {
  if (isTextareaHeightSyncScheduled.value) {
    return
  }

  isTextareaHeightSyncScheduled.value = true

  const syncTextareaHeight = () => {
    resetTextareaControlHeight()
    resetTextareaAutogrow(messageInputRoot.value)
  }

  nextTick(() => {
    syncTextareaHeight()

    // Vuetify auto-grow may re-apply control height after Vue updates.
    // Second pass on the next frame stabilizes the final height.
    requestAnimationFrame(() => {
      syncTextareaHeight()
      isTextareaHeightSyncScheduled.value = false
    })
  })
}

const onInput = (event?: Event) => {
  const inputEvent = event as InputEvent | undefined
  latestInputType.value = inputEvent?.inputType ?? ''

  store.commit('draftMessage/saveMessage', {
    message: message.value,
    partnerId: props.partnerId
  })
}

const emojiPicture = (emoji: string) => {
  const textareaElement = getTextareaElement()
  const caretPosition = textareaElement?.selectionStart ?? undefined

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
    textareaElement?.setSelectionRange(newCaretPosition, newCaretPosition)
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
    scheduleTextareaHeightSync()
    store.commit('draftMessage/deleteMessage', {
      message: message.value,
      partnerId: props.partnerId
    })
    botCommandIndex.value = null
    botCommandSelectionMode.value = false
  } else {
    emit('error', error)
  }

  nextTick(() => {
    focus()
  })
}

const addLineFeed = () => {
  message.value += '\n'
}

const focus = () => {
  getTextareaElement()?.focus()
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
  --a-chat-send-color: #{map.get(settings.$shades, 'white')};
  --a-chat-send-color-disabled: #{map.get(colors.$adm-colors, 'muted')};
  --a-chat-form-prepend-offset-y: var(--a-chat-form-prepend-offset-y);
  --a-chat-form-prepend-offset-inline: var(--a-chat-form-prepend-offset-inline);
  --a-chat-form-send-hit-size: var(--a-chat-form-send-hit-size);

  :deep(.v-text-field__slot) textarea {
    max-height: var(--a-chat-form-max-height);
    overflow-y: auto;
  }

  :deep(.v-text-field) {
    align-items: flex-end;
  }
  :deep(.v-textarea) {
    .v-input__prepend {
      margin-bottom: var(--a-chat-form-prepend-offset-y);
      margin-inline-end: var(--a-chat-form-prepend-offset-inline);
      padding-top: 0;
    }
    .v-field__append-inner,
    .v-field__prepend-inner {
      margin-top: auto;
      padding-top: 0;
      margin-bottom: var(--a-space-1);
    }
    .v-field__prepend-inner > .v-icon,
    .v-field__append-inner > .v-icon,
    .v-field__clearable > .v-icon {
      --v-medium-emphasis-opacity: 1;
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

.a-chat__form {
  :deep(.v-field__append-inner) {
    display: flex;
    align-items: center;
  }
}

.a-chat__form-send-area {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--a-chat-form-send-hit-size);
    height: var(--a-chat-form-send-hit-size);
    background: currentColor;
    border-radius: var(--a-radius-round);
    opacity: 0;
    transform: translate(-50%, -50%);
    transition: opacity var(--a-motion-slow) var(--a-ease-standard);
    z-index: -1;
  }

  &:hover::before {
    opacity: 0.1;
  }

  color: var(--a-chat-send-color);

  &--disabled {
    color: var(--a-chat-send-color-disabled);
  }

  &.v-icon--disabled {
    opacity: 1;
  }

  &:hover {
    color: map.get(colors.$adm-colors, 'primary');
  }
}

.v-theme--light {
  .a-chat__form {
    --a-chat-send-color: #{map.get(settings.$shades, 'black')};
    --a-chat-send-color-disabled: #{map.get(colors.$adm-colors, 'muted')};
  }

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
    --a-chat-send-color: #{map.get(settings.$shades, 'white')};
    --a-chat-send-color-disabled: #{rgba(map.get(settings.$shades, 'white'), 0.6)};
  }

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
