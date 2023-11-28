<template>
  <v-list-item v-if="isLoadingSeparator">
    <div class="d-flex justify-center">
      <v-icon
        ref="loadingDots"
        :class="{ kmove: isLoadingSeparatorActive }"
        icon="mdi-dots-horizontal"
      />
    </div>
  </v-list-item>
  <v-list-item v-else lines="two" :class="className" @click="$emit('click')">
    <template #prepend>
      <icon v-if="isWelcomeChat(contactId)" :class="`${className}__icon`">
        <adm-fill-icon />
      </icon>
      <div v-else :class="`${className}__chat-avatar`">
        <chat-avatar :size="40" :user-id="contactId" use-public-key />
      </div>

      <v-badge
        :class="`${className}__badge`"
        v-if="numOfNewMessages > 0"
        overlap
        color="primary"
        :content="numOfNewMessages > 99 ? '99+' : numOfNewMessages"
      />
    </template>

    <div>
      <div :class="`${className}__heading`">
        <v-list-item-title
          :class="{
            'a-text-regular-enlarged-bold': true,
            [`${className}__title`]: true
          }"
          >{{ isAdamantChat(contactId) ? $t(contactName) : contactName }}</v-list-item-title
        >
        <div v-if="!isMessageReadonly" :class="`${className}__date`">
          {{ formatDate(createdAt) }}
        </div>
      </div>

      <!-- New chat (no messages yet) -->
      <template v-if="isNewChat">
        <v-list-item-subtitle>&nbsp;</v-list-item-subtitle>
      </template>

      <!-- Transaction -->
      <template v-else-if="isTransferType">
        <v-list-item-subtitle :class="`${className}__subtitle`">
          <v-icon v-if="!isIncomingTransaction" size="15" :icon="statusIcon" />
          {{ transactionDirection }} {{ currency(transaction.amount, transaction.type) }}
          <v-icon v-if="isIncomingTransaction" :icon="statusIcon" size="15" />
        </v-list-item-subtitle>
      </template>

      <!-- Reaction -->
      <template v-else-if="isReaction">
        <v-list-item-subtitle :class="`${className}__subtitle`">
          {{ reactedText }}
        </v-list-item-subtitle>
      </template>

      <!-- Message -->
      <template v-else>
        <v-list-item-subtitle
          :class="['a-text-explanation-enlarged-bold', `${className}__subtitle`]"
        >
          <template v-if="isOutgoingTransaction">
            <v-icon v-if="transaction.isReply && isConfirmed" icon="mdi-arrow-left-top" size="15" />
            <v-icon v-else :icon="statusIcon" size="15" />
          </template>

          {{ lastMessageTextNoFormats }}
        </v-list-item-subtitle>
      </template>
    </div>
  </v-list-item>
</template>

<script>
import { removeFormats } from '@/lib/markdown'

import transaction from '@/mixins/transaction'
import formatDate from '@/filters/dateBrief'
import ChatAvatar from '@/components/Chat/ChatAvatar.vue'
import Icon from '@/components/icons/BaseIcon.vue'
import AdmFillIcon from '@/components/icons/AdmFill.vue'
import partnerName from '@/mixins/partnerName'
import { tsIcon, TransactionStatus as TS } from '@/lib/constants'
import { isStringEqualCI } from '@/lib/textHelpers'

import currency from '@/filters/currencyAmountWithSymbol'
import { isAdamantChat, isWelcomeChat } from '@/lib/chat/meta/utils'

export default {
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
    isMessageReadonly: {
      type: Boolean,
      default: false
    },
    /**
     * Must be defined if is an ADAMANT chat
     */
    adamantChatMeta: {
      type: Object,
      default: null
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
  emits: ['click'],
  data: () => ({}),
  computed: {
    className: () => 'chat-brief',
    contactName() {
      return this.getPartnerName(this.contactId) || this.contactId
    },

    isTransferType() {
      return this.transaction.type !== 'message' && this.transaction.type !== 'reaction'
    },
    isReaction() {
      return this.transaction.type === 'reaction'
    },
    reactedText() {
      const reaction = this.transaction.asset.react_message
      const isRemoveReaction = !reaction

      if (isRemoveReaction) {
        const label = this.isOutgoingTransaction
          ? `${this.$t('chats.you')}: ${this.$t('chats.you_removed_reaction')}`
          : this.$t('chats.partner_removed_reaction')

        return label
      } else {
        const label = this.isOutgoingTransaction
          ? `${this.$t('chats.you')}: ${this.$t('chats.you_reacted')}`
          : this.$t('chats.partner_reacted')

        return `${label} ${reaction}`
      }
    },
    isNewChat() {
      return !this.transaction.type
    },

    lastMessage() {
      return this.transaction
    },
    isMessageI18n() {
      return this.transaction.i18n
    },
    lastMessageText() {
      return this.transaction.message || ''
    },
    lastMessageTextLocalized() {
      return this.isMessageI18n ? this.$t(this.lastMessageText) : this.lastMessageText
    },
    lastMessageTextNoFormats() {
      if (this.isAdamantChat(this.contactId) || this.$store.state.options.formatMessages) {
        return removeFormats(this.lastMessageTextLocalized)
      }

      return this.lastMessageTextLocalized
    },
    transactionDirection() {
      const direction = isStringEqualCI(this.userId, this.transaction.senderId)
        ? this.$t('chats.sent_label')
        : this.$t('chats.received_label')

      return direction
    },
    isIncomingTransaction() {
      return !isStringEqualCI(this.userId, this.transaction.senderId)
    },
    isOutgoingTransaction() {
      return !this.isIncomingTransaction
    },
    numOfNewMessages() {
      return this.$store.getters['chat/numOfNewMessages'](this.contactId)
    },
    createdAt() {
      return this.transaction.timestamp
    },
    status() {
      return this.getTransactionStatus(this.transaction)
    },
    statusIcon() {
      return tsIcon(this.status.virtualStatus)
    },
    isConfirmed() {
      return this.status.virtualStatus === TS.CONFIRMED
    }
  },
  watch: {
    // fetch status when new message received
    transaction() {
      this.fetchTransactionStatus(this.transaction, this.contactId)
    }
  },
  mounted() {
    // fetch status if transaction is transfer
    if (this.isTransferType) {
      this.fetchTransactionStatus(this.transaction, this.contactId)
    }
  },
  methods: {
    formatDate,
    currency,
    isAdamantChat,
    isWelcomeChat
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/themes/adamant/_mixins.scss';
@import '@/assets/styles/settings/_colors.scss';

@keyframes movement {
  from {
    left: -50px;
  }
  to {
    left: 50px;
  }
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

  &__chat-avatar {
    margin-right: 16px;
  }

  &__icon {
    width: 40px;
    height: 40px;
    margin-right: 16px;
  }

  &__heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    line-height: 24px;
    margin-bottom: 0;
  }

  &__subtitle {
    line-height: 1.5;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__date {
    @include a-text-explanation-small();
    margin-left: 16px;
    white-space: nowrap;
  }

  &__badge {
    :deep(.v-badge__badge) {
      left: calc(100% - 12px - 16px) !important;
      font-size: 14px;
      width: 22px;
      height: 22px;
    }
  }

  :deep(.v-list-item-subtitle) {
    @include a-text-explanation-enlarged-bold();
  }
}

/** Themes **/
.v-theme--light {
  .chat-brief {
    border-bottom: 1px solid map-get($adm-colors, 'secondary2');

    &__date {
      color: map-get($adm-colors, 'muted');
    }

    &__icon {
      fill: #bdbdbd;
    }

    :deep(.v-list-item-subtitle) {
      color: map-get($adm-colors, 'muted');
    }
  }
}
.v-theme--dark {
  .chat-brief {
    :deep(.v-list-item-subtitle) {
      color: map-get($adm-colors, 'grey-transparent');
    }
  }
}
</style>
