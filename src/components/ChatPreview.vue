<template>
  <v-list-tile
    class="chat-preview"
    @click="$emit('click')"
  >
    <v-list-tile-avatar>
      <icon v-if="readOnly" class="adm-icon"><adm-fill-icon/></icon>
      <chat-avatar v-else :size="40" :user-id="partnerId" use-public-key/>

      <v-badge overlap color="primary">
        <span v-if="numOfNewMessages > 0" slot="badge">
          {{ numOfNewMessages > 99 ? '99+' : numOfNewMessages }}
        </span>
      </v-badge>
    </v-list-tile-avatar>

    <v-list-tile-content>
      <v-list-tile-title>{{ partnerName }}</v-list-tile-title>

      <!-- Transaction -->
      <template v-if="lastTransaction">
        <v-list-tile-sub-title>
          <v-icon size="15">{{ status === 'confirmed' ? 'mdi-check-all' : 'mdi-clock-outline' }}</v-icon>
          {{ transactionMessage }}
        </v-list-tile-sub-title>
      </template>

      <!-- Message -->
      <template v-else>
        <v-list-tile-sub-title
          v-if="readOnly"
          v-text="isMessageI18n ? $t(lastMessageText) : lastMessageText"
        />
        <v-list-tile-sub-title v-else>{{ lastMessageTextNoFormats }}</v-list-tile-sub-title>
      </template>
    </v-list-tile-content>

    <div class="chat-preview__date">
      {{ createdAt | date }}
    </div>
  </v-list-tile>
</template>

<script>
import moment from 'moment'
import { removeFormats } from '@/lib/message-formatter'

import transaction from '@/mixins/transaction'
import dateFilter from '@/filters/date'
import ChatAvatar from '@/components/Chat/ChatAvatar'
import Icon from '@/components/icons/BaseIcon'
import AdmFillIcon from '@/components/icons/AdmFill'

export default {
  mounted () {
    moment.locale(this.$store.state.language.currentLocale)

    // fetch status if last message is transaction
    if (this.lastTransaction) {
      this.fetchTransactionStatus(this.lastTransaction, this.partnerId)
    }
  },
  computed: {
    userId () {
      return this.$store.state.address
    },
    partnerName () {
      return this.$store.getters['contacts/contactName'](this.partnerId) || this.partnerId
    },
    lastMessage () {
      return this.$store.getters['chat/lastMessage'](this.partnerId)
    },
    isMessageI18n () {
      return this.lastMessage.i18n
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
    lastTransaction () {
      if (this.lastMessage) {
        const abstract = this.lastMessage

        if (abstract.type !== 'message') {
          return abstract
        }
      }

      return null
    },
    transactionMessage () {
      const amount = this.$formatAmount(this.lastTransaction.amount, this.lastTransaction.type)

      const direction = this.userId === this.lastTransaction.senderId
        ? this.$t('chats.sent_label')
        : this.$t('chats.received_label')

      const crypto = this.lastTransaction.type

      return `${direction} ${amount} ${crypto}`
    },
    numOfNewMessages () {
      return this.$store.getters['chat/numOfNewMessages'](this.partnerId)
    },
    createdAt () {
      return this.lastMessageTimestamp
    },
    status () {
      return this.lastMessage.status
    }
  },
  data: () => ({
  }),
  filters: {
    date: dateFilter
  },
  mixins: [transaction],
  components: {
    ChatAvatar,
    Icon,
    AdmFillIcon
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
  .adm-icon
    fill: #BDBDBD

.theme--dark
  .chat-preview__icon
    background-color: $grey.darken-1
</style>
