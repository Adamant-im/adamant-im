<template>
  <v-menu
    :open-on-hover="isDesktop"
    :model-value="open"
    :eager="true"
    location="top"
    @update:model-value="toggleMenu"
    :close-on-content-click="false"
    transition="slide-y-reverse-transition"
  >
    <template #activator="{ props }">
      <v-icon class="chat-emojis__icon" :icon="mdiEmoticonOutline" size="28" v-bind="props" />
    </template>

    <emoji-picker @emoji:select="getEmoji" position="absolute"></emoji-picker>
  </v-menu>
</template>
<script>
import EmojiPicker from '@/components/EmojiPicker.vue'
import { mdiEmoticonOutline } from '@mdi/js'
import { useDisplay } from 'vuetify'

export default {
  props: {
    open: {
      type: Boolean,
      required: true
    }
  },
  emits: ['onChange', 'get-emoji-picture'],
  setup() {
    const { mdAndUp } = useDisplay()
    return {
      mdiEmoticonOutline,
      isDesktop: mdAndUp
    }
  },
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
@use 'sass:map';
@use 'vuetify/settings';

/** Themes **/
.v-theme--light {
  .chat-emojis {
    &__icon {
      position: relative;

      &::before {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        background: currentColor;
        opacity: 0;
        transition: 0.4s;
        z-index: -1;
      }

      &:hover::before {
        opacity: 0.1;
      }
    }
  }
}
.v-theme--dark {
  .chat-emojis {
    &__icon {
      position: relative;

      &::before {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        background: currentColor;
        opacity: 0;
        transition: 0.4s;
        z-index: -1;
      }

      &:hover::before {
        opacity: 0.1;
      }
    }
  }
}
</style>
