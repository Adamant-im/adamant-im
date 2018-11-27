<template>
  <v-list-tile
    class="chat-preview"
    @click="$emit('click')"
  >
    <v-list-tile-avatar>
      <v-icon class="grey lighten-1 white--text">
        {{ readOnly ? 'mdi-ethereum' : 'mdi-message-text' }}
      </v-icon>
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
export default {
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
      type: Boolean,
      default: false
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
