<template>
  <v-list-tile
    class="chat-preview"
    @click="$emit('click')"
  >
    <v-list-tile-avatar>
      <v-icon class="chat-preview__icon">
        {{ readOnly ? 'mdi-ethereum' : 'mdi-message-text' }}
      </v-icon>
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

<style>
.chat-preview {
}
.chat-preview__date {
  font-size: 8px;
  color: #616161;
}
</style>
