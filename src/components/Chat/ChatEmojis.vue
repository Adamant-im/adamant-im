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
      <v-icon
        class="chat-emojis__icon"
        :icon="mdiEmoticonOutline"
        :size="COMMON_TRIGGER_ICON_SIZE"
        v-bind="props"
      />
    </template>

    <emoji-picker @emoji:select="getEmoji"></emoji-picker>
  </v-menu>
</template>
<script>
import EmojiPicker from '@/components/EmojiPicker.vue'
import { mdiEmoticonOutline } from '@mdi/js'
import { useScreenSize } from '@/hooks/useScreenSize'
import { COMMON_TRIGGER_ICON_SIZE } from '@/components/common/helpers/uiMetrics'

export default {
  props: {
    open: {
      type: Boolean,
      required: true
    }
  },
  emits: ['onChange', 'get-emoji-picture'],
  setup() {
    const { isMobileView } = useScreenSize()
    return {
      COMMON_TRIGGER_ICON_SIZE,
      mdiEmoticonOutline,
      isDesktop: !isMobileView.value
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

.v-theme--light {
  .chat-emojis {
    &__icon {
      color: map.get(settings.$grey, 'darken-1');
    }
  }
}
</style>
