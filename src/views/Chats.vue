<template>
  <v-layout row wrap justify-center>
    <container>
      <v-layout row wrap>
        <v-flex xs12>

          <v-list two-line subheader class="transparent">
            <v-list-tile @click="showChatStartDialog = true">
              <v-list-tile-avatar>
                <v-icon class="chat-icon">mdi-plus</v-icon>
              </v-list-tile-avatar>

              <v-list-tile-content>
                <v-list-tile-title>{{ $t('chats.new_chat') }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>

            <transition-group name="messages" v-if="isFulfilled">
              <chat-preview
                v-for="transaction in messages"
                :key="transaction.contactId"
                :user-id="userId"
                :contact-id="transaction.contactId"
                :transaction="transaction"
                :read-only="isChatReadOnly(transaction.contactId)"
                @click="openChat(transaction.contactId)"
              />
            </transition-group>
          </v-list>

        </v-flex>

        <ChatSpinner :value="!isFulfilled" />
      </v-layout>
    </container>

    <chat-start-dialog
      v-model="showChatStartDialog"
      @start-chat="openChat"
    />
  </v-layout>
</template>

<script>
import ChatPreview from '@/components/ChatPreview'
import ChatStartDialog from '@/components/ChatStartDialog'
import ChatSpinner from '@/components/ChatSpinner'

export default {
  computed: {
    isFulfilled () {
      return this.$store.state.chat.isFulfilled
    },
    partners () {
      return this.$store.getters['chat/partners']
    },
    messages () {
      return this.$store.getters['chat/lastMessages']
    },
    userId () {
      return this.$store.state.address
    }
  },
  data: () => ({
    showChatStartDialog: false
  }),
  methods: {
    openChat (userId) {
      this.$router.push(`/chats/${userId}/`)
    },
    isChatReadOnly (partnerId) {
      return this.$store.getters['chat/isChatReadOnly'](partnerId)
    }
  },
  components: {
    ChatPreview,
    ChatStartDialog,
    ChatSpinner
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'

/** Themes **/
.theme--light
  .chat-icon
    color: $shades.white
    background-color: $grey.lighten-1

.theme--dark
  .chat-icon
    color: $shades.white
    background-color: $grey.darken-1

/** Animations **/
.messages-move
  transition: transform 0.5s
</style>
