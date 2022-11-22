<template>
  <v-row
    justify="center"
    :class="className"
    no-gutters
  >
    <container>
      <v-row no-gutters>
        <v-col cols="12">
          <v-list
            subheader
            class="pa-0"
            bg-color="transparent"
          >
            <v-list-item
              v-if="isFulfilled"
              :class="`${className}__item`"
              @click="showChatStartDialog = true"
            >
              <template #prepend>
                <v-icon
                  :class="`${className}__icon`"
                  size="16"
                >
                  mdi-message-outline
                </v-icon>
              </template>

              <div>
                <v-list-item-title :class="`${className}__title`">
                  {{ $t('chats.new_chat') }}
                </v-list-item-title>
              </div>
            </v-list-item>

            <transition-group
              v-if="isFulfilled"
              name="messages"
            >
              <chat-preview
                v-for="transaction in messages"
                :ref="transaction.contactId"
                :key="transaction.contactId"
                :is-loading-separator="transaction.loadingSeparator"
                :is-loading-separator-active="loading"
                :user-id="userId"
                :contact-id="transaction.contactId"
                :transaction="transaction"
                :read-only="isChatReadOnly(transaction.contactId)"
                :is-message-readonly="transaction.readonly"
                :is-adamant-chat="isAdamantChat(transaction.contactId)"
                @click="openChat(transaction.contactId)"
              />
            </transition-group>
          </v-list>
        </v-col>

        <ChatSpinner :value="!isFulfilled" />
      </v-row>
    </container>

    <chat-start-dialog
      v-model="showChatStartDialog"
      :partner-id="partnerId"
      @error="onError"
      @start-chat="openChat"
    />
  </v-row>
</template>

<script>
import ChatPreview from '@/components/ChatPreview'
import ChatStartDialog from '@/components/ChatStartDialog'
import ChatSpinner from '@/components/ChatSpinner'
import scrollPosition from '@/mixins/scrollPosition'

const scrollOffset = 64

export default {
  components: {
    ChatPreview,
    ChatStartDialog,
    ChatSpinner
  },
  mixins: [scrollPosition],
  props: {
    partnerId: { default: undefined, type: String },
    showNewContact: { default: false, type: Boolean }
  },
  data: () => ({
    showChatStartDialog: false,
    loading: false,
    noMoreChats: false
  }),
  computed: {
    className: () => 'chats-view',
    isFulfilled () {
      return this.$store.state.chat.isFulfilled
    },
    partners () {
      return this.$store.getters['chat/partners']
    },
    messages () {
      const lastMessages = this.$store.getters['chat/lastMessages']
      // We should modify cloned message list to leave original one untouched
      const clonedLastMessages = lastMessages.map(msg => { return { ...msg } })
      if (!this.noMoreChats && clonedLastMessages.length > 25) {
        const lastNotAdamantChat = lastMessages.map(msg => this.isAdamantChat(msg.contactId)).lastIndexOf(false)
        if (lastNotAdamantChat) {
          clonedLastMessages.splice(lastNotAdamantChat + 1, 0, { loadingSeparator: true, userId: 'loadingSeparator', contactId: 'loadingSeparator' })
        }
      }
      return clonedLastMessages
    },
    userId () {
      return this.$store.state.address
    }
  },
  beforeMount () {
    // When returning to chat list from a specific chat, restore noMoreChats property not to show loadingSeparator
    this.noMoreChats = this.$store.getters['chat/chatListOffset'] === -1
  },
  mounted () {
    this.showChatStartDialog = this.showNewContact
    this.attachScrollListener()
  },
  beforeUnmount () {
    this.destroyScrollListener()
  },
  methods: {
    openChat (partnerId, messageText) {
      this.$router.push({
        name: 'Chat', params: { messageText, partnerId }
      })
    },
    isChatReadOnly (partnerId) {
      return this.$store.getters['chat/isChatReadOnly'](partnerId)
    },
    isAdamantChat (partnerId) {
      return this.$store.getters['chat/isAdamantChat'](partnerId)
    },
    onError (message) {
      this.$store.dispatch('snackbar/show', { message })
    },
    attachScrollListener () {
      window.addEventListener('scroll', this.onScroll)
    },
    destroyScrollListener () {
      window.removeEventListener('scroll', this.onScroll)
    },
    onScroll () {
      const scrollHeight = document.documentElement.scrollHeight // all of viewport height
      const scrollTop = document.documentElement.scrollTop // current vieport scroll position
      const clientHeight = document.documentElement.clientHeight

      let isLoadingSeparatorVisible = false
      if (this.$refs.loadingSeparator && this.$refs.loadingSeparator[0] && this.$refs.loadingSeparator[0].$el) {
        const el = this.$refs.loadingSeparator[0].$el
        if (el.offsetTop > 0) { // loadingSeparator is visible
          const loadingSeparatorTop = el.offsetTop
          const loadingSeparatorHeight = el.clientHeight // it is nearly about bottom menu height
          isLoadingSeparatorVisible = scrollTop + clientHeight > loadingSeparatorTop + loadingSeparatorHeight
        }
      }

      const isScrolledToBottom = scrollHeight - scrollTop - scrollOffset < clientHeight

      if (isLoadingSeparatorVisible || isScrolledToBottom) {
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
          this.onScroll() // update messages and remove loadingSeparator, if needed
        })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~vuetify/settings';
@import '../assets/styles/settings/_colors.scss';
.chats-view {
  &__item {
    justify-content: flex-end;
    height: 56px;
    min-height: 56px;

    & :deep(.v-list-item__avatar) {
      margin-right: 4px;
    }

    :deep(.v-list-item__prepend) {
      > .v-icon {
        margin-inline-end: 8px;
      }
    }
  }
  &__title {
    font-weight: 300;
    font-size: 14px;
  }
}

/** Themes **/
.v-theme--light {
  .chats-view {
    &__item {
      background-color: map-get($adm-colors, 'secondary2-transparent');
    }
    &__title {
      color: map-get($adm-colors, 'muted');
    }
    &__icon {
      color: map-get($adm-colors, 'regular');
    }
  }
}

.v-theme--dark {
  .chats-view {
    &__icon {
      color: map-get($shades, 'white');
    }
  }
}

/** Animations **/
.messages-move {
  transition: transform 0.5s;
}
</style>
