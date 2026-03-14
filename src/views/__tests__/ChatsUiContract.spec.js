import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const chatToolbarPath = path.resolve(currentDir, '../../components/Chat/ChatToolbar.vue')
const chatsPath = path.resolve(currentDir, '../../components/Chat/Chats.vue')
const chatPath = path.resolve(currentDir, '../../components/Chat/Chat.vue')
const chatPreviewPath = path.resolve(currentDir, '../../components/ChatPreview.vue')
const chatUiMetricsPath = path.resolve(currentDir, '../../components/Chat/helpers/uiMetrics.ts')
const commonUiMetricsPath = path.resolve(currentDir, '../../components/common/helpers/uiMetrics.ts')
const genericTokensPath = path.resolve(currentDir, '../../assets/styles/generic/_tokens.scss')
const chatPlaceholderPath = path.resolve(currentDir, '../../components/Chat/ChatPlaceholder.vue')
const chatStylesPath = path.resolve(currentDir, '../../assets/styles/components/_chat.scss')
const themeMixinsPath = path.resolve(currentDir, '../../assets/styles/themes/adamant/_mixins.scss')
const chatMenuPath = path.resolve(currentDir, '../../components/Chat/ChatMenu.vue')
const chatEmojisPath = path.resolve(currentDir, '../../components/Chat/ChatEmojis.vue')
const chatMessageActionsPath = path.resolve(
  currentDir,
  '../../components/Chat/ChatMessageActions.vue'
)
const chatAvatarPath = path.resolve(currentDir, '../../components/Chat/ChatAvatar.vue')
const layoutPrimitivesPath = path.resolve(
  currentDir,
  '../../assets/styles/components/_layout-primitives.scss'
)
const colorRolesPath = path.resolve(currentDir, '../../assets/styles/components/_color-roles.scss')

describe('Chats UI style contract', () => {
  it('stores shared chat toolbar and chats sizing metrics in helper constants', () => {
    const content = readFileSync(chatUiMetricsPath, 'utf8')
    const commonMetricsContent = readFileSync(commonUiMetricsPath, 'utf8')

    expect(content).toContain('CHAT_TOOLBAR_UNREAD_COUNTER_MAX')
    expect(content).toContain('CHAT_CONNECTION_SPINNER_SIZE')
    expect(content).toContain('CHATS_CONNECTION_SPINNER_SIZE')
    expect(content).toContain('CHATS_SCROLL_OFFSET')
    expect(commonMetricsContent).toContain('COMMON_TRIGGER_ICON_SIZE = 28')
  })

  it('defines shared typography tokens for chat toolbar and list', () => {
    const content = readFileSync(genericTokensPath, 'utf8')

    expect(content).toContain('--a-font-weight-light')
    expect(content).toContain('--a-font-weight-medium')
    expect(content).toContain('--a-letter-spacing-caps-subtle')
    expect(content).toContain('--a-field-floating-label-scale')
    expect(content).toContain('--a-chat-connection-spinner-size')
    expect(content).toContain('--a-chat-preview-avatar-size')
    expect(content).toContain('--a-chat-preview-item-padding-inline-start')
    expect(content).toContain('--a-chat-preview-item-padding-inline-end')
    expect(content).toContain('--a-chat-preview-heading-gap')
    expect(content).toContain('--a-chat-trigger-hover-inset')
  })

  it('uses tokenized toolbar typography, spacing and floating label transforms', () => {
    const content = readFileSync(chatToolbarPath, 'utf8')

    expect(content).toContain('--a-chat-toolbar-adm-name-letter-spacing')
    expect(content).toContain('--a-chat-toolbar-padding-inline-start')
    expect(content).toContain('--a-chat-toolbar-label-font-size')
    expect(content).toContain('--a-chat-toolbar-input-padding-top')
    expect(content).toContain('--a-chat-toolbar-input-font-weight')
    expect(content).toContain('--a-chat-toolbar-floating-label-font-size')
    expect(content).toContain('--a-chat-toolbar-floating-label-offset-y')
    expect(content).toContain('--a-chat-toolbar-floating-label-scale')
    expect(content).toContain('--a-chat-toolbar-content-gap-mobile')
    expect(content).toContain('--a-chat-toolbar-back-button-margin-inline-end-mobile')
    expect(content).toContain('var(--a-letter-spacing-caps-subtle)')
    expect(content).toContain('var(--a-font-weight-medium)')
    expect(content).toContain('var(--a-field-floating-label-scale)')
    expect(content).toContain('messagesCounterContent')
    expect(content).toContain('CHAT_TOOLBAR_UNREAD_COUNTER_MAX')
    expect(content).toContain('translateY(var(--a-chat-toolbar-floating-label-offset-y))')
    expect(content).toContain('scale(var(--a-chat-toolbar-floating-label-scale))')
    expect(content).toContain('padding-inline-start: var(--a-chat-toolbar-padding-inline-start);')
    expect(content).toContain('gap: var(--a-chat-toolbar-content-gap-mobile);')
    expect(content).toContain(
      'margin-inline-end: var(--a-chat-toolbar-back-button-margin-inline-end-mobile) !important;'
    )

    expect(content).not.toMatch(/(^|\n)\s*letter-spacing:\s*0\.02em;/)
    expect(content).not.toMatch(/(^|\n)\s*font-size:\s*var\(--a-space-5\);/)
    expect(content).not.toMatch(/(^|\n)\s*font-weight:\s*500;/)
    expect(content).not.toContain('--a-chat-toolbar-adm-name-letter-spacing: 0.02em;')
    expect(content).not.toContain('--a-chat-toolbar-padding-inline-start: var(--a-space-3);')
    expect(content).not.toContain('--a-chat-toolbar-input-font-weight: 500;')
    expect(content).not.toContain('--a-chat-toolbar-floating-label-scale: 0.6875;')
    expect(content).not.toContain("numOfNewMessages > 99 ? '99+' : numOfNewMessages")
  })

  it('keeps chats list action row sizing tokenized', () => {
    const content = readFileSync(chatsPath, 'utf8')
    const layoutPrimitives = readFileSync(layoutPrimitivesPath, 'utf8')

    expect(content).toContain('CHATS_CONNECTION_SPINNER_SIZE')
    expect(content).toContain('CHATS_SCROLL_OFFSET')
    expect(content).toContain('--a-chats-actions-height')
    expect(content).toContain('--a-chats-actions-padding-inline-start')
    expect(content).toContain('--a-chats-actions-padding-inline-end')
    expect(content).toContain('--a-chats-actions-gap')
    expect(content).toContain('--a-chats-connection-spinner-size')
    expect(content).toContain('--a-chats-connection-spinner-offset-inline-start')
    expect(content).toContain('--a-chats-item-padding-inline')
    expect(content).toContain('--a-chats-item-avatar-gap-inline')
    expect(content).toContain('--a-chats-item-icon-gap-inline')
    expect(content).toContain('--a-chats-title-font-weight')
    expect(content).toContain('--a-chats-title-font-size')
    expect(content).toContain('--a-chats-messages-move-duration')
    expect(content).toContain('--a-chat-preview-item-padding-inline-start')
    expect(content).toContain('--a-chat-preview-item-padding-inline-end')
    expect(content).toContain('var(--a-chat-connection-spinner-size)')
    expect(content).toContain('var(--a-chat-preview-avatar-size)')
    expect(content).toContain('var(--a-font-weight-light)')
    expect(content).toContain('height: var(--a-chats-actions-height);')
    expect(content).toContain('column-gap: var(--a-chats-actions-gap);')
    expect(layoutPrimitives).toContain('@mixin a-flex-center()')
    expect(content).toContain("@use '@/assets/styles/components/_layout-primitives.scss'")
    expect(content).toContain('@include layoutPrimitives.a-flex-center();')
    expect(content).toContain(
      'margin-inline-start: var(--a-chats-connection-spinner-offset-inline-start);'
    )
    expect(content).toContain(':size="CHATS_CONNECTION_SPINNER_SIZE"')
    expect(content).toContain('const scrollOffset = CHATS_SCROLL_OFFSET')
    expect(content).toContain('transition: transform var(--a-chats-messages-move-duration);')
    expect(content).toContain('<v-row :class="`${className}__chats-actions`">')
    expect(content).toContain('margin: 0;')

    expect(content).not.toContain('height: 56px;')
    expect(content).not.toContain(':size="24"')
    expect(content).not.toContain('const scrollOffset = 64')
    expect(content).not.toContain('transition: transform 0.5s;')
    expect(content).not.toContain('--a-chats-title-font-weight: 300;')
    expect(content).not.toContain('--a-chats-connection-spinner-offset-inline-start: 34px;')
    expect(content).not.toContain('class="v-row--no-gutters"')
  })

  it('keeps chat preview spacing, line-height and icon sizes tokenized', () => {
    const content = readFileSync(chatPreviewPath, 'utf8')
    const layoutPrimitives = readFileSync(layoutPrimitivesPath, 'utf8')
    const colorRolesContent = readFileSync(colorRolesPath, 'utf8')

    expect(content).toContain('CHAT_PREVIEW_AVATAR_SIZE')
    expect(content).toContain('CHAT_PREVIEW_STATUS_ICON_SIZE')
    expect(content).toContain('--a-chat-brief-avatar-size')
    expect(content).toContain('--a-chat-brief-avatar-gap')
    expect(content).toContain('--a-chat-brief-date-gap')
    expect(content).toContain('--a-chat-brief-heading-gap')
    expect(content).toContain('--a-chat-brief-item-padding-inline-start')
    expect(content).toContain('--a-chat-brief-item-padding-inline-end')
    expect(content).toContain('var(--a-chat-preview-avatar-size)')
    expect(content).toContain('var(--a-chat-preview-heading-gap)')
    expect(content).toContain(
      'padding-inline-start: var(--a-chat-brief-item-padding-inline-start);'
    )
    expect(content).toContain('padding-inline-end: var(--a-chat-brief-item-padding-inline-end);')
    expect(content).toContain('--a-chat-brief-subtitle-line-height')
    expect(content).toContain('--a-chat-brief-loading-separator-shift')
    expect(content).toContain('--a-chat-brief-loading-separator-duration')
    expect(content).toContain('--a-chat-brief-border-width: var(--a-border-width-thin);')
    expect(content).toContain('--a-chat-brief-meta-color')
    expect(layoutPrimitives).toContain('@mixin a-flex-space-between-center()')
    expect(content).toContain("@use '@/assets/styles/components/_layout-primitives.scss'")
    expect(content).toContain("@use '@/assets/styles/components/_color-roles.scss'")
    expect(content).toContain('@include layoutPrimitives.a-flex-space-between-center();')
    expect(content).toContain(
      "@include colorRoles.a-color-role-subtle-var('--a-chat-brief-meta-color');"
    )
    expect(content).toContain('--a-chat-brief-icon-fill-light')
    expect(content).toContain('var(--a-color-icon-subtle-light)')
    expect(content).toContain('@include mixins.a-text-regular-enlarged-bold();')
    expect(content).toContain('@include mixins.a-text-explanation-enlarged-bold();')
    expect(content).toContain('margin-bottom: var(--a-chat-brief-heading-gap);')
    expect(content).toContain('line-height: var(--a-chat-brief-subtitle-line-height);')

    expect(content).not.toContain('size="15"')
    expect(content).not.toContain('const CHAT_PREVIEW_AVATAR_SIZE = 48')
    expect(content).not.toContain("'a-text-regular-enlarged-bold': true")
    expect(content).not.toContain("['a-text-explanation-enlarged-bold', `${className}__subtitle`]")
    expect(content).not.toMatch(/&__subtitle\s*\{[^}]*line-height:\s*1\.5;/s)
    expect(content).not.toContain('--a-chat-brief-border-width: 1px;')
    expect(content).not.toContain('--a-chat-brief-icon-fill-light: #bdbdbd;')
    expect(content).not.toContain("color: map.get(colors.$adm-colors, 'grey-transparent');")
    expect(colorRolesContent).toContain('@mixin a-color-role-subtle-var($var-name)')
  })

  it('shares soft surface elevation mixin across chat placeholder and message bubbles', () => {
    const mixinsContent = readFileSync(themeMixinsPath, 'utf8')
    const placeholderContent = readFileSync(chatPlaceholderPath, 'utf8')
    const chatStylesContent = readFileSync(chatStylesPath, 'utf8')

    expect(mixinsContent).toContain('@mixin a-surface-elevation-soft {')
    expect(placeholderContent).toContain('@include mixins.a-surface-elevation-soft();')
    expect(placeholderContent).toContain('p {')
    expect(placeholderContent).toContain('margin: 0;')
    expect(placeholderContent).toContain('&__link {')
    expect(placeholderContent).toContain('@include mixins.a-text-active();')
    expect(placeholderContent).toContain("@use '@/assets/styles/generic/_variables.scss';")
    expect(placeholderContent).toContain('padding-bottom: var(--a-space-6);')
    expect(placeholderContent).toContain('padding-inline: var(--a-screen-padding-inline);')
    expect(placeholderContent).toContain(
      "background-color: map.get(colors.$adm-colors, 'light-gray');"
    )
    expect(placeholderContent).toContain(
      "border-color: map.get(colors.$adm-colors, 'light-gray2');"
    )
    expect(placeholderContent).toContain("background-color: map.get(colors.$adm-colors, 'black3');")
    expect(placeholderContent).toContain("border-color: map.get(colors.$adm-colors, 'black4');")
    expect(placeholderContent).not.toContain('background: #fff;')
    expect(placeholderContent).not.toContain('class="a-text-active"')
    expect(placeholderContent).not.toContain('background: var(--a-chat-placeholder-surface-light);')
    expect(placeholderContent).not.toContain('background: var(--a-chat-placeholder-surface-dark);')
    expect(placeholderContent).not.toMatch(/&__row\s*\{[^}]*padding-bottom:/s)
    expect(placeholderContent).not.toContain('max-width: 100%;')
    expect(placeholderContent).not.toContain('box-sizing: border-box;')
    expect(chatStylesContent).toContain('@include mixins.a-surface-elevation-soft();')

    expect(placeholderContent).not.toContain('0 1px 10px hsla(0, 0%, 39.2%, 0.06),')
    expect(chatStylesContent).not.toContain('0 1px 10px hsla(0, 0%, 39.2%, 0.06),')
  })

  it('keeps header avatar offset compact to avoid doubled spacing with toolbar gap', () => {
    const content = readFileSync(chatPath, 'utf8')

    expect(content).toContain('.chat-avatar {')
    expect(content).toContain('CHAT_CONNECTION_SPINNER_SIZE')
    expect(content).toContain(':size="CHAT_CONNECTION_SPINNER_SIZE"')
    expect(content).toContain('margin-right: var(--a-space-1);')
    expect(content).not.toMatch(/\.chat-avatar\s*\{[^}]*margin-right:\s*var\(--a-space-3\);/s)
  })

  it('uses semantic avatar sizing styles and hidden canvas class in chat avatar', () => {
    const content = readFileSync(chatAvatarPath, 'utf8')

    expect(content).toContain(':style="avatarSizeStyles"')
    expect(content).toContain("'--a-chat-avatar-size': `${this.size}px`")
    expect(content).toContain(':class="`${className}__canvas`"')
    expect(content).toContain('width: var(--a-chat-avatar-size);')
    expect(content).toContain('height: var(--a-chat-avatar-size);')
    expect(content).toContain('&__canvas {')
    expect(content).toContain('display: none;')
    expect(content).not.toContain(':style="styles"')
    expect(content).not.toContain(`:style="{ display: 'none' }"`)
  })

  it('only uses global Enter to focus composer when no editable element is already focused', () => {
    const content = readFileSync(chatPath, 'utf8')

    expect(content).toContain('const hasFocusedEditableElement = () => {')
    expect(content).toContain('!hasFocusedEditableElement()')
    expect(content).toContain('e.preventDefault()')
    expect(content).toContain('e.stopPropagation()')
  })

  it('uses shared trigger icon metrics in attach and emoji menus', () => {
    const menuContent = readFileSync(chatMenuPath, 'utf8')
    const emojisContent = readFileSync(chatEmojisPath, 'utf8')
    const actionsContent = readFileSync(chatMessageActionsPath, 'utf8')

    expect(menuContent).toContain('COMMON_TRIGGER_ICON_SIZE')
    expect(menuContent).toContain(
      'min-width: calc((var(--a-control-size-lg) * 4) + var(--a-space-2));'
    )
    expect(menuContent).toContain('inset: calc(var(--a-chat-trigger-hover-inset) * -1);')
    expect(menuContent).not.toContain('size="28"')
    expect(menuContent).not.toContain('min-width: 200px;')
    expect(menuContent).not.toContain('inset: -3px;')

    expect(emojisContent).toContain('COMMON_TRIGGER_ICON_SIZE')
    expect(emojisContent).toContain('inset: calc(var(--a-chat-trigger-hover-inset) * -1);')
    expect(emojisContent).not.toContain('position="absolute"')
    expect(emojisContent).not.toContain('size="28"')
    expect(emojisContent).not.toContain('inset: -3px;')

    expect(actionsContent).toContain('<transition name="slide-y-reverse-transition" mode="out-in">')
  })
})
