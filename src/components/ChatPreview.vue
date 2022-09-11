<template>
  <v-list-tile
    v-if="isLoadingSeparator"
  >
    <v-list-tile-content
      style="align-items: center"
    >
      <v-icon
        ref="loadingDots"
        :class="{ kmove: isLoadingSeparatorActive }"
      >
        mdi-dots-horizontal
      </v-icon>
    </v-list-tile-content>
  </v-list-tile>
  <v-list-tile
    v-else
    :class="className"
    @click="$emit('click')"
  >
    <v-list-tile-avatar>
      <icon
        v-if="readOnly"
        :class="`${className}__icon`"
      >
        <adm-fill-icon />
      </icon>
      <chat-avatar
        v-else
        :size="40"
        :user-id="contactId"
        use-public-key
      />

      <v-badge
        overlap
        color="primary"
      >
        <span
          v-if="numOfNewMessages > 0"
          slot="badge"
        >
          {{ numOfNewMessages > 99 ? '99+' : numOfNewMessages }}
        </span>
      </v-badge>
    </v-list-tile-avatar>

    <v-list-tile-content>
      <v-list-tile-title
        class="a-text-regular-enlarged-bold"
        v-text="isAdamantChat ? $t(contactName) : contactName"
      />

      <!-- New chat (no messages yet) -->
      <template v-if="isNewChat">
        <v-list-tile-sub-title>&nbsp;</v-list-tile-sub-title>
      </template>

      <!-- Transaction -->
      <template v-else-if="isTransferType">
        <v-list-tile-sub-title>
          <v-icon
            v-if="!isIncomingTransaction"
            size="15"
          >
            {{ statusIcon }}
          </v-icon>
          {{ transactionDirection }} {{ transaction.amount | currency(transaction.type) }}
          <v-icon
            v-if="isIncomingTransaction"
            size="15"
          >
            {{ statusIcon }}
          </v-icon>
        </v-list-tile-sub-title>
      </template>

      <!-- Message -->
      <template v-else>
        <v-list-tile-sub-title class="a-text-explanation-enlarged-bold">
          <v-icon
            v-if="!isIncomingTransaction"
            size="15"
          >
            {{ statusIcon }}
          </v-icon>
          {{ lastMessageTextNoFormats }}
        </v-list-tile-sub-title>
      </template>
    </v-list-tile-content>

    <div
      v-if="!isMessageReadonly"
      :class="`${className}__date`"
    >
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
import partnerName from '@/mixins/partnerName'
import { tsIcon } from '@/lib/constants'
import { isStringEqualCI } from '@/lib/textHelpers'

export default {
  filters: {
    date: dateFilter
  },
  components: {
    ChatAvatar,
    Icon,
    AdmFillIcon
  },
  mixins: [transaction, partnerName],
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
    isMessageReadonly: {
      type: Boolean,
      default: false
    },
    isAdamantChat: {
      type: Boolean,
      default: false
    },
    isLoadingSeparator: {
      type: Boolean,
      default: false
    },
    isLoadingSeparatorActive: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
  }),
  computed: {
    className: () => 'chat-brief',
    contactName () {
      return this.getPartnerName(this.contactId) || this.contactId
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
    lastMessageTextLocalized () {
      return this.isMessageI18n
        ? this.$t(this.lastMessageText)
        : this.lastMessageText
    },
    lastMessageTextNoFormats () {
      if (
        this.isAdamantChat ||
        this.$store.state.options.formatMessages
      ) {
        return removeFormats(this.lastMessageTextLocalized)
      }

      return this.lastMessageTextLocalized
    },
    transactionDirection () {
      const direction = isStringEqualCI(this.userId, this.transaction.senderId)
        ? this.$t('chats.sent_label')
        : this.$t('chats.received_label')

      return direction
    },
    isIncomingTransaction () {
      return !isStringEqualCI(this.userId, this.transaction.senderId)
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
      return tsIcon(this.status.virtualStatus)
    }
  },
  watch: {
    // fetch status when new message received
    transaction () {
      this.fetchTransactionStatus(this.transaction, this.contactId)
    }
  },
  mounted () {
    // fetch status if transaction is transfer
    if (this.isTransferType) {
      this.fetchTransactionStatus(this.transaction, this.contactId)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../assets/stylus/settings/_colors.scss';
@import '../assets/stylus/themes/adamant/_mixins.scss';

@keyframes movement {
  from { left: -50px }
  to { left: 50px }
}

.kmove {
  position: relative;
  animation-name: movement;
  animation-duration: 0.5s;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

/**
 * 1. Message/Transaction content.
 */
.chat-brief {
  position: relative;

  &__date {
    @include a-text-explanation-small();
    position: absolute;
    top: 16px;
    right: 16px;
  }

  /deep/ .v-list__tile__sub-title  {
    @include a-text-explanation-enlarged-bold();
  }
}

/** Themes **/
.theme--light {
  .chat-brief {
    border-bottom: 1px solid, map-get($adm-colors, 'secondary2');

    &__date {
      color: map-get($adm-colors, 'muted');
    }

    &__icon {
      fill: #BDBDBD;
    }

    /deep/ .v-list__tile__sub-title  {
      color: map-get($adm-colors, 'muted');
    }
  }
}
</style>
