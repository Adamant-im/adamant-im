<template>
  <v-list-tile
    class="chat-preview"
    @click="$emit('click')"
  >
    <v-list-tile-avatar>
      <v-icon class="chat-preview__icon" v-if="readOnly">
        {{ 'mdi-ethereum' }}
      </v-icon>
      <canvas :height="identiconSize" :ref="identiconRef" :width="identiconSize" v-else>
        Canvas API is not supported
      </canvas>
      <v-badge overlap color="primary">
        <span v-if="numOfNewMessages" slot="badge">{{ numOfNewMessages }}</span>
      </v-badge>
    </v-list-tile-avatar>

    <v-list-tile-content>
      <v-list-tile-title>{{ partnerName }}</v-list-tile-title>
      <v-list-tile-sub-title
        v-if="readOnly"
        v-text="isMessageI18n ? $t(lastMessageText) : lastMessageText"
      />
      <v-list-tile-sub-title v-else>{{ lastMessageText }}</v-list-tile-sub-title>
    </v-list-tile-content>

    <v-list-tile-action class="chat-preview__date">
      {{ createdAt }}
    </v-list-tile-action>
  </v-list-tile>
</template>

<script>
import { getPublicKey } from '@/lib/adamant-api'
import Identicon from '@/lib/identicon'

export default {
  mounted () {
    if (!this.readOnly) {
      const el = this.$refs[this.identiconRef]
      const identicon = new Identicon()

      getPublicKey(this.partnerId).then(key => {
        identicon.avatar(el, key, this.identiconSize)
      })
    }
  },
  computed: {
    partnerName () {
      return this.$store.getters['partners/displayName'](this.partnerId) || this.partnerId
    },
    lastMessage () {
      return this.$store.getters['chat/lastMessage'](this.partnerId)
    },
    isMessageI18n () {
      return (this.lastMessage.i18n)
    },
    lastMessageText () {
      return this.$store.getters['chat/lastMessageText'](this.partnerId)
    },
    lastMessageTimestamp () {
      return this.$store.getters['chat/lastMessageTimestamp'](this.partnerId)
    },
    numOfNewMessages () {
      return this.$store.getters['chat/numOfNewMessages'](this.partnerId)
    },
    createdAt () {
      return this.$formatDate(this.lastMessageTimestamp)
    },
    identiconRef () {
      return 'identicon_' + this.partnerId
    }
  },
  data () {
    return {
      identiconSize: 40
    }
  },
  props: {
    partnerId: {
      type: String,
      required: true
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'

.chat-preview
  &__date
    font-size: 8px
    color: #616161
  &__icon
    color: $shades.white

/** Themes **/
.theme--light
  .chat-preview__icon
    background-color: $grey.lighten-1

.theme--dark
  .chat-preview__icon
    background-color: $grey.darken-1
</style>
