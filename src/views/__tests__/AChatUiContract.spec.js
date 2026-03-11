import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const uiMetricsPath = path.resolve(currentDir, '../../components/AChat/helpers/uiMetrics.ts')
const commonUiMetricsPath = path.resolve(currentDir, '../../components/common/helpers/uiMetrics.ts')
const genericTokensPath = path.resolve(currentDir, '../../assets/styles/generic/_tokens.scss')
const themeMixinsPath = path.resolve(currentDir, '../../assets/styles/themes/adamant/_mixins.scss')
const messagePath = path.resolve(currentDir, '../../components/AChat/AChatMessage.vue')
const attachmentPath = path.resolve(
  currentDir,
  '../../components/AChat/AChatAttachment/AChatAttachment.vue'
)
const incomingMessageHelperPath = path.resolve(
  currentDir,
  '../../components/AChat/helpers/isIncomingMessage.ts'
)
const attachmentInlineLayoutPath = path.resolve(
  currentDir,
  '../../components/AChat/AChatAttachment/InlineLayout.vue'
)
const attachmentImageLayoutPath = path.resolve(
  currentDir,
  '../../components/AChat/AChatAttachment/ImageLayout.vue'
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
const modalFilePath = path.resolve(
  currentDir,
  '../../components/AChat/AChatAttachment/AChatModalFile.vue'
)
const transactionPath = path.resolve(currentDir, '../../components/AChat/AChatTransaction.vue')
const chatContainerPath = path.resolve(currentDir, '../../components/AChat/AChat.vue')
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
const reactionSelectPath = path.resolve(
  currentDir,
  '../../components/AChat/AChatReactionSelect/AChatReactionSelect.vue'
)
const replyPreviewPath = path.resolve(currentDir, '../../components/AChat/AChatReplyPreview.vue')
const filesPreviewPath = path.resolve(
  currentDir,
  '../../components/AChat/FilesPreview/FilesPreview.vue'
)
const reactionsPath = path.resolve(
  currentDir,
  '../../components/AChat/AChatReactions/AChatReactions.vue'
)
const quotedMessagePath = path.resolve(currentDir, '../../components/AChat/QuotedMessage.vue')
const chatStylesPath = path.resolve(currentDir, '../../assets/styles/components/_chat.scss')
const emojiPickerPath = path.resolve(currentDir, '../../components/EmojiPicker.vue')
const iconBoxPath = path.resolve(currentDir, '../../components/icons/IconBox.vue')

describe('AChat UI style contract', () => {
  it('stores shared icon and dropdown sizing in chat ui metrics helper', () => {
    const content = readFileSync(uiMetricsPath, 'utf8')
    const commonMetricsContent = readFileSync(commonUiMetricsPath, 'utf8')

    expect(content).toContain('CHAT_STATUS_ICON_SIZE')
    expect(content).toContain('CHAT_STATUS_ICON_ERROR_SIZE')
    expect(content).toContain('CHAT_ACTIONS_DROPDOWN_MIN_WIDTH')
    expect(content).toContain('CHAT_ACTIONS_DROPDOWN_MAX_WIDTH')
    expect(content).toContain('CHAT_ACTIONS_DROPDOWN_BUTTON_SIZE')
    expect(content).toContain('CHAT_ACTIONS_DROPDOWN_ICON_SIZE')
    expect(content).toContain('CHAT_ATTACHMENT_PREVIEW_SIZE')
    expect(content).toContain('CHAT_MODAL_FILE_MAX_WIDTH')
    expect(content).toContain('CHAT_MODAL_FILE_MAX_HEIGHT')
    expect(content).toContain('CHAT_MODAL_FILE_ICON_SIZE')
    expect(commonMetricsContent).toContain('COMMON_ICON_SIZE = 24')
    expect(commonMetricsContent).toContain('COMMON_TRIGGER_ICON_SIZE = 28')
    expect(commonMetricsContent).toContain('COMMON_REACTION_MORE_BUTTON_SIZE = 32')
  })

  it('uses the shared chat connection spinner size for initial message loading', () => {
    const content = readFileSync(chatContainerPath, 'utf8')

    expect(content).toContain('CHAT_CONNECTION_SPINNER_SIZE')
    expect(content).toContain(':size="CHAT_CONNECTION_SPINNER_SIZE"')
    expect(content).not.toContain(':size="20"')
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
    expect(dropdownContent).toContain(':class="classes.root"')
    expect(dropdownContent).toContain('transition="a-chat-message-actions-fade-transition"')
    expect(dropdownContent).toContain('--a-chat-message-actions-dropdown-top-gap')
    expect(dropdownContent).toContain('--a-chat-message-actions-dropdown-transition-duration')
    expect(dropdownContent).toContain('--a-chat-message-actions-dropdown-transition-scale-from')
    expect(dropdownContent).toContain('.a-chat-message-actions-fade-transition-enter-active')
    expect(dropdownContent).toContain('position: relative;')
    expect(dropdownContent).toContain('align-items: flex-end;')
    expect(dropdownContent).toContain('overflow: visible;')
    expect(dropdownContent).toContain('justify-content: flex-end;')
    expect(dropdownContent).not.toContain(
      '--a-chat-message-actions-dropdown-top-gap: var(--a-space-2);'
    )

    expect(listContent).toContain('--a-chat-message-actions-list-offset-top')
    expect(menuContent).toContain('--a-chat-message-actions-menu-overlay-inset-inline')
    expect(overlayContent).toContain('--a-chat-actions-overlay-reaction-height')
    expect(overlayContent).toContain('--a-chat-actions-overlay-reaction-gap')
    expect(overlayContent).toContain('--a-chat-actions-overlay-transition-duration')
    expect(overlayContent).not.toContain('--a-chat-actions-overlay-reaction-gap: var(--a-space-4);')
    expect(overlayContent).not.toContain('--a-chat-actions-overlay-reaction-gap: var(--a-space-2);')
  })

  it('uses shared utility icon metrics in reaction select, reply preview and files preview', () => {
    const reactionSelectContent = readFileSync(reactionSelectPath, 'utf8')
    const replyPreviewContent = readFileSync(replyPreviewPath, 'utf8')
    const filesPreviewContent = readFileSync(filesPreviewPath, 'utf8')

    expect(reactionSelectContent).toContain('COMMON_REACTION_MORE_BUTTON_SIZE')
    expect(reactionSelectContent).toContain('COMMON_ICON_SIZE')
    expect(reactionSelectContent).toContain('background-color: rgb(var(--v-theme-surface));')
    expect(reactionSelectContent).toContain(
      'border: var(--a-border-width-thin) solid rgba(var(--v-border-color), var(--v-border-opacity));'
    )
    expect(reactionSelectContent).toContain('background-color: transparent !important;')
    expect(reactionSelectContent).not.toContain(':size="32"')
    expect(reactionSelectContent).not.toContain(':size="24"')
    expect(reactionSelectContent).not.toContain(
      "background-color: map.get(colors.$adm-colors, 'regular');"
    )

    expect(replyPreviewContent).toContain('COMMON_ICON_SIZE')
    expect(replyPreviewContent).not.toContain('size="24"')

    expect(filesPreviewContent).toContain('COMMON_ICON_SIZE')
    expect(filesPreviewContent).not.toContain('size="24"')
  })

  it('uses sender-vs-current-user direction for reactions and overlays, including self-chat', () => {
    const helperContent = readFileSync(incomingMessageHelperPath, 'utf8')
    const reactionsContent = readFileSync(reactionsPath, 'utf8')
    const overlayContent = readFileSync(actionsOverlayPath, 'utf8')

    expect(helperContent).toContain('return !isStringEqualCI(senderId, currentUserId)')

    expect(reactionsContent).toContain(
      'isIncomingMessage(props.transaction.senderId, store.state.address)'
    )
    expect(reactionsContent).toContain('[classes.left]: incomingMessage')
    expect(reactionsContent).toContain('isSelfChat.value')
    expect(reactionsContent).not.toContain('[classes.left]: transaction.senderId === partnerId')

    expect(overlayContent).toContain(
      'resolveIncomingMessage(props.transaction.senderId, store.state.address)'
    )
    expect(overlayContent).toContain('[classes.reactionSelectLeft]: incomingMessage')
    expect(overlayContent).toContain('[classes.menuLeft]: incomingMessage')
    expect(overlayContent).not.toContain(
      '[classes.reactionSelectLeft]: transaction.senderId === partnerId'
    )
    expect(overlayContent).not.toContain('[classes.menuLeft]: transaction.senderId === partnerId')
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
    const tokensContent = readFileSync(genericTokensPath, 'utf8')

    expect(tokensContent).toContain('--a-chat-attachments-max-width')
    expect(tokensContent).toContain('--a-chat-attachments-file-container-max-width')
    expect(tokensContent).toContain('--a-chat-attachments-grid-max-width')
    expect(tokensContent).toContain('--a-chat-attachments-grid-min-column-width')
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

  it('uses shared modal file metrics and reply preview typography tokens', () => {
    const metricsContent = readFileSync(uiMetricsPath, 'utf8')
    const modalFileContent = readFileSync(modalFilePath, 'utf8')
    const replyPreviewContent = readFileSync(replyPreviewPath, 'utf8')
    const tokensContent = readFileSync(genericTokensPath, 'utf8')

    expect(metricsContent).toContain('CHAT_MODAL_FILE_MAX_WIDTH = 500')
    expect(metricsContent).toContain('CHAT_MODAL_FILE_MAX_HEIGHT = 250')
    expect(metricsContent).toContain('CHAT_MODAL_FILE_ICON_SIZE = 128')

    expect(modalFileContent).toContain('CHAT_MODAL_FILE_MAX_WIDTH')
    expect(modalFileContent).toContain('CHAT_MODAL_FILE_MAX_HEIGHT')
    expect(modalFileContent).toContain('CHAT_MODAL_FILE_ICON_SIZE')
    expect(modalFileContent).toContain('var(--a-chat-modal-file-name-max-width)')
    expect(modalFileContent).not.toContain('const fileMaxWidth = 500')
    expect(modalFileContent).not.toContain('const fileMaxHeight = 250')
    expect(modalFileContent).not.toContain('const iconSize = 128')
    expect(modalFileContent).not.toContain('max-width: 220px;')

    expect(tokensContent).toContain('--a-chat-reply-preview-line-height')
    expect(replyPreviewContent).toContain('line-height: var(--a-chat-reply-preview-line-height);')
    expect(replyPreviewContent).not.toContain('line-height: 20px;')
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

  it('uses shared soft surface elevation mixin across attachment layouts', () => {
    const mixinsContent = readFileSync(themeMixinsPath, 'utf8')
    const imageLayoutContent = readFileSync(attachmentImageLayoutPath, 'utf8')
    const inlineLayoutContent = readFileSync(attachmentInlineLayoutPath, 'utf8')

    expect(mixinsContent).toContain('@mixin a-surface-elevation-soft {')
    expect(imageLayoutContent).toContain('@include mixins.a-surface-elevation-soft();')
    expect(inlineLayoutContent).toContain('@include mixins.a-surface-elevation-soft();')

    expect(imageLayoutContent).not.toContain('0 1px 10px hsla(0, 0%, 39.2%, 0.06),')
    expect(inlineLayoutContent).not.toContain('0 1px 10px hsla(0, 0%, 39.2%, 0.06),')
  })

  it('keeps image modal preview background non-interactive with blurred backdrop in both themes', () => {
    const content = readFileSync(attachmentImageModalPath, 'utf8')

    expect(content).toMatch(/<v-dialog[^>]*\bscrim\b/)
    expect(content).toContain('@click.capture="handleBackgroundClick"')
    expect(content).toContain('<v-card :class="classes.container">')
    expect(content).toContain(
      '<div :class="classes.content" @click.capture="handleBackgroundClick">'
    )
    expect(content).toContain('--a-chat-image-modal-surface')
    expect(content).toContain('--a-chat-image-modal-backdrop-color')
    expect(content).toContain('--a-chat-image-modal-backdrop-blur')
    expect(content).toContain('background-color: var(--a-chat-image-modal-surface) !important;')
    expect(content).toContain(':deep(.v-overlay__scrim) {')
    expect(content).toContain('opacity: 1 !important;')
    expect(content).toContain('backdrop-filter: blur(var(--a-chat-image-modal-backdrop-blur));')
    expect(content).toContain(
      'background-color: var(--a-chat-image-modal-backdrop-color) !important;'
    )
    expect(content).toContain('-webkit-tap-highlight-color: transparent;')
    expect(content).toContain(':deep(.v-img__img),')
    expect(content).toContain(':deep(.v-btn),')
    expect(content).toContain(
      'const clickedControl = target.closest(\'.v-toolbar, .v-btn, button, [role="button"]\')'
    )
    expect(content).toContain('const clickedFileContent = target.closest(')
    expect(content).toContain("'.v-window-item--active .a-chat-modal-file__container'")
    expect(content).toContain('const activeImageSlideSelector =')
    expect(content).toContain(
      "'.v-window-item--active.a-chat-image-modal-item, .v-window-item--active .a-chat-image-modal-item'"
    )
    expect(content).toContain('const getRenderedImageBounds = () => {')
    expect(content).toContain("const imageSurface = activeSlide.querySelector('.v-img__img')")
    expect(content).toContain('props.files[slide.value]?.resolution')
    expect(content).toContain('const isPointInsideBounds = (')
    expect(content).toContain('--a-chat-image-modal-surface: transparent;')
    expect(content).toMatch(/--a-chat-image-modal-backdrop-color:\s*rgb\(0 0 0 \/ \d+%\);/)
    expect(content).toMatch(/--a-chat-image-modal-backdrop-color:\s*rgb\(18 22 30 \/ \d+%\);/)
    expect(content).toContain('&__content {')
    expect(content).not.toContain(
      '<v-card :class="classes.container" @click.capture="handleBackgroundClick">'
    )
    expect(content).not.toContain("background-color: map.get(colors.$adm-colors, 'muted');")
    expect(content).not.toContain("classList?.contains('v-window-item')")
  })

  it('uses shared emoji picker and icon box sizing tokens', () => {
    const emojiPickerContent = readFileSync(emojiPickerPath, 'utf8')
    const iconBoxContent = readFileSync(iconBoxPath, 'utf8')
    const tokensContent = readFileSync(genericTokensPath, 'utf8')

    expect(tokensContent).toContain('--a-emoji-picker-radius')
    expect(tokensContent).toContain('--a-emoji-picker-size')
    expect(tokensContent).toContain('--a-emoji-picker-border-width')
    expect(iconBoxContent).toContain('var(--a-icon-box-centered-size)')

    expect(emojiPickerContent).toContain('var(--a-emoji-picker-radius)')
    expect(emojiPickerContent).toContain('var(--a-emoji-picker-size)')
    expect(emojiPickerContent).toContain('var(--a-emoji-picker-border-width)')
    expect(emojiPickerContent).toContain('ref="root"')
    expect(emojiPickerContent).toContain("alignment = ref<'start' | 'end'>('start')")
    expect(emojiPickerContent).toContain('const updateAlignment = async () => {')
    expect(emojiPickerContent).toContain('startRect.right > window.innerWidth - VIEWPORT_PADDING')
    expect(emojiPickerContent).toContain("verticalAlignment = ref<'up' | 'down'>('up')")
    expect(emojiPickerContent).toContain("isPlacementResolved = ref(props.position !== 'absolute')")
    expect(emojiPickerContent).toContain('upperRect.top < VIEWPORT_PADDING')
    expect(emojiPickerContent).toContain("window.addEventListener('resize', updateAlignment)")
    expect(emojiPickerContent).toContain("window.removeEventListener('resize', updateAlignment)")
    expect(emojiPickerContent).toContain(
      "[classes.positionPending]: position === 'absolute' && !isPlacementResolved"
    )
    expect(emojiPickerContent).toContain("[classes.alignEnd]: alignment === 'end'")
    expect(emojiPickerContent).toContain("[classes.dropDown]: verticalAlignment === 'down'")
    expect(emojiPickerContent).not.toContain('if (!overflowsRight) {\n    return\n  }')
    expect(emojiPickerContent).toContain('&--position-pending {')
    expect(emojiPickerContent).toContain('&--align-end {')
    expect(emojiPickerContent).toContain('&--drop-down {')
    expect(emojiPickerContent).not.toContain('border-radius: 8px;')
    expect(emojiPickerContent).not.toContain('width: 264px;')
    expect(emojiPickerContent).not.toContain('height: 264px;')
    expect(emojiPickerContent).not.toContain('border-width: 1px;')

    expect(iconBoxContent).not.toContain('width: 40px;')
    expect(iconBoxContent).not.toContain('height: 40px;')
  })
})
