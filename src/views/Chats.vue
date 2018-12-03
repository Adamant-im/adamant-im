<template>
  <v-layout row wrap justify-center>
    <v-flex xs12 md4>
      <v-layout row wrap>
        <v-flex xs12>

          <v-list two-line subheader class="transparent">
            <v-list-tile @click="showChatStartDialog = true">
              <v-list-tile-avatar>
                <v-icon class="grey lighten-1 white--text">mdi-plus</v-icon>
              </v-list-tile-avatar>

              <v-list-tile-content>
                <v-list-tile-title>{{ $t('startNewChat') }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>

            <chat-preview
              v-for="chat in chats"
              :key="chat.partner"
              :chat-name="chatName(chat.partner)"
              :new-messages="newMessages(chat.partner)"
              :created-at="$formatDate(chat.last_message.timestamp)"
              :last-message="getLastMessage(chat.last_message)"
              :read-only="chat.readOnly"
              @click="openChat(chat.partner)"
            />
          </v-list>

        </v-flex>
      </v-layout>

    </v-flex>

    <chat-start-dialog
      v-model="showChatStartDialog"
      @start-chat="openChat"
    />
  </v-layout>
</template>

<script>
// @todo refactoring `store`, put chat logic in separate module and then refactor this
import ChatPreview from '@/components/ChatPreview'
import ChatStartDialog from '@/components/ChatStartDialog'

export default {
  computed: {
    chats () {
      return this.$store.state.chats
    }
  },
  data: () => ({
    showChatStartDialog: false
  }),
  methods: {
    newMessages (address) {
      if (this.$store.state.newChats[address]) {
        return true // @todo object or boolean?
      }
      return false
    },
    chatName (address) {
      return this.$store.getters['partners/displayName'](address) || address
    },
    getLastMessage (obj) {
      // type message or type transaction
      if (obj && obj.message) {
        if (typeof obj.message === 'string') {
          return obj.message
        } else if (obj.message.comments) {
          return obj.message.comments
        }
      }

      return ''
    },
    openChat (userId) {
      this.$router.push(`/chats/${userId}`)
    }
  },
  components: {
    ChatPreview,
    ChatStartDialog
  }
}
</script>

<i18n>
{
  "en": {
    "startNewChat": "Start new Chat"
  },
  "ru": {
    "startNewChat": "Новый чат"
  }
}
</i18n>
