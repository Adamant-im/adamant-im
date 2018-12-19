<template>
  <v-layout row wrap justify-center>

    <v-flex lg5 md5 sm12 xs12>

      <v-card>
        <chat-toolbar/>

        <v-divider></v-divider>

        <chat ref="chat" :class="{ 'chat--fill-height': isChatReadOnly }">
          <chat-row
            v-for="(message, i) in messages"
            :key="i"
          >
            <chat-message
              v-if="message.type === 'message'"
              :user-id="userId"
              :sender-id="message.senderId"
              :message="message.message"
              :timestamp="message.timestamp"
              :status="message.status"
              :readonly="isChatReadOnly"
              :i18n="message.i18n"
            />
            <chat-transaction
              v-else-if="message.type === 'transaction'"
              :transaction-id="message.id"
              :user-id="userId"
              :sender-id="message.senderId"
              :message="message.message"
              :timestamp="message.timestamp"
              :amount="message.amount"
              :currency="message.currency"
            />
          </chat-row>
        </chat>

        <v-divider></v-divider>

        <chat-input
          v-if="!isChatReadOnly"
          :partnerId="partnerId"
          @send="onSendMessage"
        />
      </v-card>

    </v-flex>

  </v-layout>
</template>

<script>
import ChatToolbar from '@/components/Chat/ChatToolbar'
import Chat from '@/components/Chat/Chat'
import ChatRow from '@/components/Chat/ChatRow'
import ChatMessage from '@/components/Chat/ChatMessage'
import ChatTransaction from '@/components/Chat/ChatTransaction'
import ChatInput from '@/components/Chat/ChatInput'

/**
 * Return unix timestamp based on
 * ADM timestamp (foundation Date).
 * @param {number} timestamp
 * @returns {number}
 */
function getRealTimestamp (timestamp) {
  return parseInt(timestamp) * 1000 + Date.UTC(2017, 8, 2, 17, 0, 0, 0)
}

/**
 * Transform array of messages into types:
 * message or adm transaction or eth transaction
 */
function transformMessages (messages) {
  return messages.map(message => {
    if (message.message && message.message.type === 'eth_transaction') {
      // ETH Transaction
      return {
        id: message.id,
        type: 'transaction',
        senderId: message.senderId,
        message: (message.message && message.message.comments) || '',
        timestamp: message.timestamp,
        realTimestamp: getRealTimestamp(message.timestamp),
        username: this.partnerName,
        amount: message.amount,
        currency: 'ETH',
        status: message.status || 'confirmed'
      }
    } else if (message.amount > 0) {
      // ADM Transaction
      return {
        id: message.id,
        type: 'transaction',
        senderId: message.senderId,
        message: message.message,
        timestamp: message.timestamp,
        realTimestamp: getRealTimestamp(message.timestamp),
        username: this.partnerName,
        amount: this.$formatAmount(message.amount),
        currency: 'ADM',
        status: message.status || 'confirmed'
      }
    } else {
      // Message
      return {
        id: message.id,
        type: 'message',
        senderId: message.senderId,
        message: message.message,
        timestamp: message.timestamp,
        realTimestamp: getRealTimestamp(message.timestamp),
        username: this.partnerName,
        status: message.status || 'confirmed',
        i18n: (message.i18n)
      }
    }
  }).sort((a, b) => a.realTimestamp - b.realTimestamp)
}

export default {
  mounted () {
    this.markAsRead()
  },
  computed: {
    messages () {
      let messages = this.$store.getters['chat/messages'](this.partnerId)

      return transformMessages.call(this, messages)
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
    }
  },
  data: () => ({
  }),
  methods: {
    onSendMessage () {
      this.$refs.chat.scrollToBottom()
    },
    markAsRead () {
      this.$store.commit('chat/markAsRead', this.partnerId)
    }
  },
  components: {
    Chat,
    ChatRow,
    ChatMessage,
    ChatTransaction,
    ChatInput,
    ChatToolbar
  }
}
</script>
