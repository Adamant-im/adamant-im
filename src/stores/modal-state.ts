import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatStateStore = defineStore('chatState', () => {
  const isChatMenuOpen = ref(false)
  const isEmojiPickerOpen = ref(false)
  const actionsDropdownMessageId = ref<number | string>(-1)

  const setChatMenuOpen = (value: boolean) => {
    isChatMenuOpen.value = value
  }

  const setEmojiPickerOpen = (value: boolean) => {
    isEmojiPickerOpen.value = value
  }

  const setActionsDropdownMessageId = (value: number | string) => {
    actionsDropdownMessageId.value = value
  }

  const $reset = () => {
    setChatMenuOpen(false)
    setEmojiPickerOpen(false)
    setActionsDropdownMessageId(-1)
  }

  return {
    actionsDropdownMessageId,
    isChatMenuOpen,
    isEmojiPickerOpen,

    setActionsDropdownMessageId,
    setChatMenuOpen,
    setEmojiPickerOpen,
    $reset
  }
})
