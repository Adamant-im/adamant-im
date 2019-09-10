<template>
  <v-list-tile
    :class="className"
    @click="$emit('click')"
  >
    <v-list-tile-avatar>
      <icon v-if="readOnly" :class="`${className}__icon`"><adm-fill-icon/></icon>
      <chat-avatar v-else :size="40" :user-id="contactId" use-public-key/>

      <v-badge overlap color="primary">
        <span v-if="numOfNewMessages > 0" slot="badge">
          {{ numOfNewMessages > 99 ? '99+' : numOfNewMessages }}
        </span>
      </v-badge>
    </v-list-tile-avatar>

    <v-list-tile-content>
      <v-list-tile-title
        v-text="isAdamantChat ? $t(contactName) : contactName"
        class="a-text-regular-enlarged-bold"
      ></v-list-tile-title>

      <!-- New chat (no messages yet) -->
      <template v-if="isNewChat">
        <v-list-tile-sub-title>&nbsp;</v-list-tile-sub-title>
      </template>

      <!-- Transaction -->
      <template v-else-if="isTransferType">
        <v-list-tile-sub-title>
          <v-icon size="15" v-if="!isIncomingTransaction">{{ statusIcon }}</v-icon>
          {{ transactionDirection }} {{ transaction.amount | currency(transaction.type) }}
          <v-icon size="15" v-if="isIncomingTransaction">{{ statusIcon }}</v-icon>
        </v-list-tile-sub-title>
      </template>

      <!-- Message -->
      <template v-else>
        <v-list-tile-sub-title
          v-if="readOnly || isMessageI18n"
          v-text="isMessageI18n ? $t(transaction.message) : transaction.message"
          class="a-text-explanation-enlarged-bold"
        />
        <v-list-tile-sub-title class="a-text-explanation-enlarged-bold" v-else>
          <v-icon size="15" v-if="!isIncomingTransaction">{{ statusIcon }}</v-icon>
          {{ lastMessageTextNoFormats }}
        </v-list-tile-sub-title>
      </template>
    </v-list-tile-content>

    <div v-if="!isAdamantChat" :class="`${className}__date`">
      {{ createdAt | date }}
    </div>
  </v-list-tile>
</template>

<script>
import { removeFormats } from '@/lib/markdown'

import transaction from '@/mixins/transaction'
import dateFilter from '@/filters/dateBrief'
import ChatAvatar from '@/components/Chat/ChatAvatar'
import Icon from '@/components/icons/BaseIcon'
import AdmFillIcon from '@/components/icons/AdmFill'

export default {
  mounted () {
    // fetch status if transaction is transfer
    if (this.isTransferType) {
      this.fetchTransactionStatus(this.transaction, this.contactId)
    }
  },
  watch: {
    // fetch status when new message received
    transaction () {
      this.fetchTransactionStatus(this.transaction, this.contactId)
    }
  },
  computed: {
    className: () => 'chat-brief',
    contactName () {
      return this.$store.getters['partners/displayName'](this.contactId) || this.contactId
    },

    isTransferType () {
      return this.transaction.type !== 'message'
    },
    isNewChat () {
      return !this.transaction.type
    },

    lastMessage () {
      return this.transaction
    },
    isMessageI18n () {
      return this.transaction.i18n
    },
    lastMessageText () {
      return this.transaction.message || ''
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
    transactionDirection () {
      const direction = this.userId === this.transaction.senderId
        ? this.$t('chats.sent_label')
        : this.$t('chats.received_label')

      return direction
    },
    isIncomingTransaction () {
      return this.userId !== this.transaction.senderId
    },
    numOfNewMessages () {
      return this.$store.getters['chat/numOfNewMessages'](this.contactId)
    },
    createdAt () {
      return this.transaction.timestamp
    },
    status () {
      return this.getTransactionStatus(this.transaction)
    },
    statusIcon () {
      if (this.status === 'delivered') {
        return 'mdi-check'
      } else if (this.status === 'pending') {
        return 'mdi-clock-outline'
      } else if (this.status === 'rejected') {
        return 'mdi-close-circle-outline'
      } else if (this.status === 'invalid') {
        return 'mdi-alert-outline'
      } else if (this.status === 'unknown') {
        return 'mdi-help-circle-outline'
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
    userId: {
      type: String,
      required: true
    },
    contactId: {
      type: String,
      required: true
    },
    transaction: {
      type: Object,
      required: true
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    isAdamantChat: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../assets/stylus/settings/_colors.styl'
@import '../assets/stylus/themes/adamant/_mixins.styl'

/**
 * 1. Message/Transaction content.
 */
.chat-brief
  position: relative

  &__date
    a-text-explanation-small()
    position: absolute
    top: 16px
    right: 16px
  >>> .v-list__tile__sub-title // [1]
    a-text-explanation-enlarged-bold()

/** Themes **/
.theme--light
  .chat-brief
    border-bottom: 1px solid $adm-colors.secondary2

    &__date
      color: $adm-colors.muted
    &__icon
      fill: #BDBDBD
    >>> .v-list__tile__sub-title // [1]
      color: $adm-colors.muted
</style>
