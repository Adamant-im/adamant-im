<template>
  <v-list-item
    v-if="isLoadingSeparator"
  >
    <v-list-item-content
      style="align-items: center"
    >
      <v-icon
        ref="loadingDots"
        :class="{ kmove: isLoadingSeparatorActive }"
      >
        mdi-dots-horizontal
      </v-icon>
    </v-list-item-content>
  </v-list-item>
  <v-list-item
    v-else
    :class="className"
    @click="$emit('click')"
  >
    <v-list-item-avatar>
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
        v-if="numOfNewMessages > 0"
        overlap
        color="primary"
        :content="numOfNewMessages > 99 ? '99+' : numOfNewMessages"
      />
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title
        :class="{
          'a-text-regular-enlarged-bold': true,
          [`${className}__title`]: true
        }"
        v-text="isAdamantChat ? $t(contactName) : contactName"
      />

      <!-- New chat (no messages yet) -->
      <template v-if="isNewChat">
        <v-list-item-subtitle>&nbsp;</v-list-item-subtitle>
      </template>

      <!-- Transaction -->
      <template v-else-if="isTransferType">
        <v-list-item-subtitle
          :class="{
            [`${className}__subtitle`]: true
          }"
        >
          <v-icon
            v-if="!isIncomingTransaction"
            size="15"
          >
            {{ statusIcon }}
          </v-icon>
          {{ transactionDirection }} {{ currency(transaction.amount, transaction.type) }}
          <v-icon
            v-if="isIncomingTransaction"
            size="15"
          >
            {{ statusIcon }}
          </v-icon>
        </v-list-item-subtitle>
      </template>

      <!-- Message -->
      <template v-else>
        <v-list-item-subtitle
          :class="{
            'a-text-explanation-enlarged-bold': true,
            [`${className}__subtitle`]: true
          }"
        >
          <v-icon
            v-if="!isIncomingTransaction"
            size="15"
          >
            {{ statusIcon }}
          </v-icon>
          {{ lastMessageTextNoFormats }}
        </v-list-item-subtitle>
      </template>
    </v-list-item-content>

    <div
      v-if="!isMessageReadonly"
      :class="`${className}__date`"
    >
      {{ formatDate(createdAt) }}
    </div>
  </v-list-item>
</template>

<script>
import { removeFormats } from '@/lib/markdown'

import transaction from '@/mixins/transaction'
import formatDate from '@/filters/dateBrief'
import ChatAvatar from '@/components/Chat/ChatAvatar'
import Icon from '@/components/icons/BaseIcon'
import AdmFillIcon from '@/components/icons/AdmFill'
import partnerName from '@/mixins/partnerName'
import { tsIcon } from '@/lib/constants'
import { isStringEqualCI } from '@/lib/textHelpers'

import currency from '@/filters/currencyAmountWithSymbol'

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
  },
  methods: {
    formatDate,
    currency
  },
  emits: ['click']
}
</script>

<style lang="scss" scoped>
@import '../assets/styles/themes/adamant/_mixins.scss';
@import '../assets/styles/settings/_colors.scss';

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

  &__title {
    line-height: 24px;
    margin-bottom: 0;
  }

  &__subtitle {
    line-height: 1.5;
  }

  &__date {
    @include a-text-explanation-small();
    position: absolute;
    top: 16px;
    right: 16px;
  }

  :deep(.v-list__tile__sub-title)  {
    @include a-text-explanation-enlarged-bold();
  }

  :deep(.v-avatar.v-list-item__avatar) {
    overflow: visible;
  }
}

/** Themes **/
.theme--light {
  .chat-brief {
    border-bottom: 1px solid map-get($adm-colors, 'secondary2');

    &__date {
      color: map-get($adm-colors, 'muted');
    }

    &__icon {
      fill: #BDBDBD;
    }

    :deep(.v-list__tile__sub-title)  {
      color: map-get($adm-colors, 'muted');
    }
  }
}
</style>
