<template>
  <div :class="className">
    <v-list-item avatar :class="`${className}__tile`" @click="onClickTransaction">
      <template #prepend>
        <v-icon
          :class="`${className}__prepend-icon ${directionClass}`"
          :icon="isStringEqualCI(senderId, userId) ? mdiAirplaneTakeoff : mdiAirplaneLanding"
          size="small"
        />
      </template>

      <v-list-item-title v-if="partnerName">
        <span class="a-text-regular-enlarged">{{ partnerName }}</span>
        <span class="a-text-explanation-enlarged"> ({{ partnerId }})</span>
      </v-list-item-title>
      <v-list-item-title v-else>
        <span class="a-text-regular-enlarged">{{ partnerId }}</span>
      </v-list-item-title>

      <v-list-item-title>
        <span :class="`${className}__amount ${directionClass}`">{{
          currency(amount, crypto)
        }}</span>
        <span :class="`${className}__rates`">{{ historyRate }}</span>
        <span
          v-if="comment"
          :class="`${className}__note-prefix ${className}__note-prefix--comment a-text-regular-enlarged-bold`"
        >
          "</span
        >
        <span v-if="comment" :class="`${className}__note-text a-text-explanation`">{{
          comment
        }}</span>
        <span
          v-if="textData"
          :class="`${className}__note-prefix ${className}__note-prefix--text-data a-text-regular-enlarged-bold`"
        >
          #</span
        >
        <span v-if="textData" :class="`${className}__note-text a-text-explanation`">{{
          textData
        }}</span>
      </v-list-item-title>

      <v-list-item-subtitle :class="`${className}__date`" class="a-text-explanation-small">
        <span v-if="!isStatusVisibleTransaction">{{ formatDate(createdAt) }}</span>
        <span v-else-if="status" :class="`${className}__status ${className}__status--${status}`">{{
          $t(`transaction.statuses.${status}`)
        }}</span>
      </v-list-item-subtitle>

      <template #append>
        <v-list-item-action v-if="isClickIcon" :class="`${className}__action`" end>
          <v-btn icon ripple variant="plain" @click.stop="onClickIcon">
            <v-icon
              :class="`${className}__icon`"
              :icon="isPartnerInChatList ? mdiMessageText : mdiMessageOutline"
              size="small"
            />
          </v-btn>
        </v-list-item-action>
      </template>
    </v-list-item>

    <v-divider :inset="true" class="a-divider" />
  </div>
</template>

<script>
import formatDate from '@/filters/date'
import { EPOCH, Cryptos, TransactionStatus } from '@/lib/constants'
import partnerName from '@/mixins/partnerName'
import { isStringEqualCI } from '@/lib/textHelpers'
import currencyAmount from '@/filters/currencyAmount'
import { timestampInSec } from '@/filters/helpers'
import currency from '@/filters/currencyAmountWithSymbol'
import { mdiAirplaneLanding, mdiAirplaneTakeoff, mdiMessageOutline, mdiMessageText } from '@mdi/js'

export default {
  mixins: [partnerName],
  props: {
    id: {
      type: String,
      required: true
    },
    // Crypto address, like 1F9bMGsui6GbcFaGSNao5YcjnEk38eXXg7 or U3716604363012166999
    senderId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    recipientId: {
      type: String,
      required: true
    },
    textData: {
      type: String,
      required: false
    },
    timestamp: {
      type: Number,
      required: true
    },
    amount: {
      type: [Number, String],
      required: true
    },
    crypto: {
      type: String,
      default: 'ADM',
      validator: (v) => v in Cryptos
    }
  },
  emits: ['click:transaction', 'click:icon'],
  setup() {
    return {
      mdiAirplaneLanding,
      mdiAirplaneTakeoff,
      mdiMessageOutline,
      mdiMessageText
    }
  },
  data: () => ({
    virtualTimestamp: Date.now()
  }),
  computed: {
    // Own crypto address, like 1F9bMGsui6GbcFaGSNao5YcjnEk38eXXg7 or U3716604363012166999
    userId() {
      if (this.crypto === Cryptos.ADM) {
        return this.$store.state.address
      } else {
        const cryptoModule = this.crypto.toLowerCase()
        return this.$store.state[cryptoModule].address
      }
    },
    // Crypto address, like 1F9bMGsui6GbcFaGSNao5YcjnEk38eXXg7 or U3716604363012166999
    partnerId() {
      return isStringEqualCI(this.senderId, this.userId) ? this.recipientId : this.senderId
    },
    // Partner's ADM address, if found. Else, returns 'undefined'
    partnerAdmId() {
      const admTx = this.getAdmTx
      return isStringEqualCI(admTx.senderId, this.$store.state.address)
        ? admTx.recipientId
        : admTx.senderId
    },
    // Partner's name from KVS, if partnerAdmId found
    partnerName() {
      if (isStringEqualCI(this.partnerId, this.userId)) {
        return this.$t('transaction.me')
      }
      const name = this.getPartnerName(this.partnerAdmId) || ''
      if (this.isCryptoADM()) {
        return name
      } else {
        return name || this.partnerAdmId || ''
      }
    },
    createdAt() {
      if (this.crypto === 'ADM') {
        return this.timestamp * 1000 + EPOCH
      }
      return this.timestamp
    },
    isPartnerInChatList() {
      return this.$store.getters['chat/isPartnerInChatList'](this.partnerAdmId)
    },
    className() {
      return 'transaction-item'
    },
    isClickIcon() {
      const hasPartnerAddress = this.partnerAdmId && this.partnerAdmId !== undefined
      return this.isCryptoADM() || hasPartnerAddress
    },
    getAdmTx() {
      return this.admTx()
    },
    directionClass() {
      if (
        isStringEqualCI(this.senderId, this.userId) &&
        isStringEqualCI(this.recipientId, this.userId)
      ) {
        return `${this.className}__amount--is-itself`
      } else if (isStringEqualCI(this.senderId, this.userId)) {
        return `${this.className}__amount--is-outgoing`
      } else {
        return `${this.className}__amount--is-incoming`
      }
    },
    comment() {
      const admTx = this.getAdmTx
      return admTx.message
    },
    historyRate() {
      const amount = currencyAmount(this.amount, this.crypto)
      return (
        '~' +
        this.$store.getters['rate/historyRate'](
          timestampInSec(this.crypto, this.timestamp || this.virtualTimestamp),
          amount,
          this.crypto
        )
      )
    },
    isStatusVisibleTransaction() {
      return (
        this.status === TransactionStatus.PENDING ||
        this.status === TransactionStatus.REGISTERED ||
        this.status === TransactionStatus.REJECTED
      )
    }
  },
  mounted() {
    this.getHistoryRates()
  },
  methods: {
    isStringEqualCI(string1, string2) {
      return isStringEqualCI(string1, string2)
    },
    isCryptoADM() {
      return this.crypto === Cryptos.ADM
    },
    onClickTransaction() {
      this.$emit('click:transaction', this.id)
    },
    onClickIcon() {
      this.$emit('click:icon', this.partnerAdmId)
    },
    admTx() {
      // Note: because to Chatrooms API, we store only fetched messages, not all of them
      // So, we'll search through only stored messages

      if (this.isCryptoADM()) {
        const chatWithPartner = this.$store.state.chat.chats[this.partnerId]
        const msg =
          chatWithPartner && chatWithPartner.messages
            ? chatWithPartner.messages.find((message) => message.id === this.id)
            : undefined
        return (
          // this.$store.getters['chat/partnerMessageById'](this.partnerId, this.id) || // unable to use getter, as it causes "You may have an infinite update loop in a component render function"
          msg || // first, try to get message with comment
          this.$store.state.adm.transactions[this.id] || // next, try to get direct transaction
          {} // finally, return empty object
        )
      }

      // If crytpo is not ADM: we have to scan all the messages
      const admTx = {}
      Object.values(this.$store.state.chat.chats).some((chat) => {
        Object.values(chat.messages).some((msg) => {
          if (msg.hash && msg.hash === this.id) {
            Object.assign(admTx, msg)
          }
          return !!admTx.id
        })
        return !!admTx.id
      })
      return admTx
    },
    getHistoryRates() {
      this.$store.dispatch('rate/getHistoryRates', {
        timestamp: timestampInSec(this.crypto, this.timestamp || this.virtualTimestamp)
      })
    },
    currency,
    formatDate
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';

.transaction-item {
  --a-transaction-item-rates-gap: var(--a-space-1);
  --a-transaction-item-subtitle-margin-top: var(--a-space-1);
  --a-transaction-item-prepend-gap: var(--a-space-4);
  --a-transaction-item-prepend-top: var(--a-space-2);
  --a-transaction-item-divider-inset: var(--toolbar-height);
  --a-transaction-item-action-width: var(--a-control-size-sm);
  --a-transaction-item-padding-inline: var(--a-screen-padding-inline);
  --a-transaction-item-note-weight: 100;
  --a-transaction-item-note-prefix-style: var(--a-font-style-emphasis);
  --a-transaction-item-rates-color-dark: var(--a-color-text-muted-dark);
  --a-transaction-item-rates-style: var(--a-font-style-emphasis);

  &__rates {
    color: var(--a-transaction-item-rates-color-dark);
    font-style: var(--a-transaction-item-rates-style);
    @include mixins.a-text-regular();
    margin-left: var(--a-transaction-item-rates-gap);
  }
  &__amount {
    @include mixins.a-text-regular-enlarged-bold();
  }
  &__date {
    margin-top: var(--a-transaction-item-subtitle-margin-top);
  }
  &__prepend-icon {
    margin-inline-end: var(--a-transaction-item-prepend-gap);
    margin-top: var(--a-transaction-item-prepend-top);
  }
  :deep(.v-divider--inset:not(.v-divider--vertical)) {
    margin-left: var(--a-transaction-item-divider-inset);
    max-width: calc(100% - var(--a-transaction-item-divider-inset));
  }
  &__action {
    min-width: var(--a-transaction-item-action-width);
  }
  &__note-prefix {
    font-style: var(--a-transaction-item-note-prefix-style);
  }
  &__note-text {
    font-weight: var(--a-transaction-item-note-weight);
  }
  &__status {
    color: map.get(colors.$adm-colors, 'attention');

    &--REJECTED {
      color: map.get(colors.$adm-colors, 'danger');
    }
  }
  // Do not break computed length of v-divider
  /*&__tile*/
  /*:deep(.v-list__tile)*/
  /*padding: 0 12px*/

  &__tile {
    padding-inline: var(--a-transaction-item-padding-inline);
  }
}

/** Themes **/
.v-theme--light.v-list {
  .transaction-item {
    &__amount,
    &__prependIcon {
      color: map.get(colors.$adm-colors, 'regular');
      &--is-incoming {
        color: map.get(colors.$adm-colors, 'good');
      }
      &--is-outgoing {
        color: map.get(colors.$adm-colors, 'danger');
      }
    }
    &__rates {
      color: map.get(colors.$adm-colors, 'muted');
      &--is-incoming {
        color: map.get(colors.$adm-colors, 'good');
      }
      &--is-outgoing {
        color: map.get(colors.$adm-colors, 'danger');
      }
    }
    &__icon {
      color: map.get(colors.$adm-colors, 'muted');
    }
  }
}
.v-theme--dark.v-list {
  .transaction-item {
    &__amount,
    &__prependIcon {
      color: map.get(colors.$adm-colors, 'grey-transparent');
      &--is-incoming {
        color: map.get(colors.$adm-colors, 'good');
      }
      &--is-outgoing {
        color: map.get(colors.$adm-colors, 'danger');
      }
    }
  }
}
</style>
