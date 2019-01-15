<template>
  <v-list-tile
    class="chat-preview"
    @click="$emit('click')"
  >
    <v-list-tile-avatar>
      <v-icon v-if="readOnly" class="chat-preview__icon">mdi-ethereum</v-icon>
      <chat-avatar v-else :size="40" :user-id="partnerId" use-public-key/>

      <v-badge overlap color="primary">
        <span v-if="numOfNewMessages" slot="badge">{{ numOfNewMessages }}</span>
      </v-badge>
    </v-list-tile-avatar>

    <v-list-tile-content>
      <v-list-tile-title>{{ partnerName }}</v-list-tile-title>
      <v-list-tile-sub-title
        v-if="readOnly"
        v-text="isMessageI18n ? $t(lastMessageText) : lastMessageText"
      />
      <v-list-tile-sub-title v-else>{{ lastMessageTextNoFormats }}</v-list-tile-sub-title>
    </v-list-tile-content>

    <div class="chat-preview__date">
      {{ createdAt | date }}
    </div>
  </v-list-tile>
</template>

<script>
import moment from 'moment'
import dateFilter from '@/filters/date'
import { EPOCH } from '@/lib/constants'
import { removeFormats } from '@adamant/message-formatter'
import ChatAvatar from '@/components/Chat/ChatAvatar'

export default {
  mounted () {
    moment.locale(this.$store.state.language.currentLocale)
  },
  computed: {
    partnerName () {
      return this.$store.getters['contacts/contactName'](this.partnerId) || this.partnerId
    },
    lastMessage () {
      return this.$store.getters['chat/lastMessage'](this.partnerId)
    },
    isMessageI18n () {
      return (this.lastMessage.i18n)
    },
    lastMessageText () {
      return this.$store.getters['chat/lastMessageText'](this.partnerId)
    },
    lastMessageTextNoFormats () {
      return removeFormats(this.lastMessageText)
    },
    lastMessageTimestamp () {
      return this.$store.getters['chat/lastMessageTimestamp'](this.partnerId)
    },
    numOfNewMessages () {
      return this.$store.getters['chat/numOfNewMessages'](this.partnerId)
    },
    createdAt () {
      return this.lastMessageTimestamp * 1000 + EPOCH // transform ADM timestamp
    }
  },
  data: () => ({
  }),
  filters: {
    date: dateFilter
  },
  components: {
    ChatAvatar
  },
  props: {
    partnerId: {
      type: String,
      required: true
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'

.chat-preview
  position: relative

  &__date
    font-size: 12px
    color: $grey.base
    position: absolute
    top: 16px
    right: 16px

/** Themes **/
.theme--light
  .chat-preview__icon
    background-color: $grey.lighten-1
    color: $shades.white

.theme--dark
  .chat-preview__icon
    background-color: $grey.darken-1
</style>
