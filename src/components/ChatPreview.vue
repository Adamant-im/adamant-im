<template>
  <v-list-tile
    class="chat-preview"
    @click="$emit('click')"
  >
    <v-list-tile-avatar>
      <v-icon class="grey lighten-1 white--text">
        {{ readOnly ? 'mdi-ethereum' : 'mdi-message-text' }}
      </v-icon>
      <v-badge overlap color="primary">
        <span v-if="numOfNewMessages" slot="badge">{{ numOfNewMessages }}</span>
      </v-badge>
    </v-list-tile-avatar>

    <v-list-tile-content>
      <v-list-tile-title>{{ partnerName }}</v-list-tile-title>
      <v-list-tile-sub-title>{{ lastMessageText }}</v-list-tile-sub-title>
    </v-list-tile-content>

    <v-list-tile-action class="chat-preview__date">
      {{ createdAt }}
    </v-list-tile-action>
  </v-list-tile>
</template>

<script>
export default {
  computed: {
    partnerName () {
      return this.$store.getters['partners/displayName'](this.partnerId) || this.partnerId
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

<style>
.chat-preview {
}
.chat-preview__date {
  font-size: 8px;
  color: #616161;
}
</style>
