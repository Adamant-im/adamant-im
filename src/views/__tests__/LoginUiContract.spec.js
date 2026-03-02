import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const loginPath = path.resolve(currentDir, '../Login.vue')
const loginFormPath = path.resolve(currentDir, '../../components/LoginForm.vue')
const passphraseGeneratorPath = path.resolve(currentDir, '../../components/PassphraseGenerator.vue')
const loginPasswordFormPath = path.resolve(currentDir, '../../components/LoginPasswordForm.vue')
const buttonsThemePath = path.resolve(
  currentDir,
  '../../assets/styles/themes/adamant/_buttons.scss'
)

describe('Login UI style contract', () => {
  it('uses tokenized hero spacing and removes inline logo styling', () => {
    const content = readFileSync(loginPath, 'utf8')

    expect(content).toContain('--a-login-logo-width')
    expect(content).toContain('--a-login-title-line-height')
    expect(content).toContain('--a-login-settings-offset-inline')
    expect(content).toContain('--a-login-settings-hover-overlay-opacity')
    expect(content).toContain('--a-login-icon-opacity')
    expect(content).toContain('--a-login-title-letter-spacing')
    expect(content).toContain('--a-login-subtitle-weight')
    expect(content).toContain('--a-login-bottom-padding')
    expect(content).toContain('--a-login-auth-sheet-margin-top')
    expect(content).toContain('--a-login-passphrase-row-margin-top')
    expect(content).toContain('${className}__passphrase-row')
    expect(content).toContain('${className}__auth-sheet')
    expect(content).toContain('${className}__logo')

    expect(content).not.toContain('style="width: 300px"')
    expect(content).not.toContain('class="hidden-sm-and-down mt-4"')
    expect(content).not.toContain('hidden-sm-and-down')
  })

  it('uses tokenized passphrase field paddings in login form', () => {
    const content = readFileSync(loginFormPath, 'utf8')

    expect(content).toContain('--a-login-form-passphrase-toggle-offset')
    expect(content).toContain('--a-login-form-passphrase-input-padding-inline')
    expect(content).toContain('--a-login-form-submit-row-margin-top')
    expect(content).toContain('login-form__submit-row')
    expect(content).toContain('var(--a-control-size-sm)')

    expect(content).not.toContain('margin-left: -28px;')
    expect(content).not.toContain('padding-right: 32px;')
    expect(content).not.toContain('padding-left: 32px;')
  })

  it('uses tokenized spacing around create-new and password hint blocks', () => {
    const passphraseContent = readFileSync(passphraseGeneratorPath, 'utf8')
    const loginPasswordContent = readFileSync(loginPasswordFormPath, 'utf8')

    expect(passphraseContent).toContain('--a-passphrase-create-title-gap')
    expect(passphraseContent).toContain('--a-passphrase-create-button-margin-top')
    expect(passphraseContent).toContain('--a-passphrase-box-margin-top')
    expect(passphraseContent).toContain('--a-passphrase-box-margin-top: var(--a-space-8);')
    expect(passphraseContent).not.toContain('margin-top: 36px;')

    expect(loginPasswordContent).toContain('--a-login-password-hint-block-gap')
    expect(loginPasswordContent).toContain('--a-login-password-hint-title-gap')
    expect(loginPasswordContent).toContain('--a-login-password-hint-button-margin-top')
    expect(loginPasswordContent).toContain('--a-login-form-submit-row-margin-top')
    expect(loginPasswordContent).toContain('login-form__submit-row')
    expect(loginPasswordContent).not.toContain(
      '<v-row align="center" justify="center" class="mt-2"'
    )
  })

  it('defines stronger hover/focus feedback for link-like action buttons globally', () => {
    const content = readFileSync(buttonsThemePath, 'utf8')

    expect(content).toContain('.a-btn-link')
    expect(content).toContain('&.v-btn:not(.v-btn--disabled):hover')
    expect(content).toContain('&.v-btn:not(.v-btn--disabled):focus-visible')
    expect(content).toContain('.v-btn__overlay')
    expect(content).toContain('opacity: 0.18;')
    expect(content).toContain('opacity: 0.24;')
    expect(content).toContain('box-shadow: var(--a-focus-ring);')
  })
})
