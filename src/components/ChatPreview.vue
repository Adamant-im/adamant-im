<template>
  <v-list-tile
    class="chat-preview"
    @click="$emit('click')"
  >
    <v-list-tile-avatar>
      <icon v-if="readOnly" class="adm-icon"><adm-fill-icon/></icon>
      <chat-avatar v-else :size="40" :user-id="contactId" use-public-key/>

      <v-badge overlap color="primary">
        <span v-if="numOfNewMessages > 0" slot="badge">
          {{ numOfNewMessages > 99 ? '99+' : numOfNewMessages }}
        </span>
      </v-badge>
    </v-list-tile-avatar>

    <v-list-tile-content>
      <v-list-tile-title v-text="readOnly ? $t(contactName) : contactName"></v-list-tile-title>

      <!-- Transaction -->
      <template v-if="isTransferType">
        <v-list-tile-sub-title>
          <v-icon size="15">{{ statusIcon }}</v-icon>
          {{ transactionDirection }} {{ transaction.amount | currency(transaction.type) }}
        </v-list-tile-sub-title>
      </template>

      <!-- Message -->
      <template v-else>
        <v-list-tile-sub-title
          v-if="readOnly || isMessageI18n"
          v-text="isMessageI18n ? $t(transaction.message) : transaction.message"
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
import { removeFormats } from '@/lib/markdown'

import transaction from '@/mixins/transaction'
import dateFilter from '@/filters/date'
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
    contactName () {
      return this.$store.getters['partners/displayName'](this.contactId) || this.contactId
    },

    isTransferType () {
      return this.transaction.type !== 'message'
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
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'

.chat-preview
  position: relative

  &__date
    font-size: 8px
    font-style: italic
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
