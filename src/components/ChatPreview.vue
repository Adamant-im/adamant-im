<template>
  <v-list-tile
    class="chat-preview"
    @click="$emit('click')"
  >
    <v-list-tile-avatar>
      <v-icon class="grey lighten-1 white--text" v-if="readOnly">
        {{ 'mdi-ethereum' }}
      </v-icon>
      <canvas :height="identiconSize" :ref="identiconRef" :width="identiconSize" v-else>
        Canvas API is not supported
      </canvas>
      <v-badge overlap color="primary">
        <span v-if="newMessages" slot="badge">{{ newMessages }}</span>
      </v-badge>
    </v-list-tile-avatar>

    <v-list-tile-content>
      <v-list-tile-title>{{ chatName }}</v-list-tile-title>
      <v-list-tile-sub-title>{{ lastMessage }}</v-list-tile-sub-title>
    </v-list-tile-content>

    <v-list-tile-action class="chat-preview__date">
      {{ createdAt }}
    </v-list-tile-action>
  </v-list-tile>
</template>

<script>
// import adamant from '@/lib/adamant'
import { getPublicKey } from '@/lib/adamant-api'
import Identicon from '@/lib/identicon'

export default {
  computed: {
    identiconRef () {
      return 'identicon_' + this.chatName
    }
  },
  data () {
    return {
      identiconSize: 40
    }
  },
  props: {
    icon: {
      type: String,
      default: 'mdi-message-text'
    },
    chatName: {
      type: String,
      default: ''
    },
    lastMessage: {
      type: String,
      default: ''
    },
    newMessages: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: String,
      default: ''
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    userId: {
      type: String,
      default: ''
    }
  },
  mounted () {
    if (!this.readOnly) {
      const el = this.$refs[this.identiconRef]
      const identicon = new Identicon()
      // const hash = adamant.createPassPhraseHash(this.$store.getters.getPassPhrase)
      // const publicKey = adamant.makeKeypair(hash).publicKey
      getPublicKey(this.chatName).then(key => {
        identicon.avatar(el, key, this.identiconSize)
      })
    }
  }
}
</script>

<style>
.chat-preview {
}
.chat-preview__date {
  font-size: 8px;
  color: #616161;
}
</style>
