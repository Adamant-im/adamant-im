<template>
  <div class="chat">

    <div class="chat__body" ref="chat">

      <div
        v-for="message in messages"
        class="chat__row"
      >

        <div class="chat__item" :class="{ 'chat__item--right': message.senderId === userId }">
          <div class="chat__item-header">
            <span v-if="message.senderId !== userId">{{ message.senderId }}</span>
            <span :title="dateTime(message.timestamp)">{{ timeAgo(message.timestamp) }}</span>
          </div>

          <div class="chat__item-body">
            {{ message.message }}
          </div>
        </div>

      </div>

      <!-- Message type Transfer -->
      <div class="chat__row">
        <div class="chat__item chat__item--transfer" :class="{ 'chat__item--right': messages[0].senderId === userId }">
          <div class="chat__item-header">
            <span v-if="messages[0].senderId !== userId">{{ messages[0].senderId }}</span>
            <span :title="dateTime(messages[0].timestamp)">1 hour ago</span>
          </div>

          <div class="chat__item-body">
            <span v-if="messages[0].senderId === userId">You've sent 1 ETH</span>
            <span v-else="messages[0].senderId === userId">You received 1 ETH</span>
            <v-icon class="ml-2">mdi-file-document</v-icon>
          </div>
        </div>
      </div>

      <div class="chat__row">
        <div class="chat__item chat__item--transfer" :class="{ 'chat__item--right': messages[10].senderId === userId }">
          <div class="chat__item-header">
            <span v-if="messages[0].senderId !== userId">{{ messages[0].senderId }}</span>
            <span :title="dateTime(messages[10].timestamp)">5 minute ago</span>
          </div>

          <div class="chat__item-body">
            <span v-if="messages[10].senderId === userId">You've sent 1000 ADM</span>
            <span v-else="messages[10].senderId === userId">You received 1000 ADM</span>
            <v-icon class="ml-2">mdi-file-document</v-icon>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script>
import moment from 'moment'

import { messages, partnerId, partnerName, userId } from '@/components/__tests__/__mocks__/chat'

import '@/assets/css/components/_chat.css'

export default {
  mounted () {
    this.scrollToBottom()
  },
  computed: {
    partnerId () {
      return partnerId
    },
    userId () {
      return userId
    }
  },
  data: () => ({
    messages
  }),
  methods: {
    timeAgo (timestamp) {
      return moment(timestamp).startOf('hour').fromNow()
    },
    dateTime (timestamp) {
      return moment(timestamp)
    },
    scrollToBottom () {
      this.$refs.chat.scrollTop = this.$refs.chat.scrollHeight
    }
  }
}
</script>
