<template>
  <v-menu
    :model-value="open"
    :eager="true"
    @update:model-value="toggleMenu"
    :close-on-content-click="false"
    transition="slide-y-reverse-transition"
  >
    <template #activator="{ props }">
      <v-icon class="chat-emojis__icon" icon="mdi-emoticon-outline" size="28" v-bind="props" />
    </template>

    <emoji-picker @emoji:select="getEmoji" :elevation="true"></emoji-picker>
  </v-menu>
</template>
<script>
import EmojiPicker from '@/components/EmojiPicker.vue'
export default {
  props: {
    open: {
      type: Boolean,
      required: true
    }
  },
  emits: ['onChange', 'get-emoji-picture'],
  methods: {
    getEmoji(emoji) {
      this.$emit('get-emoji-picture', emoji)
    },
    toggleMenu(state) {
      this.$emit('onChange', state)
    }
  },
  components: {
    EmojiPicker
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
