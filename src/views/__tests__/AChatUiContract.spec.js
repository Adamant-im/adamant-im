import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const uiMetricsPath = path.resolve(currentDir, '../../components/AChat/helpers/uiMetrics.ts')
const messagePath = path.resolve(currentDir, '../../components/AChat/AChatMessage.vue')
const attachmentPath = path.resolve(
  currentDir,
  '../../components/AChat/AChatAttachment/AChatAttachment.vue'
)
const attachmentFilePath = path.resolve(
  currentDir,
  '../../components/AChat/AChatAttachment/AChatFile.vue'
)
const attachmentImagePath = path.resolve(
  currentDir,
  '../../components/AChat/AChatAttachment/AChatImage.vue'
)
const attachmentImageModalPath = path.resolve(
  currentDir,
  '../../components/AChat/AChatAttachment/AChatImageModal.vue'
)
const transactionPath = path.resolve(currentDir, '../../components/AChat/AChatTransaction.vue')
const actionsDropdownPath = path.resolve(
  currentDir,
  '../../components/AChat/AChatMessageActionsDropdown.vue'
)
const actionsListPath = path.resolve(
  currentDir,
  '../../components/AChat/AChatMessageActionsList.vue'
)
const actionsMenuPath = path.resolve(
  currentDir,
  '../../components/AChat/AChatMessageActionsMenu.vue'
)
const actionsOverlayPath = path.resolve(
  currentDir,
  '../../components/AChat/AChatActionsOverlay.vue'
)
const quotedMessagePath = path.resolve(currentDir, '../../components/AChat/QuotedMessage.vue')
const chatStylesPath = path.resolve(currentDir, '../../assets/styles/components/_chat.scss')

describe('AChat UI style contract', () => {
  it('stores shared icon and dropdown sizing in chat ui metrics helper', () => {
    const content = readFileSync(uiMetricsPath, 'utf8')

    expect(content).toContain('CHAT_STATUS_ICON_SIZE')
    expect(content).toContain('CHAT_STATUS_ICON_ERROR_SIZE')
    expect(content).toContain('CHAT_ACTIONS_DROPDOWN_MIN_WIDTH')
    expect(content).toContain('CHAT_ACTIONS_DROPDOWN_MAX_WIDTH')
    expect(content).toContain('CHAT_ACTIONS_DROPDOWN_BUTTON_SIZE')
    expect(content).toContain('CHAT_ACTIONS_DROPDOWN_ICON_SIZE')
    expect(content).toContain('CHAT_ATTACHMENT_PREVIEW_SIZE')
  })

  it('uses shared status icon sizes across message, attachment and transaction cards', () => {
    const messageContent = readFileSync(messagePath, 'utf8')
    const attachmentContent = readFileSync(attachmentPath, 'utf8')
    const transactionContent = readFileSync(transactionPath, 'utf8')

    expect(messageContent).toContain(':size="CHAT_STATUS_ICON_ERROR_SIZE"')
    expect(messageContent).toContain(':size="CHAT_STATUS_ICON_SIZE"')
    expect(attachmentContent).toContain(':size="CHAT_STATUS_ICON_ERROR_SIZE"')
    expect(attachmentContent).toContain(':size="CHAT_STATUS_ICON_SIZE"')
    expect(transactionContent).toContain(':size="CHAT_STATUS_ICON_SIZE"')

    expect(messageContent).not.toContain('size="15"')
    expect(messageContent).not.toContain('size="13"')
    expect(attachmentContent).not.toContain('size="15"')
    expect(attachmentContent).not.toContain('size="13"')
    expect(transactionContent).not.toContain('size="13"')
  })

  it('tokenizes chat message actions dropdown, list, menu and overlay offsets', () => {
    const dropdownContent = readFileSync(actionsDropdownPath, 'utf8')
    const listContent = readFileSync(actionsListPath, 'utf8')
    const menuContent = readFileSync(actionsMenuPath, 'utf8')
    const overlayContent = readFileSync(actionsOverlayPath, 'utf8')

    expect(dropdownContent).toContain(':min-width="CHAT_ACTIONS_DROPDOWN_MIN_WIDTH"')
    expect(dropdownContent).toContain(':max-width="CHAT_ACTIONS_DROPDOWN_MAX_WIDTH"')
    expect(dropdownContent).toContain(':size="CHAT_ACTIONS_DROPDOWN_BUTTON_SIZE"')
    expect(dropdownContent).toContain(':size="CHAT_ACTIONS_DROPDOWN_ICON_SIZE"')
    expect(dropdownContent).toContain('--a-chat-message-actions-dropdown-top-gap')

    expect(listContent).toContain('--a-chat-message-actions-list-offset-top')
    expect(menuContent).toContain('--a-chat-message-actions-menu-overlay-inset-inline')
    expect(overlayContent).toContain('--a-chat-actions-overlay-reaction-height')
    expect(overlayContent).toContain('--a-chat-actions-overlay-reaction-gap')
    expect(overlayContent).toContain('--a-chat-actions-overlay-transition-duration')
  })

  it('keeps shared chat bubble spacing and transitions tokenized in global chat styles', () => {
    const content = readFileSync(chatStylesPath, 'utf8')

    expect(content).toContain('--a-chat-message-container-gap')
    expect(content).toContain('--a-chat-message-container-grouped-gap')
    expect(content).toContain('--a-chat-message-padding-block')
    expect(content).toContain('--a-chat-message-padding-inline')
    expect(content).toContain('--a-chat-message-header-min-height')
    expect(content).toContain('--a-chat-message-status-gap-inline')
    expect(content).toContain('--a-chat-message-swipe-transition-duration')
    expect(content).toContain('--a-chat-message-actions-icon-transition-duration')
    expect(content).toContain('margin-bottom: var(--a-chat-message-container-gap);')
    expect(content).toContain(
      'padding: var(--a-chat-message-padding-block) var(--a-chat-message-padding-inline);'
    )
    expect(content).toContain('min-height: var(--a-chat-message-header-min-height);')

    expect(content).not.toContain('margin-bottom: var(--a-space-4);')
    expect(content).not.toContain('padding: var(--a-space-2) var(--a-space-4);')
    expect(content).not.toContain('transition: left 0.4s;')
  })

  it('tokenizes quoted message sizing and accent border styles', () => {
    const content = readFileSync(quotedMessagePath, 'utf8')

    expect(content).toContain('--a-quoted-message-height')
    expect(content).toContain('--a-quoted-message-radius')
    expect(content).toContain('--a-quoted-message-padding-block')
    expect(content).toContain('--a-quoted-message-padding-inline')
    expect(content).toContain('--a-quoted-message-border-width')
    expect(content).toContain('--a-quoted-message-error-font-style')
    expect(content).toContain(
      "border-left: var(--a-quoted-message-border-width) solid map.get(colors.$adm-colors, 'attention');"
    )

    expect(content).not.toContain('border-left: 3px solid')
    expect(content).not.toMatch(/&__invalid-message\s*\{[^}]*font-style:\s*italic;/s)
    expect(content).not.toMatch(/&__message-not-found\s*\{[^}]*font-style:\s*italic;/s)
  })

  it('tokenizes attachment layout widths and avoids hardcoded dark text color', () => {
    const content = readFileSync(attachmentPath, 'utf8')

    expect(content).toContain('--a-chat-attachments-max-width')
    expect(content).toContain('--a-chat-attachments-offset-top')
    expect(content).toContain('--a-chat-attachments-file-container-max-width')
    expect(content).toContain('--a-chat-attachments-grid-max-width')
    expect(content).toContain('--a-chat-attachments-grid-min-column-width')
    expect(content).toContain('--a-chat-attachments-grid-width')
    expect(content).toContain('width: var(--a-chat-attachments-max-width);')
    expect(content).toContain('max-width: var(--a-chat-attachments-grid-max-width);')
    expect(content).toContain("color: map.get(settings.$shades, 'white');")

    expect(content).not.toContain('$attachments-width: 500px;')
    expect(content).not.toContain('$file-container-max-width: 420px;')
    expect(content).not.toContain('$file-grid-max-width: 200px;')
    expect(content).not.toContain('$file-grid-min-column-width: 98px;')
    expect(content).not.toContain('color: #fff;')
  })

  it('shares attachment placeholder and error tokens between file and image components', () => {
    const fileContent = readFileSync(attachmentFilePath, 'utf8')
    const imageContent = readFileSync(attachmentImagePath, 'utf8')

    expect(fileContent).toContain('CHAT_ATTACHMENT_PREVIEW_SIZE')
    expect(fileContent).toContain('--a-chat-file-preview-size')
    expect(fileContent).toContain('--a-chat-file-size-font-size')
    expect(fileContent).toContain('--a-chat-attachment-placeholder-surface')
    expect(fileContent).toContain('--a-chat-attachment-placeholder-surface-transparent')
    expect(fileContent).toContain('--a-chat-attachment-error-surface')
    expect(fileContent).toContain('--a-chat-attachment-error-icon-color')

    expect(imageContent).toContain('--a-chat-attachment-placeholder-surface')
    expect(imageContent).toContain('--a-chat-attachment-placeholder-surface-transparent')
    expect(imageContent).toContain('--a-chat-attachment-error-surface')
    expect(imageContent).toContain('--a-chat-attachment-error-icon-color')

    expect(fileContent).not.toContain('const iconSize = 64')
    expect(fileContent).not.toContain('font-size: 14px;')
  })

  it('keeps image modal preview background translucent in both themes', () => {
    const content = readFileSync(attachmentImageModalPath, 'utf8')

    expect(content).toContain('scrim="transparent"')
    expect(content).toContain('@click.capture="handleBackgroundClick"')
    expect(content).toContain('<v-card :class="classes.container">')
    expect(content).toContain(
      '<div :class="classes.content" @click.capture="handleBackgroundClick">'
    )
    expect(content).toContain('--a-chat-image-modal-surface')
    expect(content).toContain('background-color: var(--a-chat-image-modal-surface) !important;')
    expect(content).toContain('-webkit-tap-highlight-color: transparent;')
    expect(content).toContain(':deep(.v-img__img),')
    expect(content).toContain(':deep(.v-btn),')
    expect(content).toContain(
      'const clickedControl = target.closest(\'.v-toolbar, .v-btn, button, [role="button"]\')'
    )
    expect(content).toContain(
      "const clickedFileContent = target.closest('.v-window-item--active .a-chat-modal-file__container')"
    )
    expect(content).toContain('const activeImageSlideSelector =')
    expect(content).toContain(
      "'.v-window-item--active.a-chat-image-modal-item, .v-window-item--active .a-chat-image-modal-item'"
    )
    expect(content).toContain('const getRenderedImageBounds = () => {')
    expect(content).toContain("const imageSurface = activeSlide.querySelector('.v-img__img')")
    expect(content).toContain('props.files[slide.value]?.resolution')
    expect(content).toContain('const isPointInsideBounds = (')
    expect(content).toContain('--a-chat-image-modal-surface: transparent;')
    expect(content).toContain('&__content {')
    expect(content).not.toContain(
      '<v-card :class="classes.container" @click.capture="handleBackgroundClick">'
    )
    expect(content).not.toContain("background-color: map.get(colors.$adm-colors, 'muted');")
    expect(content).not.toContain("classList?.contains('v-window-item')")
  })
})
