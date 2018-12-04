<template>
  <v-layout row wrap justify-center>

    <v-flex xs12 sm12 lg6 md8 >

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
              :timestamp="message.realTimestamp"
              :readonly="isChatReadOnly"
            />
            <chat-transaction
              v-else-if="message.type === 'transaction'"
              :user-id="userId"
              :sender-id="message.senderId"
              :message="message.message"
              :timestamp="message.realTimestamp"
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

export default {
  mounted () {
    this.fetchMessages()
  },
  computed: {
    messages () {
      // @todo refactor store and return array instead object
      let messages = this.$store.state.currentChat.messages || {}

      // transform into array and replace keys
      let arrayMessages = Object
        .keys(messages)
        .map(key => {
          if (
            messages[key] &&
            messages[key].message &&
            messages[key].message.type === 'eth_transaction'
          ) { // ETH transaction
            return {
              type: 'transaction',
              senderId: messages[key].senderId,
              message: messages[key].message.comments,
              timestamp: messages[key].timestamp,
              realTimestamp: messages[key].real_timestamp,
              username: this.partnerName,
              amount: messages[key].message.amount,
              currency: 'ETH'
            }
          } else if (
            messages[key] &&
            messages[key].amount > 0
          ) { // ADM transaction
            return {
              type: 'transaction',
              senderId: messages[key].senderId,
              message: messages[key].message,
              timestamp: messages[key].timestamp,
              realTimestamp: messages[key].real_timestamp,
              username: this.partnerName,
              amount: messages[key].amount / 100000000,
              currency: 'ADM'
            }
          } else {
            return { // message
              type: 'message',
              senderId: messages[key].senderId,
              message: messages[key].message,
              timestamp: messages[key].timestamp,
              realTimestamp: messages[key].real_timestamp,
              username: this.partnerName
            }
          }
        })
        .sort((a, b) => a.realTimestamp - b.realTimestamp)

      return arrayMessages
    },
    partnerId () {
      return this.$route.params.partner
    },
    partnerName () {
      return this.$store.state.partnerName
    },
    displayName () {
      return this.$store.getters['partners/displayName'](this.$store.state.partnerName)
    },
    userId () {
      return this.$store.state.address
    },
    isChatReadOnly () {
      return this.$store.state.currentChat.readOnly === true
    }
  },
  data: () => ({
  }),
  methods: {
    fetchMessages () {
      this.$store.commit('last_visited_chat', this.partnerId)
      this.$store.commit('select_chat', this.partnerId)
      this.$store.commit('mark_as_read_total', this.partnerId)
      this.$store.commit('mark_as_read', this.partnerId)
    },
    onSendMessage (message) {
      console.log('sendMessage', message)
      this.$refs.chat.scrollToBottom()
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
