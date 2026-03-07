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
const vibroViewPath = path.resolve(currentDir, '../Vibro.vue')

describe('Secondary dialogs UI contract', () => {
  it('defines shared secondary-dialog tokens and mixin', () => {
    const tokensContent = readFileSync(genericTokensPath, 'utf8')
    const mixinContent = readFileSync(secondaryDialogMixinPath, 'utf8')

    expect(tokensContent).toContain('--a-secondary-dialog-content-padding')
    expect(tokensContent).toContain('--a-secondary-dialog-disclaimer-gap')
    expect(tokensContent).toContain('--a-secondary-dialog-action-margin-top')
    expect(tokensContent).toContain('--a-secondary-dialog-footer-padding-bottom')
    expect(mixinContent).toContain('@mixin a-secondary-dialog-warning-frame()')
    expect(mixinContent).toContain('var(--a-secondary-dialog-content-padding)')
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
      expect(content).not.toContain('padding: 16px !important;')
      expect(content).not.toContain('margin-top: 10px;')
      expect(content).not.toContain('padding: 10px;')
      expect(content).not.toContain('margin-right: 8px;')
    }

    expect(warningAddressesContent).not.toContain('margin-top: 15px;')
    expect(warningAddressesContent).not.toContain('margin-bottom: 20px;')
    expect(warningAddressesContent).not.toContain('padding: 0 0 30px 0;')
    expect(freeTokensContent).not.toContain('padding: 0 0 30px 0;')
    expect(nodesOfflineContent).not.toContain('padding: 12px 0 24px 0;')
  })

  it('uses semantic dialog body classes and shared tokens in secondary dialog forms', () => {
    const chatStartContent = readFileSync(chatStartDialogPath, 'utf8')
    const walletResetContent = readFileSync(walletResetDialogPath, 'utf8')
    const passwordSetContent = readFileSync(passwordSetDialogPath, 'utf8')

    expect(chatStartContent).toContain('`${className}__body`')
    expect(chatStartContent).toContain('var(--a-secondary-dialog-content-padding)')
    expect(chatStartContent).toContain('var(--a-secondary-dialog-action-margin-top)')
    expect(chatStartContent).toContain('var(--a-secondary-dialog-link-margin-top)')
    expect(chatStartContent).not.toContain('class="pa-4"')
    expect(chatStartContent).not.toContain('margin-top: 15px;')
    expect(chatStartContent).not.toContain('margin-bottom: 15px;')

    expect(walletResetContent).toContain("const className = 'wallet-reset-dialog'")
    expect(walletResetContent).toContain('`${classes.root}__dialog-body`')
    expect(walletResetContent).toContain('var(--a-secondary-dialog-content-padding)')
    expect(walletResetContent).not.toContain('class="pa-4"')
    expect(walletResetContent).not.toContain("const className = 'wallets-view'")

    expect(passwordSetContent).toContain("const className = 'password-set-dialog'")
    expect(passwordSetContent).toContain('`${className}__body`')
    expect(passwordSetContent).toContain('`${className}__actions`')
    expect(passwordSetContent).toContain('var(--a-secondary-dialog-content-padding)')
    expect(passwordSetContent).toContain('var(--a-space-3)')
    expect(passwordSetContent).not.toContain('class="pa-4"')
    expect(passwordSetContent).not.toContain('class="pa-3"')
  })

  it('uses shared spacing token in vibro secondary screen input', () => {
    const content = readFileSync(vibroViewPath, 'utf8')

    expect(content).toContain('margin-right: var(--a-space-4);')
    expect(content).not.toContain('margin-right: 16px;')
  })
})
