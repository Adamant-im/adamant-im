<template>
  <div :class="className">
    <v-list-tile avatar @click="onClickTransaction">
      <v-list-tile-avatar>
        <v-icon>{{ senderId === userId ? 'mdi-airplane-takeoff' : 'mdi-airplane-landing' }}</v-icon>
      </v-list-tile-avatar>

      <v-list-tile-content>
        <v-list-tile-title v-if="partnerName">
          <span :class="`${className}__head-title`">{{ partnerName }}</span>
          <span :class="`${className}__head-subtitle`" class="body-1"> ({{ partnerId }})</span>
        </v-list-tile-title>
        <v-list-tile-title v-else>
          <span :class="`${className}__head-title`">{{ partnerId }}</span>
        </v-list-tile-title>

        <v-list-tile-sub-title :class="`${className}__title`">
          {{ amount | currency(crypto) }}
        </v-list-tile-sub-title>

        <v-list-tile-sub-title :class="`${className}__subtitle`">
          {{ createdAt | date }}
        </v-list-tile-sub-title>
      </v-list-tile-content>

      <v-list-tile-action>
        <v-btn icon ripple @click.stop="onClickIcon">
          <v-icon color="grey darken-2">
            {{ isPartnerInChatList ? 'mdi-message-text' : 'mdi-message-outline' }}
          </v-icon>
        </v-btn>
      </v-list-tile-action>
    </v-list-tile>

    <v-divider :inset="true"></v-divider>
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
@import '~vuetify/src/stylus/settings/_colors.styl'

/** Themes **/
.theme--light.v-list
  .transaction-item
    &__head-title
      color: $grey.darken-3
    &__head-subtitle
      color: $grey.darken-1
    &__title
      color: $grey.darken-4
    &__subtitle
      color: $grey.darken-1
</style>
