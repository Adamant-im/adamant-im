import { defineAsyncComponent, type Component } from 'vue'

/**
 * Dialogs that can be opened with `useModalsStore().open({ component: '<name>' })`.
 * A dialog receives `modelValue` and its props, and reports back with the `close` event
 * (carries the result) or the `dismiss` event (no result).
 */
export const modalRegistry: Record<string, Component> = {
  ChatStartDialog: defineAsyncComponent(() => import('@/components/ChatStartDialog.vue'))
}
