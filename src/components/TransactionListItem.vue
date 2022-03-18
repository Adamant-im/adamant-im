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
            :class="`${className}__rates`"
          > ~{{ rate }} {{ currentCurrency }}</span>
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
          <span
            v-if="textData"
            class="a-text-regular-enlarged-bold"
            style="font-style: italic;"
          > #</span>
          <span
            v-if="textData"
            class="a-text-explanation"
            style="font-weight: 100;"
          >{{ textData }}</span>
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
import currencyFilter from '@/filters/currency'

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
    // Crypto address, like 1F9bMGsui6GbcFaGSNao5YcjnEk38eXXg7 or U3716604363012166999
    senderId: {
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
      validator: v => v in Cryptos
    }
  },
  computed: {
    // Own crypto address, like 1F9bMGsui6GbcFaGSNao5YcjnEk38eXXg7 or U3716604363012166999
    userId () {
      if (this.crypto === Cryptos.ADM) {
        return this.$store.state.address
      } else {
        const cryptoModule = this.crypto.toLowerCase()
        return this.$store.state[cryptoModule].address
      }
    },
    // Crypto address, like 1F9bMGsui6GbcFaGSNao5YcjnEk38eXXg7 or U3716604363012166999
    partnerId () {
      return isStringEqualCI(this.senderId, this.userId) ? this.recipientId : this.senderId
    },
    // Partner's ADM address, if found. Else, returns 'undefined'
    partnerAdmId () {
      const admTx = this.getAdmTx
      return isStringEqualCI(admTx.senderId, this.$store.state.address) ? admTx.recipientId : admTx.senderId
    },
    // Partner's name from KVS, if partnerAdmId found
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
      const admTx = this.getAdmTx
      return admTx.message
    },
    currentCurrency: {
      get () {
        return this.$store.state.options.currentRate
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'currentRate',
          value
        })
      }
    },
    rate () {
      const state = this.$store.state.rate.rates
      const currentRate = state[`${this.crypto}/${this.currentCurrency}`]
      // const amount = currencyFilter(this.amount, this.crypto).replace(/[^\d.-]/g, '') * currentRate
      // const rate = currentRate !== undefined ? Number(amount.toFixed(2)) : 0
      const amount = currencyFilter(this.amount, this.crypto).replace(/[^\d.-]/g, '')
      const rate = currentRate !== undefined ? Number((currentRate * amount).toFixed(2)) : 0
      return rate
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
      // Note: because to Chatrooms API, we store only fetched messages, not all of them
      // So, we'll search through only stored messages

      if (this.isCryptoADM()) {
        const chatWithPartner = this.$store.state.chat.chats[this.partnerId]
        const msg = chatWithPartner && chatWithPartner.messages ? chatWithPartner.messages.find(message => message.id === this.id) : undefined
        return (
          // this.$store.getters['chat/partnerMessageById'](this.partnerId, this.id) || // unable to use getter, as it causes "You may have an infinite update loop in a component render function"
          msg || // first, try to get message with comment
          this.$store.state.adm.transactions[this.id] || // next, try to get direct transaction
          { } // finally, return empty object
        )
      }

      // If crytpo is not ADM: we have to scan all the messages
      const admTx = { }
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
  &__rates
   color: hsla(0,0%,100%,.7)
   font-style: italic
   a-text-regular()
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
    &__rates
      color: $adm-colors.muted
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
