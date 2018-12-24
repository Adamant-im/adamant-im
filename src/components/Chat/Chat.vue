<template>
  <v-card class="chat">
    <a-chat
      :messages="messages"
      :partners="partners"
      :user-id="userId"
      :loading="loading"

      @scroll:top="onScrollTop"
      @scroll:bottom="onScrollBottom"

      ref="chat"
    >
      <chat-toolbar slot="header"/>

      <template slot="message" slot-scope="props">

        <a-chat-message
          v-if="props.message.type === 'message'"
          v-bind="props.message"
          :key="props.message.id"
          :show-avatar="true"
        >
          <chat-avatar :user-id="props.userId" slot="avatar"/>
        </a-chat-message>

        <a-chat-transaction
          v-else-if="['ADM', 'ETH'].includes(props.message.type)"
          v-bind="props.message"
          :key="props.message.id"
          :amount="props.message.amount"
          :currency="props.message.type"
          @click:transaction="openTransaction(props.message)"
        />

      </template>

      <a-chat-form
        slot="form"
        @message="onMessage"
        :show-send-button="true"
        :send-on-enter="sendMessageOnEnter"
        :label="$t('typeYourMessage')"
      />
    </a-chat>
  </v-card>
</template>

<script>
import { transformMessage, getRealTimestamp } from '@/lib/chatHelpers'
import { AChat, AChatMessage, AChatTransaction, AChatForm } from '@adamant/chat'

import ChatToolbar from '@/components/Chat/ChatToolbar'
import ChatAvatar from '@/components/Chat/ChatAvatar'

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
    user.name = this.$t('YOU')
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
      message: this.$t('notEnoughFunds')
    })
    return false
  }

  if ((message.length * 1.5) > 20000) {
    this.$store.dispatch('snackbar/show', {
      message: this.$t('messageTooLong')
    })
    return false
  }

  return true
}

export default {
  mounted () {
    this.$refs.chat.scrollToBottom()
    this.markAsRead()
  },
  computed: {
    /**
     * Returns array of transformed messages.
     * @returns {Message[]}
     */
    messages () {
      let messages = this.$store.getters['chat/messages'](this.partnerId)

      return messages.map(message => transformMessage(message))
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
    partnerId () {
      return this.$route.params.partner
    },
    partnerName () {
      return this.$store.getters['partners/displayName'](this.partnerId)
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
    }
  },
  components: {
    AChat,
    AChatMessage,
    AChatTransaction,
    AChatForm,
    ChatToolbar,
    ChatAvatar
  }
}
</script>

<style scoped lang="stylus">
.chat
  height: 100vh
</style>

<i18n>
{
  "en": {
    "YOU": "YOU",
    "typeYourMessage": "Type your message",
    "notEnoughFunds": "Not enough funds. Top up your balance.",
    "messageTooLong": "Message is too long"
  },
  "ru": {
    "YOU": "ВЫ",
    "typeYourMessage": "Введите сообщение",
    "notEnoughFunds": "Недостаточно токенов. Пополните баланс.",
    "messageTooLong": "Сообщение слишком длинное"
  }
}
</i18n>
