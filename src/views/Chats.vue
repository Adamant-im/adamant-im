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
              <v-list-tile-avatar size="24">
                <v-icon :class="`${className}__icon`" size="16">mdi-message-outline</v-icon>
              </v-list-tile-avatar>

              <div>
                <v-list-tile-title :class="`${className}__title`">
                  {{ $t('chats.new_chat') }}
                </v-list-tile-title>
              </div>
            </v-list-tile>

            <transition-group name="messages" v-if="isFulfilled">
              <chat-preview
                v-for="transaction in messages"
                :key="transaction.contactId"
                :user-id="userId"
                :contact-id="transaction.contactId"
                :transaction="transaction"
                :read-only="isChatReadOnly(transaction.contactId)"
                :is-adamant-chat="isAdamantChat(transaction.contactId)"
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
import scrollPosition from '@/mixins/scrollPosition'

export default {
  computed: {
    className: () => 'chats-view',
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
    },
    isAdamantChat (partnerId) {
      return this.$store.getters['chat/isAdamantChat'](partnerId)
    }
  },
  mixins: [scrollPosition],
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
      min-width: 28px
  &__title
    font-weight: 300
    font-size: 14px

/** Themes **/
.theme--light
  .chats-view
    &__tile
      >>> .v-list__tile
        background-color: $adm-colors.secondary2-transparent
    &__title
      color: $adm-colors.muted
    &__icon
      color: $adm-colors.regular

.theme--dark
  .chats-view
    &__icon
      color: $shades.white

/** Animations **/
.messages-move
  transition: transform 0.5s
</style>
