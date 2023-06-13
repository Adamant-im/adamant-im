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
      :reply-to="!!replyTo"
      @scroll:top="onScrollTop"

      @scroll:bottom="onScrollBottom"

      @scroll="onScroll"
    >
      <template #header>
        <chat-toolbar
          :partner-id="partnerId"
        >
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

      <template
        #message="{ message, userId, sender, locale }"
      >
        <a-chat-message
          v-if="message.type === 'message'"
          v-bind="message"
          :key="message.id"
          :message="formatMessage(message)"
          :time="formatDate(message.timestamp)"
          :user-id="userId"
          :sender="sender"
          :status="getTransactionStatus(message)"
          :show-avatar="!isWelcomeChat(partnerId)"
          :locale="locale"
          :html="true"
          :i18n="{ retry: $t('chats.retry_message') }"
          :hide-time="message.readonly"
          @resend="resendMessage(partnerId, message.id)"
          @replyTo="onReplyTo($event)"
        >
          <template #avatar>
            <ChatAvatar
              :user-id="sender.id"
              use-public-key
              @click="onClickAvatar(sender.id)"
            />
          </template>
        </a-chat-message>
        <a-chat-transaction
          v-else-if="isTransaction(message.type)"
          v-bind="message"
          :key="message.id"
          :user-id="userId"
          :sender="sender"
          :amount="message.amount"
          :crypto="message.type"
          :time="formatDate(message.timestamp)"
          :hash="message.hash"
          :tx-timestamp="getTransaction(message.type, message.hash).timestamp"
          :currency="message.type"
          :locale="locale"
          :status="getTransactionStatus(message)"
          :is-clickable="isCryptoSupported(message.type)"
          @click:transaction="openTransaction(message)"
          @click:transactionStatus="updateTransactionStatus(message)"
          @mount="fetchTransactionStatus(message, partnerId)"
          @replyTo="onReplyTo($event)"
        >
          <template #crypto>
            <crypto-icon
              :crypto="message.type"
            />
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
          :reply-to="replyTo"
          @message="onMessage"
          @removeReplyTo="replyTo = null"
        >
          <template #prepend>
            <chat-menu
              :partner-id="partnerId"
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
          <v-icon
            icon="mdi-chevron-down"
            size="x-large"
          />
        </v-btn>
      </template>
    </a-chat>
  </v-card>
</template>

<script>
import { nextTick } from 'vue'
import { detect } from 'detect-browser'
import Visibility from 'visibilityjs'

import { Cryptos } from '@/lib/constants'
import { renderMarkdown, sanitizeHTML } from '@/lib/markdown'

import { AChat, AChatMessage, AChatTransaction, AChatForm } from '@/components/AChat'
import ChatToolbar from '@/components/Chat/ChatToolbar'
import ChatAvatar from '@/components/Chat/ChatAvatar'
import ChatMenu from '@/components/Chat/ChatMenu'
import transaction from '@/mixins/transaction'
import partnerName from '@/mixins/partnerName'
import formatDate from '@/filters/date'
import CryptoIcon from '@/components/icons/CryptoIcon'
import FreeTokensDialog from '@/components/FreeTokensDialog'
import { websiteUriToOnion } from '@/lib/uri'
import { isStringEqualCI } from '@/lib/textHelpers'
import { isWelcomeChat } from '@/lib/chat/meta/utils'

/**
 * Returns user meta by userId.
 * @param {string} userId
 * @returns {User} See `packages/chat/src/types.ts`
 */
function getUserMeta (userId) {
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
function validateMessage (message) {
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

  if ((message.length * 1.5) > 20000) {
    this.$store.dispatch('snackbar/show', {
      message: this.$t('chats.too_long')
    })
    return false
  }

  return true
}

export default {
  components: {
    AChat,
    AChatMessage,
    AChatTransaction,
    AChatForm,
    ChatToolbar,
    ChatAvatar,
    ChatMenu,
    CryptoIcon,
    FreeTokensDialog
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
    noMoreMessages: false,
    isScrolledToBottom: true,
    visibilityId: null,
    showFreeTokensDialog: false,
    replyTo: null
  }),
  computed: {
    /**
     * Returns array of transformed messages.
     * @returns {Message[]}
     */
    messages () {
      return this.$store.getters['chat/messages'](this.partnerId)
    },
    /**
     * Returns array of partners who participate in chat.
     * @returns {User[]}
     */
    partners () {
      return [
        getUserMeta.call(this, this.userId),
        getUserMeta.call(this, this.partnerId)
      ]
    },
    userId () {
      return this.$store.state.address
    },
    sendMessageOnEnter () {
      return this.$store.state.options.sendMessageOnEnter
    },
    isFulfilled () {
      return this.$store.state.chat.isFulfilled
    },
    lastMessage () {
      return this.$store.getters['chat/lastMessage'](this.partnerId)
    },
    chatPage () {
      return this.$store.getters['chat/chatPage'](this.partnerId)
    },
    scrollPosition () {
      return this.$store.getters['chat/scrollPosition'](this.partnerId)
    },
    numOfNewMessages () {
      return this.$store.getters['chat/numOfNewMessages'](this.partnerId)
    }
  },
  watch: {
    // Scroll to the bottom every time window focused by desktop notification
    '$store.state.notification.desktopActivateClickCount' () {
      nextTick(() => {
        this.$refs.chat.scrollToBottom()
      })
    },
    // scroll to bottom when received new message
    lastMessage () {
      nextTick(() => {
        if (this.isScrolledToBottom) {
          this.$refs.chat.scrollToBottom()
        }

        if (!Visibility.hidden()) this.markAsRead()
      })
    },
    // watch `isFulfilled` when opening chat directly from address bar
    isFulfilled (value) {
      if (value && (!this.chatPage || this.chatPage <= 0)) this.fetchChatMessages()
    }
  },
  created () {
    window.addEventListener('keyup', this.onKeyPress)
  },
  beforeUnmount () {
    window.removeEventListener('keyup', this.onKeyPress)
    Visibility.unbind(this.visibilityId)
  },
  mounted () {
    if (this.isFulfilled && this.chatPage <= 0) this.fetchChatMessages()
    this.scrollBehavior()
    nextTick(() => {
      this.isScrolledToBottom = this.$refs.chat.isScrolledToBottom()
    })
    this.visibilityId = Visibility.change((event, state) => {
      if (state === 'visible' && this.isScrolledToBottom) this.markAsRead()
    })
    this.chatFormLabel = {
      'Mac OS': this.$t('chats.message_mac_os'),
      'Windows 10': this.$t('chats.message_windows_10')
    }[detect().os] || this.$t('chats.message')
  },
  methods: {
    onReplyTo (msg) {
      this.replyTo = msg
    },
    onMessage (message) {
      if (validateMessage.call(this, message)) {
        this.sendMessage(message)
        nextTick(() => this.$refs.chat.scrollToBottom())
      }
    },
    sendMessage (message) {
      return this.$store.dispatch('chat/sendMessage', {
        message,
        recipientId: this.partnerId
      })
        .catch(err => {
          console.error(err.message)
        })
    },
    resendMessage (recipientId, messageId) {
      return this.$store.dispatch('chat/resendMessage', { recipientId, messageId })
        .catch(err => {
          this.$store.dispatch('snackbar/show', {
            message: err.message
          })
          console.error(err.message)
        })
    },
    updateTransactionStatus (message) {
      this.$store.dispatch(message.type.toLowerCase() + '/updateTransaction', { hash: message.hash, force: true, updateOnly: false, dropStatus: true })
    },
    markAsRead () {
      this.$store.commit('chat/markAsRead', this.partnerId)
    },
    onScrollTop () {
      this.fetchChatMessages()
    },
    onScrollBottom () {
      this.markAsRead()
    },
    onScroll (scrollPosition, isBottom) {
      this.isScrolledToBottom = isBottom

      this.$store.commit('chat/updateScrollPosition', {
        contactId: this.partnerId,
        scrollPosition
      })
    },
    /**
     * @param {string} address ADAMANT address
     */
    onClickAvatar (address) {
      this.$emit('click:chat-avatar', address)
    },
    openTransaction (transaction) {
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
    isTransaction (type) {
      return (
        type in Cryptos ||
        type === 'UNKNOWN_CRYPTO'
      )
    },
    isCryptoSupported (type) {
      return type in Cryptos
    },
    formatMessage (transaction) {
      if (this.isWelcomeChat(this.partnerId) || transaction.i18n) {
        return renderMarkdown(websiteUriToOnion(this.$t(transaction.message)))
      }

      if (this.$store.state.options.formatMessages) {
        return renderMarkdown(transaction.message)
      }

      return sanitizeHTML(transaction.message)
    },
    fetchChatMessages () {
      if (this.noMoreMessages) return
      if (this.loading) return

      this.loading = true

      return this.$store.dispatch('chat/getChatRoomMessages', { contactId: this.partnerId })
        .catch(() => {
          this.noMoreMessages = true
        })
        .finally(() => {
          this.loading = false
          this.$refs.chat.maintainScrollPosition()
        })
    },
    scrollBehavior () {
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
    onKeyPress (e) {
      if (e.code === 'Enter' && !this.showFreeTokensDialog) this.$refs.chatForm.focus()
    },
    formatDate,
    isWelcomeChat
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
