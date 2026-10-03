import type { Component } from 'vue'

import ChatStartDialog from '@/components/ChatStartDialog.vue'

/**
 * Dialog components available to the async modal system (`modals.open({ component })`).
 *
 * Dialogs are migrated one by one (see #915): a dialog is registered here once it
 * renders its own `v-card` content and emits `close`/`dismiss` instead of owning
 * a `v-dialog` and a visibility flag.
 */
export const dialogs: Record<string, Component> = {
  ChatStartDialog
}

export const getDialog = (name: string): Component => {
  const component = dialogs[name]

  if (!component) {
    throw new Error(`[modals] Unknown dialog component: "${name}"`)
  }

  return component
}
