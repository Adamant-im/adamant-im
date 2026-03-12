import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const tokensPath = path.resolve(currentDir, '../../assets/styles/generic/_tokens.scss')
const inlineSpinnerPath = path.resolve(currentDir, '../../components/InlineSpinner.vue')
const chatSpinnerPath = path.resolve(currentDir, '../../components/ChatSpinner.vue')
const qrcodeRendererPath = path.resolve(currentDir, '../../components/QrcodeRenderer.vue')
const qrcodeUiMetricsPath = path.resolve(currentDir, '../../components/Qrcode/helpers/uiMetrics.ts')
const qrcodeCapturePath = path.resolve(currentDir, '../../components/QrcodeCapture.vue')
const qrcodeScannerDialogPath = path.resolve(currentDir, '../../components/QrcodeScannerDialog.vue')
const chatPlaceholderPath = path.resolve(currentDir, '../../components/Chat/ChatPlaceholder.vue')

describe('QR and loading UI contract', () => {
  it('defines shared qr and loading tokens in the generic token layer', () => {
    const content = readFileSync(tokensPath, 'utf8')

    expect(content).toContain('--a-spinner-neutral-color')
    expect(content).toContain('--a-chat-spinner-size')
    expect(content).toContain('--a-chat-spinner-stroke')
    expect(content).toContain('--a-chat-placeholder-logo-size')
    expect(content).toContain('--a-chat-placeholder-public-key-spinner-size')
    expect(content).toContain('--a-chat-image-modal-backdrop-blur')
    expect(content).toContain('--a-qrcode-renderer-spinner-size')
    expect(content).toContain('--a-qrcode-renderer-max-width')
    expect(content).toContain('--a-qrcode-scanner-waiting-spinner-size')
    expect(content).toContain('--a-qrcode-scanner-camera-height')
    expect(content).toContain('--a-qrcode-scanner-camera-select-padding-inline')
  })

  it('uses named spinner metrics and shared neutral spinner color', () => {
    const inlineSpinnerContent = readFileSync(inlineSpinnerPath, 'utf8')
    const chatSpinnerContent = readFileSync(chatSpinnerPath, 'utf8')

    expect(inlineSpinnerContent).toContain('INLINE_SPINNER_SIZE_DEFAULT')
    expect(inlineSpinnerContent).toContain('color="var(--a-spinner-neutral-color)"')
    expect(inlineSpinnerContent).not.toContain('default: 32,')
    expect(inlineSpinnerContent).not.toContain('color="#4A4A4A"')

    expect(chatSpinnerContent).toContain('CHAT_SPINNER_SIZE')
    expect(chatSpinnerContent).toContain('CHAT_SPINNER_STROKE')
    expect(chatSpinnerContent).toContain(':class="className"')
    expect(chatSpinnerContent).toContain('`${className}__spinner`')
    expect(chatSpinnerContent).toContain('color="var(--a-spinner-neutral-color)"')
    expect(chatSpinnerContent).not.toContain(':size="150"')
    expect(chatSpinnerContent).not.toContain('color="#4A4A4A"')
    expect(chatSpinnerContent).not.toContain('$chat-spinner-size: 150px !default;')
  })

  it('keeps qr renderer and scanner layout tokenized', () => {
    const rendererContent = readFileSync(qrcodeRendererPath, 'utf8')
    const metricsContent = readFileSync(qrcodeUiMetricsPath, 'utf8')
    const captureContent = readFileSync(qrcodeCapturePath, 'utf8')
    const scannerContent = readFileSync(qrcodeScannerDialogPath, 'utf8')

    expect(rendererContent).toContain('QRCODE_RENDERER_SPINNER_SIZE')
    expect(rendererContent).toContain('qrcode-renderer__image')
    expect(rendererContent).toContain('qrcode-renderer__spinner-container')
    expect(rendererContent).toContain('var(--a-qrcode-renderer-max-width)')
    expect(metricsContent).toContain('QRCODE_RENDERER_SPINNER_SIZE = 152')
    expect(metricsContent).toContain('QRCODE_SCANNER_WAITING_SPINNER_SIZE = 32')
    expect(rendererContent).not.toContain('<InlineSpinner :size="152" />')
    expect(rendererContent).not.toContain('max-width: 250px;')

    expect(metricsContent).toContain('QRCODE_CAPTURE_IMAGE_MAX_SIZE = 400')
    expect(captureContent).toContain('QRCODE_CAPTURE_IMAGE_MAX_SIZE')
    expect(captureContent).not.toContain('const IMG_MAX_SIZE = 400')

    expect(scannerContent).toContain('QRCODE_SCANNER_WAITING_SPINNER_SIZE')
    expect(scannerContent).toContain('`${classes.root}__waiting-spinner`')
    expect(scannerContent).toContain('`${classes.root}__hint-title`')
    expect(scannerContent).toContain('`${classes.root}__state-title')
    expect(scannerContent).toContain('`${classes.root}__state-message')
    expect(scannerContent).toContain('var(--a-qrcode-scanner-camera-height)')
    expect(scannerContent).toContain('var(--a-qrcode-scanner-camera-select-padding-inline)')
    expect(scannerContent).not.toContain('size="32" class="ml-4"')
    expect(scannerContent).not.toContain('const QRCODE_SCANNER_WAITING_SPINNER_SIZE = 32')
    expect(scannerContent).not.toContain('height: 300px;')
    expect(scannerContent).not.toContain('padding: 0 8px;')
    expect(scannerContent).not.toContain('class="a-text-regular text-center"')
    expect(scannerContent).not.toContain("['text-center', `${classes.root}__state`]")
    expect(scannerContent).not.toContain('class="a-text-regular mt-1 mb-0"')
  })

  it('keeps chat placeholder logo and public-key spinner tokenized', () => {
    const content = readFileSync(chatPlaceholderPath, 'utf8')

    expect(content).toContain('CHAT_PLACEHOLDER_PUBLIC_KEY_SPINNER_SIZE')
    expect(content).toContain('var(--a-chat-placeholder-logo-size)')
    expect(content).toContain('border: var(--a-border-width-thin) solid transparent;')
    expect(content).not.toContain(':size="20"')
    expect(content).not.toContain('width: 100px;')
    expect(content).not.toContain('height: 100px;')
    expect(content).not.toContain('border: 1px solid transparent;')
  })
})
