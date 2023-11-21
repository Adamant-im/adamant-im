<template>
  <div>
    <v-menu :close-on-content-click="false">
      <template v-slot:activator="{ props }">
        <v-icon class="chat-emojis__icon" icon="mdi-emoticon-outline" size="28" v-bind="props" />
      </template>

      <emoji-picker @emoji:select="getEmoji"></emoji-picker>
    </v-menu>
  </div>
</template>
<script>
import emojiPicker from '@/components/EmojiPicker.vue'
export default {
  methods: {
    getEmoji(emoji) {
      this.$emit('get-emoji-picture', emoji)
    }
  },
  components: {
    emojiPicker
  }
}
</script>
<style lang="scss" scoped>
@import 'vuetify/settings';

/** Themes **/
.v-theme--light {
  .chat-emojis {
    &__icon {
      color: map-get($grey, 'darken-1');
    }
  }
}
.v-theme--dark {
  .chat-emojis {
    &__icon {
      color: map-get($shades, 'white');
    }
  }
}
</style>
