import { defineAsyncComponent, type Component } from 'vue'

/**
 * Dialogs that can be opened with `useModalsStore().open({ component: '<name>' })`.
 * A dialog receives `modelValue` and its props, and reports back with the `close` event
 * (carries the result) or the `dismiss` event (no result).
 */
export const modalRegistry: Record<string, Component> = {
  BuildInfoDialog: defineAsyncComponent(() => import('@/components/BuildInfoDialog.vue')),
  BuyTokensDialog: defineAsyncComponent(() => import('@/components/BuyTokensDialog.vue')),
  ChatStartDialog: defineAsyncComponent(() => import('@/components/ChatStartDialog.vue')),
  FreeTokensDialog: defineAsyncComponent(() => import('@/components/FreeTokensDialog.vue')),
  HttpProtocolInfoDialog: defineAsyncComponent(
    () => import('@/components/nodes/components/HttpProtocolInfoDialog.vue')
  ),
  PartnerInfo: defineAsyncComponent(() => import('@/components/PartnerInfo.vue')),
  PasswordSetDialog: defineAsyncComponent(() => import('@/components/PasswordSetDialog.vue')),
  QrcodeRendererDialog: defineAsyncComponent(() => import('@/components/QrcodeRendererDialog.vue')),
  QrcodeScannerDialog: defineAsyncComponent(() => import('@/components/QrcodeScannerDialog.vue')),
  ShareURIDialog: defineAsyncComponent(() => import('@/components/ShareURIDialog.vue')),
  WarningOnAddressesDialog: defineAsyncComponent(
    () => import('@/components/WarningOnAddressesDialog.vue')
  ),
  WarningOnPartnerAddressDialog: defineAsyncComponent(
    () => import('@/components/WarningOnPartnerAddressDialog.vue')
  )
}
