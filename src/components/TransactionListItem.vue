<template>
  <div :class="className">
    <v-list-tile
      @click="onClickTransaction"
      avatar
      :class="`${className}__tile`"
    >
      <v-list-tile-avatar>
        <v-icon :class="`${className}__icon`">
          {{ senderId === userId ? 'mdi-airplane-takeoff' : 'mdi-airplane-landing' }}
        </v-icon>
      </v-list-tile-avatar>

      <v-list-tile-content>
        <v-list-tile-title v-if="partnerName">
          <span :class="`${className}__head-title`">{{ partnerName }}</span>
          <span :class="`${className}__head-subtitle`"> ({{ partnerId }})</span>
        </v-list-tile-title>
        <v-list-tile-title v-else>
          <span :class="`${className}__head-title`">{{ partnerId }}</span>
        </v-list-tile-title>

        <v-list-tile-sub-title :class="`${className}__title`">
          {{ amount | currency(crypto) }}
        </v-list-tile-sub-title>

        <v-list-tile-sub-title :class="`${className}__date`">
          {{ createdAt | date }}
        </v-list-tile-sub-title>
      </v-list-tile-content>

      <v-list-tile-action v-if="isCryptoADM">
        <v-btn icon ripple @click.stop="onClickIcon">
          <v-icon :class="`${className}__icon`">
            {{ isPartnerInChatList ? 'mdi-message-text' : 'mdi-message-outline' }}
          </v-icon>
        </v-btn>
      </v-list-tile-action>
    </v-list-tile>

    <v-divider :inset="true" :class="`${className}__divider`"></v-divider>
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

.transaction-item
  &__head-title
    font-weight: 300
  &__head-subtitle
    font-weight: 300
    font-size: 14px
  &__title
    font-weight: 400
    font-size: 16px
  &__date
    font-weight: 300
    font-size: 12px
  &__tile
    >>> .v-list__tile
      padding: 0 12px

/** Themes **/
.theme--light.v-list
  .transaction-item
    &__head-title
      color: $adm-colors.regular
    &__head-subtitle
      color: $adm-colors.muted
    &__title
      color: $adm-colors.regular
    &__date
      color: $adm-colors.muted
    &__subtitle
      color: $adm-colors.muted
    &__icon
      color: $adm-colors.muted
    &__divider
      border-color: $adm-colors.secondary2
</style>
