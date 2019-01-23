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
          :user-id="userId"
          :show-avatar="!isChatReadOnly"
          :locale="locale"
          :html="true"
          @resend="resendMessage(partnerId, message.id)"
        >
          <div @click="showPartnerInfo" slot="avatar" v-if="!isChatReadOnly">
            <ChatAvatar :user-id="sender.id" style="cursor: pointer" use-public-key />
          </div>
        </a-chat-message>

        <a-chat-transaction
          v-else-if="isTransaction(message.type)"
          v-bind="message"
          :key="message.id"
          :user-id="userId"
          :amount="$formatAmount(message.amount)"
          :currency="message.type"
          :i18n="{ sent: $t('chats.sent_label'), received: $t('chats.received_label') }"
          :locale="locale"
          @click:transaction="openTransaction(message)"
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
import { transformMessage } from '@/lib/chatHelpers'
import { AChat, AChatMessage, AChatTransaction, AChatForm } from '@adamant/chat'
import { Formatter } from '@adamant/message-formatter'

import ChatToolbar from '@/components/Chat/ChatToolbar'
import ChatAvatar from '@/components/Chat/ChatAvatar'
import ChatMenu from '@/components/Chat/ChatMenu'

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
  if (!message) {
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
      return this.rawMessages.map(message => transformMessage(message))
    },
    rawMessages () {
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
          tx_id: transaction.id
        }
      })
    },
    isTransaction (type) {
      const cryptos = Object.values(Cryptos)

      return cryptos.includes(type)
    }
  },
  filters: {
    msg: message => formatter.format(message)
  },
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
