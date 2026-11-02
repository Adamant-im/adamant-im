import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatStateStore = defineStore('chatState', () => {
  const isShowPartnerInfoDialog = ref(false)
  const isShowFreeTokensDialog = ref(false)
  const isShowSetPasswordDialog = ref(false)
  const isChatMenuOpen = ref(false)
  const isEmojiPickerOpen = ref(false)
  const actionsDropdownMessageId = ref<number | string>(-1)

  const setShowPartnerInfoDialog = (value: boolean) => {
    isShowPartnerInfoDialog.value = value
  }

  const setShowFreeTokensDialog = (value: boolean) => {
    isShowFreeTokensDialog.value = value
  }

  const setShowSetPasswordDialog = (value: boolean) => {
    isShowSetPasswordDialog.value = value
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

  const $reset = () => {
    setShowPartnerInfoDialog(false)
    setShowFreeTokensDialog(false)
    setShowSetPasswordDialog(false)
    setChatMenuOpen(false)
    setEmojiPickerOpen(false)
    setActionsDropdownMessageId(-1)
  }

  return {
    actionsDropdownMessageId,
    isShowPartnerInfoDialog,
    isShowFreeTokensDialog,
    isShowSetPasswordDialog,
    isChatMenuOpen,
    isEmojiPickerOpen,

    setActionsDropdownMessageId,
    setShowPartnerInfoDialog,
    setShowFreeTokensDialog,
    setShowSetPasswordDialog,
    setChatMenuOpen,
    setEmojiPickerOpen,
    $reset
  }
})
