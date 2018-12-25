## Adamant chat

A chat built with Vuetify.

## Installation

```shell
# yarn
yarn add file:packages/chat
```

```shell
# npm
npm i --save file:packages/chat
```

## Usage
```vue
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
      <v-toolbar flat slot="header" class="toolbar hidden-sm-and-down">
        <v-toolbar-title>Adamant Chat</v-toolbar-title>

        <v-spacer/>

        <v-btn @click="pushNewMessage" color="primary">Push Message</v-btn>
        <v-btn @click="shuffle" color="secondary">Shuffle</v-btn>
      </v-toolbar>
      
      <template slot="message" slot-scope="props">

        <a-chat-message
          :key="props.message.timestamp"
          
          :id="props.message.id"
          :message="props.message.message"
          :timestamp="props.message.timestamp"
          :status="props.message.status"
          :sender="props.sender"

          :show-avatar="true"
        >
          <img src="assets/avatar.png" slot="avatar"/>
        </a-chat-message>

      </template>

      <a-chat-form
        slot="form"
        @message="onMessage"
        :show-send-button="true"
        :send-on-enter="true"
      />
    </a-chat>
  </v-card>
</template>

<script>
import { createRandomMessages, createOneMessage } from '~/components/__tests__/__mocks__/chatMessages'
import { AChat, AChatMessage, AChatForm } from '@adamant/chat'

export default {
  mounted () {
    this.loading = true
    
    this.fetchMessages(25)
      .then(messages => this.messages.unshift(...messages))
      .catch(err => console.error(err))
      .finally(() => {
        this.loading = false
      })
  },
  data: () => ({
    messages: [],
    partners: [
      {
        id: 'U111111',
        name: 'Rick'
      },
      {
        id: 'U222222',
        name: 'Morty'
      }
    ],
    userId: 'U111111', // chat owner
    loading: false
  }),
  methods: {
    onMessage (message) {
      let oneMessage = createOneMessage()
      oneMessage.senderId = this.userId
      oneMessage.timestamp = (new Date()).getTime()
      oneMessage.message = message
      
      this.messages.push(oneMessage)
      
      this.$nextTick(() => this.$refs.chat.scrollToBottom())
    },
    onScrollTop () {
      this.loading = true
      
      this.fetchMessages(10)
        .then(messages => this.messages.unshift(...messages))
        .catch(err => console.error(err))
        .finally(() => {
          this.loading = false
          this.$refs.chat.maintainScrollPosition()
        })
    },
    onScrollBottom () {
      //
    },
    fetchMessages (count) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          return resolve(createRandomMessages(count))
        }, 2000)
      })
    },
    pushNewMessage () {
      const messages = createRandomMessages(1)
      this.messages.push(...messages)
      
      this.$nextTick(() => this.$refs.chat.scrollToBottom())
    }
  },
  components: {
    AChat,
    AChatMessage,
    AChatForm
  }
}
</script>
```

## Types
```ts
export type Message = {
  id: number,
  senderId: string,
  message: string,
  timestamp: number,
  admTimestamp: number,
  amount: number,
  i18n: boolean,
  status: MessageStatus,
  type: MessageType,
}

export enum MessageType {
  Message = 'message',
  ADM = 'ADM',
  ETH = 'ETH'
}

export enum MessageStatus {
  sent,
  confirmed,
  rejected
}

export type User = {
  id: string,
  name?: string
}

```

## AChat.vue

### Props

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**[`messages`](#)**|`Message[]`|`[]`|Array of messages|
|**[`partners`](#)**|`User[]`|`[]`|Array of users who participate in chat (including vendor)|
|**[`user-id`](#)**|`string`|`undefined`|Id of the user who own the chat|
|**[`loading`](#)**|`boolean`|`false`|Show spinner|

### Events

|Name|Description|
|:--:|:----------|
|**[`@scroll:top`](#)**|When user scrolled top of messages. Use this event to fetch messages from history.|
|**[`@scroll:bottom`](#)**|When scrolled bottom of messages.|


### Slots

|Name|Props|Description|
|:--:|:---:|:----------|
|**[`messages`](#)**|`{messages: Message[]}`||
|**[`message`](#)**|`{message: Message, sender: User, userId: string]}`||
|**[`header`](#)**||Chat toolbar||
|**[`form`](#)**||Input message form||
