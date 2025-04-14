import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatStateStore = defineStore('chatState', () => {
  const isShowChatStartDialog = ref(false)
  const isShowPartnerInfoDialog = ref(false)
  const isShowFreeTokensDialog = ref(false)
  const isChatMenuOpen = ref(false)
  const isEmojiPickerOpen = ref(false)
  const actionsDropdownMessageId = ref<number | string>(-1)

  const setShowChatStartDialog = (value: boolean) => {
    isShowChatStartDialog.value = value
  }

  const setShowPartnerInfoDialog = (value: boolean) => {
    isShowPartnerInfoDialog.value = value
  }

  const setShowFreeTokensDialog = (value: boolean) => {
    isShowFreeTokensDialog.value = value
  }

  const setChatMenuOpen = (value: boolean) => {
    isChatMenuOpen.value = value
  }

  const setEmojiPickerOpen = (value: boolean) => {
    isEmojiPickerOpen.value = value
  }

  const setActionsDropdownMessageId = (value: number | string) => {
    actionsDropdownMessageId.value = value
  }

  return {
    actionsDropdownMessageId,
    isShowChatStartDialog,
    isShowPartnerInfoDialog,
    isShowFreeTokensDialog,
    isChatMenuOpen,
    isEmojiPickerOpen,

    setActionsDropdownMessageId,
    setShowChatStartDialog,
    setShowPartnerInfoDialog,
    setShowFreeTokensDialog,
    setChatMenuOpen,
    setEmojiPickerOpen
  }
})
