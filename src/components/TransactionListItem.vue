<template>
  <div :class="className">
    <v-list-tile
      avatar
      :class="`${className}__tile`"
      @click="onClickTransaction"
    >
      <v-list-tile-avatar
        :class="`${className}__icon-avatar`"
        :size="40"
      >
        <v-icon
          :class="`${className}__icon`"
          :size="20"
        >
          {{ isStringEqualCI(senderId, userId) ? 'mdi-airplane-takeoff' : 'mdi-airplane-landing' }}
        </v-icon>
      </v-list-tile-avatar>

      <v-list-tile-content>
        <v-list-tile-title v-if="partnerName">
          <span class="a-text-regular-enlarged">{{ partnerName }}</span>
          <span class="a-text-explanation-enlarged"> ({{ partnerId }})</span>
        </v-list-tile-title>
        <v-list-tile-title v-else>
          <span class="a-text-regular-enlarged">{{ partnerId }}</span>
        </v-list-tile-title>

        <v-list-tile-title>
          <span :class="`${className}__amount ${directionClass}`">{{ amount | currency(crypto) }}</span>
          <span
            v-if="comment"
            class="a-text-regular-enlarged-bold"
            style="font-style: italic;"
          > "</span>
          <span
            v-if="comment"
            class="a-text-explanation"
            style="font-weight: 100;"
          >{{ comment }}</span>
        </v-list-tile-title>

        <v-list-tile-sub-title
          :class="`${className}__date`"
          class="a-text-explanation-small"
        >
          {{ createdAt | date }}
        </v-list-tile-sub-title>
      </v-list-tile-content>

      <v-list-tile-action
        v-if="isClickIcon"
        :class="`${className}__action`"
      >
        <v-btn
          icon
          ripple
          @click.stop="onClickIcon"
        >
          <v-icon
            :class="`${className}__icon`"
            :size="20"
          >
            {{ isPartnerInChatList ? 'mdi-message-text' : 'mdi-message-outline' }}
          </v-icon>
        </v-btn>
      </v-list-tile-action>
    </v-list-tile>

    <v-divider
      :inset="true"
      class="a-divider"
    />
  </div>
</template>

<script>
import dateFilter from '@/filters/date'
import { EPOCH, Cryptos } from '@/lib/constants'
import partnerName from '@/mixins/partnerName'
import { isStringEqualCI } from '@/lib/textHelpers'

export default {
  filters: {
    date: dateFilter
  },
  mixins: [partnerName],
  props: {
    id: {
      type: String,
      required: true
    },
    senderId: {
      type: String,
      required: true
    },
    recipientId: {
      type: String,
      required: true
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
      validator: v => v in Cryptos
    }
  },
  computed: {
    userId () {
      if (this.crypto === Cryptos.ADM) {
        return this.$store.state.address
      } else {
        const cryptoModule = this.crypto.toLowerCase()

        return this.$store.state[cryptoModule].address
      }
    },
    partnerId () {
      return isStringEqualCI(this.senderId, this.userId)
        ? this.recipientId
        : this.senderId
    },
    partnerAdmId () {
      return isStringEqualCI(this.getAdmTx.senderId, this.$store.state.address)
        ? this.getAdmTx.recipientId
        : this.getAdmTx.senderId
    },
    partnerName () {
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
    createdAt () {
      if (this.crypto === 'ADM') {
        return this.timestamp * 1000 + EPOCH
      }
      return this.timestamp
    },
    isPartnerInChatList () {
      return this.$store.getters['chat/isPartnerInChatList'](this.partnerAdmId)
    },
    className () {
      return 'transaction-item'
    },
    isClickIcon () {
      const hasPartnerAddress = this.partnerAdmId && (this.partnerAdmId !== undefined)
      return this.isCryptoADM() || hasPartnerAddress
    },
    getAdmTx () {
      return this.admTx()
    },
    directionClass () {
      if (isStringEqualCI(this.senderId, this.userId) && isStringEqualCI(this.recipientId, this.userId)) {
        return `${this.className}__amount--is-itself`
      } else if (isStringEqualCI(this.senderId, this.userId)) {
        return `${this.className}__amount--is-outgoing`
      } else {
        return `${this.className}__amount--is-incoming`
      }
    },
    comment () {
      return this.getAdmTx && this.getAdmTx.message ? this.getAdmTx.message : false
    }
  },
  methods: {
    isStringEqualCI (string1, string2) {
      return isStringEqualCI(string1, string2)
    },
    isCryptoADM () {
      return this.crypto === Cryptos.ADM
    },
    onClickTransaction () {
      this.$emit('click:transaction', this.id)
    },
    onClickIcon () {
      this.$emit('click:icon', this.partnerAdmId)
    },
    admTx () {
      if (this.isCryptoADM()) {
        return this.$store.getters['chat/messageById'](this.id) || this.$store.state.adm.transactions[this.id] || { }
      }

      const admTx = {}
      // Bad news, everyone: we'll have to scan the messages
      Object.values(this.$store.state.chat.chats).some(chat => {
        Object.values(chat.messages).some(msg => {
          if (msg.hash && msg.hash === this.id) {
            Object.assign(admTx, msg)
          }
          return !!admTx.id
        })
        return !!admTx.id
      })
      return admTx
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../assets/stylus/settings/_colors.styl'
@import '../assets/stylus/themes/adamant/_mixins.styl'

.transaction-item
  &__amount
    a-text-regular-enlarged-bold()
  &__date
    margin-top: 4px
  &__icon-avatar
      min-width: 40px;
    >>> .v-avatar
      position: relative
      padding-right: 15px;
  >>> .v-divider--inset:not(.v-divider--vertical)
      margin-left: 56px;
      max-width: calc(100% - 56px);
  &__action
    margin-top: -14px;
    min-width: 36px;
  // Do not break computed length of v-divider
  /*&__tile*/
    /*>>> .v-list__tile*/
    /*padding: 0 12px*/

/** Themes **/
.theme--light.v-list
  .transaction-item
    &__amount
      color: $adm-colors.regular

      &--is-incoming
        color: $adm-colors.good
      &--is-outgoing
        color: $adm-colors.danger

    &__icon
      color: $adm-colors.muted

.theme--dark.v-list
  .transaction-item
    &__amount
      color: $adm-colors.regular

      &--is-incoming
        color: $adm-colors.good
      &--is-outgoing
        color: $adm-colors.danger

</style>
