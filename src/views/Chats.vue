<template>
  <v-layout row wrap justify-center :class="className">
    <container>
      <v-layout row wrap>
        <v-flex xs12>

          <v-list two-line subheader class="transparent">
            <v-list-tile
              v-if="isFulfilled"
              @click="showChatStartDialog = true"
              :class="`${className}__tile`"
            >
              <v-list-tile-avatar size="36">
                <v-icon :class="`${className}__icon`" size="24">mdi-pencil</v-icon>
              </v-list-tile-avatar>

              <div>
                <v-list-tile-title :class="`${className}__title`">
                  {{ $t('chats.new_chat') }}
                </v-list-tile-title>
              </div>
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
    className: () => 'chats-view',
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
@import '../assets/stylus/settings/_colors.styl'

.chats-view
  &__tile
    >>> .v-list__tile
      justify-content: flex-end
      height: 56px
    >>> .v-list__tile__avatar
      min-width: 48px
  &__title
    font-weight: 300
    font-size: 14px

/** Themes **/
.theme--light
  .chats-view
    &__title
      color: $adm-colors.muted
    &__icon
      color: $shades.white
      background-color: $grey.lighten-1

.theme--dark
  .chats-view
    &__icon
      color: $shades.white
      background-color: $grey.darken-1

/** Animations **/
.messages-move
  transition: transform 0.5s
</style>
