<template>
  <div :class="className">
    <v-list-tile
      @click="onClickTransaction"
      avatar
      :class="`${className}__tile`"
    >
      <v-list-tile-avatar :class="`${className}__icon-avatar`" :size="40">
        <v-icon :class="`${className}__icon`" :size="20">
          {{ senderId === userId ? 'mdi-airplane-takeoff' : 'mdi-airplane-landing' }}
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

        <v-list-tile-sub-title :class="`${className}__amount ${directionClass}`">
          {{ amount | currency(crypto) }}
        </v-list-tile-sub-title>

        <v-list-tile-sub-title :class="`${className}__date`" class="a-text-explanation-small">
          {{ createdAt | date }}
        </v-list-tile-sub-title>
      </v-list-tile-content>

      <v-list-tile-action :class="`${className}__action`" v-if="isCryptoADM">
        <v-btn icon ripple @click.stop="onClickIcon">
          <v-icon :class="`${className}__icon`" :size="20">
            {{ isPartnerInChatList ? 'mdi-message-text' : 'mdi-message-outline' }}
          </v-icon>
        </v-btn>
      </v-list-tile-action>
    </v-list-tile>

    <v-divider :inset="true" class="a-divider"></v-divider>
  </div>
</template>

<script>
import dateFilter from '@/filters/date'
import { EPOCH, Cryptos } from '@/lib/constants'

export default {
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
      return this.senderId === this.userId
        ? this.recipientId
        : this.senderId
    },
    partnerName () {
      return this.$store.getters['partners/displayName'](this.partnerId) || ''
    },
    createdAt () {
      if (this.crypto === 'ADM') {
        return this.timestamp * 1000 + EPOCH
      }

      return this.timestamp
    },
    isPartnerInChatList () {
      return this.$store.getters['chat/isPartnerInChatList'](this.partnerId)
    },
    className () {
      return 'transaction-item'
    },
    isCryptoADM () {
      return this.crypto === Cryptos.ADM
    },
    directionClass () {
      if (this.senderId === this.userId && this.recipientId === this.userId) {
        return `${this.className}__amount--is-itself`
      } else if (this.senderId === this.userId) {
        return `${this.className}__amount--is-outgoing`
      } else {
        return `${this.className}__amount--is-incoming`
      }
    }
  },
  methods: {
    onClickTransaction () {
      this.$emit('click:transaction', this.id)
    },
    onClickIcon () {
      this.$emit('click:icon', this.partnerId)
    }
  },
  filters: {
    date: dateFilter
  },
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
</style>
