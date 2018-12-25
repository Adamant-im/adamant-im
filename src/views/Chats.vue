<template>
  <v-layout row wrap justify-center>
    <v-flex lg4 md5 sm12 xs12>
      <v-layout row wrap>
        <v-flex xs12>

          <v-list two-line subheader class="transparent">
            <v-list-tile @click="showChatStartDialog = true">
              <v-list-tile-avatar>
                <v-icon class="chat-icon">mdi-plus</v-icon>
              </v-list-tile-avatar>

              <v-list-tile-content>
                <v-list-tile-title>{{ $t('startNewChat') }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>

            <chat-preview
              v-for="partnerId in partners"
              :key="partnerId"
              :partner-id="partnerId"
              :read-only="isChatReadOnly(partnerId)"
              @click="openChat(partnerId)"
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
  mounted () {
    this.$store.commit('chat/createAdamantChats')
    this.$store.dispatch('chat/loadChats')
  },
  computed: {
    isFulfilled () {
      return this.$store.state.chat.isFulfilled
    },
    partners () {
      return this.$store.getters['chat/partners']
    }
  },
  data: () => ({
    showChatStartDialog: false
  }),
  methods: {
    openChat (userId) {
      this.$router.push(`/chats/${userId}`)
    },
    isChatReadOnly (partnerId) {
      return this.$store.getters['chat/isChatReadOnly'](partnerId)
    }
  },
  components: {
    ChatPreview,
    ChatStartDialog
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'

.theme--light
  .chat-icon
    color: $shades.white
    background-color: $grey.lighten-1

.theme--dark
  .chat-icon
    color: $shades.white
    background-color: $grey.darken-1
</style>

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
