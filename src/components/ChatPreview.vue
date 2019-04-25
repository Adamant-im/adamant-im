<template>
  <v-list-tile
    :class="className"
    @click="$emit('click')"
  >
    <v-list-tile-avatar>
      <icon v-if="readOnly" :class="`${className}__icon`"><adm-fill-icon/></icon>
      <chat-avatar v-else :size="40" :user-id="partnerId" use-public-key/>

      <v-badge overlap color="primary">
        <span v-if="numOfNewMessages > 0" slot="badge">
          {{ numOfNewMessages > 99 ? '99+' : numOfNewMessages }}
        </span>
      </v-badge>
    </v-list-tile-avatar>

    <v-list-tile-content>
      <v-list-tile-title
        v-text="readOnly ? $t(partnerName) : partnerName"
        :class="`${className}__title`"
      ></v-list-tile-title>

      <!-- Transaction -->
      <template v-if="lastTransaction">
        <v-list-tile-sub-title>
          <v-icon size="15">{{ statusIcon }}</v-icon>
          {{ transactionDirection }} {{ lastTransaction.amount | currency(lastTransaction.type) }}
        </v-list-tile-sub-title>
      </template>

      <!-- Message -->
      <template v-else>
        <v-list-tile-sub-title
          v-if="readOnly || isMessageI18n"
          v-text="isMessageI18n ? $t(lastMessageText) : lastMessageText"
        />
        <v-list-tile-sub-title v-else>{{ lastMessageTextNoFormats }}</v-list-tile-sub-title>
      </template>
    </v-list-tile-content>

    <div :class="`${className}__date`">
      {{ createdAt | date }}
    </div>
  </v-list-tile>
</template>

<script>
import moment from 'moment'
import { removeFormats } from '@/lib/markdown'

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
  watch: {
    // fetch status when new message received
    lastTransaction () {
      this.fetchTransactionStatus(this.lastTransaction, this.partnerId)
    }
  },
  computed: {
    className: () => 'chat-brief',
    userId () {
      return this.$store.state.address
    },
    partnerName () {
      return this.$store.getters['partners/displayName'](this.partnerId) || this.partnerId
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
      if (
        this.readOnly ||
        this.$store.state.options.formatMessages
      ) {
        return removeFormats(this.lastMessageText)
      }

      return this.lastMessageText
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
    transactionDirection () {
      const direction = this.userId === this.lastTransaction.senderId
        ? this.$t('chats.sent_label')
        : this.$t('chats.received_label')

      return direction
    },
    numOfNewMessages () {
      return this.$store.getters['chat/numOfNewMessages'](this.partnerId)
    },
    createdAt () {
      return this.lastMessageTimestamp
    },
    status () {
      return this.getTransactionStatus(this.lastMessage)
    },
    statusIcon () {
      if (this.status === 'delivered') {
        return 'mdi-check'
      } else if (this.status === 'pending') {
        return 'mdi-clock-outline'
      } else if (this.status === 'rejected') {
        return 'mdi-close-circle-outline'
      } else {
        return 'mdi-alert-outline'
      }
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
@import '../assets/stylus/settings/_colors.styl'

/**
 * 1. Message/Transaction content.
 */
.chat-brief
  position: relative

  &__title
    font-weight: 300
  &__date
    font-size: 8px
    font-style: italic
    position: absolute
    top: 16px
    right: 16px
  >>> .v-list__tile__sub-title // [1]
    font-size: 16px
    font-weight: 300

/** Themes **/
.theme--light
  .chat-brief
    &__title
      color: $adm-colors.regular
    &__date
      color: $adm-colors.muted
    &__icon
      fill: #BDBDBD
    >>> .v-list__tile__sub-title // [1]
      color: $adm-colors.muted
</style>
