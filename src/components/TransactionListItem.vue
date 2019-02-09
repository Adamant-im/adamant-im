<template>
  <v-list-tile avatar @click="onClickTransaction">
    <v-list-tile-avatar>
      <v-icon>{{ senderId === userId ? 'mdi-airplane-takeoff' : 'mdi-airplane-landing' }}</v-icon>
    </v-list-tile-avatar>

    <v-list-tile-content>
      <v-list-tile-title v-if="partnerName">
        {{ partnerName }}
        <span class="body-1 grey--text text--darken-1">({{ partnerId }})</span>
      </v-list-tile-title>
      <v-list-tile-title v-else>
        {{ partnerId }}
      </v-list-tile-title>
      <v-list-tile-sub-title>
        <v-layout>
          {{ amountFormatted }} {{ crypto }}
          <v-spacer/>
          {{ createdAt | date }}
        </v-layout>
      </v-list-tile-sub-title>
    </v-list-tile-content>

    <v-list-tile-action v-if="isPartnerInChatList">
      <v-btn icon ripple @click.stop="onClickIcon">
        <v-icon color="grey darken-2">
          mdi-comment
        </v-icon>
      </v-btn>
    </v-list-tile-action>
  </v-list-tile>
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
      return this.$store.getters['contacts/contactName'](this.partnerId) || ''
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
    amountFormatted () {
      return this.$formatAmount(this.amount, this.crypto)
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
