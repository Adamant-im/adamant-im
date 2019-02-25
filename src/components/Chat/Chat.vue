<template>
  <v-card class="chat">
    <a-chat
      :messages="messages"
      :partners="partners"
      :user-id="userId"
      :loading="loading"
      :locale="$i18n.locale"

      @scroll:top="onScrollTop"
      @scroll:bottom="onScrollBottom"

      ref="chat"
    >
      <chat-toolbar :partner-id="partnerId" slot="header"/>

      <template slot="message" slot-scope="{ message, userId, sender, locale }">

        <a-chat-message
          v-if="message.type === 'message'"
          v-bind="message"
          :key="message.id"
          :message="isChatReadOnly ? $t(message.message) : message.message | msg"
          :time="message.timestamp | date"
          :user-id="userId"
          :sender="sender"
          :show-avatar="!isChatReadOnly"
          :locale="locale"
          :html="true"
          :i18n="{ retry: $t('chats.retry_message') }"
          @resend="resendMessage(partnerId, message.id)"
        >
          <ChatAvatar
            @click="showPartnerInfo"
            :user-id="sender.id"
            use-public-key
            slot="avatar"
          />
        </a-chat-message>

        <a-chat-transaction
          v-else-if="isTransaction(message.type)"
          v-bind="message"
          :key="message.id"
          :user-id="userId"
          :sender="sender"
          :amount="message.amount | currency(message.type)"
          :time="message.timestamp | date"
          :currency="message.type"
          :i18n="{
            sent: $t('chats.sent_label'),
            received: $t('chats.received_label'),
            statuses: $t('chats.transaction_statuses')
          }"
          :locale="locale"
          :status="getTransactionStatus(message, partnerId)"
          @click:transaction="openTransaction(message)"
          @mount="fetchTransactionStatus(message, partnerId)"
        />

      </template>

      <a-chat-form
        v-if="!isChatReadOnly"
        slot="form"
        @message="onMessage"
        :show-send-button="true"
        :send-on-enter="sendMessageOnEnter"
        :show-divider="true"
        :label="$t('chats.message')"
      >
        <chat-menu
          slot="prepend"
          :partner-id="partnerId"
        />
      </a-chat-form>
    </a-chat>
  </v-card>
</template>

<script>
import { Cryptos } from '@/lib/constants'
import { Formatter } from '@/lib/message-formatter'

import { AChat, AChatMessage, AChatTransaction, AChatForm } from '@/components/AChat'
import ChatToolbar from '@/components/Chat/ChatToolbar'
import ChatAvatar from '@/components/Chat/ChatAvatar'
import ChatMenu from '@/components/Chat/ChatMenu'
import transaction from '@/mixins/transaction'
import dateFilter from '@/filters/date'

/**
 * Create Formatter instance.
 */
const formatter = new Formatter()

/**
 * Returns user meta by userId.
 * @param {string} userId
 * @returns {User} See `packages/chat/src/types.ts`
 */
function getUserMeta (userId) {
  let user = {
    id: userId,
    name: ''
  }

  if (userId === this.userId) {
    user.name = this.$t('chats.you')
  } else {
    user.name = this.$store.getters['partners/displayName'](userId)
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
    this.$store.dispatch('snackbar/show', {
      message: this.$t('chats.no_money')
    })
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
  mounted () {
    this.$nextTick(() => this.$refs.chat.scrollToBottom())
    this.markAsRead()
  },
  watch: {
    // scroll to bottom when received new message
    messages () {
      this.$nextTick(() => this.$refs.chat.scrollToBottom())
    }
  },
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
    isChatReadOnly () {
      return this.$store.getters['chat/isChatReadOnly'](this.partnerId)
    },
    sendMessageOnEnter () {
      return this.$store.state.options.sendMessageOnEnter
    }
  },
  data: () => ({
    loading: false
  }),
  methods: {
    onMessage (message) {
      if (validateMessage.call(this, message)) {
        this.sendMessage(message)
        this.$nextTick(() => this.$refs.chat.scrollToBottom())
      }
    },
    sendMessage (message) {
      return this.$store.dispatch('chat/sendMessage', {
        message,
        recipientId: this.partnerId
      })
        .catch(err => {
          this.$store.dispatch('snackbar/show', {
            message: err.message
          })
          console.error(err.message)
        })
    },
    showPartnerInfo () {
      this.$emit('partner-info', true)
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
    markAsRead () {
      this.$store.commit('chat/markAsRead', this.partnerId)
    },
    onScrollTop () {
      //
    },
    onScrollBottom () {
      //
    },
    openTransaction (transaction) {
      this.$router.push({
        name: 'Transaction',
        params: {
          crypto: transaction.type,
          txId: transaction.hash
        }
      })
    },
    isTransaction (type) {
      // @todo remove LSK & DASH when will be supported
      return (
        type in Cryptos ||
        type === 'LSK' ||
        type === 'DASH' ||
        type === 'UNKNOWN_CRYPTO'
      )
    }
  },
  filters: {
    msg: message => formatter.format(message),
    date: dateFilter
  },
  mixins: [transaction],
  components: {
    AChat,
    AChatMessage,
    AChatTransaction,
    AChatForm,
    ChatToolbar,
    ChatAvatar,
    ChatMenu
  },
  props: {
    partnerId: {
      type: String,
      required: true
    }
  }
}
</script>

<style scoped lang="stylus">
.chat
  height: 100vh
</style>
