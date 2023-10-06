<template>
  <v-card class="chat">
    <free-tokens-dialog v-model="showFreeTokensDialog" />
    <a-chat
      ref="chat"
      :messages="messages"
      :partners="partners"
      :user-id="userId"
      :loading="loading"
      :locale="$i18n.locale"
      @scroll:top="onScrollTop"
      @scroll:bottom="onScrollBottom"
      @scroll="onScroll"
    >
      <template #overlay v-if="actionMessage">
        <a-chat-actions-overlay
          :modelValue="actionsMenuMessageId !== -1"
          @update:modelValue="closeActionsMenu"
          :transaction="actionMessage"
        >
          <a-chat-message
            v-if="actionMessage.type === 'message'"
            :transaction="actionMessage"
            :status="getTransactionStatus(actionMessage)"
            :data-id="'action-message'"
            html
            disable-max-width
            elevation
          >
            <template #avatar>
              <ChatAvatar :user-id="partnerId" use-public-key @click="onClickAvatar(partnerId)" />
            </template>
          </a-chat-message>

          <a-chat-transaction
            v-else-if="isTransaction(actionMessage.type)"
            :transaction="actionMessage"
            :crypto="actionMessage.type"
            :tx-timestamp="getTransaction(actionMessage.type, actionMessage.hash).timestamp"
            :status="getTransactionStatus(actionMessage)"
            :data-id="'action-message'"
            disable-max-width
            elevation
          >
            <template #crypto>
              <crypto-icon :crypto="actionMessage.type" />
            </template>
          </a-chat-transaction>

          <template #top>
            <EmojiPicker
              v-if="showEmojiPicker"
              @emoji:select="(emoji) => onEmojiSelect(actionMessage.id, emoji)"
              elevation
            />

            <AChatReactionSelect
              v-else
              :transaction="actionMessage"
              @reaction:add="sendReaction"
              @reaction:remove="removeReaction"
              @click:emoji-picker="showEmojiPicker = true"
            />
          </template>

          <template #bottom>
            <AChatMessageActionsMenu
              v-if="!showEmojiPicker"
              @click:reply="openReplyPreview(actionMessage)"
              @click:copy="copyMessageToClipboard(actionMessage)"
            />
          </template>
        </a-chat-actions-overlay>
      </template>

      <template #header>
        <chat-toolbar :partner-id="partnerId">
          <template #avatar-toolbar>
            <ChatAvatar
              class="chat-avatar"
              :user-id="partnerId"
              use-public-key
              @click="onClickAvatar(partnerId)"
            />
          </template>
        </chat-toolbar>
      </template>

      <template #message="{ message, sender }">
        <a-chat-message
          v-if="message.type === 'message'"
          :transaction="message"
          :status="getTransactionStatus(message)"
          :html="true"
          :flashing="flashingMessageId === message.id"
          :data-id="message.id"
          :swipe-disabled="isWelcomeMessage(message)"
          @resend="resendMessage(partnerId, message.id)"
          @click:quoted-message="onQuotedMessageClick"
          @swipe:left="onSwipeLeft(message)"
          @longpress="onMessageLongPress(message)"
        >
          <template #avatar>
            <ChatAvatar :user-id="sender.id" use-public-key @click="onClickAvatar(sender.id)" />
          </template>

          <template #actions v-if="isRealMessage(message)">
            <AChatReactions @click="handleClickReactions(message)" :transaction="message" />

            <AChatMessageActionsDropdown
              :transaction="message"
              :open="actionsDropdownMessageId === message.id"
              @open:change="toggleActionsDropdown"
              @click:reply="openReplyPreview(message)"
              @click:copy="copyMessageToClipboard(message)"
            >
              <template #top>
                <EmojiPicker
                  v-if="showEmojiPicker"
                  @emoji:select="(emoji) => onEmojiSelect(message.id, emoji)"
                  elevation
                />

                <AChatReactionSelect
                  v-else
                  :transaction="message"
                  @reaction:add="sendReaction"
                  @reaction:remove="removeReaction"
                  @click:emoji-picker="showEmojiPicker = true"
                />
              </template>

              <template #bottom>
                <AChatMessageActionsList
                  v-if="!showEmojiPicker"
                  @click:reply="openReplyPreview(message)"
                  @click:copy="copyMessageToClipboard(message)"
                />
              </template>
            </AChatMessageActionsDropdown>
          </template>
        </a-chat-message>
        <a-chat-transaction
          v-else-if="isTransaction(message.type)"
          :transaction="message"
          :crypto="message.type"
          :tx-timestamp="getTransaction(message.type, message.hash).timestamp"
          :status="getTransactionStatus(message)"
          :flashing="flashingMessageId === message.id"
          :data-id="message.id"
          :swipe-disabled="isWelcomeMessage(message)"
          @click:transaction="openTransaction(message)"
          @click:transactionStatus="updateTransactionStatus(message)"
          @mount="fetchTransactionStatus(message, partnerId)"
          @click:quoted-message="onQuotedMessageClick"
          @swipe:left="onSwipeLeft(message)"
          @longpress="onMessageLongPress(message)"
        >
          <template #crypto>
            <crypto-icon :crypto="message.type" />
          </template>

          <template #actions v-if="isRealMessage(message)">
            <AChatReactions @click="handleClickReactions(message)" :transaction="message" />

            <AChatMessageActionsDropdown
              :transaction="message"
              :open="actionsDropdownMessageId === message.id"
              @open:change="toggleActionsDropdown"
              @click:reply="openReplyPreview(message)"
              @click:copy="copyMessageToClipboard(message)"
            >
              <template #top>
                <EmojiPicker
                  v-if="showEmojiPicker"
                  @emoji:select="(emoji) => onEmojiSelect(message.id, emoji)"
                  elevation
                />

                <AChatReactionSelect
                  v-else
                  :transaction="message"
                  @reaction:add="sendReaction"
                  @reaction:remove="removeReaction"
                  @click:emoji-picker="showEmojiPicker = true"
                />
              </template>

              <template #bottom>
                <AChatMessageActionsList
                  v-if="!showEmojiPicker"
                  @click:reply="openReplyPreview(message)"
                  @click:copy="copyMessageToClipboard(message)"
                />
              </template>
            </AChatMessageActionsDropdown>
          </template>
        </a-chat-transaction>
      </template>

      <template #form>
        <a-chat-form
          v-if="!isWelcomeChat(partnerId)"
          ref="chatForm"
          :show-send-button="true"
          :send-on-enter="sendMessageOnEnter"
          :show-divider="true"
          :label="chatFormLabel"
          :message-text="$route.query.messageText"
          @message="onMessage"
          @esc="replyMessageId = -1"
          :clearInputValueOnSend="this.$store.state.balance < 0.001 === false"
        >
          <template #prepend>
            <chat-menu
              :partner-id="partnerId"
              :reply-to-id="replyMessageId > -1 ? replyMessageId : undefined"
            />
          </template>

          <template #reply-preview v-if="replyMessage">
            <a-chat-reply-preview
              :partner-id="partnerId"
              :message="replyMessage"
              @cancel="replyMessageId = -1"
            />
          </template>
        </a-chat-form>
      </template>

      <template #fab>
        <v-btn
          v-if="!isScrolledToBottom"
          class="ma-0 grey--text"
          color="grey lighten-3"
          depressed
          fab
          size="small"
          @click="$refs.chat.scrollToBottom()"
        >
          <v-icon icon="mdi-chevron-down" size="x-large" />
        </v-btn>
      </template>
    </a-chat>

    <ProgressIndicator :show="replyLoadingChatHistory" />
  </v-card>
</template>

<script>
import AChatMessageActionsList from '@/components/AChat/AChatMessageActionsList.vue'
import AChatReactions from '@/components/AChat/AChatReactions/AChatReactions.vue'
import { emojiWeight } from '@/lib/chat/emoji-weight/emojiWeight'
import { vibrate } from '@/lib/vibrate'
import { nextTick } from 'vue'
import { detect } from 'detect-browser'
import Visibility from 'visibilityjs'
import copyToClipboard from 'copy-to-clipboard'

import { Cryptos } from '@/lib/constants'
import EmojiPicker from '@/components/EmojiPicker.vue'

import {
  AChat,
  AChatMessage,
  AChatTransaction,
  AChatForm,
  AChatReplyPreview,
  AChatMessageActionsMenu,
  AChatMessageActionsDropdown,
  AChatActionsOverlay,
  AChatReactionSelect
} from '@/components/AChat'
import ChatToolbar from '@/components/Chat/ChatToolbar'
import ChatAvatar from '@/components/Chat/ChatAvatar'
import ChatMenu from '@/components/Chat/ChatMenu'
import transaction from '@/mixins/transaction'
import partnerName from '@/mixins/partnerName'
import formatDate from '@/filters/date'
import CryptoIcon from '@/components/icons/CryptoIcon'
import FreeTokensDialog from '@/components/FreeTokensDialog'
import { isStringEqualCI } from '@/lib/textHelpers'
import { isWelcomeChat, isWelcomeMessage } from '@/lib/chat/meta/utils'
import ProgressIndicator from '@/components/ProgressIndicator'

/**
 * Returns user meta by userId.
 * @param {string} userId
 * @returns {User} See `packages/chat/src/types.ts`
 */
function getUserMeta(userId) {
  const user = {
    id: userId,
    name: ''
  }

  if (isStringEqualCI(userId, this.userId)) {
    user.name = this.$t('chats.you')
  } else {
    user.name = this.getPartnerName(userId)
  }

  return user
}

/**
 * Validate message before sending.
 * @param {string} message
 * @returns {boolean}
 */
function validateMessage(message) {
  // Ensure that message contains at least one non-whitespace character
  if (!message.trim().length) {
    return false
  }

  if (this.$store.state.balance < 0.001) {
    if (this.$store.getters.isAccountNew()) {
      this.showFreeTokensDialog = true
    } else {
      this.$store.dispatch('snackbar/show', { message: this.$t('chats.no_money') })
    }
    return false
  }

  if (message.length * 1.5 > 20000) {
    this.$store.dispatch('snackbar/show', {
      message: this.$t('chats.too_long')
    })
    return false
  }

  return true
}

export default {
  components: {
    AChatMessageActionsList,
    AChatReactions,
    AChatReplyPreview,
    AChat,
    AChatMessage,
    AChatTransaction,
    AChatForm,
    ChatToolbar,
    ChatAvatar,
    ChatMenu,
    CryptoIcon,
    FreeTokensDialog,
    ProgressIndicator,
    AChatMessageActionsMenu,
    AChatMessageActionsDropdown,
    AChatActionsOverlay,
    AChatReactionSelect,
    EmojiPicker
  },
  mixins: [transaction, partnerName],
  props: {
    partnerId: {
      type: String,
      required: true
    }
  },
  emits: ['click:chat-avatar'],
  data: () => ({
    chatFormLabel: '',
    loading: false,
    replyLoadingChatHistory: false,
    noMoreMessages: false,
    isScrolledToBottom: true,
    visibilityId: null,
    showFreeTokensDialog: false,
    flashingMessageId: -1,

    actionsMenuMessageId: -1,
    actionsDropdownMessageId: -1,
    replyMessageId: -1,
    showEmojiPicker: false
  }),
  computed: {
    /**
     * Returns array of transformed messages.
     * @returns {Message[]}
     */
    messages() {
      return this.$store.getters['chat/messages'](this.partnerId)
    },
    /**
     * Returns array of partners who participate in chat.
     * @returns {User[]}
     */
    partners() {
      return [getUserMeta.call(this, this.userId), getUserMeta.call(this, this.partnerId)]
    },
    userId() {
      return this.$store.state.address
    },
    sendMessageOnEnter() {
      return this.$store.state.options.sendMessageOnEnter
    },
    isFulfilled() {
      return this.$store.state.chat.isFulfilled
    },
    lastMessage() {
      return this.$store.getters['chat/lastMessage'](this.partnerId)
    },
    chatPage() {
      return this.$store.getters['chat/chatPage'](this.partnerId)
    },
    scrollPosition() {
      return this.$store.getters['chat/scrollPosition'](this.partnerId)
    },
    numOfNewMessages() {
      return this.$store.getters['chat/numOfNewMessages'](this.partnerId)
    },
    replyMessage() {
      return this.$store.getters['chat/messageById'](this.replyMessageId)
    },
    actionMessage() {
      return this.$store.getters['chat/messageById'](this.actionsMenuMessageId)
    }
  },
  watch: {
    // Scroll to the bottom every time window focused by desktop notification
    '$store.state.notification.desktopActivateClickCount'() {
      nextTick(() => {
        this.$refs.chat.scrollToBottom()
      })
    },
    // scroll to bottom when received new message
    lastMessage() {
      nextTick(() => {
        if (this.isScrolledToBottom) {
          this.$refs.chat.scrollToBottom()
        }

        if (!Visibility.hidden()) this.markAsRead()
      })
    },
    // watch `isFulfilled` when opening chat directly from address bar
    isFulfilled(value) {
      if (value && (!this.chatPage || this.chatPage <= 0)) this.fetchChatMessages()
    },
    replyMessageId(messageId) {
      this.$router.replace({
        name: 'Chat',
        query: {
          replyToId: messageId === -1 ? undefined : messageId
        }
      })
    }
  },
  created() {
    window.addEventListener('keyup', this.onKeyPress)
  },
  beforeUnmount() {
    window.removeEventListener('keyup', this.onKeyPress)
    Visibility.unbind(this.visibilityId)
  },
  mounted() {
    if (this.isFulfilled && this.chatPage <= 0) this.fetchChatMessages()
    this.scrollBehavior()
    nextTick(() => {
      this.isScrolledToBottom = this.$refs.chat.isScrolledToBottom()
    })
    this.visibilityId = Visibility.change((event, state) => {
      if (state === 'visible' && this.isScrolledToBottom) this.markAsRead()
    })
    this.chatFormLabel =
      {
        'Mac OS': this.$t('chats.message_mac_os'),
        'Windows 10': this.$t('chats.message_windows_10')
      }[detect().os] || this.$t('chats.message')

    if (this.$route.query.replyToId) {
      this.replyMessageId = this.$route.query.replyToId
    }
  },
  methods: {
    onMessage(message) {
      if (validateMessage.call(this, message)) {
        this.sendMessage(message)
        nextTick(() => this.$refs.chat.scrollToBottom())
        this.replyMessageId = -1
      }
    },
    sendMessage(message) {
      const replyToId = this.replyMessageId > -1 ? this.replyMessageId : undefined

      return this.$store
        .dispatch('chat/sendMessage', {
          message,
          recipientId: this.partnerId,
          replyToId
        })
        .catch((err) => {
          console.error(err.message)
        })
    },
    resendMessage(recipientId, messageId) {
      return this.$store.dispatch('chat/resendMessage', { recipientId, messageId }).catch((err) => {
        this.$store.dispatch('snackbar/show', {
          message: err.message
        })
        console.error(err.message)
      })
    },
    sendReaction(reactToId, emoji) {
      this.closeActionsMenu()
      this.closeActionsDropdown()

      emojiWeight.addReaction(emoji)
      vibrate.veryShort()

      return this.$store.dispatch('chat/sendReaction', {
        recipientId: this.partnerId,
        reactToId,
        reactMessage: emoji
      })
    },
    removeReaction(reactToId, emoji) {
      this.closeActionsMenu()
      this.closeActionsDropdown()

      emojiWeight.removeReaction(emoji)

      return this.$store.dispatch('chat/sendReaction', {
        recipientId: this.partnerId,
        reactToId,
        reactMessage: ''
      })
    },
    onEmojiSelect(transactionId, emoji) {
      this.sendReaction(transactionId, emoji)
    },
    updateTransactionStatus(message) {
      this.$store.dispatch(message.type.toLowerCase() + '/updateTransaction', {
        hash: message.hash,
        force: true,
        updateOnly: false,
        dropStatus: true
      })
    },
    markAsRead() {
      this.$store.commit('chat/markAsRead', this.partnerId)
    },
    onScrollTop() {
      this.fetchChatMessages()
    },
    onScrollBottom() {
      this.markAsRead()
    },
    onScroll(scrollPosition, isBottom) {
      this.isScrolledToBottom = isBottom

      this.$store.commit('chat/updateScrollPosition', {
        contactId: this.partnerId,
        scrollPosition
      })
    },
    /**
     * @param {string} address ADAMANT address
     */
    onClickAvatar(address) {
      this.$emit('click:chat-avatar', address)
    },
    async onQuotedMessageClick(transactionId) {
      let transactionIndex = this.$store.getters['chat/indexOfMessage'](
        this.partnerId,
        transactionId
      )

      // if the message is not present in the store
      // fetch chat history until reach that message
      if (transactionIndex === -1) {
        await this.fetchUntilFindTransaction(transactionId)

        transactionIndex = this.$store.getters['chat/indexOfMessage'](this.partnerId, transactionId)
      }

      // if after fetching chat history the message still cannot be found
      // then do nothing
      if (transactionIndex === -1) {
        console.warn(
          'onQuotedMessageClick: Transaction not found in the chat history',
          `tx.id="${transactionId}"`
        )
        return
      }

      await this.$refs.chat.scrollToMessageEasy(transactionIndex)
      this.highlightMessage(transactionId)
    },
    /** touch devices **/
    onMessageLongPress(transaction) {
      if (isWelcomeMessage(transaction)) return

      this.openActionsMenu(transaction)
      vibrate.veryShort()
    },
    onSwipeLeft(message) {
      if (isWelcomeMessage(message)) return

      this.openReplyPreview(message)
      vibrate.veryShort()
    },
    openActionsMenu(transaction) {
      this.actionsMenuMessageId = transaction.id
    },
    closeActionsMenu() {
      this.actionsMenuMessageId = -1
      this.showEmojiPicker = false
    },
    /** desktop **/
    openActionsDropdown(transaction) {
      this.actionsDropdownMessageId = transaction.id
    },
    closeActionsDropdown() {
      this.actionsDropdownMessageId = -1
      this.showEmojiPicker = false
    },
    toggleActionsDropdown(open, transaction) {
      if (open) {
        this.openActionsDropdown(transaction)
      } else {
        this.closeActionsDropdown()
      }
    },
    handleClickReactions(transaction) {
      const isMobile = window.innerWidth < 600

      if (isMobile) {
        this.openActionsMenu(transaction)
      } else {
        this.toggleActionsDropdown(true, transaction)
      }
    },
    openReplyPreview(message) {
      this.closeActionsMenu()
      this.closeActionsDropdown()

      this.replyMessageId = message.id
      this.$refs.chatForm.focus()
    },
    copyMessageToClipboard({ message }) {
      this.closeActionsMenu()
      this.closeActionsDropdown()

      copyToClipboard(message)
      this.$store.dispatch('snackbar/show', { message: this.$t('home.copied'), timeout: 1000 })
    },
    isRealMessage(transaction) {
      return !isWelcomeMessage(transaction)
    },
    /**
     * Apply flash effect to a message in the chat
     * @param transactionId
     */
    highlightMessage(transactionId) {
      this.flashingMessageId = transactionId

      setTimeout(() => {
        this.flashingMessageId = -1
      }, 1000)
    },
    openTransaction(transaction) {
      if (transaction.type in Cryptos) {
        this.$router.push({
          name: 'Transaction',
          params: {
            crypto: transaction.type,
            txId: transaction.hash
          },
          query: {
            fromChat: true
          }
        })
      }
    },
    isTransaction(type) {
      return type in Cryptos || type === 'UNKNOWN_CRYPTO'
    },
    isCryptoSupported(type) {
      return type in Cryptos
    },
    fetchChatMessages() {
      if (this.noMoreMessages) return
      if (this.loading) return

      this.loading = true

      return this.$store
        .dispatch('chat/getChatRoomMessages', { contactId: this.partnerId })
        .catch(() => {
          this.noMoreMessages = true
        })
        .finally(() => {
          this.loading = false
          this.$refs.chat.maintainScrollPosition()
        })
    },
    fetchUntilFindTransaction(transactionId) {
      const fetchMessages = async () => {
        await this.$store.dispatch('chat/getChatRoomMessages', { contactId: this.partnerId })

        this.$refs.chat.maintainScrollPosition()

        const transactionFound = this.$store.getters['chat/partnerMessageById'](
          this.partnerId,
          transactionId
        )
        if (transactionFound) return

        if (this.$store.state.chat.offset > -1) {
          await new Promise((resolve) => setTimeout(resolve, 200))
          return fetchMessages()
        }
      }

      this.replyLoadingChatHistory = true

      return fetchMessages()
        .catch(() => {
          this.noMoreMessages = true
        })
        .finally(() => {
          this.replyLoadingChatHistory = false
        })
    },
    scrollBehavior() {
      nextTick(() => {
        if (this.numOfNewMessages > 0) {
          this.$refs.chat.scrollToMessage(this.numOfNewMessages - 1)
        } else if (this.scrollPosition !== false) {
          this.$refs.chat.scrollTo(this.scrollPosition)
        } else {
          this.$refs.chat.scrollToBottom()
        }

        this.markAsRead()
      })
    },
    onKeyPress(e) {
      if (e.code === 'Enter' && !this.showFreeTokensDialog) this.$refs.chatForm.focus()
    },
    formatDate,
    isWelcomeChat,
    isWelcomeMessage
  }
}
</script>

<style scoped lang="scss">
.chat {
  height: 100vh;
  box-shadow: none;
  background-color: transparent !important;
}

.chat-avatar {
  margin-right: 12px;
}
</style>
