import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const genericTokensPath = path.resolve(currentDir, '../../assets/styles/generic/_tokens.scss')
const secondaryDialogMixinPath = path.resolve(
  currentDir,
  '../../assets/styles/components/_secondary-dialog.scss'
)
const warningOnAddressesDialogPath = path.resolve(
  currentDir,
  '../../components/WarningOnAddressesDialog.vue'
)
const warningOnPartnerAddressDialogPath = path.resolve(
  currentDir,
  '../../components/WarningOnPartnerAddressDialog.vue'
)
const freeTokensDialogPath = path.resolve(currentDir, '../../components/FreeTokensDialog.vue')
const nodesOfflineDialogPath = path.resolve(currentDir, '../../components/NodesOfflineDialog.vue')
const chatStartDialogPath = path.resolve(currentDir, '../../components/ChatStartDialog.vue')
const walletResetDialogPath = path.resolve(
  currentDir,
  '../../components/wallets/WalletResetDialog.vue'
)
const passwordSetDialogPath = path.resolve(currentDir, '../../components/PasswordSetDialog.vue')
const shareUriDialogPath = path.resolve(currentDir, '../../components/ShareURIDialog.vue')
const buyTokensDialogPath = path.resolve(currentDir, '../../components/BuyTokensDialog.vue')
const chatDialogPath = path.resolve(currentDir, '../../components/Chat/ChatDialog.vue')
const partnerInfoDialogPath = path.resolve(currentDir, '../../components/PartnerInfo.vue')
const qrcodeRendererDialogPath = path.resolve(
  currentDir,
  '../../components/QrcodeRendererDialog.vue'
)
const qrcodeScannerDialogPath = path.resolve(currentDir, '../../components/QrcodeScannerDialog.vue')
const sendFundsFormPath = path.resolve(currentDir, '../../components/SendFundsForm.vue')
const httpProtocolInfoDialogPath = path.resolve(
  currentDir,
  '../../components/nodes/components/HttpProtocolInfoDialog.vue'
)
const votesViewPath = path.resolve(currentDir, '../Votes.vue')
const vibroViewPath = path.resolve(currentDir, '../Vibro.vue')
const textContentPath = path.resolve(
  currentDir,
  '../../assets/styles/components/_text-content.scss'
)

describe('Secondary dialogs UI contract', () => {
  it('defines shared secondary-dialog tokens and mixin', () => {
    const tokensContent = readFileSync(genericTokensPath, 'utf8')
    const mixinContent = readFileSync(secondaryDialogMixinPath, 'utf8')

    expect(tokensContent).toContain('--a-secondary-dialog-padding-inline')
    expect(tokensContent).toContain('--a-secondary-dialog-title-padding')
    expect(tokensContent).toContain('--a-secondary-dialog-content-padding')
    expect(tokensContent).toContain('--a-secondary-dialog-actions-padding')
    expect(tokensContent).toContain('--a-secondary-dialog-width')
    expect(tokensContent).toContain('--a-secondary-dialog-width-compact')
    expect(tokensContent).toContain('--a-secondary-dialog-width-info')
    expect(tokensContent).toContain('--a-secondary-dialog-width-qrcode')
    expect(tokensContent).toContain('--a-secondary-dialog-content-padding-reset')
    expect(tokensContent).toContain('--a-secondary-dialog-list-padding-block')
    expect(tokensContent).toContain('--a-secondary-dialog-list-background')
    expect(tokensContent).toContain('--a-color-surface-warning-soft')
    expect(tokensContent).toContain('--a-secondary-dialog-disclaimer-gap')
    expect(tokensContent).toContain('--a-secondary-dialog-action-margin-top')
    expect(tokensContent).toContain('--a-secondary-dialog-footer-padding-bottom')
    expect(mixinContent).toContain('@mixin a-secondary-dialog-title()')
    expect(mixinContent).toContain('@mixin a-secondary-dialog-body-copy()')
    expect(mixinContent).toContain('@mixin a-secondary-dialog-link-action()')
    expect(mixinContent).toContain('@mixin a-secondary-dialog-action-block($padding: 0)')
    expect(mixinContent).toContain('@mixin a-secondary-dialog-primary-action-button()')
    expect(mixinContent).toContain('@mixin a-secondary-dialog-footer-link-block()')
    expect(mixinContent).toContain('@mixin a-secondary-dialog-card-frame()')
    expect(mixinContent).toContain('@mixin a-secondary-dialog-warning-frame()')
    expect(mixinContent).toContain('@include mixins.a-text-header();')
    expect(mixinContent).toContain('@include mixins.a-text-regular-enlarged();')
    expect(mixinContent).toContain('@include mixins.a-text-active();')
    expect(mixinContent).toContain('margin-top: var(--a-secondary-dialog-action-margin-top);')
    expect(mixinContent).toContain(
      'padding: 0 0 var(--a-secondary-dialog-footer-padding-bottom) 0;'
    )
    expect(mixinContent).toContain('var(--a-secondary-dialog-title-padding)')
    expect(mixinContent).toContain('var(--a-secondary-dialog-content-padding)')
    expect(mixinContent).toContain('var(--a-secondary-dialog-actions-padding)')
    expect(mixinContent).toContain('var(--a-list-row-min-height)')
    expect(mixinContent).toContain('var(--a-secondary-dialog-disclaimer-gap)')
    expect(mixinContent).toContain('var(--a-secondary-dialog-highlight-padding)')
  })

  it('uses shared warning/info dialog pattern instead of repeated raw spacing', () => {
    const warningAddressesContent = readFileSync(warningOnAddressesDialogPath, 'utf8')
    const warningPartnerContent = readFileSync(warningOnPartnerAddressDialogPath, 'utf8')
    const freeTokensContent = readFileSync(freeTokensDialogPath, 'utf8')
    const nodesOfflineContent = readFileSync(nodesOfflineDialogPath, 'utf8')

    for (const content of [
      warningAddressesContent,
      warningPartnerContent,
      freeTokensContent,
      nodesOfflineContent
    ]) {
      expect(content).toContain('secondaryDialog.a-secondary-dialog-warning-frame()')
      expect(content).toContain('secondaryDialog.a-secondary-dialog-title()')
      expect(content).toContain('secondaryDialog.a-secondary-dialog-body-copy()')
      expect(content).toContain('secondaryDialog.a-secondary-dialog-action-block(')
      expect(content).toContain('width="var(--a-secondary-dialog-width)"')
      expect(content).toContain('__card-title')
      expect(content).not.toContain('padding: 16px !important;')
      expect(content).not.toContain('margin-top: 10px;')
      expect(content).not.toContain('padding: 10px;')
      expect(content).not.toContain('margin-right: 8px;')
    }

    expect(warningAddressesContent).toContain('`${className}__btn-block`')
    expect(warningAddressesContent).not.toContain('class="text-center pa-0"')
    expect(warningPartnerContent).toContain('`${className}__btn-block`')
    expect(warningPartnerContent).not.toContain('class="text-center"')
    expect(freeTokensContent).toContain('`${className}__btn-block`')
    expect(freeTokensContent).not.toContain('class="text-center pa-0"')
    expect(nodesOfflineContent).toContain('`${className}__btn-block`')
    expect(nodesOfflineContent).not.toContain("[`${className}__btn-block`, 'text-center']")

    expect(warningAddressesContent).not.toContain('margin-top: 15px;')
    expect(warningAddressesContent).not.toContain('margin-bottom: 20px;')
    expect(warningAddressesContent).not.toContain('padding: 0 0 30px 0;')
    expect(freeTokensContent).not.toContain('padding: 0 0 30px 0;')
    expect(nodesOfflineContent).not.toContain('padding: 12px 0 24px 0;')
    expect(freeTokensContent).toContain(
      'secondaryDialog.a-secondary-dialog-primary-action-button()'
    )
    expect(freeTokensContent).toContain('secondaryDialog.a-secondary-dialog-footer-link-block()')
    expect(warningAddressesContent).toContain(
      'secondaryDialog.a-secondary-dialog-primary-action-button()'
    )
    expect(warningAddressesContent).toContain(
      'secondaryDialog.a-secondary-dialog-footer-link-block()'
    )
    expect(warningPartnerContent).toContain(
      'secondaryDialog.a-secondary-dialog-primary-action-button()'
    )
  })

  it('uses semantic dialog body classes and shared tokens in secondary dialog forms', () => {
    const warningAddressesContent = readFileSync(warningOnAddressesDialogPath, 'utf8')
    const warningPartnerContent = readFileSync(warningOnPartnerAddressDialogPath, 'utf8')
    const chatStartContent = readFileSync(chatStartDialogPath, 'utf8')
    const walletResetContent = readFileSync(walletResetDialogPath, 'utf8')
    const passwordSetContent = readFileSync(passwordSetDialogPath, 'utf8')
    const shareUriContent = readFileSync(shareUriDialogPath, 'utf8')
    const buyTokensContent = readFileSync(buyTokensDialogPath, 'utf8')
    const chatDialogContent = readFileSync(chatDialogPath, 'utf8')
    const partnerInfoContent = readFileSync(partnerInfoDialogPath, 'utf8')
    const qrcodeRendererContent = readFileSync(qrcodeRendererDialogPath, 'utf8')
    const qrcodeScannerContent = readFileSync(qrcodeScannerDialogPath, 'utf8')
    const sendFundsFormContent = readFileSync(sendFundsFormPath, 'utf8')
    const httpProtocolInfoContent = readFileSync(httpProtocolInfoDialogPath, 'utf8')
    const votesViewContent = readFileSync(votesViewPath, 'utf8')
    const textContent = readFileSync(textContentPath, 'utf8')

    expect(chatStartContent).toContain('`${className}__body`')
    expect(chatStartContent).toContain('`${className}__card-title')
    expect(chatStartContent).toContain('`${className}__actions`')
    expect(chatStartContent).toContain('inputActionMenu.a-input-action-menu()')
    expect(chatStartContent).toContain('__menu-list')
    expect(chatStartContent).toContain('__menu-item')
    expect(chatStartContent).toContain('__menu-item-title')
    expect(chatStartContent).toContain('width="var(--a-secondary-dialog-width)"')
    expect(chatStartContent).toContain('secondaryDialog.a-secondary-dialog-card-frame()')
    expect(chatStartContent).toContain('var(--a-secondary-dialog-action-margin-top)')
    expect(chatStartContent).toContain('var(--a-secondary-dialog-link-margin-top)')
    expect(chatStartContent).not.toContain('class="pa-4"')
    expect(chatStartContent).not.toContain('class="text-center"')
    expect(chatStartContent).not.toContain('margin-top: 15px;')
    expect(chatStartContent).not.toContain('margin-bottom: 15px;')

    expect(walletResetContent).toContain("const className = 'wallet-reset-dialog'")
    expect(walletResetContent).toContain('`${classes.root}__trigger-wrap`')
    expect(walletResetContent).toContain('`${classes.root}__trigger`')
    expect(walletResetContent).toContain('`${classes.root}__dialog-body`')
    expect(walletResetContent).toContain('`${classes.root}__dialog-actions`')
    expect(walletResetContent).toContain('width="var(--a-secondary-dialog-width)"')
    expect(walletResetContent).toContain('secondaryDialog.a-secondary-dialog-card-frame()')
    expect(walletResetContent).not.toContain('class="pa-4"')
    expect(walletResetContent).not.toContain('class="text-right"')
    expect(walletResetContent).not.toContain('class="a-btn-primary ma-2"')
    expect(walletResetContent).not.toContain("const className = 'wallets-view'")
    expect(walletResetContent).not.toContain('width="500"')

    expect(passwordSetContent).toContain("const className = 'password-set-dialog'")
    expect(passwordSetContent).toContain('`${className}__card-title')
    expect(passwordSetContent).toContain('`${className}__body`')
    expect(passwordSetContent).toContain('`${className}__actions`')
    expect(passwordSetContent).toContain('`${className}__submit-spinner`')
    expect(passwordSetContent).toContain('width="var(--a-secondary-dialog-width)"')
    expect(passwordSetContent).toContain('secondaryDialog.a-secondary-dialog-card-frame()')
    expect(passwordSetContent).toContain('AUTH_FORM_TOGGLE_BUTTON_SIZE')
    expect(passwordSetContent).toContain('AUTH_FORM_TOGGLE_ICON_SIZE')
    expect(passwordSetContent).toContain('AUTH_FORM_SUBMIT_SPINNER_SIZE')
    expect(passwordSetContent).toContain('secondaryDialog.a-secondary-dialog-title()')
    expect(passwordSetContent).toContain('secondaryDialog.a-secondary-dialog-body-copy()')
    expect(passwordSetContent).toContain('secondaryDialog.a-secondary-dialog-link-action()')
    expect(passwordSetContent).not.toContain('class="pa-4"')
    expect(passwordSetContent).not.toContain('class="pa-3"')
    expect(passwordSetContent).not.toContain('class="mr-4"')

    expect(shareUriContent).toContain("const className = 'share-uri-dialog'")
    expect(shareUriContent).toContain('width="var(--a-secondary-dialog-width-compact)"')
    expect(shareUriContent).toContain('classes.dialogBody')
    expect(shareUriContent).toContain('classes.list')
    expect(shareUriContent).toContain('classes.listItem')
    expect(shareUriContent).toContain('@include mixins.a-text-header();')
    expect(shareUriContent).toContain('bg-color="transparent"')
    expect(shareUriContent).toContain('background: var(--a-secondary-dialog-list-background);')
    expect(shareUriContent).toContain(
      'padding-block: var(--a-secondary-dialog-list-padding-block) !important;'
    )
    expect(shareUriContent).toContain(
      'padding: var(--a-secondary-dialog-content-padding-reset) !important;'
    )
    expect(shareUriContent).toContain('secondaryDialog.a-secondary-dialog-card-frame()')
    expect(shareUriContent).not.toContain('class="pa-0"')
    expect(shareUriContent).toContain("map.get(colors.$adm-colors, 'regular')")
    expect(shareUriContent).toContain("map.get(settings.$shades, 'white')")
    expect(shareUriContent).not.toContain('width="320"')

    expect(buyTokensContent).toContain("const className = 'buy-tokens-dialog'")
    expect(buyTokensContent).toContain('width="var(--a-secondary-dialog-width-compact)"')
    expect(buyTokensContent).toContain('classes.dialogBody')
    expect(buyTokensContent).toContain('`${classes.root}__dialog-title')
    expect(buyTokensContent).toContain('classes.listItem')
    expect(buyTokensContent).toContain('classes.listItemTitle')
    expect(buyTokensContent).toContain('@include mixins.a-text-header();')
    expect(buyTokensContent).toContain('bg-color="transparent"')
    expect(buyTokensContent).toContain('background: var(--a-secondary-dialog-list-background);')
    expect(buyTokensContent).toContain(
      'padding-block: var(--a-secondary-dialog-list-padding-block) !important;'
    )
    expect(buyTokensContent).toContain(
      'padding: var(--a-secondary-dialog-content-padding-reset) !important;'
    )
    expect(buyTokensContent).toContain('secondaryDialog.a-secondary-dialog-card-frame()')
    expect(buyTokensContent).not.toContain('class="pa-0"')
    expect(buyTokensContent).toContain("map.get(colors.$adm-colors, 'regular')")
    expect(buyTokensContent).toContain("map.get(settings.$shades, 'white')")
    expect(buyTokensContent).not.toContain('width="320"')

    expect(chatDialogContent).toContain("className: () => 'chat-dialog'")
    expect(chatDialogContent).toContain('`${className}__card-title')
    expect(chatDialogContent).toContain('`${className}__card-text`')
    expect(chatDialogContent).toContain('`${className}__card-actions`')
    expect(chatDialogContent).toContain('width="var(--a-secondary-dialog-width)"')
    expect(chatDialogContent).toContain('secondaryDialog.a-secondary-dialog-title()')
    expect(chatDialogContent).toContain('secondaryDialog.a-secondary-dialog-card-frame()')
    expect(chatDialogContent).not.toContain('class="pa-4"')

    expect(partnerInfoContent).toContain("const className = 'partner-info-dialog'")
    expect(partnerInfoContent).toContain('max-width="var(--a-secondary-dialog-width-info)"')
    expect(partnerInfoContent).toContain('`${className}__list`')
    expect(partnerInfoContent).toContain('COMMON_ICON_BUTTON_SIZE')
    expect(partnerInfoContent).toContain('COMMON_ICON_SIZE')
    expect(partnerInfoContent).toContain('secondaryDialog.a-secondary-dialog-title()')
    expect(partnerInfoContent).toContain('bg-color="transparent"')
    expect(partnerInfoContent).toContain('background: inherit;')
    expect(partnerInfoContent).toContain('`${className}__qrcode-row`')
    expect(partnerInfoContent).toContain('padding-bottom: var(--a-space-6);')
    expect(partnerInfoContent).toContain('secondaryDialog.a-secondary-dialog-card-frame()')
    expect(partnerInfoContent).not.toContain('max-width="360"')
    expect(partnerInfoContent).not.toContain(':size="36"')
    expect(partnerInfoContent).not.toContain(':size="24"')
    expect(partnerInfoContent).not.toContain('class="pb-6"')

    expect(qrcodeRendererContent).toContain("className: () => 'qrcode-renderer-dialog'")
    expect(qrcodeRendererContent).toContain('width="var(--a-secondary-dialog-width-qrcode)"')
    expect(qrcodeRendererContent).toContain('`${className}__body`')
    expect(qrcodeRendererContent).toContain('`${className}__content`')
    expect(qrcodeRendererContent).toContain('`${className}__preview-action`')
    expect(qrcodeRendererContent).toContain('<button')
    expect(qrcodeRendererContent).toContain('type="button"')
    expect(qrcodeRendererContent).toContain(':aria-label="$t(\'login.save_qr_code_to_images\')"')
    expect(qrcodeRendererContent).toContain('`${className}__button`')
    expect(qrcodeRendererContent).toContain('secondaryDialog.a-secondary-dialog-card-frame()')
    expect(qrcodeRendererContent).not.toContain('cursor: pointer;')
    expect(qrcodeRendererContent).not.toContain('width="250"')

    expect(qrcodeScannerContent).toContain("const className = 'qrcode-scanner-dialog'")
    expect(qrcodeScannerContent).toContain('`${classes.root}__status`')
    expect(qrcodeScannerContent).toContain('`${classes.root}__hint`')
    expect(qrcodeScannerContent).toContain('`${classes.root}__state`')
    expect(qrcodeScannerContent).toContain('`${classes.root}__status-title`')
    expect(qrcodeScannerContent).toContain('`${classes.root}__dialog-actions`')
    expect(qrcodeScannerContent).toContain('width="var(--a-secondary-dialog-width)"')
    expect(qrcodeScannerContent).toContain('secondaryDialog.a-secondary-dialog-card-frame()')
    expect(qrcodeScannerContent).toContain('@include mixins.a-text-header();')
    expect(qrcodeScannerContent).toContain('@include mixins.a-text-regular();')
    expect(qrcodeScannerContent).not.toContain('class="pa-8"')
    expect(qrcodeScannerContent).not.toContain('class="pa-6"')

    expect(sendFundsFormContent).toContain('send-funds-confirm-dialog__dialog-title')
    expect(sendFundsFormContent).toContain('send-funds-confirm-dialog__dialog-body')
    expect(sendFundsFormContent).toContain('send-funds-confirm-dialog__dialog-actions')
    expect(sendFundsFormContent).toContain('send-funds-confirm-dialog__spinner')
    expect(sendFundsFormContent).toContain('width="var(--a-secondary-dialog-width)"')
    expect(sendFundsFormContent).toContain('secondaryDialog.a-secondary-dialog-card-frame()')
    expect(sendFundsFormContent).not.toContain('v-card-actions class="pa-4"')
    expect(sendFundsFormContent).not.toContain('class="mr-4"')

    expect(httpProtocolInfoContent).toContain("const className = 'http-protocol-info-dialog'")
    expect(httpProtocolInfoContent).toContain('`${className}__dialog-title')
    expect(httpProtocolInfoContent).toContain('`${className}__dialog-body')
    expect(httpProtocolInfoContent).toContain('`${className}__paragraph`')
    expect(httpProtocolInfoContent).toContain('`${className}__section-title')
    expect(httpProtocolInfoContent).toContain('`${className}__list`')
    expect(httpProtocolInfoContent).toContain('`${className}__dialog-actions')
    expect(httpProtocolInfoContent).toContain('width="var(--a-secondary-dialog-width)"')
    expect(httpProtocolInfoContent).toContain('@include mixins.a-text-header();')
    expect(httpProtocolInfoContent).toContain('textContent.a-content-body-copy()')
    expect(httpProtocolInfoContent).toContain('@include mixins.a-text-regular-enlarged-bold();')
    expect(httpProtocolInfoContent).toContain('secondaryDialog.a-secondary-dialog-card-frame()')
    expect(httpProtocolInfoContent).not.toContain('class="pa-4 a-text-regular-enlarged"')
    expect(httpProtocolInfoContent).not.toContain('v-card-actions class="pa-3"')
    expect(httpProtocolInfoContent).not.toContain('class="mb-4"')
    expect(httpProtocolInfoContent).not.toContain('class="a-text-regular-enlarged-bold mb-2"')
    expect(httpProtocolInfoContent).not.toContain('class="ml-4"')
    expect(textContent).toContain('@mixin a-content-body-copy()')

    expect(votesViewContent).toContain("const summaryDialogClass = 'delegates-summary-dialog'")
    expect(votesViewContent).toContain('`${summaryDialogClass}__dialog-title`')
    expect(votesViewContent).toContain('`${summaryDialogClass}__dialog-body`')
    expect(votesViewContent).toContain('`${summaryDialogClass}__dialog-actions`')
    expect(votesViewContent).toContain('width="var(--a-secondary-dialog-width)"')
    expect(votesViewContent).toContain('secondaryDialog.a-secondary-dialog-card-frame()')
    expect(votesViewContent).not.toContain('class="pa-4 v-row--no-gutters"')
    expect(warningAddressesContent).toContain('var(--a-color-surface-warning-soft)')
    expect(warningPartnerContent).toContain('var(--a-color-surface-warning-soft)')
  })

  it('uses shared dev-screen spacing pattern in vibro public utility screen', () => {
    const content = readFileSync(vibroViewPath, 'utf8')

    expect(content).toContain("const className = 'vibro-view'")
    expect(content).toContain("label: 'dev_vibrations.double_short'")
    expect(content).toContain('onClick: () => vibrate.doubleShort()')
    expect(content).toContain('var(--a-dev-screen-section-gap)')
    expect(content).toContain('var(--a-dev-screen-section-title-gap)')
    expect(content).toContain('var(--a-dev-screen-section-title-padding-bottom)')
    expect(content).toContain('`${className}__section`')
    expect(content).toContain('`${className}__section-title`')
    expect(content).toContain('`${className}__custom-input`')
    expect(content).toContain('`${className}__play-button`')
    expect(content).toContain('`${className}__preset-button`')
    expect(content).not.toContain('class="input"')
    expect(content).not.toContain('class="btnPlay"')
    expect(content).not.toContain('class="btn"')
    expect(content).not.toContain('border: 2px solid orange;')
    expect(content).not.toContain('margin-right: var(--a-space-4);')
    expect(content).not.toContain('margin-top: 12px;')
    expect(content).not.toContain('background-color: rgba(205, 144, 31, 0.93);')
  })
})
