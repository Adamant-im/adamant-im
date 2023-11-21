<template>
  <v-menu :model-value="open" @update:model-value="toggleMenu" :close-on-content-click="false" transition="slide-y-reverse-transition">
    <template #activator="{ props }">
      <v-icon class="chat-emojis__icon" icon="mdi-emoticon-outline" size="28" v-bind="props" />
    </template>

    <emoji-picker @emoji:select="getEmoji"></emoji-picker>
  </v-menu>
</template>
<script>
import emojiPicker from '@/components/EmojiPicker.vue'
export default {
  props: {
    open: {
      type: Boolean,
      required: true,
    }
  },
  emits: ['onChange'],
  methods: {
    getEmoji(emoji) {
      this.$emit('get-emoji-picture', emoji)
    },
    toggleMenu(state) {
      this.$emit('onChange', state)
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
