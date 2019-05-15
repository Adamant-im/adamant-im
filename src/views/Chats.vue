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
                v-for="message in messagesSorted"
                :key="message.partnerId"
                :partner-id="message.partnerId"
                :read-only="isChatReadOnly(message.partnerId)"
                @click="openChat(message.partnerId)"
              />
            </transition-group>
          </v-list>

          <div class="text-xs-center">
            <v-progress-circular
              v-show="loading"
              indeterminate
              color="primary"
              size="24"
            />
          </div>

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
  mounted () {
    this.attachScrollListener()
  },
  beforeDestroy () {
    this.destroyScrollListener()
  },
  computed: {
    isFulfilled () {
      return this.$store.state.chat.isFulfilled
    },
    partners () {
      return this.$store.getters['chat/partners']
    },
    /**
     * Create array of last messages with timestamp.
     *
     * Important: `timestamp` is Adamant Timestamp.
     *
     * @returns {Array<{partnerId: string, timestamp: number}>}
     */
    messages () {
      return this.partners.map(partnerId => {
        const timestamp = this.$store.getters['chat/lastMessageTimestamp'](partnerId)

        return {
          partnerId,
          timestamp
        }
      })
    },
    /**
     * Sort messages by timestamp.
     * @returns {Message[]}
     */
    messagesSorted () {
      // clone only array with references
      const messages = [...this.messages]

      return messages.sort((left, right) => right.timestamp - left.timestamp)
    }
  },
  data: () => ({
    showChatStartDialog: false,
    loading: false,
    noMoreChats: false
  }),
  methods: {
    openChat (userId) {
      this.$router.push(`/chats/${userId}/`)
    },
    isChatReadOnly (partnerId) {
      return this.$store.getters['chat/isChatReadOnly'](partnerId)
    },

    attachScrollListener () {
      window.addEventListener('scroll', this.onScroll)
    },

    destroyScrollListener () {
      window.removeEventListener('scroll', this.onScroll)
    },

    onScroll () {
      const scrollHeight = document.documentElement.scrollHeight
      const scrollTop = document.documentElement.scrollTop
      const clientHeight = document.documentElement.clientHeight

      // if scrolled to bottom
      if (scrollHeight - scrollTop === clientHeight) {
        this.loadChatsPaged()
      }
    },

    loadChatsPaged () {
      if (this.loading) return
      if (this.noMoreChats) return

      this.loading = true
      this.$store.dispatch('chat/loadChatsPaged')
        .catch(() => {
          this.noMoreChats = true
        })
        .finally(() => {
          this.loading = false
        })
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
